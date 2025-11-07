using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopWave.Models;
using ShopWave.Models.Responses;

namespace ShopWave.Controllers.Admin
{
    [ApiController]
    [Route("api/v1/admin/shipping-rates")]
    [Authorize(Roles = "Admin")]
    public class ShippingRatesAdminController : ControllerBase
    {
        private readonly ShopWaveDbContext _context;
        private readonly ILogger<ShippingRatesAdminController> _logger;

        public ShippingRatesAdminController(ShopWaveDbContext context, ILogger<ShippingRatesAdminController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// GET /api/v1/admin/shipping-rates
        /// L?y t?t c? phí v?n chuy?n (dành cho admin)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllShippingRates()
        {
            try
            {
                var rates = await _context.ShippingRates
                    .OrderBy(sr => sr.Province)
                    .Select(sr => new
                    {
                        id = sr.Id,
                        province = sr.Province,
                        fee = sr.Fee,
                        createdAt = sr.CreatedAt,
                        updatedAt = sr.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(EnvelopeBuilder.Ok(HttpContext, "SHIPPING_RATES_RETRIEVED", rates));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shipping rates");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR",
                    new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        /// <summary>
        /// POST /api/v1/admin/shipping-rates
        /// T?o ho?c c?p nh?t phí v?n chuy?n cho m?t t?nh
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> UpsertShippingRate([FromBody] ShippingRateRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "VALIDATION_ERROR",
                        new[] { new ErrorItem("request", "Invalid payload", "VALIDATION_ERROR") }, 400));
                }

                var provinceName = request.Province.Trim();

                // Ki?m tra xem ?ã có phí cho t?nh này ch?a
                var existingRate = await _context.ShippingRates
                    .FirstOrDefaultAsync(sr => sr.Province == provinceName);

                if (existingRate != null)
                {
                    // C?p nh?t
                    existingRate.Fee = request.Fee;
                    existingRate.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Updated shipping rate for province {Province} to {Fee}", provinceName, request.Fee);

                    return Ok(EnvelopeBuilder.Ok(HttpContext, "SHIPPING_RATE_UPDATED", new { id = existingRate.Id }));
                }
                else
                {
                    // T?o m?i
                    var newRate = new ShippingRate
                    {
                        Province = provinceName,
                        Fee = request.Fee,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.ShippingRates.Add(newRate);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Created shipping rate for province {Province} with fee {Fee}", provinceName, request.Fee);

                    return StatusCode(201, EnvelopeBuilder.Ok(HttpContext, "SHIPPING_RATE_CREATED", new { id = newRate.Id }));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error upserting shipping rate");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR",
                    new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        /// <summary>
        /// DELETE /api/v1/admin/shipping-rates/{id}
        /// Xóa phí v?n chuy?n
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteShippingRate(Guid id)
        {
            try
            {
                var rate = await _context.ShippingRates.FindAsync(id);
                if (rate == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND",
                        new[] { new ErrorItem("id", "Shipping rate not found", "NOT_FOUND") }, 404));
                }

                // Không cho phép xóa DEFAULT rate
                if (rate.Province == "DEFAULT")
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "CANNOT_DELETE_DEFAULT",
                        new[] { new ErrorItem("province", "Không th? xóa phí v?n chuy?n m?c ??nh", "CANNOT_DELETE_DEFAULT") }, 400));
                }

                _context.ShippingRates.Remove(rate);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Deleted shipping rate {Id} for province {Province}", id, rate.Province);

                return Ok(EnvelopeBuilder.Ok(HttpContext, "SHIPPING_RATE_DELETED", new { id }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting shipping rate {Id}", id);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR",
                    new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }
    }

    public class ShippingRateRequest
    {
        public string Province { get; set; } = string.Empty;
        public decimal Fee { get; set; }
    }
}
