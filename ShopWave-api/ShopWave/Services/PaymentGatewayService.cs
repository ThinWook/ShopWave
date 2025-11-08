using ShopWave.Controllers;
using ShopWave.Models;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace ShopWave.Services
{
    public class PaymentGatewayService : IPaymentGatewayService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<PaymentGatewayService> _logger;

        public PaymentGatewayService(IConfiguration configuration, ILogger<PaymentGatewayService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string> CreatePaymentUrl(string gateway, Order order, Guid transactionId, string returnUrl)
        {
            return gateway.ToUpper() switch
            {
                "VNPAY" => await CreateVnpayPaymentUrl(order, transactionId, returnUrl),
                "MOMO" => await CreateMomoPaymentUrl(order, transactionId, returnUrl),
                _ => throw new ArgumentException($"Unsupported payment gateway: {gateway}")
            };
        }

        private async Task<string> CreateVnpayPaymentUrl(Order order, Guid transactionId, string returnUrl)
        {
            var vnpayConfig = _configuration.GetSection("VNPay");
            var vnp_TmnCode = vnpayConfig["TmnCode"] ?? "";
            var vnp_HashSecret = vnpayConfig["HashSecret"] ?? "";
            var vnp_Url = vnpayConfig["Url"] ?? "";
            // Use configured return URL directly (points to frontend)
            var vnp_Returnurl = vnpayConfig["PaymentBackReturnUrl"] ?? returnUrl;

            var vnp_Params = new Dictionary<string, string>
            {
                { "vnp_Version", "2.1.0" },
                { "vnp_Command", "pay" },
                { "vnp_TmnCode", vnp_TmnCode },
                { "vnp_Amount", ((long)(order.TotalAmount * 100)).ToString() },
                { "vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss") },
                { "vnp_CurrCode", "VND" },
                { "vnp_IpAddr", "127.0.0.1" },
                { "vnp_Locale", "vn" },
                { "vnp_OrderInfo", $"Thanh toan don hang {order.OrderNumber}" },
                { "vnp_OrderType", "other" },
                { "vnp_ReturnUrl", vnp_Returnurl },
                { "vnp_TxnRef", transactionId.ToString() }
            };

            // Remove empty or null values (VNPay best practice)
            var validParams = vnp_Params
                .Where(x => !string.IsNullOrEmpty(x.Value))
                .OrderBy(x => x.Key)
                .ToList();

            // Create signature from RAW values (NO URL encoding)
            var signData = string.Join("&", validParams.Select(x => $"{x.Key}={x.Value}"));
            var vnp_SecureHash = HmacSHA512(vnp_HashSecret, signData);

            // Create query string WITH URL encoding
            var queryString = string.Join("&", validParams.Select(x => $"{x.Key}={Uri.EscapeDataString(x.Value)}"));
            var paymentUrl = $"{vnp_Url}?{queryString}&vnp_SecureHash={vnp_SecureHash}";

            _logger.LogInformation("VNPay payment URL created. TransactionId: {TransactionId}, ReturnUrl: {ReturnUrl}", transactionId, vnp_Returnurl);
            return await Task.FromResult(paymentUrl);
        }

        private async Task<string> CreateMomoPaymentUrl(Order order, Guid transactionId, string returnUrl)
        {
            var momoConfig = _configuration.GetSection("MoMo");
            var partnerCode = momoConfig["PartnerCode"] ?? "";
            var accessKey = momoConfig["AccessKey"] ?? "";
            var secretKey = momoConfig["SecretKey"] ?? "";
            var endpoint = momoConfig["Endpoint"] ?? "";
            var redirectUrl = returnUrl + "?gateway=momo";
            var ipnUrl = momoConfig["IpnUrl"] ?? ""; // Webhook URL

            var orderId = transactionId.ToString();
            var requestId = Guid.NewGuid().ToString();
            var amount = ((long)order.TotalAmount).ToString();
            var orderInfo = $"Thanh toan don hang {order.OrderNumber}";
            var requestType = "captureWallet";

            // T?o ch? ký
            var rawSignature = $"accessKey={accessKey}&amount={amount}&extraData=&ipnUrl={ipnUrl}&orderId={orderId}&orderInfo={orderInfo}&partnerCode={partnerCode}&redirectUrl={redirectUrl}&requestId={requestId}&requestType={requestType}";
            var signature = HmacSHA256(secretKey, rawSignature);

            var requestData = new
            {
                partnerCode,
                accessKey,
                requestId,
                amount,
                orderId,
                orderInfo,
                redirectUrl,
                ipnUrl,
                requestType,
                extraData = "",
                lang = "vi",
                signature
            };

            // G?i API MoMo
            using var httpClient = new HttpClient();
            var content = new StringContent(JsonSerializer.Serialize(requestData), Encoding.UTF8, "application/json");
            var response = await httpClient.PostAsync(endpoint, content);
            var responseString = await response.Content.ReadAsStringAsync();
            var responseData = JsonSerializer.Deserialize<MomoResponse>(responseString);

            if (responseData?.ResultCode == 0)
            {
                _logger.LogInformation("MoMo payment URL created for transaction {TransactionId}", transactionId);
                return responseData.PayUrl ?? "";
            }

            _logger.LogError("Failed to create MoMo payment URL: {Response}", responseString);
            throw new Exception("Failed to create MoMo payment URL");
        }

        public bool ValidateVnpaySignature(Dictionary<string, string> queryParams)
        {
            try
            {
                var vnp_HashSecret = _configuration.GetSection("VNPay")["HashSecret"] ?? "";
                var vnp_SecureHash = queryParams.GetValueOrDefault("vnp_SecureHash", "");

                if (string.IsNullOrEmpty(vnp_SecureHash))
                {
                    _logger.LogWarning("VNPay signature validation failed: vnp_SecureHash is missing");
                    return false;
                }

                // Filter out signature params and empty values (same as when creating)
                var filteredParams = queryParams
                    .Where(x => x.Key != "vnp_SecureHash" && x.Key != "vnp_SecureHashType" && !string.IsNullOrEmpty(x.Value))
                    .OrderBy(x => x.Key)
                    .ToList();

                // Create sign data from RAW values (NO URL decoding needed - already decoded by ASP.NET)
                var signData = string.Join("&", filteredParams.Select(x => $"{x.Key}={x.Value}"));
                var computedHash = HmacSHA512(vnp_HashSecret, signData);

                _logger.LogInformation("VNPay signature validation: Expected={Expected}, Received={Received}, SignData={SignData}", 
                    computedHash, vnp_SecureHash, signData);

                return computedHash.Equals(vnp_SecureHash, StringComparison.InvariantCultureIgnoreCase);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating VNPay signature");
                return false;
            }
        }

        public bool ValidateMomoSignature(object payload)
        {
            var secretKey = _configuration.GetSection("MoMo")["SecretKey"] ?? "";
            
            // Use reflection to get properties from anonymous object
            var type = payload.GetType();
            var orderIdProp = type.GetProperty("OrderId");
            var transIdProp = type.GetProperty("TransId");
            var resultCodeProp = type.GetProperty("ResultCode");
            var messageProp = type.GetProperty("Message");
            var amountProp = type.GetProperty("Amount");
            var signatureProp = type.GetProperty("Signature");

            if (orderIdProp == null || transIdProp == null || resultCodeProp == null || 
                messageProp == null || amountProp == null || signatureProp == null)
            {
                return false;
            }

            var orderId = orderIdProp.GetValue(payload)?.ToString() ?? "";
            var transId = transIdProp.GetValue(payload)?.ToString() ?? "";
            var resultCode = resultCodeProp.GetValue(payload)?.ToString() ?? "";
            var message = messageProp.GetValue(payload)?.ToString() ?? "";
            var amount = amountProp.GetValue(payload)?.ToString() ?? "";
            var signature = signatureProp.GetValue(payload)?.ToString() ?? "";

            var rawSignature = $"accessKey={_configuration.GetSection("MoMo")["AccessKey"]}&amount={amount}&message={message}&orderId={orderId}&partnerCode={_configuration.GetSection("MoMo")["PartnerCode"]}&resultCode={resultCode}&transId={transId}";
            var computedSignature = HmacSHA256(secretKey, rawSignature);

            return computedSignature.Equals(signature, StringComparison.InvariantCultureIgnoreCase);
        }

        private string HmacSHA512(string key, string data)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var dataBytes = Encoding.UTF8.GetBytes(data);
            using var hmac = new HMACSHA512(keyBytes);
            var hash = hmac.ComputeHash(dataBytes);
            return BitConverter.ToString(hash).Replace("-", "").ToLower();
        }

        private string HmacSHA256(string key, string data)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var dataBytes = Encoding.UTF8.GetBytes(data);
            using var hmac = new HMACSHA256(keyBytes);
            var hash = hmac.ComputeHash(dataBytes);
            return BitConverter.ToString(hash).Replace("-", "").ToLower();
        }

        private class MomoResponse
        {
            public string? PartnerCode { get; set; }
            public string? RequestId { get; set; }
            public string? OrderId { get; set; }
            public long Amount { get; set; }
            public int ResultCode { get; set; }
            public string? Message { get; set; }
            public string? PayUrl { get; set; }
        }
    }
}
