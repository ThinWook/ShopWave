using System;
using Xunit;
using Moq;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using ShopWave.Repositories;
using ShopWave.Services;
using ShopWave.Models;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace ShopWave.Tests
{
    public class RecommendationServiceTests
    {
        private RecommendationService CreateService(IRecommendationRepository repo)
        {
            var cache = new MemoryCache(new MemoryCacheOptions());
            var logger = Mock.Of<ILogger<RecommendationService>>();
            return new RecommendationService(repo, cache, logger);
        }

        [Fact]
        public async Task ProductPath_Returns_ItemSimilar()
        {
            var repoMock = new Mock<IRecommendationRepository>();
            var pid = Guid.Parse("11111111-1111-1111-1111-111111111111");
            repoMock.Setup(r => r.GetItemSimilarAsync(pid, 2, default)).ReturnsAsync(new List<(Guid, double)> { (Guid.Parse("22222222-2222-2222-2222-222222222222"), 0.9) });
            repoMock.Setup(r => r.GetPersonalizedAsync(It.IsAny<Guid>(), It.IsAny<int>(), default)).ReturnsAsync(new List<(Guid, double)>());
            repoMock.Setup(r => r.GetPopularAsync(It.IsAny<int>(), default)).ReturnsAsync(new List<string>());

            var svc = CreateService(repoMock.Object);
            var res = await svc.GetRecommendationsAsync(null, pid, 2);

            Assert.Equal("item-similar", res.FallbackUsed);
            Assert.Single(res.Recommendations);
            Assert.Equal(Guid.Parse("22222222-2222-2222-2222-222222222222"), res.Recommendations[0].Id);
        }

        [Fact]
        public async Task UserPath_Returns_Personalized()
        {
            var repoMock = new Mock<IRecommendationRepository>();
            var uid = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
            repoMock.Setup(r => r.GetItemSimilarAsync(It.IsAny<Guid>(), It.IsAny<int>(), default)).ReturnsAsync(new List<(Guid, double)>());
            repoMock.Setup(r => r.GetPersonalizedAsync(uid, 3, default)).ReturnsAsync(new List<(Guid, double)> { (Guid.Parse("33333333-3333-3333-3333-333333333333"), 0.95) });
            repoMock.Setup(r => r.GetPopularAsync(It.IsAny<int>(), default)).ReturnsAsync(new List<string>());

            var svc = CreateService(repoMock.Object);
            var res = await svc.GetRecommendationsAsync(uid, null, 3);

            Assert.Equal("personalized", res.FallbackUsed);
            Assert.Single(res.Recommendations);
            Assert.Equal(Guid.Parse("33333333-3333-3333-3333-333333333333"), res.Recommendations[0].Id);
        }

        [Fact]
        public async Task Fallback_To_Popularity()
        {
            var repoMock = new Mock<IRecommendationRepository>();
            repoMock.Setup(r => r.GetItemSimilarAsync(It.IsAny<Guid>(), It.IsAny<int>(), default)).ReturnsAsync(new List<(Guid, double)>());
            repoMock.Setup(r => r.GetPersonalizedAsync(It.IsAny<Guid>(), It.IsAny<int>(), default)).ReturnsAsync(new List<(Guid, double)>());
            repoMock.Setup(r => r.GetPopularAsync(5, default)).ReturnsAsync(new List<string> { "11111111-1111-1111-1111-111111111111" });

            var svc = CreateService(repoMock.Object);
            var res = await svc.GetRecommendationsAsync(null, null, 5);

            Assert.Equal("popularity", res.FallbackUsed);
            Assert.Single(res.Recommendations);
        }

        [Fact]
        public async Task InvalidK_Throws()
        {
            var repoMock = new Mock<IRecommendationRepository>();
            var svc = CreateService(repoMock.Object);
            await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => svc.GetRecommendationsAsync(null, null, 0));
            await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => svc.GetRecommendationsAsync(null, null, 51));
        }
    }
}
