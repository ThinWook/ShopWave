using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopWave.Models
{
    public class OptionValue
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid OptionId { get; set; }

        [Required]
        [MaxLength(255)]
        public string Value { get; set; } = string.Empty;

        [Column(TypeName = "bigint")]
        public long? ThumbnailId { get; set; }

        // Navigation
        public virtual ProductOption Option { get; set; } = null!;
        public virtual Media? Thumbnail { get; set; }
    }
}