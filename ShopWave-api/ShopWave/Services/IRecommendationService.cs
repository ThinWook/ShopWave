using System;
using System.Threading;
using System.Threading.Tasks;
using ShopWave.Models;

namespace ShopWave.Services
{
    public interface IRecommendationService
    {
        Task<RecommendationsResponse> GetRecommendationsAsync(Guid? userId, Guid? productId, int k, CancellationToken ct = default);
    }
}