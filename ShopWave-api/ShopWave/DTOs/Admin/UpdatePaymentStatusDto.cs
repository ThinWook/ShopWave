using System.ComponentModel.DataAnnotations;

namespace ShopWave.DTOs.Admin
{
    /// <summary>
    /// DTO for updating payment status of an order
    /// </summary>
    public class UpdatePaymentStatusDto
    {
        /// <summary>
        /// New payment status (e.g., "PAID", "UNPAID", "REFUNDED", "FAILED")
        /// </summary>
        [Required(ErrorMessage = "Tr?ng thái thanh toán là b?t bu?c")]
        [MaxLength(50)]
        public string NewPaymentStatus { get; set; } = string.Empty;
    }
}
