using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopWave.Models
{
    public class Order
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        [Required]
        [MaxLength(50)]
        public string OrderNumber { get; set; } = string.Empty;

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
        public virtual User User { get; set; } = null!;

        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        
        public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    }
}