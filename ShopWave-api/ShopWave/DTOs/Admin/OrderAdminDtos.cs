using System;
using System.Collections.Generic;
using ShopWave.Models.DTOs;

namespace ShopWave.DTOs.Admin
{
    /// <summary>
    /// Complete response for admin order dashboard
    /// </summary>
    public class AdminOrderDashboardDto
    {
        /// <summary>
        /// Statistics for overview cards
        /// </summary>
        public AdminOrderStatsDto Stats { get; set; } = null!;
        
        /// <summary>
        /// Pagination metadata
        /// </summary>
        public PaginationMeta Pagination { get; set; } = null!;
        
        /// <summary>
        /// List of orders for the table
        /// </summary>
        public List<AdminOrderListDto> Orders { get; set; } = new();
    }

    /// <summary>
    /// Statistics for overview cards at the top of dashboard
    /// </summary>
    public class AdminOrderStatsDto
    {
        /// <summary>
        /// Total new orders (PENDING + PROCESSING)
        /// </summary>
        public int NewOrdersCount { get; set; }
        
        /// <summary>
        /// Orders ready to ship (PROCESSING status)
        /// </summary>
        public int ReadyToShipCount { get; set; }
        
        /// <summary>
        /// Today's revenue from PAID orders
        /// </summary>
        public decimal TodaysRevenue { get; set; }
        
        /// <summary>
        /// Orders with pending payment issues (PENDING_PAYMENT status)
        /// </summary>
        public int PendingPaymentCount { get; set; }
    }

    /// <summary>
    /// Order information for each row in the table
    /// </summary>
    public class AdminOrderListDto
    {
        public Guid Id { get; set; }
        
        /// <summary>
        /// Order number (e.g., "ORD20250125001")
        /// </summary>
        public string OrderNumber { get; set; } = string.Empty;
        
        /// <summary>
        /// Customer full name
        /// </summary>
        public string CustomerName { get; set; } = string.Empty;
        
        /// <summary>
        /// Order creation date
        /// </summary>
        public DateTime OrderDate { get; set; }
        
        /// <summary>
        /// Total order amount (VND)
        /// </summary>
        public decimal TotalAmount { get; set; }
        
        /// <summary>
        /// Payment status (e.g., "PAID", "UNPAID", "PENDING")
        /// </summary>
        public string PaymentStatus { get; set; } = string.Empty;
        
        /// <summary>
        /// Order status (e.g., "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED")
        /// </summary>
        public string Status { get; set; } = string.Empty;
    }

    /// <summary>
    /// Pagination metadata
    /// </summary>
    public class PaginationMeta
    {
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
    }

    // === NEW: Detailed Order DTOs for Admin Single Transaction Page ===

    /// <summary>
    /// Complete order detail for admin "Single Transaction" page
    /// </summary>
    public class AdminOrderDetailDto
    {
        public Guid Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        
        // Status information
        public string Status { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string? PaymentMethod { get; set; }

        // === PRICE BREAKDOWN (snapshot from order) ===
        public decimal SubTotal { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal ProgressiveDiscountAmount { get; set; }
        public decimal VoucherDiscountAmount { get; set; }
        public string? VoucherCode { get; set; }
        public decimal TotalAmount { get; set; }

        // Flattened address information
        public AdminOrderShippingAddressDto ShippingAddress { get; set; } = null!;
        public AdminOrderBillingAddressDto? BillingAddress { get; set; }
        
        // Related data
        public List<AdminOrderItemDto> OrderItems { get; set; } = new();
        public List<AdminTransactionDto> Transactions { get; set; } = new();
    }

    /// <summary>
    /// Order item with snapshot data for admin view
    /// </summary>
    public class AdminOrderItemDto
    {
        public Guid Id { get; set; }
        public string ProductName { get; set; } = string.Empty; // Snapshot
        public string? VariantImageUrl { get; set; } // Snapshot
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; } // Snapshot
        public decimal TotalPrice { get; set; }

        /// <summary>
        /// Array of selected options at time of order
        /// e.g. [{ "name": "Size", "value": "XL" }, { "name": "Color", "value": "Red" }]
        /// </summary>
        public List<SelectedOptionDto>? SelectedOptions { get; set; }
    }

    /// <summary>
    /// Transaction history for admin view
    /// </summary>
    public class AdminTransactionDto
    {
        public Guid Id { get; set; }
        public string Gateway { get; set; } = string.Empty; // VNPAY, MOMO, COD
        public string? GatewayTransactionId { get; set; } // Transaction ID from payment gateway
        public decimal Amount { get; set; }
        public string Status { get; set; } = string.Empty; // PENDING, SUCCESS, FAILED
        public string? ErrorMessage { get; set; }
        public string? GatewayResponse { get; set; } // Full JSON response for debugging
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Shipping address DTO (flattened structure)
    /// </summary>
    public class AdminOrderShippingAddressDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string Ward { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string Province { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Billing address DTO (optional, flattened structure)
    /// </summary>
    public class AdminOrderBillingAddressDto
    {
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? Street { get; set; }
        public string? Ward { get; set; }
        public string? District { get; set; }
        public string? Province { get; set; }
        public string? Notes { get; set; }
    }
}
