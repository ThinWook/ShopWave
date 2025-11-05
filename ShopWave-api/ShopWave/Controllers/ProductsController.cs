using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopWave.Models;
using ShopWave.Models.DTOs;
using ShopWave.Models.Requests;
using ShopWave.Models.Responses;
using ShopWave.Services;
using System.Security.Cryptography;
using System.Text;

namespace ShopWave.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly ShopWaveDbContext _context;
        private readonly ILogger<ProductsController> _logger;

        public ProductsController(ShopWaveDbContext context, ILogger<ProductsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateProduct([FromBody] ProductCreateRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "VALIDATION_ERROR", new[] { new ErrorItem("request", "Invalid payload", "VALIDATION_ERROR") }, 400));
                }

                await using var tx = await _context.Database.BeginTransactionAsync();

                // 1. Tạo Product
                var product = new Product
                {
                    Name = request.Name.Trim(),
                    Description = request.Description?.Trim(),
                    CategoryId = request.CategoryId,
                    MediaId = request.MainImageId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };

                _context.Products.Add(product);
                await _context.SaveChangesAsync();

                // 2. Thêm Gallery Media
                if (request.GalleryMedia != null && request.GalleryMedia.Count > 0)
                {
                    var existingMediaIds = await _context.Media
                        .Where(m => request.GalleryMedia.Select(g => g.MediaId).Contains(m.Id))
                        .Select(m => m.Id)
                        .ToListAsync();

                    var toInsert = request.GalleryMedia
                        .Where(g => existingMediaIds.Contains(g.MediaId))
                        .Select(g => new ProductMedia
                        {
                            ProductId = product.Id,
                            MediaId = g.MediaId,
                            DisplayOrder = g.SortOrder
                        })
                        .ToList();

                    if (toInsert.Count > 0)
                    {
                        _context.ProductMedia.AddRange(toInsert);
                        await _context.SaveChangesAsync();
                    }
                }

                // 3. XỬ LÝ OPTIONS (PHẦN MỚI)
                // Dictionary để map option name + value -> OptionValue.Id
                var optionValueMap = new Dictionary<string, Guid>(); // key: "optionName|value", value: OptionValue.Id

                if (request.Options != null && request.Options.Count > 0)
                {
                    foreach (var optionDto in request.Options)
                    {
                        // Tạo ProductOption
                        var productOption = new ProductOption
                        {
                            ProductId = product.Id,
                            Name = optionDto.Name.Trim(),
                            DisplayType = optionDto.DisplayType // Lưu displayType
                        };
                        _context.ProductOptions.Add(productOption);
                        await _context.SaveChangesAsync();

                        // Tạo các OptionValue cho option này
                        foreach (var valueDto in optionDto.Values)
                        {
                            var optionValue = new OptionValue
                            {
                                OptionId = productOption.Id,
                                Value = valueDto.Value.Trim(),
                                ThumbnailId = valueDto.ThumbnailId
                            };
                            _context.OptionValues.Add(optionValue);
                            await _context.SaveChangesAsync();

                            // Lưu vào map để dùng khi tạo variants
                            var key = $"{optionDto.Name.Trim()}|{valueDto.Value.Trim()}";
                            optionValueMap[key] = optionValue.Id;
                        }
                    }
                }

                // 4. TẠO VARIANTS VỚI SELECTED_OPTIONS (PHẦN MỚI)
                if (request.Variants != null && request.Variants.Count > 0)
                {
                    for (int i = 0; i < request.Variants.Count; i++)
                    {
                        var v = request.Variants[i];

                        // Generate SKU nếu không có
                        string sku = v.Sku;
                        if (string.IsNullOrWhiteSpace(sku))
                        {
                            var nameSlug = ToSlug(request.Name);
                            sku = $"{nameSlug}-{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}";
                        }

                        // Tạo ProductVariant
                        var variant = new ProductVariant
                        {
                            ProductId = product.Id,
                            Sku = sku,
                            Price = v.Price,
                            Stock = v.Stock,
                            ImageId = v.ImageId
                        };
                        _context.ProductVariants.Add(variant);
                        await _context.SaveChangesAsync();

                        // Liên kết variant với các option values thông qua VariantValue
                        if (v.SelectedOptions != null && v.SelectedOptions.Count > 0)
                        {
                            foreach (var selectedOpt in v.SelectedOptions)
                            {
                                var key = $"{selectedOpt.OptionName.Trim()}|{selectedOpt.Value.Trim()}";

                                if (optionValueMap.TryGetValue(key, out var optionValueId))
                                {
                                    var variantValue = new VariantValue
                                    {
                                        VariantId = variant.Id,
                                        ValueId = optionValueId
                                    };
                                    _context.VariantValues.Add(variantValue);
                                }
                                else
                                {
                                    _logger.LogWarning("Could not find option value for {Key} in variant {Sku}", key, sku);
                                }
                            }
                            await _context.SaveChangesAsync();
                        }
                    }
                }

                // 5. Cập nhật denormalized fields
                product.DisplayPrice = await _context.ProductVariants
                    .Where(v => v.ProductId == product.Id)
                    .Select(v => (decimal?)v.Price)
                    .MinAsync() ?? 0m;

                product.TotalInventory = await _context.ProductVariants
                    .Where(v => v.ProductId == product.Id)
                    .Select(v => (int?)v.Stock)
                    .SumAsync() ?? 0;

                product.VariantCount = await _context.ProductVariants
                    .CountAsync(v => v.ProductId == product.Id);

                await _context.SaveChangesAsync();

                await tx.CommitAsync();

                _logger.LogInformation("Created product {ProductId} with {OptionCount} options and {VariantCount} variants",
                    product.Id, request.Options?.Count ?? 0, request.Variants?.Count ?? 0);

                return StatusCode(201, EnvelopeBuilder.Ok(HttpContext, "PRODUCT_CREATED", new { id = product.Id }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product with options");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetProducts([FromQuery] ProductSearchRequest request)
        {
            try
            {
                if (request.Page < 1) request.Page = 1;
                if (request.PageSize <= 0 || request.PageSize > 100) request.PageSize = 12;

                // Admin detection: role or explicit query/header
                bool isAdminRequest = (User?.Identity?.IsAuthenticated == true && User.IsInRole("Admin"))
                    || string.Equals(Request.Query["view"], "admin", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(Request.Query["admin"], "1", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(Request.Headers["X-Admin-View"], "1", StringComparison.OrdinalIgnoreCase);

                var baseQuery = _context.Products
                    .AsNoTracking()
                    .Where(p => p.IsActive);

                if (!string.IsNullOrWhiteSpace(request.SearchTerm))
                {
                    var term = request.SearchTerm.Trim();
                    baseQuery = baseQuery.Where(p => p.Name.Contains(term) || (p.Description != null && p.Description.Contains(term)));
                }
                if (request.CategoryId.HasValue)
                {
                    var cid = request.CategoryId.Value;
                    baseQuery = baseQuery.Where(p => p.CategoryId == cid);
                }

                var sortKey = (request.SortBy ?? "name").ToLower();
                IOrderedQueryable<Product> ordered = sortKey switch
                {
                    "popularity" => (request.SortDirection == "desc" ? baseQuery.OrderByDescending(p => p.Popularity) : baseQuery.OrderBy(p => p.Popularity)),
                    "updated" or "updatedat" => (request.SortDirection == "desc" ? baseQuery.OrderByDescending(p => p.UpdatedAt) : baseQuery.OrderBy(p => p.UpdatedAt)),
                    _ => (request.SortDirection == "desc" ? baseQuery.OrderByDescending(p => p.Name) : baseQuery.OrderBy(p => p.Name))
                };

                var latestUpdated = await baseQuery.MaxAsync(p => (DateTime?)p.UpdatedAt) ?? DateTime.MinValue;
                var totalRecords = await baseQuery.CountAsync();
                var totalPages = totalRecords == 0 ? 0 : (int)Math.Ceiling(totalRecords / (double)request.PageSize);
                if (totalPages > 0 && request.Page > totalPages) request.Page = totalPages;

                var etagRaw = $"{totalRecords}-{latestUpdated:O}-{request.Page}-{request.PageSize}-{sortKey}-{request.SortDirection}-{request.SearchTerm}-{request.CategoryId}-{isAdminRequest}";
                var etag = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(etagRaw)));
                if (Request.Headers.TryGetValue("If-None-Match", out var inm) && inm == etag)
                {
                    return StatusCode(StatusCodes.Status304NotModified);
                }

                if (isAdminRequest)
                {
                    var adminItems = await ordered
                        .Skip((request.Page - 1) * request.PageSize)
                        .Take(request.PageSize)
                        .Select(p => new
                        {
                            id = p.Id,
                            name = p.Name,
                            thumbnail_url = p.Media != null ? p.Media.Url : null,
                            display_price = p.DisplayPrice > 0 ? p.DisplayPrice : (p.Variants.Select(v => (decimal?)v.Price).Min() ?? 0m),
                            total_inventory = p.TotalInventory > 0 ? p.TotalInventory : (p.Variants.Select(v => (int?)v.Stock).Sum() ?? 0),
                            variant_count = p.VariantCount > 0 ? p.VariantCount : p.Variants.Count,
                            category_name = p.Category.Name,
                            is_active = p.IsActive,
                            updated_at = p.UpdatedAt,
                            created_at = p.CreatedAt
                        })
                        .ToListAsync();

                    Response.Headers.ETag = etag;
                    var payload = new
                    {
                        pagination = new
                        {
                            total_items = totalRecords,
                            total_pages = totalPages,
                            current_page = request.Page,
                            page_size = request.PageSize
                        },
                        data = adminItems
                    };
                    return Ok(payload);
                }
                else
                {
                    var items = await ordered
                        .Skip((request.Page - 1) * request.PageSize)
                        .Take(request.PageSize)
                        .Select(p => new ProductCardDto
                        {
                            Id = p.Id,
                            Name = p.Name,
                            Description = p.Description,
                            CategoryName = p.Category.Name,
                            ImageUrl = p.Media != null ? p.Media.Url : null,
                            Price = p.DisplayPrice > 0 ? p.DisplayPrice : (p.Variants.Select(v => (decimal?)v.Price).Min() ?? 0m),
                            StockQuantity = p.TotalInventory > 0 ? p.TotalInventory : (p.Variants.Select(v => (int?)v.Stock).Sum() ?? 0),
                            VariantCount = p.VariantCount > 0 ? p.VariantCount : p.Variants.Count,
                            IsActive = p.IsActive,
                            CreatedAt = p.CreatedAt,
                            UpdatedAt = p.UpdatedAt
                        })
                        .ToListAsync();

                    Response.Headers.ETag = etag;

                    var paged = new
                    {
                        items,
                        currentPage = request.Page,
                        totalPages = totalPages,
                        pageSize = request.PageSize,
                        totalRecords = totalRecords,
                        hasPreviousPage = request.Page > 1,
                        hasNextPage = request.Page < totalPages,
                        appliedFilters = new
                        {
                            searchTerm = request.SearchTerm,
                            categoryId = request.CategoryId,
                            sort = new { field = sortKey, direction = request.SortDirection }
                        },
                        lastUpdatedAt = latestUpdated
                    };

                    return Ok(EnvelopeBuilder.Ok(HttpContext, "PRODUCT_LIST_RETRIEVED", paged));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving products");
                var env = EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500);
                return StatusCode(500, env);
            }
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProduct(Guid id)
        {
            try
            {
                var product = await _context.Products
                    .Include(p => p.Category)
                    .Include(p => p.Media)
                    .Include(p => p.ProductMedia)
                        .ThenInclude(pm => pm.Media)
                    .Include(p => p.Options)
                        .ThenInclude(o => o.Values)
                            .ThenInclude(v => v.Thumbnail)
                    .Include(p => p.Variants)
                        .ThenInclude(v => v.VariantValues)
                            .ThenInclude(vv => vv.Value)
                                .ThenInclude(ov => ov.Option)
                    .Where(p => p.Id == id && p.IsActive)
                    .FirstOrDefaultAsync();

                if (product == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("id", "Product not found", "NOT_FOUND") }, 404));
                }

                var mainImage = product.Media != null ? new
                {
                    id = product.Media.Id,
                    url = product.Media.Url,
                    altText = product.Name
                } : null;

                var galleryImages = product.ProductMedia
                    .OrderBy(pm => pm.DisplayOrder)
                    .Select(pm => new
                    {
                        id = pm.Media.Id,
                        url = pm.Media.Url,
                        sortOrder = pm.DisplayOrder
                    }).ToList();

                // Map options với displayType từ DB
                var options = product.Options.Select(o => new
                {
                    name = o.Name,
                    displayType = o.DisplayType ?? "text_button", // Default nếu null
                    values = o.Values.Select(v => new
                    {
                        value = v.Value,
                        thumbnailId = v.ThumbnailId
                    }).ToList()
                }).ToList();

                var variants = product.Variants.Select(v => new
                {
                    id = v.Id,
                    sku = v.Sku,
                    price = v.Price,
                    stock = v.Stock,
                    imageId = v.ImageId,
                    selectedOptions = v.VariantValues.Select(vv => new
                    {
                        optionName = vv.Value.Option.Name,
                        value = vv.Value.Value
                    }).ToList()
                }).ToList();

                var result = new
                {
                    id = product.Id,
                    name = product.Name,
                    description = product.Description,
                    slug = ToSlug(product.Name),
                    category = new
                    {
                        id = product.Category.Id,
                        name = product.Category.Name
                    },
                    mainImage,
                    galleryImages,
                    options, // PHẦN MỚI
                    variants
                };

                return Ok(EnvelopeBuilder.Ok(HttpContext, "PRODUCT_DETAIL_RETRIEVED", result));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product {ProductId}", id);
                var env = EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500);
                return StatusCode(500, env);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] UpdateProductRequest request)
        {
            try
            {
                var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
                if (product == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("id", "Product not found", "NOT_FOUND") }, 404));
                }

                var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.IsActive);
                if (category == null)
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "CATEGORY_INVALID", new[] { new ErrorItem("categoryId", "Category not found or inactive", "CATEGORY_INVALID") }, 400));
                }

                product.Name = request.Name.Trim();
                product.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
                product.CategoryId = request.CategoryId;
                product.IsActive = request.IsActive;
                product.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                if (request.Variants != null)
                {
                    var oldVariants = await _context.ProductVariants.Where(v => v.ProductId == product.Id).ToListAsync();
                    var requestSkus = request.Variants.Where(v => !string.IsNullOrWhiteSpace(v.Sku)).Select(v => v.Sku).ToHashSet();
                    var toRemove = oldVariants.Where(v => !requestSkus.Contains(v.Sku)).ToList();
                    if (toRemove.Count > 0)
                    {
                        _context.ProductVariants.RemoveRange(toRemove);
                        await _context.SaveChangesAsync();
                    }

                    foreach (var v in request.Variants)
                    {
                        var variant = oldVariants.FirstOrDefault(x => x.Sku == v.Sku);
                        if (variant == null)
                        {
                            variant = new ProductVariant
                            {
                                ProductId = product.Id,
                                Sku = v.Sku ?? Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper(),
                                Price = v.Price,
                                Stock = v.Stock,
                                ImageId = v.ImageId
                            };
                            _context.ProductVariants.Add(variant);
                            await _context.SaveChangesAsync();
                        }
                        else
                        {
                            variant.Price = v.Price;
                            variant.Stock = v.Stock;
                            variant.ImageId = v.ImageId;
                            if (!string.IsNullOrWhiteSpace(v.Sku))
                                variant.Sku = v.Sku;
                            await _context.SaveChangesAsync();
                        }
                    }
                }

                // Recompute denormalized fields on update
                product.DisplayPrice = await _context.ProductVariants.Where(v => v.ProductId == product.Id).Select(v => (decimal?)v.Price).MinAsync() ?? 0m;
                product.TotalInventory = await _context.ProductVariants.Where(v => v.ProductId == product.Id).Select(v => (int?)v.Stock).SumAsync() ?? 0;
                product.VariantCount = await _context.ProductVariants.CountAsync(v => v.ProductId == product.Id);
                await _context.SaveChangesAsync();

                var dto = new ProductDto
                {
                    Id = product.Id,
                    Name = product.Name,
                    Description = product.Description,
                    CategoryName = category.Name,
                    IsActive = product.IsActive
                };

                return Ok(EnvelopeBuilder.Ok(HttpContext, "PRODUCT_UPDATED", dto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product {ProductId}", id);
                var env = EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500);
                return StatusCode(500, env);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(Guid id)
        {
            try
            {
                var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
                if (product == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("id", "Product not found", "NOT_FOUND") }, 404));
                }

                if (!product.IsActive)
                {
                    return Ok(EnvelopeBuilder.Ok(HttpContext, "PRODUCT_ALREADY_INACTIVE", new { id }));
                }

                product.IsActive = false;
                product.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(EnvelopeBuilder.Ok(HttpContext, "PRODUCT_DEACTIVATED", new { id }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product {ProductId}", id);
                var env = EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500);
                return StatusCode(500, env);
            }
        }

        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedProducts([FromQuery] int take = 8)
        {
            try
            {
                if (take <= 0 || take > 50) take = 8;
                var products = await _context.Products
                    .Include(p => p.Category)
                    .Where(p => p.IsActive)
                    .OrderByDescending(p => p.Popularity)
                    .Take(take)
                    .Select(p => new ProductDto
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Description = p.Description,
                        CategoryName = p.Category.Name,
                        IsActive = p.IsActive
                    })
                    .ToListAsync();

                return Ok(EnvelopeBuilder.Ok(HttpContext, "PRODUCT_FEATURED_RETRIEVED", products));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving featured products");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [HttpGet("{id}/related")]
        public async Task<IActionResult> GetRelatedProducts(Guid id, [FromQuery] int take = 4)
        {
            try
            {
                var product = await _context.Products.FindAsync(id);
                if (product == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("id", "Product not found", "NOT_FOUND") }, 404));
                }
                if (take <= 0 || take > 20) take = 4;

                var related = await _context.Products
                    .Include(p => p.Category)
                    .Where(p => p.CategoryId == product.CategoryId && p.Id != id && p.IsActive)
                    .OrderByDescending(p => p.Popularity)
                    .Take(take)
                    .Select(p => new ProductDto
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Description = p.Description,
                        CategoryName = p.Category.Name,
                        IsActive = p.IsActive
                    })
                    .ToListAsync();

                return Ok(EnvelopeBuilder.Ok(HttpContext, "PRODUCT_RELATED_RETRIEVED", related));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving related products {ProductId}", id);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{productId}/variants")]
        public async Task<IActionResult> AddVariant(Guid productId, [FromBody] ProductVariantRequest request)
        {
            try
            {
                var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == productId && p.IsActive);
                if (product == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("productId", "Product not found", "NOT_FOUND") }, 404));
                }
                string sku = string.IsNullOrWhiteSpace(request.Sku)
                    ? $"{ToSlug(product.Name)}-{Guid.NewGuid().ToString("N").Substring(0, 5).ToUpper()}"
                    : request.Sku;
                var variant = new ProductVariant
                {
                    ProductId = productId,
                    Sku = sku,
                    Price = request.Price,
                    Stock = request.Stock,
                    ImageId = request.ImageId
                };
                _context.ProductVariants.Add(variant);

                await _context.SaveChangesAsync();

                // Update denormalized fields
                var p = await _context.Products.FirstAsync(x => x.Id == productId);
                p.DisplayPrice = await _context.ProductVariants.Where(v => v.ProductId == productId).Select(v => (decimal?)v.Price).MinAsync() ?? 0m;
                p.TotalInventory = await _context.ProductVariants.Where(v => v.ProductId == productId).Select(v => (int?)v.Stock).SumAsync() ?? 0;
                p.VariantCount = await _context.ProductVariants.CountAsync(v => v.ProductId == productId);
                await _context.SaveChangesAsync();

                return StatusCode(201, EnvelopeBuilder.Ok(HttpContext, "VARIANT_CREATED", new { id = variant.Id }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding variant for product {ProductId}", productId);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{productId}/variants/{variantId}")]
        public async Task<IActionResult> UpdateVariant(Guid productId, Guid variantId, [FromBody] ProductVariantRequest request)
        {
            try
            {
                var variant = await _context.ProductVariants.FirstOrDefaultAsync(v => v.Id == variantId && v.ProductId == productId);
                if (variant == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("variantId", "Variant not found", "NOT_FOUND") }, 404));
                }

                variant.Price = request.Price;
                variant.Stock = request.Stock;
                variant.ImageId = request.ImageId;
                if (!string.IsNullOrWhiteSpace(request.Sku))
                    variant.Sku = request.Sku;

                await _context.SaveChangesAsync();

                // Update denormalized fields
                var p = await _context.Products.FirstAsync(x => x.Id == productId);
                p.DisplayPrice = await _context.ProductVariants.Where(v => v.ProductId == productId).Select(v => (decimal?)v.Price).MinAsync() ?? 0m;
                p.TotalInventory = await _context.ProductVariants.Where(v => v.ProductId == productId).Select(v => (int?)v.Stock).SumAsync() ?? 0;
                p.VariantCount = await _context.ProductVariants.CountAsync(v => v.ProductId == productId);
                await _context.SaveChangesAsync();

                return Ok(EnvelopeBuilder.Ok(HttpContext, "VARIANT_UPDATED", new { id = variant.Id }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating variant {VariantId}", variantId);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{productId}/variants/{variantId}")]
        public async Task<IActionResult> DeleteVariant(Guid productId, Guid variantId)
        {
            try
            {
                var variant = await _context.ProductVariants.FirstOrDefaultAsync(v => v.Id == variantId && v.ProductId == productId);
                if (variant == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("variantId", "Variant not found", "NOT_FOUND") }, 404));
                }
                _context.ProductVariants.Remove(variant);
                await _context.SaveChangesAsync();

                // Update denormalized fields
                var p = await _context.Products.FirstAsync(x => x.Id == productId);
                p.DisplayPrice = await _context.ProductVariants.Where(v => v.ProductId == productId).Select(v => (decimal?)v.Price).MinAsync() ?? 0m;
                p.TotalInventory = await _context.ProductVariants.Where(v => v.ProductId == productId).Select(v => (int?)v.Stock).SumAsync() ?? 0;
                p.VariantCount = await _context.ProductVariants.CountAsync(v => v.ProductId == productId);
                await _context.SaveChangesAsync();

                return Ok(EnvelopeBuilder.Ok(HttpContext, "VARIANT_DELETED", new { id = variantId }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting variant {VariantId}", variantId);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("variants/{variantId}/upload-image")]
        public async Task<IActionResult> UploadVariantImage(Guid variantId, [FromForm] IFormFile file, [FromServices] IMediaService mediaService)
        {
            try
            {
                var variant = await _context.ProductVariants.FindAsync(variantId);
                if (variant == null)
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("variantId", "Variant not found", "NOT_FOUND") }, 404));
                if (file == null || file.Length == 0)
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "NO_FILE", new[] { new ErrorItem("file", "No file uploaded", "NO_FILE") }, 400));

                var media = await mediaService.UploadFileAsync(file, null);
                variant.ImageId = media.Id;
                await _context.SaveChangesAsync();

                return Ok(EnvelopeBuilder.Ok(HttpContext, "VARIANT_IMAGE_UPLOADED", new { imageId = media.Id, imageUrl = media.Url }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading variant image {VariantId}", variantId);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        private static string ToSlug(string str)
        {
            if (string.IsNullOrWhiteSpace(str)) return string.Empty;
            var slug = str.ToLowerInvariant()
                .Replace(" ", "-")
                .Replace("đ", "d")
                .Replace("á", "a").Replace("à", "a").Replace("ả", "a").Replace("ã", "a").Replace("ạ", "a")
                .Replace("é", "e").Replace("è", "e").Replace("ẻ", "e").Replace("ẽ", "e").Replace("ẹ", "e")
                .Replace("í", "i").Replace("ì", "i").Replace("ỉ", "i").Replace("ĩ", "i").Replace("ị", "i")
                .Replace("ó", "o").Replace("ò", "o").Replace("ỏ", "o").Replace("õ", "o").Replace("ọ", "o")
                .Replace("ú", "u").Replace("ù", "u").Replace("ủ", "u").Replace("ũ", "u").Replace("ụ", "u")
                .Replace("ý", "y").Replace("ỳ", "y").Replace("ỷ", "y").Replace("ỹ", "y").Replace("ỵ", "y");
            slug = System.Text.RegularExpressions.Regex.Replace(slug, "[^a-z0-9-]", "");
            slug = System.Text.RegularExpressions.Regex.Replace(slug, "-+", "-");
            return slug.Trim('-');
        }
    }
}