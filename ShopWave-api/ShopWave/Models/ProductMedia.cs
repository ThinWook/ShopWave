using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopWave.Models
{
    public class ProductMedia
    {
        [Required]
        public Guid ProductId { get; set; }

        [Required]
        [Column(TypeName = "bigint")]
        public long MediaId { get; set; }

        public int DisplayOrder { get; set; } = 0;

        // Navigation
        public virtual Product Product { get; set; } = null!;
        public virtual Media Media { get; set; } = null!;
    }
}
