namespace ShopWave.DTOs.Cart
{
    public class AvailableVoucherDto
    {
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal MinOrderAmount { get; set; }
        public decimal DiscountValue { get; set; }
        public string DiscountType { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for a voucher that has been applied to the cart
    /// </summary>
    public class AppliedVoucherDto
    {
        public string Code { get; set; } = string.Empty;
        public decimal DiscountAmount { get; set; }
        public string? Description { get; set; }
    }
}