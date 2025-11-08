using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopWave.Models;
using ShopWave.Services;
using System.Text.Json;

namespace ShopWave.Controllers
{
    [ApiController]
    [Route("api/v1/payments")]
    public class PaymentWebhookController : ControllerBase
    {
        private readonly ShopWaveDbContext _context;
        private readonly ILogger<PaymentWebhookController> _logger;
        private readonly IPaymentGatewayService _paymentGatewayService;
        private readonly IVnPayService _vnPayService;

        public PaymentWebhookController(
            ShopWaveDbContext context,
            ILogger<PaymentWebhookController> logger,
            IPaymentGatewayService paymentGatewayService,
            IVnPayService vnPayService)
        {
            _context = context;
            _logger = logger;
            _paymentGatewayService = paymentGatewayService;
            _vnPayService = vnPayService;
        }

        /// <summary>
        /// VNPay IPN (Instant Payment Notification) - Server-to-Server callback
        /// This is the critical endpoint that actually processes the payment
        /// </summary>
        [HttpPost("webhook/vnpay")]
        [HttpGet("webhook/vnpay")]
        public async Task<IActionResult> HandleVnpayWebhook()
        {
            try
            {
                _logger.LogInformation("VNPay webhook received: {Query}", Request.QueryString);

                // Parse and validate callback using VnPayService
                var response = _vnPayService.PaymentExecute(Request.Query);

                // Validate signature
                if (!response.Success)
                {
                    _logger.LogWarning("Invalid VNPay signature or failed payment");
                    return Ok(new { RspCode = "97", Message = "Invalid Signature" });
                }

                // Parse transaction ID from vnp_TxnRef
                if (!Guid.TryParse(response.OrderId, out var transactionId))
                {
                    _logger.LogWarning("Invalid transaction ID format: {TxnRef}", response.OrderId);
                    return Ok(new { RspCode = "01", Message = "Invalid transaction reference" });
                }

                // Find transaction and order
                var transaction = await _context.Transactions
                    .Include(t => t.Order)
                        .ThenInclude(o => o.OrderItems)
                            .ThenInclude(oi => oi.ProductVariant)
                    .FirstOrDefaultAsync(t => t.Id == transactionId);

                if (transaction == null)
                {
                    _logger.LogWarning("Transaction not found: {TransactionId}", transactionId);
                    return Ok(new { RspCode = "01", Message = "Order not found" });
                }

                // Idempotency check - prevent duplicate processing
                if (transaction.Status != "PENDING")
                {
                    _logger.LogInformation("Transaction already processed: {TransactionId}, Status: {Status}", 
                        transactionId, transaction.Status);
                    return Ok(new { RspCode = "00", Message = "Already processed" });
                }

                // Update transaction with gateway response
                transaction.GatewayTransactionId = response.TransactionId;
                transaction.GatewayResponse = JsonSerializer.Serialize(new {
                    vnp_TxnRef = response.OrderId,
                    vnp_TransactionNo = response.TransactionId,
                    vnp_ResponseCode = response.VnPayResponseCode,
                    vnp_OrderInfo = response.OrderDescription
                });
                transaction.CompletedAt = DateTime.UtcNow;
                transaction.UpdatedAt = DateTime.UtcNow;

                // Check payment result
                if (response.VnPayResponseCode == "00")
                {
                    // SUCCESS - Process the order
                    transaction.Status = "SUCCESS";
                    transaction.Order.Status = "PROCESSING";
                    transaction.Order.PaymentStatus = "PAID";
                    transaction.Order.UpdatedAt = DateTime.UtcNow;

                    // Reduce stock NOW
                    foreach (var orderItem in transaction.Order.OrderItems)
                    {
                        orderItem.ProductVariant.Stock -= orderItem.Quantity;
                        _logger.LogInformation("Stock reduced for variant {VariantId}: -{Quantity}", 
                            orderItem.ProductVariantId, orderItem.Quantity);
                    }

                    // Delete cart NOW
                    Cart? cart = null;
                    if (transaction.Order.UserId.HasValue)
                    {
                        cart = await _context.Carts
                            .Include(c => c.CartItems)
                            .Include(c => c.AppliedDiscounts)
                            .FirstOrDefaultAsync(c => c.UserId == transaction.Order.UserId.Value);
                    }
                    
                    if (cart != null)
                    {
                        _context.CartItems.RemoveRange(cart.CartItems);
                        _context.AppliedDiscounts.RemoveRange(cart.AppliedDiscounts);
                        _context.Carts.Remove(cart);
                        _logger.LogInformation("Cart deleted for user {UserId}", transaction.Order.UserId);
                    }

                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Payment SUCCESS for Order: {OrderNumber}, Transaction: {TransactionId}", 
                        transaction.Order.OrderNumber, transactionId);
                }
                else
                {
                    // FAILED - Cancel the order
                    transaction.Status = "FAILED";
                    transaction.ErrorMessage = $"VNPay error code: {response.VnPayResponseCode}";
                    transaction.Order.Status = "CANCELLED";
                    transaction.Order.UpdatedAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync();
                    _logger.LogWarning("Payment FAILED for Order: {OrderNumber}, Code: {ResponseCode}", 
                        transaction.Order.OrderNumber, response.VnPayResponseCode);
                }

                // Return success response to VNPay
                return Ok(new { RspCode = "00", Message = "Confirm Success" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing VNPay webhook");
                return Ok(new { RspCode = "99", Message = "Unknown error" });
            }
        }

        /// <summary>
        /// MoMo IPN (Instant Payment Notification) - Server-to-Server callback
        /// </summary>
        [HttpPost("webhook/momo")]
        public async Task<IActionResult> HandleMomoWebhook([FromBody] MomoWebhookPayload payload)
        {
            try
            {
                _logger.LogInformation("MoMo webhook received: {Payload}", JsonSerializer.Serialize(payload));

                if (!_paymentGatewayService.ValidateMomoSignature(payload))
                {
                    _logger.LogWarning("Invalid MoMo signature");
                    return Ok(new { resultCode = 97, message = "Invalid Signature" });
                }

                var transactionId = Guid.Parse(payload.OrderId);
                var transaction = await _context.Transactions
                    .Include(t => t.Order)
                        .ThenInclude(o => o.OrderItems)
                            .ThenInclude(oi => oi.ProductVariant)
                    .FirstOrDefaultAsync(t => t.Id == transactionId);

                if (transaction == null || transaction.Status != "PENDING")
                {
                    _logger.LogWarning("Transaction not found or already processed: {TransactionId}", transactionId);
                    return Ok(new { resultCode = 1, message = "Order not found" });
                }

                transaction.GatewayTransactionId = payload.TransId;
                transaction.GatewayResponse = JsonSerializer.Serialize(payload);
                transaction.CompletedAt = DateTime.UtcNow;
                transaction.UpdatedAt = DateTime.UtcNow;

                if (payload.ResultCode == 0)
                {
                    transaction.Status = "SUCCESS";
                    transaction.Order.Status = "PROCESSING";
                    transaction.Order.PaymentStatus = "PAID";
                    transaction.Order.UpdatedAt = DateTime.UtcNow;

                    foreach (var orderItem in transaction.Order.OrderItems)
                    {
                        orderItem.ProductVariant.Stock -= orderItem.Quantity;
                    }

                    var cart = await _context.Carts
                        .Include(c => c.CartItems)
                        .Include(c => c.AppliedDiscounts)
                        .FirstOrDefaultAsync(c => c.UserId == transaction.Order.UserId);
                    
                    if (cart != null)
                    {
                        _context.CartItems.RemoveRange(cart.CartItems);
                        _context.AppliedDiscounts.RemoveRange(cart.AppliedDiscounts);
                        _context.Carts.Remove(cart);
                    }

                    _logger.LogInformation("MoMo payment successful for Order: {OrderNumber}", transaction.Order.OrderNumber);
                }
                else
                {
                    transaction.Status = "FAILED";
                    transaction.ErrorMessage = payload.Message;
                    transaction.Order.Status = "CANCELLED";
                    transaction.Order.UpdatedAt = DateTime.UtcNow;

                    _logger.LogWarning("MoMo payment failed for Order: {OrderNumber}, Code: {ResultCode}", 
                        transaction.Order.OrderNumber, payload.ResultCode);
                }

                await _context.SaveChangesAsync();
                return Ok(new { resultCode = 0, message = "Success" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing MoMo webhook");
                return Ok(new { resultCode = 99, message = "Unknown error" });
            }
        }

        /// <summary>
        /// Payment return URL - DEPRECATED (VNPay now redirects directly to frontend)
        /// This endpoint is kept for backward compatibility and logging purposes
        /// </summary>
        [HttpGet("return")]
        public IActionResult PaymentReturn([FromQuery] string? gateway, [FromQuery] string? vnp_ResponseCode, 
            [FromQuery] int? resultCode, [FromQuery] string? vnp_TxnRef)
        {
            try
            {
                _logger.LogWarning("Payment return endpoint called - VNPay should redirect to frontend directly. " +
                    "Gateway={Gateway}, ResponseCode={ResponseCode}, TxnRef={TxnRef}", 
                    gateway, vnp_ResponseCode ?? resultCode?.ToString(), vnp_TxnRef);

                // Redirect to frontend anyway
                var frontendUrl = "http://localhost:3000/checkout/result";
                var queryParams = Request.QueryString.Value;
                
                return Redirect($"{frontendUrl}{queryParams}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in payment return");
                return Redirect("http://localhost:3000/checkout/failed");
            }
        }
    }

    public class MomoWebhookPayload
    {
        public string OrderId { get; set; } = string.Empty;
        public string TransId { get; set; } = string.Empty;
        public int ResultCode { get; set; }
        public string Message { get; set; } = string.Empty;
        public long Amount { get; set; }
        public string Signature { get; set; } = string.Empty;
    }
}
