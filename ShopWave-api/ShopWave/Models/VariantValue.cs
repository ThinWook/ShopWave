using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopWave.Models
{
    public class VariantValue
    {
        [Required]
        public Guid VariantId { get; set; }

        [Required]
        public Guid ValueId { get; set; }

        // Navigation
        public virtual ProductVariant Variant { get; set; } = null!;
        public virtual OptionValue Value { get; set; } = null!;
    }
}