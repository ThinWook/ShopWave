using Microsoft.EntityFrameworkCore;
using ShopWave.Models;

namespace ShopWave.Services
{
    /// <summary>
    /// Service ?? test và l?y thông tin database
    /// </summary>
    public class DatabaseTestService
    {
        private readonly ShopWaveDbContext _context;
        private readonly ILogger<DatabaseTestService> _logger;

        public DatabaseTestService(ShopWaveDbContext context, ILogger<DatabaseTestService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Test database connection
        /// </summary>
        public async Task<bool> TestConnectionAsync()
        {
            try
            {
                return await _context.Database.CanConnectAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database connection test failed");
                return false;
            }
        }

        /// <summary>
        /// Get database information
        /// </summary>
        public async Task<DatabaseInfo> GetDatabaseInfoAsync()
        {
            var connectionString = _context.Database.GetConnectionString();
            var dbName = _context.Database.GetDbConnection().Database;
            
            // Get table count
            var tables = await GetTableNamesAsync();
            
            // Get record counts
            int userCount = 0, productCount = 0, orderCount = 0, categoryCount = 0;
            
            try
            {
                userCount = await _context.Users.CountAsync();
            }
            catch { /* Table might not exist */ }
            
            try
            {
                productCount = await _context.Products.CountAsync();
            }
            catch { /* Table might not exist */ }
            
            try
            {
                orderCount = await _context.Orders.CountAsync();
            }
            catch { /* Table might not exist */ }
            
            try
            {
                categoryCount = await _context.Categories.CountAsync();
            }
            catch { /* Table might not exist */ }

            return new DatabaseInfo
            {
                DatabaseName = dbName,
                ServerName = _context.Database.GetDbConnection().DataSource,
                TableCount = tables.Count,
                UserCount = userCount,
                ProductCount = productCount,
                OrderCount = orderCount,
                CategoryCount = categoryCount,
                ConnectionString = MaskConnectionString(connectionString ?? "")
            };
        }

        /// <summary>
        /// Get all table names in database
        /// </summary>
        public async Task<List<string>> GetTableNamesAsync()
        {
            try
            {
                var tables = await _context.Database
                    .SqlQueryRaw<string>("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'")
                    .ToListAsync();
                
                return tables;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get table names");
                return new List<string>();
            }
        }

        /// <summary>
        /// Ensure database is created
        /// </summary>
        public async Task<bool> EnsureDatabaseCreatedAsync()
        {
            try
            {
                return await _context.Database.EnsureCreatedAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to ensure database created");
                return false;
            }
        }

        /// <summary>
        /// Mask sensitive information in connection string
        /// </summary>
        private string MaskConnectionString(string connectionString)
        {
            if (string.IsNullOrEmpty(connectionString))
                return "";

            // Mask password
            var masked = System.Text.RegularExpressions.Regex.Replace(
                connectionString,
                @"(Password|Pwd)=([^;]+)",
                "$1=***",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase
            );

            return masked;
        }
    }

    /// <summary>
    /// Database information model
    /// </summary>
    public class DatabaseInfo
    {
        public string DatabaseName { get; set; } = string.Empty;
        public string ServerName { get; set; } = string.Empty;
        public int TableCount { get; set; }
        public int UserCount { get; set; }
        public int ProductCount { get; set; }
        public int OrderCount { get; set; }
        public int CategoryCount { get; set; }
        public string ConnectionString { get; set; } = string.Empty;
    }
}
