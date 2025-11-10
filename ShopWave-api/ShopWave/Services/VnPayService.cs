using ShopWave.Models;

namespace ShopWave.Services
{
    /// <summary>
    /// VNPay payment gateway service implementation
    /// </summary>
    public class VnPayService : IVnPayService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<VnPayService> _logger;

        public VnPayService(IConfiguration configuration, ILogger<VnPayService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Create VNPay payment URL with transaction ID as reference
        /// </summary>
        public string CreatePaymentUrl(PaymentInformationModel model, HttpContext context, Guid transactionId)
        {
            try
            {
                var timeZoneById = TimeZoneInfo.FindSystemTimeZoneById(_configuration["VNPay:TimeZoneId"] ?? "SE Asia Standard Time");
                var timeNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZoneById);
                var urlCallBack = _configuration["VNPay:PaymentBackReturnUrl"];

                // === FIX: Append OrderId to return URL ===
                // This allows frontend to redirect to /thank-you?orderId=xxx
                // Frontend will receive: /checkout/result?orderId=xxx&vnp_ResponseCode=00&vnp_TxnRef=...
                if (!string.IsNullOrEmpty(urlCallBack))
                {
                    urlCallBack += $"?orderId={model.OrderId}";
                }
                // =========================================

                var pay = new VnPayLibrary();

                // Add VNPay required parameters
                pay.AddRequestData("vnp_Version", _configuration["VNPay:Version"] ?? "2.1.0");
                pay.AddRequestData("vnp_Command", _configuration["VNPay:Command"] ?? "pay");
                pay.AddRequestData("vnp_TmnCode", _configuration["VNPay:TmnCode"] ?? "");
                pay.AddRequestData("vnp_Amount", ((long)(model.Amount * 100)).ToString()); // Convert to cents
                pay.AddRequestData("vnp_CreateDate", timeNow.ToString("yyyyMMddHHmmss"));
                pay.AddRequestData("vnp_CurrCode", _configuration["VNPay:CurrCode"] ?? "VND");
                pay.AddRequestData("vnp_IpAddr", pay.GetIpAddress(context));
                pay.AddRequestData("vnp_Locale", _configuration["VNPay:Locale"] ?? "vn");
                pay.AddRequestData("vnp_OrderInfo", $"{model.Name} {model.OrderDescription} {model.Amount}");
                pay.AddRequestData("vnp_OrderType", model.OrderType);
                pay.AddRequestData("vnp_ReturnUrl", urlCallBack ?? "");
                
                // Use TransactionId as reference (vnp_TxnRef)
                pay.AddRequestData("vnp_TxnRef", transactionId.ToString());

                var paymentUrl = pay.CreateRequestUrl(
                    _configuration["VNPay:Url"] ?? "",
                    _configuration["VNPay:HashSecret"] ?? ""
                );

                _logger.LogInformation("VNPay payment URL created for Order {OrderId}, Transaction {TransactionId}", 
                    model.OrderId, transactionId);
                return paymentUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating VNPay payment URL");
                throw;
            }
        }

        /// <summary>
        /// Process payment callback from VNPay
        /// </summary>
        public PaymentResponseModel PaymentExecute(IQueryCollection collections)
        {
            try
            {
                var pay = new VnPayLibrary();
                var response = pay.GetFullResponseData(collections, _configuration["VNPay:HashSecret"] ?? "");

                _logger.LogInformation("VNPay callback processed: TxnRef={TxnRef}, ResponseCode={ResponseCode}", 
                    response.OrderId, response.VnPayResponseCode);

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing VNPay callback");
                throw;
            }
        }
    }

    /// <summary>
    /// Extension methods for VnPayLibrary
    /// </summary>
    public static class VnPayLibraryExtensions
    {
        public static PaymentResponseModel GetFullResponseData(this VnPayLibrary vnPayLibrary, IQueryCollection collection, string hashSecret)
        {
            // Parse all query parameters
            foreach (var (key, value) in collection)
            {
                if (!string.IsNullOrEmpty(key) && key.StartsWith("vnp_"))
                {
                    vnPayLibrary.AddResponseData(key, value.ToString());
                }
            }

            // Extract response data
            var orderId = vnPayLibrary.GetResponseData("vnp_TxnRef");
            var vnpayTranId = vnPayLibrary.GetResponseData("vnp_TransactionNo");
            var vnpResponseCode = vnPayLibrary.GetResponseData("vnp_ResponseCode");
            var vnpSecureHash = collection.FirstOrDefault(k => k.Key == "vnp_SecureHash").Value.ToString();
            var orderInfo = vnPayLibrary.GetResponseData("vnp_OrderInfo");

            // Validate signature
            bool checkSignature = vnPayLibrary.ValidateSignature(vnpSecureHash, hashSecret);

            return new PaymentResponseModel
            {
                Success = checkSignature && vnpResponseCode == "00",
                PaymentMethod = "VNPay",
                OrderDescription = orderInfo,
                OrderId = orderId,
                TransactionId = vnpayTranId,
                Token = vnpSecureHash,
                VnPayResponseCode = vnpResponseCode
            };
        }
    }

    /// <summary>
    /// Payment response model
    /// </summary>
    public class PaymentResponseModel
    {
        public bool Success { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string OrderDescription { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string VnPayResponseCode { get; set; } = string.Empty;
    }
}
