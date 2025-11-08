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
        /// GET /api/v1/districts?provinceId=1 OR /api/v1/districts?province=B?c K?n
        /// L?y danh sách qu?n/huy?n theo t?nh (support both ID and name)
        /// </summary>
        [HttpGet("districts")]
        public async Task<IActionResult> GetDistricts([FromQuery] int? provinceId, [FromQuery] string? province)
        {
            try
            {
                // Support both provinceId (int) and province (string name)
                int? resolvedProvinceId = null;

                if (provinceId.HasValue && provinceId.Value > 0)
                {
                    resolvedProvinceId = provinceId.Value;
                }
                else if (!string.IsNullOrWhiteSpace(province))
                {
                    // Find province by name
                    var prov = await _context.Provinces
                        .FirstOrDefaultAsync(p => p.Name == province.Trim());
                    
                    if (prov == null)
                    {
                        return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "PROVINCE_NOT_FOUND",
                            new[] { new ErrorItem("province", "Không tìm th?y t?nh/thành", "PROVINCE_NOT_FOUND") }, 400));
                    }
                    
                    resolvedProvinceId = prov.Id;
                }
                else
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "INVALID_PROVINCE_ID",
                        new[] { new ErrorItem("provinceId", "Province ID không h?p l?", "INVALID_PROVINCE_ID") }, 400));
                }

                var districts = await _context.Districts
                    .Where(d => d.ProvinceId == resolvedProvinceId.Value)
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
                _logger.LogError(ex, "Error retrieving districts for province {Province}/{ProvinceId}", province, provinceId);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR",
                    new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        /// <summary>
        /// GET /api/v1/wards?districtId=1 OR /api/v1/wards?district=Qu?n Ba ?ình
        /// L?y danh sách ph??ng/xã theo qu?n/huy?n (support both ID and name)
        /// </summary>
        [HttpGet("wards")]
        public async Task<IActionResult> GetWards([FromQuery] int? districtId, [FromQuery] string? district)
        {
            try
            {
                // Support both districtId (int) and district (string name)
                int? resolvedDistrictId = null;

                if (districtId.HasValue && districtId.Value > 0)
                {
                    resolvedDistrictId = districtId.Value;
                }
                else if (!string.IsNullOrWhiteSpace(district))
                {
                    // Find district by name
                    var dist = await _context.Districts
                        .FirstOrDefaultAsync(d => d.Name == district.Trim());
                    
                    if (dist == null)
                    {
                        return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "DISTRICT_NOT_FOUND",
                            new[] { new ErrorItem("district", "Không tìm th?y qu?n/huy?n", "DISTRICT_NOT_FOUND") }, 400));
                    }
                    
                    resolvedDistrictId = dist.Id;
                }
                else
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "INVALID_DISTRICT_ID",
                        new[] { new ErrorItem("districtId", "District ID không h?p l?", "INVALID_DISTRICT_ID") }, 400));
                }

                var wards = await _context.Wards
                    .Where(w => w.DistrictId == resolvedDistrictId.Value)
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
                _logger.LogError(ex, "Error retrieving wards for district {District}/{DistrictId}", district, districtId);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR",
                    new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        /// <summary>
        /// GET /api/v1/shipping-fee?province=... OR /api/v1/shipping-fee?provinceId=1
        /// L?y phí v?n chuy?n theo tên t?nh/thành ph? ho?c ID
        /// </summary>
        [HttpGet("shipping-fee")]
        public async Task<IActionResult> GetShippingFee([FromQuery] string? province, [FromQuery] int? provinceId)
        {
            try
            {
                string? provinceName = null;

                // Support both province name (string) and provinceId (int)
                if (!string.IsNullOrWhiteSpace(province))
                {
                    provinceName = province.Trim();
                }
                else if (provinceId.HasValue && provinceId.Value > 0)
                {
                    // Find province name by ID
                    var prov = await _context.Provinces.FindAsync(provinceId.Value);
                    if (prov == null)
                    {
                        return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "PROVINCE_NOT_FOUND",
                            new[] { new ErrorItem("provinceId", "Không tìm th?y t?nh/thành", "PROVINCE_NOT_FOUND") }, 400));
                    }
                    provinceName = prov.Name;
                }
                else
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "PROVINCE_REQUIRED",
                        new[] { new ErrorItem("province", "Tên T?nh/Thành là b?t bu?c", "PROVINCE_REQUIRED") }, 400));
                }

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
                _logger.LogError(ex, "Error retrieving shipping fee for province {Province}/{ProvinceId}", province, provinceId);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR",
                    new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }
    }
}
