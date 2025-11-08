using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopWave.Models
{
    public class Order
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        // Allow null for guest orders
        public Guid? UserId { get; set; }

        [Required]
        [MaxLength(50)]
        public string OrderNumber { get; set; } = string.Empty;

        // === PRICE BREAKDOWN FIELDS (Added for historical tracking) ===
        /// <summary>
        /// Subtotal before discounts and shipping (sum of all item prices)
        /// </summary>
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal SubTotal { get; set; }

        /// <summary>
        /// Shipping fee at the time of order
        /// </summary>
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal ShippingFee { get; set; }

        /// <summary>
        /// Total discount amount applied (progressive + voucher)
        /// Kept for backward compatibility and quick reference
        /// </summary>
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountAmount { get; set; }

        // === DETAILED DISCOUNT BREAKDOWN ===
        /// <summary>
        /// Progressive discount amount based on order subtotal tiers
        /// </summary>
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal ProgressiveDiscountAmount { get; set; }

        /// <summary>
        /// Voucher discount amount if a voucher code was applied
        /// </summary>
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal VoucherDiscountAmount { get; set; }

        /// <summary>
        /// Voucher code applied to this order (if any)
        /// </summary>
        [MaxLength(50)]
        public string? VoucherCode { get; set; }

        /// <summary>
        /// Final total = SubTotal + ShippingFee - DiscountAmount
        /// </summary>
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        // Structured Shipping Address Fields
        [Required]
        [MaxLength(100)]
        public string ShippingFullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string ShippingPhone { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string ShippingStreet { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string ShippingWard { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string ShippingDistrict { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string ShippingProvince { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? ShippingNotes { get; set; }

        // Structured Billing Address Fields (optional, defaults to shipping if not provided)
        [MaxLength(100)]
        public string? BillingFullName { get; set; }

        [MaxLength(20)]
        public string? BillingPhone { get; set; }

        [MaxLength(500)]
        public string? BillingStreet { get; set; }

        [MaxLength(100)]
        public string? BillingWard { get; set; }

        [MaxLength(100)]
        public string? BillingDistrict { get; set; }

        [MaxLength(100)]
        public string? BillingProvince { get; set; }

        [MaxLength(500)]
        public string? BillingNotes { get; set; }

        [MaxLength(100)]
        public string? PaymentMethod { get; set; }

        [MaxLength(50)]
        public string PaymentStatus { get; set; } = "Pending";

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        public DateTime? ShippedDate { get; set; }

        public DateTime? DeliveredDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        
        public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    }
}