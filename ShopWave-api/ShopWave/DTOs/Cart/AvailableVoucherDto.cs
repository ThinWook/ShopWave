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
}