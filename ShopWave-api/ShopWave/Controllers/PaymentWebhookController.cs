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

        public PaymentWebhookController(
            ShopWaveDbContext context,
            ILogger<PaymentWebhookController> logger,
            IPaymentGatewayService paymentGatewayService)
        {
            _context = context;
            _logger = logger;
            _paymentGatewayService = paymentGatewayService;
        }

        [HttpPost("webhook/vnpay")]
        [HttpGet("webhook/vnpay")]
        public async Task<IActionResult> HandleVnpayWebhook()
        {
            try
            {
                var queryParams = Request.Query.ToDictionary(x => x.Key, x => x.Value.ToString());
                _logger.LogInformation("VNPay webhook received: {Params}", JsonSerializer.Serialize(queryParams));

                if (!_paymentGatewayService.ValidateVnpaySignature(queryParams))
                {
                    _logger.LogWarning("Invalid VNPay signature");
                    return BadRequest(new { RspCode = "97", Message = "Invalid Signature" });
                }

                var transactionId = Guid.Parse(queryParams.GetValueOrDefault("vnp_TxnRef", Guid.Empty.ToString()));
                var vnpResponseCode = queryParams.GetValueOrDefault("vnp_ResponseCode", "");
                var vnpTransactionNo = queryParams.GetValueOrDefault("vnp_TransactionNo", "");

                var transaction = await _context.Transactions
                    .Include(t => t.Order)
                        .ThenInclude(o => o.OrderItems)
                            .ThenInclude(oi => oi.ProductVariant)
                    .FirstOrDefaultAsync(t => t.Id == transactionId);

                if (transaction == null || transaction.Status != "PENDING")
                {
                    _logger.LogWarning("Transaction not found or already processed: {TransactionId}", transactionId);
                    return Ok(new { RspCode = "01", Message = "Order not found" });
                }

                transaction.GatewayTransactionId = vnpTransactionNo;
                transaction.GatewayResponse = JsonSerializer.Serialize(queryParams);
                transaction.CompletedAt = DateTime.UtcNow;
                transaction.UpdatedAt = DateTime.UtcNow;

                if (vnpResponseCode == "00")
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
                    }

                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Payment successful for Order: {OrderNumber}", transaction.Order.OrderNumber);
                }
                else
                {
                    transaction.Status = "FAILED";
                    transaction.ErrorMessage = queryParams.GetValueOrDefault("vnp_Message", "Payment failed");
                    transaction.Order.Status = "CANCELLED";
                    transaction.Order.UpdatedAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync();
                    _logger.LogWarning("Payment failed for Order: {OrderNumber}, Code: {ResponseCode}", 
                        transaction.Order.OrderNumber, vnpResponseCode);
                }

                await _context.SaveChangesAsync();
                return Ok(new { RspCode = "00", Message = "Confirm Success" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing VNPay webhook");
                return Ok(new { RspCode = "99", Message = "Unknown error" });
            }
        }

        [HttpPost("webhook/momo")]
        public async Task<IActionResult> HandleMomoWebhook([FromBody] MomoWebhookPayload payload)
        {
            try
            {
                _logger.LogInformation("MoMo webhook received: {Payload}", JsonSerializer.Serialize(payload));

                if (!_paymentGatewayService.ValidateMomoSignature(payload))
                {
                    _logger.LogWarning("Invalid MoMo signature");
                    return BadRequest(new { resultCode = 97, message = "Invalid Signature" });
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

        [HttpGet("return")]
        public IActionResult PaymentReturn([FromQuery] string gateway, [FromQuery] string? vnp_ResponseCode, [FromQuery] int? resultCode)
        {
            try
            {
                var isSuccess = false;

                if (gateway?.ToUpper() == "VNPAY")
                {
                    isSuccess = vnp_ResponseCode == "00";
                }
                else if (gateway?.ToUpper() == "MOMO")
                {
                    isSuccess = resultCode == 0;
                }

                var redirectUrl = isSuccess 
                    ? $"{Request.Scheme}://{Request.Host}/checkout/success"
                    : $"{Request.Scheme}://{Request.Host}/checkout/failed";

                return Redirect(redirectUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in payment return");
                return Redirect($"{Request.Scheme}://{Request.Host}/checkout/failed");
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
