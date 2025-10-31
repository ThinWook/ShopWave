namespace ShopWave.Models
{
    public class RecommendationDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public double Score { get; set; }
        public string Reason { get; set; } = string.Empty; // "popular" | "co-view" | "personalized"
    }
}