namespace ShopWave.Models.DTOs
{
    /// <summary>
    /// DTO dùng chung cho T?nh, Qu?n, và Ph??ng
    /// </summary>
    public class LocationDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO cho phí v?n chuy?n
    /// </summary>
    public class ShippingFeeDto
    {
        public string Province { get; set; } = string.Empty;
        public decimal Fee { get; set; }
    }
}
