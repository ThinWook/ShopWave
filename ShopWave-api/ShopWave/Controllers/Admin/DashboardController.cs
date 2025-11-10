using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopWave.Models;
using ShopWave.Models.Responses;

namespace ShopWave.Controllers.Admin
{
    [ApiController]
    [Route("api/v1/admin/dashboard")]
    [Authorize(Roles = "Admin")]
    public class DashboardController : ControllerBase
    {
        private readonly ShopWaveDbContext _context;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(ShopWaveDbContext context, ILogger<DashboardController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboardData()
        {
            try
            {
                // === 1. Stats cards ===
                var todayStart = DateTime.UtcNow.Date;
                var todayEnd = todayStart.AddDays(1);
                var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

                var todaysRevenue = await _context.Transactions
                    .Where(t => t.Status == TransactionStatus.Success && t.CreatedAt >= todayStart && t.CreatedAt < todayEnd)
                    .Select(t => (decimal?)t.Amount)
                    .SumAsync() ?? 0m;

                var readyToShipCount = await _context.Orders
                    .CountAsync(o => o.Status == "PROCESSING" || o.Status == "Processing" || o.Status == "processing");

                var failedTodayCount = await _context.Transactions
                    .CountAsync(t => t.Status == TransactionStatus.Failed && t.CreatedAt >= todayStart && t.CreatedAt < todayEnd);

                // Count new customers this month (Role = "Customer")
                var newCustomersThisMonth = await _context.Users
                    .CountAsync(u => (u.Role == "Customer" || u.Role == "User") && u.CreatedAt >= monthStart);

                var stats = new DashboardStatsDto
                {
                    TodaysRevenue = todaysRevenue,
                    ReadyToShipCount = readyToShipCount,
                    FailedTodayCount = failedTodayCount,
                    NewCustomersThisMonth = newCustomersThisMonth
                };

                // === 2. Recent orders (top 5 processing) ===
                var recentOrders = await _context.Orders
                    .Where(o => o.Status == "PROCESSING" || o.Status == "Processing" || o.Status == "processing")
                    .OrderByDescending(o => o.OrderDate)
                    .Take(5)
                    .Select(o => new RecentOrderDto
                    {
                        Id = o.Id,
                        OrderNumber = o.OrderNumber,
                        CustomerName = o.ShippingFullName,
                        TotalAmount = o.TotalAmount,
                        OrderDate = o.OrderDate
                    })
                    .ToListAsync();

                // === 3. Failed transactions (top 5) ===
                var failedTransactions = await _context.Transactions
                    .Where(t => t.Status == TransactionStatus.Failed)
                    .OrderByDescending(t => t.CreatedAt)
                    .Take(5)
                    .Select(t => new FailedTransactionDto
                    {
                        Id = t.Id,
                        OrderId = t.OrderId,
                        Gateway = t.Gateway,
                        ErrorMessage = t.ErrorMessage,
                        Amount = t.Amount
                    })
                    .ToListAsync();

                var dashboard = new AdminDashboardDto
                {
                    Stats = stats,
                    RecentOrders = recentOrders,
                    FailedTransactions = failedTransactions
                };

                return Ok(EnvelopeBuilder.Ok(HttpContext, "ADMIN_DASHBOARD_RETRIEVED", dashboard));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin dashboard");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Error retrieving dashboard", "INTERNAL_ERROR") }, 500));
            }
        }

        // DTOs used by this controller - small and specific
        public class AdminDashboardDto
        {
            public DashboardStatsDto Stats { get; set; } = new DashboardStatsDto();
            public List<RecentOrderDto> RecentOrders { get; set; } = new List<RecentOrderDto>();
            public List<FailedTransactionDto> FailedTransactions { get; set; } = new List<FailedTransactionDto>();
        }

        public class DashboardStatsDto
        {
            public decimal TodaysRevenue { get; set; }
            public int ReadyToShipCount { get; set; }
            public int FailedTodayCount { get; set; }
            public int NewCustomersThisMonth { get; set; }
        }

        public class RecentOrderDto
        {
            public Guid Id { get; set; }
            public string OrderNumber { get; set; } = string.Empty;
            public string CustomerName { get; set; } = string.Empty;
            public decimal TotalAmount { get; set; }
            public DateTime OrderDate { get; set; }
        }

        public class FailedTransactionDto
        {
            public Guid Id { get; set; }
            public Guid OrderId { get; set; }
            public string Gateway { get; set; } = string.Empty;
            public string? ErrorMessage { get; set; }
            public decimal Amount { get; set; }
        }
    }
}
