using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopWave.Models
{
    /// <summary>
    /// Qu?n/Huy?n c?a Vi?t Nam
    /// </summary>
    public class District
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public int ProvinceId { get; set; }

        // Navigation properties
        [ForeignKey(nameof(ProvinceId))]
        public virtual Province Province { get; set; } = null!;
        
        public virtual ICollection<Ward> Wards { get; set; } = new List<Ward>();
    }
}
