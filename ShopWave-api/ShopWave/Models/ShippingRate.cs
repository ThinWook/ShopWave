using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopWave.Models
{
    /// <summary>
    /// Phí v?n chuy?n theo t?nh/thành ph?
    /// </summary>
    public class ShippingRate
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>
        /// Tên t?nh/thành (ví d?: "H? Chí Minh", "Hà N?i", ho?c "DEFAULT")
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Province { get; set; } = string.Empty;

        /// <summary>
        /// Phí v?n chuy?n (VN?)
        /// </summary>
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Fee { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
