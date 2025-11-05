using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopWave.Models;
using ShopWave.Models.Requests;

namespace ShopWave.Controllers
{
    [ApiController]
    [Route("api/v1/products/{productId}/options")]
    public class ProductOptionsController : ControllerBase
    {
        private readonly ShopWaveDbContext _context;
        private readonly ILogger<ProductOptionsController> _logger;

        public ProductOptionsController(ShopWaveDbContext context, ILogger<ProductOptionsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> CreateOption(Guid productId, [FromBody] CreateOptionRequest request)
        {
            try
            {
                var product = await _context.Products.FindAsync(productId);
                if (product == null) return NotFound(new { error = "Product not found" });

                var option = new ProductOption
                {
                    ProductId = productId,
                    Name = request.Name.Trim()
                };
                _context.ProductOptions.Add(option);
                await _context.SaveChangesAsync();

                if (request.Values != null && request.Values.Count > 0)
                {
                    var vals = request.Values.Select(v => new OptionValue { OptionId = option.Id, Value = v.Trim() }).ToList();
                    _context.OptionValues.AddRange(vals);
                    await _context.SaveChangesAsync();
                }

                return StatusCode(201, new { id = option.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product option");
                return StatusCode(500, new { error = "internal_error" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetOptions(Guid productId)
        {
            var options = await _context.ProductOptions
                .Where(po => po.ProductId == productId)
                .Include(po => po.Values)
                .ToListAsync();

            var result = options.Select(po => new
            {
                id = po.Id,
                name = po.Name,
                values = po.Values.Select(v => new { id = v.Id, value = v.Value }).ToList()
            });

            return Ok(result);
        }

        [HttpPost("{optionId}/values")]
        public async Task<IActionResult> AddValue(Guid productId, Guid optionId, [FromBody] AddOptionValueRequest request)
        {
            try
            {
                var option = await _context.ProductOptions.FirstOrDefaultAsync(po => po.Id == optionId && po.ProductId == productId);
                if (option == null) return NotFound(new { error = "Option not found" });

                var val = new OptionValue { OptionId = optionId, Value = request.Value.Trim() };
                _context.OptionValues.Add(val);
                await _context.SaveChangesAsync();

                return StatusCode(201, new { id = val.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding option value");
                return StatusCode(500, new { error = "internal_error" });
            }
        }
    }
}