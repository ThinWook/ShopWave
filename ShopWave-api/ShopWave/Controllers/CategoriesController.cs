using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopWave.Models;
using ShopWave.Models.DTOs;
using ShopWave.Models.Responses;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;

namespace ShopWave.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly ShopWaveDbContext _context;
        private readonly ILogger<CategoriesController> _logger;

        public CategoriesController(ShopWaveDbContext context, ILogger<CategoriesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ShopWave.Models.Requests.CreateCategoryRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "VALIDATION_ERROR", new[] { new ErrorItem("request", "Invalid payload", "VALIDATION_ERROR") }, 400));
                }

                var name = request.Name?.Trim();
                if (string.IsNullOrWhiteSpace(name))
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "VALIDATION_ERROR", new[] { new ErrorItem("name", "Name is required", "VALIDATION_ERROR") }, 400));
                }

                var exists = await _context.Categories.AnyAsync(c => c.Name.ToLower() == name.ToLower());
                if (exists)
                {
                    return Conflict(EnvelopeBuilder.Fail<object>(HttpContext, "CATEGORY_EXISTS", new[] { new ErrorItem("name", "Category name already exists", "CATEGORY_EXISTS") }, 409));
                }

                var category = new Category
                {
                    Name = name,
                    Description = request.Description?.Trim(),
                    ImageUrl = request.ImageUrl,
                    ParentId = request.ParentId,
                    SortOrder = request.SortOrder,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Categories.Add(category);
                await _context.SaveChangesAsync();

                // L?y thông tin cha n?u có
                string? parentName = null;
                if (category.ParentId.HasValue)
                {
                    var parent = await _context.Categories.FindAsync(category.ParentId.Value);
                    parentName = parent?.Name;
                }

                var dto = new CategoryDto
                {
                    Id = category.Id,
                    Name = category.Name,
                    Description = category.Description,
                    ParentId = category.ParentId,
                    ParentName = parentName,
                    IsActive = category.IsActive,
                    ProductCount = 0,
                    CreatedAt = category.CreatedAt,
                    UpdatedAt = category.UpdatedAt
                };

                return StatusCode(201, EnvelopeBuilder.Ok(HttpContext, "CATEGORY_CREATED", dto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating category");
                var envelope = EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500);
                return StatusCode(500, envelope);
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var categoriesQuery = _context.Categories
                    .Include(c => c.ParentCategory)
                    .Where(c => c.IsActive)
                    .OrderBy(c => c.SortOrder)
                    .ThenBy(c => c.Name);

                var lastUpdated = await categoriesQuery.MaxAsync(c => (DateTime?)c.UpdatedAt) ?? DateTime.MinValue;
                var total = await categoriesQuery.CountAsync();
                var etagRaw = $"{total}-{lastUpdated:O}";
                var etag = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(etagRaw)));

                if (Request.Headers.TryGetValue("If-None-Match", out var inm) && inm == etag)
                {
                    return StatusCode(StatusCodes.Status304NotModified);
                }

                var categories = await categoriesQuery
                    .Select(c => new CategoryDto
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Description = c.Description,
                        ParentId = c.ParentId,
                        ParentName = c.ParentCategory != null ? c.ParentCategory.Name : null,
                        IsActive = c.IsActive,
                        ProductCount = c.Products.Count(p => p.IsActive),
                        CreatedAt = c.CreatedAt,
                        UpdatedAt = c.UpdatedAt
                    })
                    .ToListAsync();

                Response.Headers.ETag = etag;

                var envelope = EnvelopeBuilder.Ok(HttpContext, "CATEGORY_LIST_RETRIEVED", new
                {
                    data = categories,
                    currentPage = 1,
                    totalPages = 1,
                    pageSize = categories.Count,
                    totalRecords = categories.Count,
                    hasPreviousPage = false,
                    hasNextPage = false,
                    appliedFilters = new { }
                });

                return Ok(envelope);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting categories");
                var envelope = EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500);
                return StatusCode(500, envelope);
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategory(Guid id)
        {
            try
            {
                var category = await _context.Categories
                    .Include(c => c.ParentCategory)
                    .Where(c => c.Id == id && c.IsActive)
                    .Select(c => new CategoryDto
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Description = c.Description,
                        ParentId = c.ParentId,
                        ParentName = c.ParentCategory != null ? c.ParentCategory.Name : null,
                        IsActive = c.IsActive,
                        ProductCount = c.Products.Count(p => p.IsActive),
                        CreatedAt = c.CreatedAt,
                        UpdatedAt = c.UpdatedAt
                    })
                    .FirstOrDefaultAsync();

                if (category == null)
                {
                    var nf = EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("id", "Category not found", "NOT_FOUND") }, 404);
                    return NotFound(nf);
                }

                return Ok(EnvelopeBuilder.Ok(HttpContext, "CATEGORY_DETAIL_RETRIEVED", category));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting category {CategoryId}", id);
                var envelope = EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500);
                return StatusCode(500, envelope);
            }
        }

        [HttpGet("tree")]
        public async Task<IActionResult> GetCategoryTree()
        {
            try
            {
                var list = await _context.Categories
                    .Where(c => c.IsActive)
                    .OrderBy(c => c.SortOrder)
                    .ThenBy(c => c.Name)
                    .ToListAsync();

                var tree = BuildCategoryTree(list, null);
                return Ok(EnvelopeBuilder.Ok(HttpContext, "CATEGORY_TREE_RETRIEVED", tree));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting category tree");
                var envelope = EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500);
                return StatusCode(500, envelope);
            }
        }

        [HttpGet("{id}/products")]
        public async Task<IActionResult> GetCategoryProducts(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 12)
        {
            try
            {
                var category = await _context.Categories.FindAsync(id);
                if (category == null || !category.IsActive)
                {
                    var nf = EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("id", "Category not found", "NOT_FOUND") }, 404);
                    return NotFound(nf);
                }

                if (page < 1) page = 1;
                if (pageSize <= 0 || pageSize > 100) pageSize = 12;

                var baseQuery = _context.Products
                    .Include(p => p.Category)
                    .Where(p => p.CategoryId == id && p.IsActive);

                var latestUpdated = await baseQuery.MaxAsync(p => (DateTime?)p.UpdatedAt) ?? DateTime.MinValue;
                var totalRecords = await baseQuery.CountAsync();
                var totalPages = totalRecords == 0 ? 0 : (int)Math.Ceiling((double)totalRecords / pageSize);
                if (totalPages > 0 && page > totalPages) page = totalPages;

                var products = await baseQuery
                    .OrderByDescending(p => p.Popularity)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var productIds = products.Select(p => p.Id).ToList();
                var variants = await _context.ProductVariants.Where(v => productIds.Contains(v.ProductId)).ToListAsync();

                var productDtos = products.Select(p =>
                {
                    var productVariants = variants.Where(v => v.ProductId == p.Id).OrderBy(v => v.Price).ToList();
                    var price = productVariants.FirstOrDefault()?.Price ?? 0;
                    // Size removed from ProductVariant; leave null (option values may be used later)
                    string? size = null;
                    var stock = productVariants.Sum(v => v.Stock);
                    return new ProductDto
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Description = p.Description,
                        Price = price,
                        CategoryName = p.Category.Name,
                        Size = size,
                        StockQuantity = stock,
                        IsActive = p.IsActive
                    };
                }).ToList();

                var etagRaw = $"{id}-{totalRecords}-{latestUpdated:O}-{page}-{pageSize}";
                var etag = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(etagRaw)));
                if (Request.Headers.TryGetValue("If-None-Match", out var inm) && inm == etag)
                {
                    return StatusCode(StatusCodes.Status304NotModified);
                }
                Response.Headers.ETag = etag;

                var paged = new PagedResult<ProductDto>(
                    Data: productDtos,
                    CurrentPage: page,
                    TotalPages: totalPages,
                    PageSize: pageSize,
                    TotalRecords: totalRecords,
                    HasPreviousPage: page > 1,
                    HasNextPage: page < totalPages,
                    AppliedFilters: new { categoryId = id, sort = "popularity_desc" },
                    LastUpdatedAt: latestUpdated
                );

                return Ok(EnvelopeBuilder.Ok(HttpContext, "CATEGORY_PRODUCTS_RETRIEVED", paged));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting category products {CategoryId}", id);
                var envelope = EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500);
                return StatusCode(500, envelope);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ShopWave.Models.Requests.CreateCategoryRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "VALIDATION_ERROR", new[] { new ErrorItem("request", "Invalid payload", "VALIDATION_ERROR") }, 400));
                }

                var category = await _context.Categories.FindAsync(id);
                if (category == null || !category.IsActive)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("id", "Category not found", "NOT_FOUND") }, 404));
                }

                var name = request.Name?.Trim();
                if (string.IsNullOrWhiteSpace(name))
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "VALIDATION_ERROR", new[] { new ErrorItem("name", "Name is required", "VALIDATION_ERROR") }, 400));
                }

                var exists = await _context.Categories.AnyAsync(c => c.Id != id && c.Name.ToLower() == name.ToLower());
                if (exists)
                {
                    return Conflict(EnvelopeBuilder.Fail<object>(HttpContext, "CATEGORY_EXISTS", new[] { new ErrorItem("name", "Category name already exists", "CATEGORY_EXISTS") }, 409));
                }

                category.Name = name;
                category.Description = request.Description?.Trim();
                category.ImageUrl = request.ImageUrl;
                category.ParentId = request.ParentId;
                category.SortOrder = request.SortOrder;
                category.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // L?y thông tin cha n?u có
                string? parentName = null;
                if (category.ParentId.HasValue)
                {
                    var parent = await _context.Categories.FindAsync(category.ParentId.Value);
                    parentName = parent?.Name;
                }

                var productCount = await _context.Products.CountAsync(p => p.CategoryId == category.Id && p.IsActive);

                var dto = new CategoryDto
                {
                    Id = category.Id,
                    Name = category.Name,
                    Description = category.Description,
                    ParentId = category.ParentId,
                    ParentName = parentName,
                    IsActive = category.IsActive,
                    ProductCount = productCount,
                    CreatedAt = category.CreatedAt,
                    UpdatedAt = category.UpdatedAt
                };

                return Ok(EnvelopeBuilder.Ok(HttpContext, "CATEGORY_UPDATED", dto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating category {CategoryId}", id);
                var envelope = EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500);
                return StatusCode(500, envelope);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var category = await _context.Categories.FindAsync(id);
                if (category == null || !category.IsActive)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("id", "Category not found", "NOT_FOUND") }, 404));
                }

                // ?ánh d?u không ho?t ??ng thay vì xóa v?t lý
                category.IsActive = false;
                category.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // L?y thông tin cha n?u có
                string? parentName = null;
                if (category.ParentId.HasValue)
                {
                    var parent = await _context.Categories.FindAsync(category.ParentId.Value);
                    parentName = parent?.Name;
                }

                var productCount = await _context.Products.CountAsync(p => p.CategoryId == category.Id && p.IsActive);

                var dto = new CategoryDto
                {
                    Id = category.Id,
                    Name = category.Name,
                    Description = category.Description,
                    ParentId = category.ParentId,
                    ParentName = parentName,
                    IsActive = category.IsActive,
                    ProductCount = productCount,
                    CreatedAt = category.CreatedAt,
                    UpdatedAt = category.UpdatedAt
                };

                return Ok(EnvelopeBuilder.Ok(HttpContext, "CATEGORY_DELETED", dto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting category {CategoryId}", id);
                var envelope = EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500);
                return StatusCode(500, envelope);
            }
        }

        private List<object> BuildCategoryTree(List<Category> categories, Guid? parentId)
        {
            return categories
                .Where(c => c.ParentId == parentId)
                .Select(c => new
                {
                    id = c.Id,
                    name = c.Name,
                    description = c.Description,
                    imageUrl = c.ImageUrl,
                    productCount = c.Products.Count(p => p.IsActive),
                    children = BuildCategoryTree(categories, c.Id)
                })
                .Cast<object>()
                .ToList();
        }
    }
}