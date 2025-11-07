using System.ComponentModel.DataAnnotations;

namespace ShopWave.Models.DTOs
{
    public class CategoryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid? ParentId { get; set; }
        public string? ParentName { get; set; }
        public bool IsActive { get; set; }
        public int ProductCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class ProductDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? Size { get; set; }
        public int StockQuantity { get; set; }
        public bool IsActive { get; set; }
    }

    // Minimal DTO for product card rendering on client
    public class ProductCardDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public int StockQuantity { get; set; }
        public int VariantCount { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UserDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public long? MediaId { get; set; }
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AddressDto
    {
        [Required]
        public string FullName { get; set; } = string.Empty;
        
        [Required]
        public string Phone { get; set; } = string.Empty;
        
        [Required]
        public string Address { get; set; } = string.Empty;
        
        [Required]
        public string Ward { get; set; } = string.Empty;
        
        [Required]
        public string District { get; set; } = string.Empty;
        
        [Required]
        public string City { get; set; } = string.Empty;
        
        public string? Notes { get; set; }
    }

    public class OrderDto
    {
        public Guid Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public DateTime? ShippedDate { get; set; }
        public DateTime? DeliveredDate { get; set; }
        public List<OrderItemDto> OrderItems { get; set; } = new List<OrderItemDto>();
    }

    public class OrderDetailDto : OrderDto
    {
        public string? PaymentMethod { get; set; }
        public AddressDto ShippingAddress { get; set; } = null!;
        public AddressDto? BillingAddress { get; set; }
    }

    public class OrderItemDto
    {
        public Guid Id { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }

    public class CartItemDto
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public Guid? VariantId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public long? ProductMediaId { get; set; }
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public decimal TotalPrice { get; set; }
        public int StockQuantity { get; set; }

        // Added fields for variant display
        public string? VariantImageUrl { get; set; }
        public List<KeyValuePair<string, string>>? SelectedOptions { get; set; }
    }

    public class ReviewDto
    {
        public Guid Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime Date { get; set; }
        public bool IsVerified { get; set; }
    }

    public class ProductVariantDto
    {
        public Guid Id { get; set; }
        public string Sku { get; set; }
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public long? ImageId { get; set; }
        public string? Size { get; set; }
        public string? Color { get; set; }
    }

    /// <summary>
    /// DTO for progressive discount information based on DiscountTiers table
    /// This is calculated server-side and returned in cart responses
    /// </summary>
    public class ProgressiveDiscountDto
    {
        /// <summary>
        /// Current discount value being applied (e.g., 40000)
        /// </summary>
        public decimal CurrentDiscountValue { get; set; } = 0;

        /// <summary>
        /// Next discount threshold amount (e.g., 999000)
        /// Null if already at highest tier
        /// </summary>
        public decimal? NextDiscountThreshold { get; set; }

        /// <summary>
        /// Discount value for the next tier (e.g., 70000)
        /// Null if already at highest tier
        /// </summary>
        public decimal? NextDiscountValue { get; set; }

        /// <summary>
        /// Amount needed to reach next tier (e.g., 121000)
        /// Null if already at highest tier
        /// </summary>
        public decimal? AmountToNext { get; set; }
    }
}