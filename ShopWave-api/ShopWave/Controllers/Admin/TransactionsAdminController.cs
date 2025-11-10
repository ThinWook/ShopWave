using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopWave.Models;
using ShopWave.DTOs.Admin;
using ShopWave.Models.Responses;

namespace ShopWave.Controllers.Admin
{
    [ApiController]
    [Route("api/v1/admin/transactions")]
    [Authorize(Roles = "Admin")]
    public class TransactionsAdminController : ControllerBase
    {
        private readonly ShopWaveDbContext _context;
        private readonly ILogger<TransactionsAdminController> _logger;

        public TransactionsAdminController(ShopWaveDbContext context, ILogger<TransactionsAdminController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get admin transaction dashboard with statistics and paginated transaction list
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Items per page (default: 10)</param>
        /// <param name="status">Filter by transaction status (e.g., "SUCCESS", "FAILED", "PENDING")</param>
        /// <param name="gateway">Filter by payment gateway (e.g., "VNPAY", "MOMO", "COD")</param>
        /// <param name="search">Search by order number or gateway transaction ID</param>
        /// <param name="days">Filter by recent days (default: 7)</param>
        /// <returns>Dashboard data with stats and transactions</returns>
        [HttpGet]
        public async Task<IActionResult> GetTransactionsDashboard(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = null,
            [FromQuery] string? gateway = null,
            [FromQuery] string? search = null,
            [FromQuery] int days = 7)
        {
            try
            {
                // === 1. CALCULATE OVERVIEW STATS (TODAY ONLY) ===
                var todayStart = DateTime.UtcNow.Date;
                var todayEnd = todayStart.AddDays(1);

                // Query for today's successful transactions
                var todaysSuccessQuery = _context.Transactions
                    .Where(t => t.Status == "SUCCESS" && 
                                t.CreatedAt >= todayStart && 
                                t.CreatedAt < todayEnd);

                var stats = new AdminTransactionStatsDto
                {
                    // Sum of successful transaction amounts today
                    TodaysRevenue = await todaysSuccessQuery.SumAsync(t => t.Amount),
                    
                    // Count of successful transactions today
                    SuccessfulTodayCount = await todaysSuccessQuery.CountAsync(),
                    
                    // Count of failed transactions today
                    FailedTodayCount = await _context.Transactions
                        .CountAsync(t => t.Status == "FAILED" && 
                                         t.CreatedAt >= todayStart && 
                                         t.CreatedAt < todayEnd)
                };

                // === 2. BUILD QUERY FOR TRANSACTION TABLE ===
                IQueryable<Transaction> query = _context.Transactions
                    .Include(t => t.Order) // JOIN to get OrderNumber
                    .AsNoTracking();

                // 2a. Apply Date Filter (Recent days)
                var dateFilter = DateTime.UtcNow.AddDays(-days);
                query = query.Where(t => t.CreatedAt >= dateFilter);

                // 2b. Apply Status Filter
                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(t => t.Status == status);
                }

                // 2c. Apply Gateway Filter
                if (!string.IsNullOrEmpty(gateway))
                {
                    query = query.Where(t => t.Gateway == gateway);
                }

                // 2d. Apply Search (by order number or gateway transaction ID)
                if (!string.IsNullOrEmpty(search))
                {
                    var searchLower = search.ToLower();
                    query = query.Where(t =>
                        (t.Order != null && t.Order.OrderNumber.ToLower().Contains(searchLower)) ||
                        (t.GatewayTransactionId != null && t.GatewayTransactionId.ToLower().Contains(searchLower))
                    );
                }

                // 2e. Sort by newest first
                query = query.OrderByDescending(t => t.CreatedAt);

                // === 3. EXECUTE PAGINATION ===
                var totalItems = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

                var transactions = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // === 4. MAP TO DTOs ===
                var transactionDtos = transactions.Select(t => new AdminTransactionListDto
                {
                    Id = t.Id,
                    GatewayTransactionId = t.GatewayTransactionId,
                    OrderNumber = t.Order?.OrderNumber ?? "N/A",
                    CreatedAt = t.CreatedAt,
                    Gateway = t.Gateway ?? "UNKNOWN",
                    Amount = t.Amount,
                    Status = t.Status ?? "UNKNOWN"
                }).ToList();

                // === 5. CREATE COMPLETE RESPONSE ===
                var response = new AdminTransactionDashboardDto
                {
                    Stats = stats,
                    Pagination = new PaginationMeta
                    {
                        CurrentPage = page,
                        PageSize = pageSize,
                        TotalItems = totalItems,
                        TotalPages = totalPages
                    },
                    Transactions = transactionDtos
                };

                return Ok(EnvelopeBuilder.Ok(HttpContext, "ADMIN_TRANSACTIONS_RETRIEVED", response));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin transaction dashboard");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(
                    HttpContext,
                    "INTERNAL_ERROR",
                    new[] { new ErrorItem("server", "Error retrieving transactions", "INTERNAL_ERROR") },
                    500
                ));
            }
        }

        /// <summary>
        /// Get detailed information about a specific transaction for modal view
        /// Returns complete transaction details including debug information
        /// </summary>
        /// <param name="id">Transaction ID</param>
        /// <returns>Complete transaction details</returns>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTransactionById(Guid id)
        {
            try
            {
                // 1. QUERY DATABASE - Include Order to get OrderNumber
                var transaction = await _context.Transactions
                    .Include(t => t.Order) // JOIN to get OrderNumber
                    .AsNoTracking() // Performance optimization for read-only query
                    .FirstOrDefaultAsync(t => t.Id == id);

                // 2. HANDLE NOT FOUND
                if (transaction == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(
                        HttpContext,
                        "NOT_FOUND",
                        new[] { new ErrorItem("id", "Không tìm th?y giao d?ch", "NOT_FOUND") },
                        404
                    ));
                }

                // 3. MAP TO DTO - Transform entity to response DTO
                var transactionDetailDto = new AdminTransactionDetailDto
                {
                    Id = transaction.Id,
                    OrderId = transaction.OrderId,
                    OrderNumber = transaction.Order?.OrderNumber ?? "N/A", // Get OrderNumber from joined Order
                    Status = transaction.Status,
                    Gateway = transaction.Gateway,
                    TransactionType = transaction.TransactionType ?? "PAYMENT",
                    Amount = transaction.Amount,
                    CreatedAt = transaction.CreatedAt,
                    UpdatedAt = transaction.UpdatedAt,
                    CompletedAt = transaction.CompletedAt,
                    
                    // Debug information
                    GatewayTransactionId = transaction.GatewayTransactionId,
                    IpAddress = transaction.IpAddress,
                    UserAgent = transaction.UserAgent,
                    ErrorMessage = transaction.ErrorMessage,
                    GatewayResponse = transaction.GatewayResponse // Raw JSON from payment gateway
                };

                // 4. RETURN SUCCESS RESPONSE
                return Ok(EnvelopeBuilder.Ok(HttpContext, "TRANSACTION_DETAIL_RETRIEVED", transactionDetailDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving transaction {TransactionId} for admin", id);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(
                    HttpContext,
                    "INTERNAL_ERROR",
                    new[] { new ErrorItem("server", "L?i khi truy xu?t giao d?ch", "INTERNAL_ERROR") },
                    500
                ));
            }
        }
    }
}
