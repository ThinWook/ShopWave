using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopWave.Models
{
    public class UserMedia
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        [Column(TypeName = "bigint")]
        public long MediaId { get; set; }

        [Required]
        [MaxLength(50)]
        [Column(TypeName = "varchar(50)")]
        public string MediaType { get; set; } = string.Empty; // avatar, cover, gallery

        // Navigation
        public virtual User User { get; set; } = null!;
        public virtual Media Media { get; set; } = null!;
    }
}
