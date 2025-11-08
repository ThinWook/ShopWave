using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopWave.Models
{
    public class OrderItem
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid OrderId { get; set; }

        // ProductVariantId is the only reference needed
        [Required]
        public Guid ProductVariantId { get; set; }

        [Required]
        [MaxLength(255)]
        public string ProductName { get; set; } = string.Empty;

        [Required]
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPrice { get; set; }

        // === VARIANT SNAPSHOT FIELDS (Added for historical tracking) ===
        /// <summary>
        /// Snapshot of variant image URL at time of order
        /// </summary>
        [MaxLength(1000)]
        public string? VariantImageUrl { get; set; }

        /// <summary>
        /// Snapshot of selected options as JSON array at time of order
        /// Example: [{"name":"Kích th??c","value":"XL"},{"name":"Màu","value":"Cam"}]
        /// </summary>
        [Column(TypeName = "nvarchar(max)")]
        public string? SelectedOptions { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("OrderId")]
        public virtual Order Order { get; set; } = null!;

        [ForeignKey("ProductVariantId")]
        public virtual ProductVariant ProductVariant { get; set; } = null!;
    }
}