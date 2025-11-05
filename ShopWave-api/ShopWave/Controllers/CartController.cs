using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopWave.Models;
using ShopWave.Models.DTOs;
using ShopWave.Models.Requests;
using ShopWave.Models.Responses;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ShopWave.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [AllowAnonymous]
    public class CartController : ControllerBase
    {
        private readonly ShopWaveDbContext _context;
        private readonly ILogger<CartController> _logger;

        public CartController(ShopWaveDbContext context, ILogger<CartController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private string? GetSessionIdFromRequest()
        {
            // Prefer header, then cookie
            if (Request.Headers.TryGetValue("X-Session-Id", out var hdr) && !string.IsNullOrWhiteSpace(hdr))
                return hdr.ToString();
            if (Request.Cookies.TryGetValue("shopwave_session", out var cookie) && !string.IsNullOrWhiteSpace(cookie))
                return cookie;
            return null;
        }

        private Guid? GetUserIdFromClaims()
        {
            var uid = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (Guid.TryParse(uid, out var userId)) return userId;
            return null;
        }

        private async Task<Cart> GetOrCreateCartAsync(Guid? userId, string? sessionId)
        {
            Cart? cart = null;
            if (userId.HasValue)
            {
                cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId.Value);
            }
            if (cart == null && !string.IsNullOrWhiteSpace(sessionId))
            {
                cart = await _context.Carts.FirstOrDefaultAsync(c => c.SessionId == sessionId);
            }
            if (cart == null)
            {
                cart = new Cart { UserId = userId, SessionId = sessionId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }
            return cart;
        }

        /// <summary>
        /// Calculate progressive discount information based on cart subtotal and DiscountTiers table
        /// This method queries all active discount tiers and determines the current applicable tier
        /// and the next tier to provide incentive information to the user
        /// </summary>
        private async Task<ProgressiveDiscountDto> CalculateProgressiveDiscountAsync(decimal subTotal)
        {
            // 1. Fetch all active discount tiers from database, ordered by threshold
            var allTiers = await _context.DiscountTiers
                .Where(t => t.IsActive)
                .OrderBy(t => t.ThresholdAmount)
                .ToListAsync();

            if (!allTiers.Any())
            {
                return new ProgressiveDiscountDto(); // Return empty DTO if no tiers configured
            }

            // 2. Find the highest tier that the user has reached (subtotal >= threshold)
            var currentTier = allTiers
                .Where(t => subTotal >= t.ThresholdAmount)
                .OrderByDescending(t => t.ThresholdAmount)
                .FirstOrDefault();

            // 3. Find the next tier that the user hasn't reached yet (subtotal < threshold)
            var nextTier = allTiers
                .Where(t => subTotal < t.ThresholdAmount)
                .OrderBy(t => t.ThresholdAmount)
                .FirstOrDefault();

            // 4. Build the DTO with current and next tier information
            var dto = new ProgressiveDiscountDto();

            if (currentTier != null)
            {
                dto.CurrentDiscountValue = currentTier.DiscountValue;
            }

            if (nextTier != null)
            {
                dto.NextDiscountThreshold = nextTier.ThresholdAmount;
                dto.NextDiscountValue = nextTier.DiscountValue;
                dto.AmountToNext = nextTier.ThresholdAmount - subTotal;
            }

            return dto;
        }

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            try
            {
                var userId = GetUserIdFromClaims();
                var sessionId = GetSessionIdFromRequest();
                if (!userId.HasValue && string.IsNullOrWhiteSpace(sessionId))
                {
                    // No identity provided - return empty cart (guest without session)
                    return Ok(EnvelopeBuilder.Ok(HttpContext, "CART_RETRIEVED", new CartResponse()));
                }

                Cart cart = await GetOrCreateCartAsync(userId, sessionId);

                var cartEntities = await _context.CartItems
                    .Include(ci => ci.Product)
                    .Include(ci => ci.ProductVariant)
                        .ThenInclude(v => v.VariantValues)
                            .ThenInclude(vv => vv.Value)
                                .ThenInclude(ov => ov.Option)
                    .Include(ci => ci.ProductVariant)
                        .ThenInclude(v => v.Image)
                    .Where(ci => ci.CartId == cart.Id)
                    .ToListAsync();

                var cartItems = cartEntities.Select(ci =>
                {
                    int stock = 0;
                    if (ci.ProductVariant != null)
                    {
                        stock = ci.ProductVariant.Stock;
                    }
                    else
                    {
                        stock = _context.ProductVariants.Where(v => v.ProductId == ci.ProductId).Sum(v => v.Stock);
                    }

                    // Prepare selected options from variant
                    List<KeyValuePair<string, string>>? selectedOptions = null;
                    if (ci.ProductVariant != null && ci.ProductVariant.VariantValues != null)
                    {
                        selectedOptions = ci.ProductVariant.VariantValues
                            .Select(vv => new KeyValuePair<string, string>(vv.Value.Option.Name, vv.Value.Value))
                            .ToList();
                    }

                    // Determine variant image URL (prefer variant image)
                    string? variantImageUrl = null;
                    if (ci.ProductVariant?.Image != null)
                    {
                        variantImageUrl = ci.ProductVariant.Image.Url;
                    }
                    else if (ci.Product?.Media != null)
                    {
                        variantImageUrl = ci.Product.Media.Url;
                    }

                    return new CartItemDto
                    {
                        Id = ci.Id,
                        ProductId = ci.ProductId,
                        VariantId = ci.ProductVariantId,
                        ProductName = ci.Product?.Name,
                        ProductMediaId = ci.Product?.MediaId,
                        UnitPrice = ci.UnitPrice,
                        Quantity = ci.Quantity,
                        TotalPrice = ci.Quantity * ci.UnitPrice,
                        StockQuantity = stock,
                        VariantImageUrl = variantImageUrl,
                        SelectedOptions = selectedOptions
                    };
                }).ToList();

                var subTotal = cartItems.Sum(ci => ci.TotalPrice);
                
                // Calculate progressive discount based on subtotal
                var progressiveDiscount = await CalculateProgressiveDiscountAsync(subTotal);
                
                var shipping = CalculateShippingFee(subTotal);
                
                // Apply progressive discount to total
                var total = subTotal - progressiveDiscount.CurrentDiscountValue + shipping;
                
                var resp = new CartResponse
                {
                    Items = cartItems,
                    TotalItems = cartItems.Sum(ci => ci.Quantity),
                    SubTotal = subTotal,
                    ShippingFee = shipping,
                    Total = total,
                    ProgressiveDiscount = progressiveDiscount
                };
                return Ok(EnvelopeBuilder.Ok(HttpContext, "CART_RETRIEVED", resp));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cart");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartRequest request)
        {
            try
            {
                var userId = GetUserIdFromClaims();
                var sessionId = GetSessionIdFromRequest();
                if (!userId.HasValue && string.IsNullOrWhiteSpace(sessionId))
                {
                    // No identity provided - return 401 to encourage client to provide a session id
                    return Unauthorized(EnvelopeBuilder.Fail<object>(HttpContext, "UNAUTHORIZED", new[] { new ErrorItem("auth", "Unauthorized", "UNAUTHORIZED") }, 401));
                }

                // Variant is now required
                var variant = await _context.ProductVariants
                    .Include(v => v.Product)
                    .FirstOrDefaultAsync(v => v.Id == request.VariantId);

                if (variant == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("variant", "Variant not found", "NOT_FOUND") }, 404));
                }

                if (variant.Product == null || !variant.Product.IsActive)
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "PRODUCT_INACTIVE", new[] { new ErrorItem("product", "Product not found or inactive", "PRODUCT_INACTIVE") }, 400));
                }

                if (variant.Stock < request.Quantity)
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "OUT_OF_STOCK", new[] { new ErrorItem("stock", "Insufficient stock for selected variant", "OUT_OF_STOCK") }, 400));
                }

                // Ensure there's a Cart row for this user/session
                var cart = await GetOrCreateCartAsync(userId, sessionId);

                Guid variantId = variant.Id;
                var existing = await _context.CartItems.FirstOrDefaultAsync(ci => ci.CartId == cart.Id && ci.ProductVariantId == variantId);
                if (existing != null)
                {
                    existing.Quantity += request.Quantity;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    var cartItem = new CartItem { CartId = cart.Id, UserId = userId, ProductId = variant.ProductId, ProductVariantId = variantId, Quantity = request.Quantity, UnitPrice = variant.Price, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
                    _context.CartItems.Add(cartItem);
                }
                await _context.SaveChangesAsync();
                return StatusCode(201, EnvelopeBuilder.Ok(HttpContext, "CART_ITEM_ADDED", new { }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding cart item");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCartItem(Guid id, [FromBody] UpdateCartItemRequest request)
        {
            try
            {
                var userId = GetUserIdFromClaims();
                var sessionId = GetSessionIdFromRequest();
                if (!userId.HasValue && string.IsNullOrWhiteSpace(sessionId))
                {
                    return Unauthorized(EnvelopeBuilder.Fail<object>(HttpContext, "UNAUTHORIZED", new[] { new ErrorItem("auth", "Unauthorized", "UNAUTHORIZED") }, 401));
                }

                var cart = await GetOrCreateCartAsync(userId, sessionId);
                var cartItem = await _context.CartItems.Include(ci => ci.ProductVariant).FirstOrDefaultAsync(ci => ci.Id == id && ci.CartId == cart.Id);
                if (cartItem == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("id", "Cart item not found", "NOT_FOUND") }, 404));
                }

                int available = 0;
                if (cartItem.ProductVariant != null)
                {
                    available = cartItem.ProductVariant.Stock;
                }
                else
                {
                    available = await _context.ProductVariants.Where(v => v.ProductId == cartItem.ProductId).SumAsync(v => v.Stock);
                }

                if (available < request.Quantity)
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "OUT_OF_STOCK", new[] { new ErrorItem("stock", "Insufficient stock", "OUT_OF_STOCK") }, 400));
                }

                cartItem.Quantity = request.Quantity;
                cartItem.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return Ok(EnvelopeBuilder.Ok(HttpContext, "CART_ITEM_UPDATED", new { }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating cart item");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoveFromCart(Guid id)
        {
            try
            {
                var userId = GetUserIdFromClaims();
                var sessionId = GetSessionIdFromRequest();
                if (!userId.HasValue && string.IsNullOrWhiteSpace(sessionId))
                {
                    return Unauthorized(EnvelopeBuilder.Fail<object>(HttpContext, "UNAUTHORIZED", new[] { new ErrorItem("auth", "Unauthorized", "UNAUTHORIZED") }, 401));
                }

                var cart = await GetOrCreateCartAsync(userId, sessionId);
                var cartItem = await _context.CartItems.FirstOrDefaultAsync(ci => ci.Id == id && ci.CartId == cart.Id);
                if (cartItem == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("id", "Cart item not found", "NOT_FOUND") }, 404));
                }
                _context.CartItems.Remove(cartItem);
                await _context.SaveChangesAsync();
                return Ok(EnvelopeBuilder.Ok(HttpContext, "CART_ITEM_REMOVED", new { }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing cart item");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart()
        {
            try
            {
                var uid = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
                if (!Guid.TryParse(uid, out var userId)) return Unauthorized(EnvelopeBuilder.Fail<object>(HttpContext, "UNAUTHORIZED", new[] { new ErrorItem("auth", "Unauthorized", "UNAUTHORIZED") }, 401));

                var items = await _context.CartItems.Where(ci => ci.UserId == userId).ToListAsync();
                if (items.Count > 0)
                {
                    _context.CartItems.RemoveRange(items);
                    await _context.SaveChangesAsync();
                }
                return Ok(EnvelopeBuilder.Ok(HttpContext, "CART_CLEARED", new { }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing cart");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [HttpPost("voucher")]
        public async Task<IActionResult> ApplyVoucher([FromBody] ApplyVoucherRequest dto)
        {
            try
            {
                var userId = GetUserIdFromClaims();
                var sessionId = GetSessionIdFromRequest();
                if (!userId.HasValue && string.IsNullOrWhiteSpace(sessionId))
                {
                    return Unauthorized(EnvelopeBuilder.Fail<object>(HttpContext, "UNAUTHORIZED", new[] { new ErrorItem("auth", "Unauthorized", "UNAUTHORIZED") }, 401));
                }

                var cart = await GetOrCreateCartAsync(userId, sessionId);

                var voucherCode = dto.VoucherCode?.Trim().ToUpper();
                if (string.IsNullOrWhiteSpace(voucherCode))
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "INVALID_REQUEST", new[] { new ErrorItem("voucher", "Voucher code required", "INVALID_REQUEST") }, 400));
                }

                var voucher = await _context.Discounts.FirstOrDefaultAsync(d => d.Code == voucherCode && d.IsActive);
                if (voucher == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "VOUCHER_NOT_FOUND", new[] { new ErrorItem("voucher", "Voucher not found", "VOUCHER_NOT_FOUND") }, 404));
                }

                if (voucher.EndDate.HasValue && voucher.EndDate.Value < DateTime.UtcNow)
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "VOUCHER_EXPIRED", new[] { new ErrorItem("voucher", "Voucher expired", "VOUCHER_EXPIRED") }, 400));
                }

                var cartItems = await _context.CartItems.Where(ci => ci.CartId == cart.Id).ToListAsync();
                var subTotal = cartItems.Sum(ci => ci.UnitPrice * ci.Quantity);
                if (voucher.MinOrderAmount > subTotal)
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "VOUCHER_MIN_AMOUNT_NOT_MET", new[] { new ErrorItem("voucher", "Minimum order amount not met", "VOUCHER_MIN_AMOUNT_NOT_MET") }, 400));
                }

                // Calculate applied amount
                decimal appliedAmount = 0;
                if (voucher.DiscountType == DiscountType.FIXED_AMOUNT)
                {
                    appliedAmount = Math.Min(voucher.DiscountValue, subTotal);
                }
                else // percentage
                {
                    appliedAmount = Math.Round(subTotal * (voucher.DiscountValue / 100m), 2);
                }

                // Upsert AppliedDiscount for this cart
                var existing = await _context.AppliedDiscounts.FirstOrDefaultAsync(ad => ad.CartId == cart.Id && ad.DiscountId == voucher.Id);
                if (existing != null)
                {
                    existing.DiscountAmountApplied = appliedAmount;
                    existing.AppliedAt = DateTime.UtcNow;
                }
                else
                {
                    var applied = new AppliedDiscount
                    {
                        CartId = cart.Id,
                        DiscountId = voucher.Id,
                        DiscountAmountApplied = appliedAmount,
                        AppliedAt = DateTime.UtcNow
                    };
                    _context.AppliedDiscounts.Add(applied);
                }

                await _context.SaveChangesAsync();

                // Recompute cart view
                var cartEntities = await _context.CartItems
                    .Include(ci => ci.Product)
                    .Include(ci => ci.ProductVariant)
                    .Where(ci => ci.CartId == cart.Id)
                    .ToListAsync();

                var items = cartEntities.Select(ci => new CartItemDto
                {
                    Id = ci.Id,
                    ProductId = ci.ProductId,
                    VariantId = ci.ProductVariantId,
                    ProductName = ci.Product?.Name,
                    ProductMediaId = ci.Product?.MediaId,
                    UnitPrice = ci.UnitPrice,
                    Quantity = ci.Quantity,
                    TotalPrice = ci.Quantity * ci.UnitPrice,
                    StockQuantity = ci.ProductVariant != null ? ci.ProductVariant.Stock : _context.ProductVariants.Where(v => v.ProductId == ci.ProductId).Sum(v => v.Stock)
                }).ToList();

                var discountTotal = await _context.AppliedDiscounts.Where(ad => ad.CartId == cart.Id).SumAsync(ad => ad.DiscountAmountApplied);
                var newSubTotal = items.Sum(i => i.TotalPrice);
                
                // Calculate progressive discount
                var progressiveDiscount = await CalculateProgressiveDiscountAsync(newSubTotal);
                
                var shipping = CalculateShippingFee(newSubTotal);
                
                // Apply both progressive discount and voucher discount to total
                var total = newSubTotal - progressiveDiscount.CurrentDiscountValue + shipping - discountTotal;
                
                var response = new CartResponse
                {
                    Items = items,
                    TotalItems = items.Sum(i => i.Quantity),
                    SubTotal = newSubTotal,
                    ShippingFee = shipping,
                    Total = total,
                    ProgressiveDiscount = progressiveDiscount
                };

                return Ok(EnvelopeBuilder.Ok(HttpContext, "VOUCHER_APPLIED", response));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error applying voucher");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [HttpDelete("voucher")]
        public async Task<IActionResult> RemoveVoucher()
        {
            try
            {
                var userId = GetUserIdFromClaims();
                var sessionId = GetSessionIdFromRequest();
                if (!userId.HasValue && string.IsNullOrWhiteSpace(sessionId))
                {
                    return Unauthorized(EnvelopeBuilder.Fail<object>(HttpContext, "UNAUTHORIZED", new[] { new ErrorItem("auth", "Unauthorized", "UNAUTHORIZED") }, 401));
                }

                var cart = await GetOrCreateCartAsync(userId, sessionId);
                var applied = await _context.AppliedDiscounts.Where(ad => ad.CartId == cart.Id).ToListAsync();
                if (applied.Count > 0)
                {
                    _context.AppliedDiscounts.RemoveRange(applied);
                    await _context.SaveChangesAsync();
                }

                var cartEntities = await _context.CartItems
                    .Include(ci => ci.Product)
                    .Include(ci => ci.ProductVariant)
                    .Where(ci => ci.CartId == cart.Id)
                    .ToListAsync();

                var items = cartEntities.Select(ci => new CartItemDto
                {
                    Id = ci.Id,
                    ProductId = ci.ProductId,
                    VariantId = ci.ProductVariantId,
                    ProductName = ci.Product?.Name,
                    ProductMediaId = ci.Product?.MediaId,
                    UnitPrice = ci.UnitPrice,
                    Quantity = ci.Quantity,
                    TotalPrice = ci.Quantity * ci.UnitPrice,
                    StockQuantity = ci.ProductVariant != null ? ci.ProductVariant.Stock : _context.ProductVariants.Where(v => v.ProductId == ci.ProductId).Sum(v => v.Stock)
                }).ToList();

                var newSubTotal = items.Sum(i => i.TotalPrice);
                
                // Calculate progressive discount
                var progressiveDiscount = await CalculateProgressiveDiscountAsync(newSubTotal);
                
                var shipping = CalculateShippingFee(newSubTotal);
                
                // Apply progressive discount to total (no voucher discount after removal)
                var total = newSubTotal - progressiveDiscount.CurrentDiscountValue + shipping;
                
                var response = new CartResponse
                {
                    Items = items,
                    TotalItems = items.Sum(i => i.Quantity),
                    SubTotal = newSubTotal,
                    ShippingFee = shipping,
                    Total = total,
                    ProgressiveDiscount = progressiveDiscount
                };

                return Ok(EnvelopeBuilder.Ok(HttpContext, "VOUCHER_REMOVED", response));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing voucher");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        private decimal CalculateShippingFee(decimal subTotal) => subTotal >= 500000 ? 0 : 30000;
    }
}