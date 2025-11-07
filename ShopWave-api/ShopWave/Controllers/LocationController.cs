using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopWave.Models;
using ShopWave.Models.DTOs;
using ShopWave.Models.Responses;

namespace ShopWave.Controllers
{
    [ApiController]
    [Route("api/v1")]
    public class LocationController : ControllerBase
    {
        private readonly ShopWaveDbContext _context;
        private readonly ILogger<LocationController> _logger;
        private const string DEFAULT_SHIPPING_PROVINCE = "DEFAULT";

        public LocationController(ShopWaveDbContext context, ILogger<LocationController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// GET /api/v1/provinces
        /// L?y danh sách t?t c? t?nh/thành ph?
        /// </summary>
        [HttpGet("provinces")]
        public async Task<IActionResult> GetProvinces()
        {
            try
            {
                var provinces = await _context.Provinces
                    .OrderBy(p => p.Name)
                    .Select(p => new LocationDto
                    {
                        Id = p.Id,
                        Name = p.Name
                    })
                    .ToListAsync();

                return Ok(EnvelopeBuilder.Ok(HttpContext, "PROVINCES_RETRIEVED", provinces));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving provinces");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", 
                    new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        /// <summary>
        /// GET /api/v1/districts?provinceId=...
        /// L?y danh sách qu?n/huy?n theo t?nh
        /// </summary>
        [HttpGet("districts")]
        public async Task<IActionResult> GetDistricts([FromQuery] int provinceId)
        {
            try
            {
                if (provinceId <= 0)
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "INVALID_PROVINCE_ID",
                        new[] { new ErrorItem("provinceId", "Province ID không h?p l?", "INVALID_PROVINCE_ID") }, 400));
                }

                var districts = await _context.Districts
                    .Where(d => d.ProvinceId == provinceId)
                    .OrderBy(d => d.Name)
                    .Select(d => new LocationDto
                    {
                        Id = d.Id,
                        Name = d.Name
                    })
                    .ToListAsync();

                return Ok(EnvelopeBuilder.Ok(HttpContext, "DISTRICTS_RETRIEVED", districts));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving districts for provinceId {ProvinceId}", provinceId);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR",
                    new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        /// <summary>
        /// GET /api/v1/wards?districtId=...
        /// L?y danh sách ph??ng/xã theo qu?n/huy?n
        /// </summary>
        [HttpGet("wards")]
        public async Task<IActionResult> GetWards([FromQuery] int districtId)
        {
            try
            {
                if (districtId <= 0)
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "INVALID_DISTRICT_ID",
                        new[] { new ErrorItem("districtId", "District ID không h?p l?", "INVALID_DISTRICT_ID") }, 400));
                }

                var wards = await _context.Wards
                    .Where(w => w.DistrictId == districtId)
                    .OrderBy(w => w.Name)
                    .Select(w => new LocationDto
                    {
                        Id = w.Id,
                        Name = w.Name
                    })
                    .ToListAsync();

                return Ok(EnvelopeBuilder.Ok(HttpContext, "WARDS_RETRIEVED", wards));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving wards for districtId {DistrictId}", districtId);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR",
                    new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        /// <summary>
        /// GET /api/v1/shipping-fee?province=...
        /// L?y phí v?n chuy?n theo tên t?nh/thành ph?
        /// </summary>
        [HttpGet("shipping-fee")]
        public async Task<IActionResult> GetShippingFee([FromQuery] string province)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(province))
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "PROVINCE_REQUIRED",
                        new[] { new ErrorItem("province", "Tên T?nh/Thành là b?t bu?c", "PROVINCE_REQUIRED") }, 400));
                }

                var provinceName = province.Trim();

                // Tìm m?c phí cho t?nh c? th?
                var rate = await _context.ShippingRates
                    .FirstOrDefaultAsync(r => r.Province == provinceName);

                // N?u không có m?c phí riêng, tìm m?c phí "DEFAULT" (m?c ??nh)
                if (rate == null)
                {
                    rate = await _context.ShippingRates
                        .FirstOrDefaultAsync(r => r.Province == DEFAULT_SHIPPING_PROVINCE);
                }

                // N?u không có c? DEFAULT, h? th?ng ?ang b? l?i c?u hình
                if (rate == null)
                {
                    _logger.LogError("No default shipping rate configured in the system");
                    return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "SHIPPING_NOT_CONFIGURED",
                        new[] { new ErrorItem("server", "L?i: Không tìm th?y c?u hình phí v?n chuy?n m?c ??nh", "SHIPPING_NOT_CONFIGURED") }, 500));
                }

                var shippingFeeDto = new ShippingFeeDto
                {
                    Province = provinceName,
                    Fee = rate.Fee
                };

                return Ok(EnvelopeBuilder.Ok(HttpContext, "SHIPPING_FEE_RETRIEVED", shippingFeeDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shipping fee for province {Province}", province);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR",
                    new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }
    }
}
