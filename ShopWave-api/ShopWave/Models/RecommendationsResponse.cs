namespace ShopWave.Models
{
    public class RecommendationsResponse
    {
        public List<RecommendationDto> Recommendations { get; set; } = new List<RecommendationDto>();
        public string FallbackUsed { get; set; } = string.Empty; // "popularity|item-similar|personalized"
    }
}