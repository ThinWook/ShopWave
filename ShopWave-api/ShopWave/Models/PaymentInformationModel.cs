namespace ShopWave.Models
{
    /// <summary>
    /// Payment information model for creating payment URL
    /// </summary>
    public class PaymentInformationModel
    {
        public double Amount { get; set; }
        public string Name { get; set; } = string.Empty;
        public string OrderDescription { get; set; } = string.Empty;
        public string OrderType { get; set; } = "other";
    }
}
