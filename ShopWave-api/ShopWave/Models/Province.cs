using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopWave.Models
{
    /// <summary>
    /// T?nh/Thành ph? c?a Vi?t Nam
    /// </summary>
    public class Province
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? Code { get; set; }

        // Navigation property
        public virtual ICollection<District> Districts { get; set; } = new List<District>();
    }
}
