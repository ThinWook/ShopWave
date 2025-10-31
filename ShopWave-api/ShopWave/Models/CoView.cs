using System.ComponentModel.DataAnnotations;

namespace ShopWave.Models
{
    public class CoView
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ProductAId { get; set; }
        public Guid ProductBId { get; set; }

        public int CoCount { get; set; }

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}