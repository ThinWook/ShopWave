using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using ShopWave.Repositories;
using ShopWave.Models;

namespace ShopWave.Services
{
    public class RecommendationService : IRecommendationService
    {
        private readonly IRecommendationRepository _repo;
        private readonly IMemoryCache _cache;
        private readonly ILogger<RecommendationService> _logger;
        private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

        public RecommendationService(IRecommendationRepository repo, IMemoryCache cache, ILogger<RecommendationService> logger)
        {
            _repo = repo;
            _cache = cache;
            _logger = logger;
        }

        public async Task<RecommendationsResponse> GetRecommendationsAsync(Guid? userId, Guid? productId, int k, CancellationToken ct = default)
        {
            if (k <= 0 || k > 50) throw new ArgumentOutOfRangeException(nameof(k));

            string fallbackUsed = "";
            var items = new List<RecommendationDto>();

            // Helper to enrich metadata for ids
            async Task<List<RecommendationDto>> EnrichAsync(List<(Guid id, double score)> ids)
            {
                var orderedIds = ids.Select(x => x.id).ToList();
                var meta = await (_repo as RecommendationRepository)?.GetProductMetadataAsync(orderedIds, ct) // try repo-specific method
                    ?? new Dictionary<Guid, (string title, decimal price, string? imageUrl)>();

                var result = ids.Select(x =>
                {
                    meta.TryGetValue(x.id, out var m);
                    return new RecommendationDto
                    {
                        Id = x.id,
                        Title = m.title ?? $"Product {x.id}",
                        Price = m.price,
                        ImageUrl = m.imageUrl,
                        Score = x.score,
                        Reason = fallbackUsed
                    };
                }).ToList();

                return result;
            }

            // Try item-similar if productId provided
            if (productId.HasValue)
            {
                var cacheKey = $"itemsim:{productId}:{k}";
                if (!_cache.TryGetValue(cacheKey, out List<RecommendationDto>? cached))
                {
                    var sim = await _repo.GetItemSimilarAsync(productId.Value, k, ct);
                    if (sim != null && sim.Count > 0)
                    {
                        fallbackUsed = "co-view";
                        var enriched = await EnrichAsync(sim);
                        items = enriched;

                        _cache.Set(cacheKey, items, CacheTtl);
                    }
                }
                else
                {
                    items = cached;
                    fallbackUsed = "co-view";
                }

                if (items.Count > 0)
                {
                    _logger.LogInformation("Recommendations: used fallback {Fallback}", fallbackUsed);
                    return new RecommendationsResponse { Recommendations = items.Take(k).ToList(), FallbackUsed = "item-similar" };
                }
            }

            // Try personalized if userId provided
            if (userId.HasValue)
            {
                var cacheKey = $"personal:{userId}:{k}";
                if (!_cache.TryGetValue(cacheKey, out List<RecommendationDto>? cached))
                {
                    var pres = await _repo.GetPersonalizedAsync(userId.Value, k, ct);
                    if (pres != null && pres.Count > 0)
                    {
                        fallbackUsed = "personalized";
                        var enriched = await EnrichAsync(pres);
                        items = enriched;

                        _cache.Set(cacheKey, items, CacheTtl);
                    }
                }
                else
                {
                    items = cached;
                    fallbackUsed = "personalized";
                }

                if (items.Count > 0)
                {
                    _logger.LogInformation("Recommendations: used fallback {Fallback}", fallbackUsed);
                    return new RecommendationsResponse { Recommendations = items.Take(k).ToList(), FallbackUsed = "personalized" };
                }
            }

            // Finally global popularity
            try
            {
                var cacheKey = $"popular:{k}";
                if (!_cache.TryGetValue(cacheKey, out List<RecommendationDto>? cached))
                {
                    var pop = await _repo.GetPopularAsync(k, ct);
                    if (pop != null && pop.Count > 0)
                    {
                        var ids = pop.Select(idstr => (id: Guid.TryParse(idstr, out var g) ? g : Guid.Empty, score: 0.0)).ToList();
                        fallbackUsed = "popular";
                        var enriched = await EnrichAsync(ids);
                        items = enriched;

                        _cache.Set(cacheKey, items, CacheTtl);
                    }
                }
                else
                {
                    items = cached;
                    fallbackUsed = "popular";
                }

                _logger.LogInformation("Recommendations: used fallback {Fallback}", fallbackUsed);
                return new RecommendationsResponse { Recommendations = items.Take(k).ToList(), FallbackUsed = "popularity" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting popularity recommendations");
                // As last resort return empty with fallback
                return new RecommendationsResponse { Recommendations = new List<RecommendationDto>(), FallbackUsed = "popularity" };
            }
        }
    }
}
