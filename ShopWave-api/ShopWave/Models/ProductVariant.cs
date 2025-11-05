using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopWave.Models
{
    public class ProductVariant
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid ProductId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Sku { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        public int Stock { get; set; }

        [Column(TypeName = "bigint")]
        public long? ImageId { get; set; }

        // Navigation
        public virtual Product Product { get; set; }
        public virtual Media? Image { get; set; }

        // New navigation for option values
        public virtual ICollection<VariantValue> VariantValues { get; set; } = new List<VariantValue>();
    }
}
