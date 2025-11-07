using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopWave.Models
{
    /// <summary>
    /// Ph??ng/Xã c?a Vi?t Nam
    /// </summary>
    public class Ward
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public int DistrictId { get; set; }

        // Navigation property
        [ForeignKey(nameof(DistrictId))]
        public virtual District District { get; set; } = null!;
    }
}
