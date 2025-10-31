using Microsoft.AspNetCore.Mvc;
using ShopWave.Services;
using ShopWave.Models;

namespace ShopWave.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecommendationsController : ControllerBase
    {
        private readonly IRecommendationService _service;
        private readonly ILogger<RecommendationsController> _logger;

        public RecommendationsController(IRecommendationService service, ILogger<RecommendationsController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] Guid? userId, [FromQuery] Guid? productId, [FromQuery] int? k)
        {
            try
            {
                int kk = k ?? 8;
                if (kk <= 0 || kk > 50)
                {
                    return BadRequest(new { error = "k must be between 1 and 50" });
                }

                var res = await _service.GetRecommendationsAsync(userId, productId, kk, HttpContext.RequestAborted);
                return Ok(new { recommendations = res.Recommendations.Select(r => new { id = r.Id, title = r.Title, price = r.Price, imageUrl = r.ImageUrl, score = r.Score, reason = r.Reason }), fallbackUsed = res.FallbackUsed });
            }
            catch (ArgumentOutOfRangeException)
            {
                return BadRequest(new { error = "k must be between 1 and 50" });
            }
            catch (OperationCanceledException)
            {
                return StatusCode(503, new { error = "request cancelled" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in recommendations endpoint");
                return StatusCode(500, new { error = "internal error" });
            }
        }
    }
}
