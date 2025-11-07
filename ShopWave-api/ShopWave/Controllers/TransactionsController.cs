using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopWave.Models;
using ShopWave.Models.DTOs;
using ShopWave.Models.Responses;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;

namespace ShopWave.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class TransactionsController : ControllerBase
    {
        private readonly ShopWaveDbContext _context;
        private readonly ILogger<TransactionsController> _logger;

        public TransactionsController(ShopWaveDbContext context, ILogger<TransactionsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Create a new transaction for an order
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionRequest request)
        {
            try
            {
                var uid = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
                if (!Guid.TryParse(uid, out var userId))
                {
                    return Unauthorized(EnvelopeBuilder.Fail<object>(HttpContext, "UNAUTHORIZED", new[] { new ErrorItem("auth", "Unauthorized", "UNAUTHORIZED") }, 401));
                }

                // Verify order exists and belongs to user
                var order = await _context.Orders.FindAsync(request.OrderId);
                if (order == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "ORDER_NOT_FOUND", new[] { new ErrorItem("orderId", "Order not found", "NOT_FOUND") }, 404));
                }

                if (order.UserId != userId)
                {
                    return StatusCode(403, EnvelopeBuilder.Fail<object>(HttpContext, "FORBIDDEN", new[] { new ErrorItem("auth", "You don't have permission to create transaction for this order", "FORBIDDEN") }, 403));
                }

                var transaction = new Transaction
                {
                    OrderId = request.OrderId,
                    Gateway = request.Gateway,
                    GatewayTransactionId = request.GatewayTransactionId,
                    Amount = request.Amount,
                    Status = TransactionStatus.Pending,
                    TransactionType = request.TransactionType,
                    GatewayResponse = request.GatewayResponse,
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = Request.Headers["User-Agent"].ToString(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Transactions.Add(transaction);
                await _context.SaveChangesAsync();

                var response = new TransactionDto
                {
                    Id = transaction.Id,
                    OrderId = transaction.OrderId,
                    Gateway = transaction.Gateway,
                    GatewayTransactionId = transaction.GatewayTransactionId,
                    Amount = transaction.Amount,
                    Status = transaction.Status,
                    TransactionType = transaction.TransactionType,
                    ErrorMessage = transaction.ErrorMessage,
                    CreatedAt = transaction.CreatedAt,
                    UpdatedAt = transaction.UpdatedAt,
                    CompletedAt = transaction.CompletedAt
                };

                return StatusCode(201, EnvelopeBuilder.Ok(HttpContext, "TRANSACTION_CREATED", response));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating transaction");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        /// <summary>
        /// Get transactions for an order
        /// </summary>
        [HttpGet("order/{orderId}")]
        [Authorize]
        public async Task<IActionResult> GetOrderTransactions(Guid orderId)
        {
            try
            {
                var uid = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
                if (!Guid.TryParse(uid, out var userId))
                {
                    return Unauthorized(EnvelopeBuilder.Fail<object>(HttpContext, "UNAUTHORIZED", new[] { new ErrorItem("auth", "Unauthorized", "UNAUTHORIZED") }, 401));
                }

                var user = await _context.Users.FindAsync(userId);
                var order = await _context.Orders.FindAsync(orderId);
                
                if (order == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "ORDER_NOT_FOUND", new[] { new ErrorItem("orderId", "Order not found", "NOT_FOUND") }, 404));
                }

                // Only owner or admin can view transactions
                if (order.UserId != userId && user?.Role != "Admin")
                {
                    return StatusCode(403, EnvelopeBuilder.Fail<object>(HttpContext, "FORBIDDEN", new[] { new ErrorItem("auth", "Forbidden", "FORBIDDEN") }, 403));
                }

                var transactions = await _context.Transactions
                    .Where(t => t.OrderId == orderId)
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => new TransactionDto
                    {
                        Id = t.Id,
                        OrderId = t.OrderId,
                        Gateway = t.Gateway,
                        GatewayTransactionId = t.GatewayTransactionId,
                        Amount = t.Amount,
                        Status = t.Status,
                        TransactionType = t.TransactionType,
                        ErrorMessage = t.ErrorMessage,
                        CreatedAt = t.CreatedAt,
                        UpdatedAt = t.UpdatedAt,
                        CompletedAt = t.CompletedAt
                    })
                    .ToListAsync();

                return Ok(EnvelopeBuilder.Ok(HttpContext, "TRANSACTIONS_RETRIEVED", transactions));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving transactions for order {OrderId}", orderId);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        /// <summary>
        /// Get transaction details by ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetTransaction(Guid id)
        {
            try
            {
                var uid = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
                if (!Guid.TryParse(uid, out var userId))
                {
                    return Unauthorized(EnvelopeBuilder.Fail<object>(HttpContext, "UNAUTHORIZED", new[] { new ErrorItem("auth", "Unauthorized", "UNAUTHORIZED") }, 401));
                }

                var user = await _context.Users.FindAsync(userId);
                var transaction = await _context.Transactions
                    .Include(t => t.Order)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (transaction == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "TRANSACTION_NOT_FOUND", new[] { new ErrorItem("id", "Transaction not found", "NOT_FOUND") }, 404));
                }

                // Only owner or admin can view transaction details
                if (transaction.Order.UserId != userId && user?.Role != "Admin")
                {
                    return StatusCode(403, EnvelopeBuilder.Fail<object>(HttpContext, "FORBIDDEN", new[] { new ErrorItem("auth", "Forbidden", "FORBIDDEN") }, 403));
                }

                var response = new TransactionDetailDto
                {
                    Id = transaction.Id,
                    OrderId = transaction.OrderId,
                    Gateway = transaction.Gateway,
                    GatewayTransactionId = transaction.GatewayTransactionId,
                    Amount = transaction.Amount,
                    Status = transaction.Status,
                    TransactionType = transaction.TransactionType,
                    ErrorMessage = transaction.ErrorMessage,
                    GatewayResponse = transaction.GatewayResponse,
                    IpAddress = transaction.IpAddress,
                    UserAgent = transaction.UserAgent,
                    OrderNumber = transaction.Order.OrderNumber,
                    CreatedAt = transaction.CreatedAt,
                    UpdatedAt = transaction.UpdatedAt,
                    CompletedAt = transaction.CompletedAt
                };

                return Ok(EnvelopeBuilder.Ok(HttpContext, "TRANSACTION_RETRIEVED", response));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving transaction {TransactionId}", id);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        /// <summary>
        /// Update transaction status (for payment gateway callbacks)
        /// </summary>
        [HttpPut("{id}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateTransactionStatus(Guid id, [FromBody] UpdateTransactionStatusRequest request)
        {
            try
            {
                var transaction = await _context.Transactions.FindAsync(id);
                if (transaction == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "TRANSACTION_NOT_FOUND", new[] { new ErrorItem("id", "Transaction not found", "NOT_FOUND") }, 404));
                }

                transaction.Status = request.Status;
                transaction.GatewayTransactionId = request.GatewayTransactionId ?? transaction.GatewayTransactionId;
                transaction.ErrorMessage = request.ErrorMessage;
                transaction.GatewayResponse = request.GatewayResponse ?? transaction.GatewayResponse;
                transaction.UpdatedAt = DateTime.UtcNow;

                if (request.Status == TransactionStatus.Success || request.Status == TransactionStatus.Failed)
                {
                    transaction.CompletedAt = DateTime.UtcNow;

                    // Update order payment status
                    var order = await _context.Orders.FindAsync(transaction.OrderId);
                    if (order != null && request.Status == TransactionStatus.Success)
                    {
                        order.PaymentStatus = "Paid";
                        order.UpdatedAt = DateTime.UtcNow;
                    }
                }

                await _context.SaveChangesAsync();

                var response = new TransactionDto
                {
                    Id = transaction.Id,
                    OrderId = transaction.OrderId,
                    Gateway = transaction.Gateway,
                    GatewayTransactionId = transaction.GatewayTransactionId,
                    Amount = transaction.Amount,
                    Status = transaction.Status,
                    TransactionType = transaction.TransactionType,
                    ErrorMessage = transaction.ErrorMessage,
                    CreatedAt = transaction.CreatedAt,
                    UpdatedAt = transaction.UpdatedAt,
                    CompletedAt = transaction.CompletedAt
                };

                return Ok(EnvelopeBuilder.Ok(HttpContext, "TRANSACTION_UPDATED", response));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating transaction status {TransactionId}", id);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        /// <summary>
        /// VNPay payment callback (webhook)
        /// </summary>
        [HttpGet("vnpay/callback")]
        [AllowAnonymous]
        public async Task<IActionResult> VNPayCallback([FromQuery] VNPayCallbackDto callback)
        {
            try
            {
                _logger.LogInformation("VNPay callback received: {Callback}", JsonSerializer.Serialize(callback));

                // TODO: Verify VNPay signature
                // var isValidSignature = VerifyVNPaySignature(callback);

                // Find transaction by gateway transaction ID or order number
                var transaction = await _context.Transactions
                    .Include(t => t.Order)
                    .FirstOrDefaultAsync(t => 
                        t.Gateway == PaymentGateway.VNPay && 
                        t.Order.OrderNumber == callback.vnp_TxnRef);

                if (transaction == null)
                {
                    _logger.LogWarning("Transaction not found for VNPay callback: {TxnRef}", callback.vnp_TxnRef);
                    return BadRequest("Transaction not found");
                }

                transaction.GatewayTransactionId = callback.vnp_TransactionNo;
                transaction.GatewayResponse = JsonSerializer.Serialize(callback);
                transaction.UpdatedAt = DateTime.UtcNow;

                if (callback.vnp_ResponseCode == "00")
                {
                    transaction.Status = TransactionStatus.Success;
                    transaction.CompletedAt = DateTime.UtcNow;

                    // Update order
                    transaction.Order.PaymentStatus = "Paid";
                    transaction.Order.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    transaction.Status = TransactionStatus.Failed;
                    transaction.ErrorMessage = $"VNPay error code: {callback.vnp_ResponseCode}";
                    transaction.CompletedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                // Redirect to frontend
                var redirectUrl = $"{Request.Scheme}://{Request.Host}/payment/result?status={transaction.Status}&orderId={transaction.OrderId}";
                return Redirect(redirectUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing VNPay callback");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// MoMo payment callback (webhook)
        /// </summary>
        [HttpPost("momo/callback")]
        [AllowAnonymous]
        public async Task<IActionResult> MoMoCallback([FromBody] MoMoCallbackDto callback)
        {
            try
            {
                _logger.LogInformation("MoMo callback received: {Callback}", JsonSerializer.Serialize(callback));

                // TODO: Verify MoMo signature
                // var isValidSignature = VerifyMoMoSignature(callback);

                var transaction = await _context.Transactions
                    .Include(t => t.Order)
                    .FirstOrDefaultAsync(t => 
                        t.Gateway == PaymentGateway.MoMo && 
                        t.Order.OrderNumber == callback.orderId);

                if (transaction == null)
                {
                    _logger.LogWarning("Transaction not found for MoMo callback: {OrderId}", callback.orderId);
                    return BadRequest(new { resultCode = 1, message = "Transaction not found" });
                }

                transaction.GatewayTransactionId = callback.transId;
                transaction.GatewayResponse = JsonSerializer.Serialize(callback);
                transaction.UpdatedAt = DateTime.UtcNow;

                if (callback.resultCode == 0)
                {
                    transaction.Status = TransactionStatus.Success;
                    transaction.CompletedAt = DateTime.UtcNow;

                    transaction.Order.PaymentStatus = "Paid";
                    transaction.Order.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    transaction.Status = TransactionStatus.Failed;
                    transaction.ErrorMessage = callback.message;
                    transaction.CompletedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return Ok(new { resultCode = 0, message = "Success" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing MoMo callback");
                return Ok(new { resultCode = 1, message = "Internal server error" });
            }
        }
    }
}
