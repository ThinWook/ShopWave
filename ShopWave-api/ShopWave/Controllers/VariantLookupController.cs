using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopWave.Models;
using ShopWave.Models.Requests;

namespace ShopWave.Controllers
{
    [ApiController]
    [Route("api/v1/products/{productId}")]
    public class VariantLookupController : ControllerBase
    {
        private readonly ShopWaveDbContext _context;
        private readonly ILogger<VariantLookupController> _logger;

        public VariantLookupController(ShopWaveDbContext context, ILogger<VariantLookupController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("find-variant")]
        public async Task<IActionResult> FindVariant(Guid productId, [FromBody] FindVariantByValuesRequest request)
        {
            if (request.ValueIds == null || request.ValueIds.Count == 0)
                return BadRequest(new { error = "valueIds required" });

            // Ensure product exists
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return NotFound(new { error = "Product not found" });

            // Query variant ids that are linked to the provided value ids
            // Approach: find variants where the set of provided valueIds is contained in the variant's value ids.

            var candidateVariantIds = await _context.VariantValues
                .Where(vv => request.ValueIds.Contains(vv.ValueId))
                .GroupBy(vv => vv.VariantId)
                .Where(g => g.Select(x => x.ValueId).Distinct().Count() == request.ValueIds.Distinct().Count()
                            && g.Select(x => x.ValueId).Distinct().All(id => request.ValueIds.Contains(id)))
                .Select(g => g.Key)
                .ToListAsync();

            if (candidateVariantIds.Count == 0)
                return NotFound(new { error = "Variant not found" });

            // Narrow to variants belonging to product
            var variant = await _context.ProductVariants
                .Where(v => candidateVariantIds.Contains(v.Id) && v.ProductId == productId)
                .FirstOrDefaultAsync();

            if (variant == null)
                return NotFound(new { error = "Variant not found for product" });

            var result = new
            {
                id = variant.Id,
                sku = variant.Sku,
                price = variant.Price,
                stock = variant.Stock,
                imageId = variant.ImageId
            };

            return Ok(result);
        }
    }
}