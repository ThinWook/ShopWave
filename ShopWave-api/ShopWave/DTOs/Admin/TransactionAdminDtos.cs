using System;
using System.Collections.Generic;

namespace ShopWave.DTOs.Admin
{
    /// <summary>
    /// Complete response for admin transaction dashboard
    /// </summary>
    public class AdminTransactionDashboardDto
    {
        /// <summary>
        /// Statistics for overview cards
        /// </summary>
        public AdminTransactionStatsDto Stats { get; set; } = null!;
        
        /// <summary>
        /// Pagination metadata
        /// </summary>
        public PaginationMeta Pagination { get; set; } = null!;
        
        /// <summary>
        /// List of transactions for the table
        /// </summary>
        public List<AdminTransactionListDto> Transactions { get; set; } = new();
    }

    /// <summary>
    /// Statistics for overview cards at the top of dashboard
    /// </summary>
    public class AdminTransactionStatsDto
    {
        /// <summary>
        /// Total revenue from successful transactions today
        /// </summary>
        public decimal TodaysRevenue { get; set; }
        
        /// <summary>
        /// Count of successful transactions today
        /// </summary>
        public int SuccessfulTodayCount { get; set; }
        
        /// <summary>
        /// Count of failed transactions today
        /// </summary>
        public int FailedTodayCount { get; set; }
    }

    /// <summary>
    /// Transaction information for each row in the table
    /// </summary>
    public class AdminTransactionListDto
    {
        public Guid Id { get; set; }
        
        /// <summary>
        /// Gateway transaction ID (e.g., VNPAY transaction code)
        /// </summary>
        public string? GatewayTransactionId { get; set; }
        
        /// <summary>
        /// Associated order number
        /// </summary>
        public string OrderNumber { get; set; } = string.Empty;
        
        /// <summary>
        /// Transaction creation date
        /// </summary>
        public DateTime CreatedAt { get; set; }
        
        /// <summary>
        /// Payment gateway (e.g., "VNPAY", "MOMO", "COD")
        /// </summary>
        public string Gateway { get; set; } = string.Empty;
        
        /// <summary>
        /// Transaction amount (VND)
        /// </summary>
        public decimal Amount { get; set; }
        
        /// <summary>
        /// Transaction status (e.g., "SUCCESS", "FAILED", "PENDING")
        /// </summary>
        public string Status { get; set; } = string.Empty;
    }

    /// <summary>
    /// Detailed transaction information for modal view
    /// Includes all fields for debugging and customer support
    /// </summary>
    public class AdminTransactionDetailDto
    {
        public Guid Id { get; set; }
        
        /// <summary>
        /// Associated order ID (for linking)
        /// </summary>
        public Guid OrderId { get; set; }
        
        /// <summary>
        /// Associated order number (for display)
        /// </summary>
        public string OrderNumber { get; set; } = string.Empty;
        
        /// <summary>
        /// Transaction status: SUCCESS, FAILED, PENDING, REFUNDED
        /// </summary>
        public string Status { get; set; } = string.Empty;
        
        /// <summary>
        /// Payment gateway: VNPAY, MOMO, COD
        /// </summary>
        public string Gateway { get; set; } = string.Empty;
        
        /// <summary>
        /// Transaction type: PAYMENT, REFUND
        /// </summary>
        public string TransactionType { get; set; } = string.Empty;
        
        /// <summary>
        /// Transaction amount (VND)
        /// </summary>
        public decimal Amount { get; set; }
        
        /// <summary>
        /// Transaction creation timestamp
        /// </summary>
        public DateTime CreatedAt { get; set; }
        
        /// <summary>
        /// Last update timestamp
        /// </summary>
        public DateTime UpdatedAt { get; set; }
        
        /// <summary>
        /// Completion timestamp (when payment confirmed)
        /// </summary>
        public DateTime? CompletedAt { get; set; }
        
        // === DEBUG INFORMATION ===
        
        /// <summary>
        /// Gateway transaction ID (from VNPay/MoMo)
        /// </summary>
        public string? GatewayTransactionId { get; set; }
        
        /// <summary>
        /// Customer IP address
        /// </summary>
        public string? IpAddress { get; set; }
        
        /// <summary>
        /// Browser user agent
        /// </summary>
        public string? UserAgent { get; set; }
        
        /// <summary>
        /// Error message if transaction failed
        /// </summary>
        public string? ErrorMessage { get; set; }
        
        /// <summary>
        /// Raw JSON response from payment gateway (for debugging)
        /// </summary>
        public string? GatewayResponse { get; set; }
    }
}
