using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopWave.Models
{
    public class Product
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Required]
        public Guid CategoryId { get; set; }

        [ForeignKey("Media")]
        [Column(TypeName = "bigint")]
        public long? MediaId { get; set; }
        public virtual Media? Media { get; set; }

        public int Popularity { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Denormalized fields for admin list performance
        [Column(TypeName = "decimal(18,2)")]
        public decimal DisplayPrice { get; set; } = 0m; // minimal price among variants
        public int TotalInventory { get; set; } = 0;    // sum of variant stock
        public int VariantCount { get; set; } = 0;      // number of variants

        // Navigation properties
        [ForeignKey("CategoryId")]
        public virtual Category Category { get; set; } = null!;

        public virtual ICollection<ProductMedia> ProductMedia { get; set; } = new List<ProductMedia>();

        // New navigations for options and variants
        public virtual ICollection<ProductOption> Options { get; set; } = new List<ProductOption>();
        public virtual ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    }
}