using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopWave.Models
{
    public class ProductOption
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid ProductId { get; set; }

        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? DisplayType { get; set; } // "text_button", "color_swatch", "dropdown", etc.

        // Navigation
        public virtual Product Product { get; set; } = null!;
        public virtual ICollection<OptionValue> Values { get; set; } = new List<OptionValue>();
    }
}