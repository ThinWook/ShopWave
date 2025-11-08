using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopWave.Models;
using ShopWave.Models.DTOs;
using ShopWave.Models.Responses;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ShopWave.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly ShopWaveDbContext _context;
        private readonly ILogger<OrdersController> _logger;

        public OrdersController(ShopWaveDbContext context, ILogger<OrdersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var uid = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
                if (!Guid.TryParse(uid, out var userId))
                {
                    return Unauthorized(EnvelopeBuilder.Fail<object>(HttpContext, "UNAUTHORIZED", new[] { new ErrorItem("auth", "Unauthorized", "UNAUTHORIZED") }, 401));
                }

                // Get user's cart
                var cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId);
                if (cart == null)
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "CART_EMPTY", new[] { new ErrorItem("cart", "Cart is empty", "CART_EMPTY") }, 400));
                }

                var cartItems = await _context.CartItems
                    .Include(ci => ci.ProductVariant)
                        .ThenInclude(v => v.Product)
                    .Where(ci => ci.CartId == cart.Id)
                    .ToListAsync();

                if (!cartItems.Any())
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "CART_EMPTY", new[] { new ErrorItem("cart", "Cart is empty", "CART_EMPTY") }, 400));
                }

                // Check availability using ProductVariant stock
                foreach (var cartItem in cartItems)
                {
                    if (cartItem.ProductVariant.Stock < cartItem.Quantity)
                    {
                        return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "OUT_OF_STOCK", new[] { new ErrorItem("product", $"Insufficient stock for '{cartItem.ProductVariant.Product.Name}'", "OUT_OF_STOCK") }, 400));
                    }
                }

                var subTotal = cartItems.Sum(ci => ci.Quantity * ci.UnitPrice);
                var shippingFee = CalculateShippingFee(subTotal);
                var totalAmount = subTotal + shippingFee;
                var orderNumber = await GenerateOrderNumber();

                var order = new Order
                {
                    UserId = userId,
                    OrderNumber = orderNumber,
                    
                    // Price breakdown (no discounts in this legacy flow)
                    SubTotal = subTotal,
                    ShippingFee = shippingFee,
                    ProgressiveDiscountAmount = 0,
                    VoucherDiscountAmount = 0,
                    VoucherCode = null,
                    DiscountAmount = 0, // No discounts in this flow
                    TotalAmount = totalAmount,
                    
                    Status = "Pending",
                    // Structured Shipping Address
                    ShippingFullName = request.ShippingAddress.FullName,
                    ShippingPhone = request.ShippingAddress.Phone,
                    ShippingStreet = request.ShippingAddress.Address,
                    ShippingWard = request.ShippingAddress.Ward,
                    ShippingDistrict = request.ShippingAddress.District,
                    ShippingProvince = request.ShippingAddress.City,
                    ShippingNotes = request.ShippingAddress.Notes,
                    // Structured Billing Address (optional)
                    BillingFullName = request.BillingAddress?.FullName,
                    BillingPhone = request.BillingAddress?.Phone,
                    BillingStreet = request.BillingAddress?.Address,
                    BillingWard = request.BillingAddress?.Ward,
                    BillingDistrict = request.BillingAddress?.District,
                    BillingProvince = request.BillingAddress?.City,
                    BillingNotes = request.BillingAddress?.Notes,
                    PaymentMethod = request.PaymentMethod,
                    PaymentStatus = "Pending",
                    OrderDate = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                var orderItems = new List<OrderItem>();
                foreach (var cartItem in cartItems)
                {
                    // Load variant with its option values for snapshotting
                    var variant = await _context.ProductVariants
                        .Include(v => v.Image)
                        .Include(v => v.VariantValues)
                            .ThenInclude(vv => vv.Value)
                                .ThenInclude(ov => ov.Option)
                        .FirstOrDefaultAsync(v => v.Id == cartItem.ProductVariantId);

                    // Build selected options array for snapshot
                    var selectedOptions = variant?.VariantValues
                        .Select(vv => new SelectedOptionDto
                        {
                            Name = vv.Value.Option.Name,
                            Value = vv.Value.Value
                        })
                        .ToList() ?? new List<SelectedOptionDto>();

                    var orderItem = new OrderItem
                    {
                        OrderId = order.Id,
                        ProductVariantId = cartItem.ProductVariantId,
                        ProductName = cartItem.ProductVariant.Product.Name,
                        Quantity = cartItem.Quantity,
                        UnitPrice = cartItem.UnitPrice,
                        TotalPrice = cartItem.Quantity * cartItem.UnitPrice,
                        
                        // Snapshot variant details
                        VariantImageUrl = variant?.Image?.Url,
                        SelectedOptions = System.Text.Json.JsonSerializer.Serialize(selectedOptions),
                        
                        CreatedAt = DateTime.UtcNow
                    };
                    orderItems.Add(orderItem);

                    // Deduct stock from variant
                    cartItem.ProductVariant.Stock -= cartItem.Quantity;
                }
                _context.OrderItems.AddRange(orderItems);
                _context.CartItems.RemoveRange(cartItems);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var response = new OrderResponse
                {
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    
                    // Price breakdown
                    SubTotal = order.SubTotal,
                    ShippingFee = order.ShippingFee,
                    ProgressiveDiscountAmount = order.ProgressiveDiscountAmount,
                    VoucherDiscountAmount = order.VoucherDiscountAmount,
                    VoucherCode = order.VoucherCode,
                    DiscountAmount = order.DiscountAmount,
                    TotalAmount = order.TotalAmount,
                    
                    Status = order.Status,
                    OrderDate = order.OrderDate,
                    OrderItems = orderItems.Select(oi => new OrderItemDto
                    {
                        Id = oi.Id,
                        ProductName = oi.ProductName,
                        Quantity = oi.Quantity,
                        UnitPrice = oi.UnitPrice,
                        TotalPrice = oi.TotalPrice,
                        VariantImageUrl = oi.VariantImageUrl,
                        SelectedOptions = string.IsNullOrEmpty(oi.SelectedOptions) 
                            ? null 
                            : System.Text.Json.JsonSerializer.Deserialize<List<SelectedOptionDto>>(oi.SelectedOptions)
                    }).ToList()
                };

                return StatusCode(201, EnvelopeBuilder.Ok(HttpContext, "ORDER_CREATED", response));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating order");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetMyOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? status = null)
        {
            try
            {
                var uid = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
                if (!Guid.TryParse(uid, out var userId))
                {
                    return Unauthorized(EnvelopeBuilder.Fail<object>(HttpContext, "UNAUTHORIZED", new[] { new ErrorItem("auth", "Unauthorized", "UNAUTHORIZED") }, 401));
                }
                if (page < 1) page = 1;
                if (pageSize <= 0 || pageSize > 100) pageSize = 10;

                var query = _context.Orders.Where(o => o.UserId == userId);
                if (!string.IsNullOrWhiteSpace(status)) query = query.Where(o => o.Status == status);

                var total = await query.CountAsync();
                var totalPages = total == 0 ? 0 : (int)Math.Ceiling(total / (double)pageSize);
                if (totalPages > 0 && page > totalPages) page = totalPages;

                var orders = await query
                    .OrderByDescending(o => o.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(o => new
                    {
                        o.Id,
                        o.OrderNumber,
                        o.SubTotal,
                        o.ShippingFee,
                        o.ProgressiveDiscountAmount,
                        o.VoucherDiscountAmount,
                        o.VoucherCode,
                        o.DiscountAmount,
                        o.TotalAmount,
                        o.Status,
                        o.PaymentStatus,
                        o.OrderDate,
                        o.ShippedDate,
                        o.DeliveredDate,
                        OrderItems = o.OrderItems.Select(oi => new
                        {
                            oi.Id,
                            oi.ProductName,
                            oi.Quantity,
                            oi.UnitPrice,
                            oi.TotalPrice,
                            oi.VariantImageUrl,
                            oi.SelectedOptions
                        }).ToList()
                    })
                    .ToListAsync();

                // Map to DTOs after query execution to avoid expression tree issues
                var orderDtos = orders.Select(o => new OrderDto
                {
                    Id = o.Id,
                    OrderNumber = o.OrderNumber,
                    SubTotal = o.SubTotal,
                    ShippingFee = o.ShippingFee,
                    ProgressiveDiscountAmount = o.ProgressiveDiscountAmount,
                    VoucherDiscountAmount = o.VoucherDiscountAmount,
                    VoucherCode = o.VoucherCode,
                    DiscountAmount = o.DiscountAmount,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status,
                    PaymentStatus = o.PaymentStatus,
                    OrderDate = o.OrderDate,
                    ShippedDate = o.ShippedDate,
                    DeliveredDate = o.DeliveredDate,
                    OrderItems = o.OrderItems.Select(oi => new OrderItemDto
                    {
                        Id = oi.Id,
                        ProductName = oi.ProductName,
                        Quantity = oi.Quantity,
                        UnitPrice = oi.UnitPrice,
                        TotalPrice = oi.TotalPrice,
                        VariantImageUrl = oi.VariantImageUrl,
                        SelectedOptions = string.IsNullOrEmpty(oi.SelectedOptions) 
                            ? null 
                            : System.Text.Json.JsonSerializer.Deserialize<List<SelectedOptionDto>>(oi.SelectedOptions)
                    }).ToList()
                }).ToList();

                var paged = new PagedResult<OrderDto>(
                    Data: orderDtos,
                    CurrentPage: page,
                    TotalPages: totalPages,
                    PageSize: pageSize,
                    TotalRecords: total,
                    HasPreviousPage: page > 1,
                    HasNextPage: page < totalPages,
                    AppliedFilters: new { status }
                );

                return Ok(EnvelopeBuilder.Ok(HttpContext, "ORDER_LIST_RETRIEVED", paged));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving orders");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous] // Allow guests to view their own orders
        public async Task<IActionResult> GetOrderById(Guid id)
        {
            try
            {
                // Try to get userId from token (for logged-in users)
                Guid? userId = null;
                var uid = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
                if (!string.IsNullOrEmpty(uid) && Guid.TryParse(uid, out var parsedUserId))
                {
                    userId = parsedUserId;
                }

                // === LOAD ORDER WITH ALL RELATED DATA ===
                var order = await _context.Orders
                    .Include(o => o.OrderItems)
                    .Include(o => o.Transactions) // Include transactions
                    .AsNoTracking() // Performance optimization for read-only query
                    .FirstOrDefaultAsync(o => o.Id == id);
                
                if (order == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("id", "Order not found", "NOT_FOUND") }, 404));
                }

                // Authorization check
                if (userId.HasValue)
                {
                    // Logged-in user: check if order belongs to user
                    var user = await _context.Users.FindAsync(userId.Value);
                    if (order.UserId != userId && user?.Role != "Admin")
                    {
                        return StatusCode(403, EnvelopeBuilder.Fail<object>(HttpContext, "FORBIDDEN", new[] { new ErrorItem("auth", "Forbidden", "FORBIDDEN") }, 403));
                    }
                }
                else
                {
                    // Guest user: verify order ownership through session
                    var sessionId = Request.Headers["X-Session-Id"].FirstOrDefault();
                    var lastOrderId = HttpContext.Session.GetString("LastOrderId");
                    
                    // Allow access if:
                    // 1. Order was just created in this session (LastOrderId matches)
                    // 2. Order has no userId (guest order) - temporary for migration
                    if (order.Id.ToString() != lastOrderId && order.UserId.HasValue)
                    {
                        _logger.LogWarning("Guest attempted to access order {OrderId} without proper session. SessionId: {SessionId}, LastOrderId: {LastOrderId}", 
                            id, sessionId, lastOrderId);
                        return StatusCode(403, EnvelopeBuilder.Fail<object>(HttpContext, "FORBIDDEN", new[] { new ErrorItem("auth", "Forbidden", "FORBIDDEN") }, 403));
                    }
                }

                // === MAP TO DETAILED DTO WITH ALL ENHANCEMENTS ===
                var detail = new OrderDetailDto
                {
                    Id = order.Id,
                    OrderNumber = order.OrderNumber,
                    
                    // Price breakdown with detailed discounts (from snapshot)
                    SubTotal = order.SubTotal,
                    ShippingFee = order.ShippingFee,
                    ProgressiveDiscountAmount = order.ProgressiveDiscountAmount,
                    VoucherDiscountAmount = order.VoucherDiscountAmount,
                    VoucherCode = order.VoucherCode,
                    DiscountAmount = order.DiscountAmount,
                    TotalAmount = order.TotalAmount,
                    
                    Status = order.Status,
                    PaymentMethod = order.PaymentMethod,
                    PaymentStatus = order.PaymentStatus,
                    OrderDate = order.OrderDate,
                    ShippedDate = order.ShippedDate,
                    DeliveredDate = order.DeliveredDate,
                    
                    ShippingAddress = new AddressDto
                    {
                        FullName = order.ShippingFullName,
                        Phone = order.ShippingPhone,
                        Address = order.ShippingStreet,
                        Ward = order.ShippingWard,
                        District = order.ShippingDistrict,
                        City = order.ShippingProvince,
                        Notes = order.ShippingNotes
                    },
                    
                    BillingAddress = !string.IsNullOrEmpty(order.BillingFullName) ? new AddressDto
                    {
                        FullName = order.BillingFullName,
                        Phone = order.BillingPhone ?? "",
                        Address = order.BillingStreet ?? "",
                        Ward = order.BillingWard ?? "",
                        District = order.BillingDistrict ?? "",
                        City = order.BillingProvince ?? "",
                        Notes = order.BillingNotes
                    } : null,
                    
                    // OrderItems with variant snapshot
                    OrderItems = order.OrderItems.Select(oi => new OrderItemDto
                    {
                        Id = oi.Id,
                        ProductName = oi.ProductName,
                        Quantity = oi.Quantity,
                        UnitPrice = oi.UnitPrice,
                        TotalPrice = oi.TotalPrice,
                        VariantImageUrl = oi.VariantImageUrl,
                        SelectedOptions = string.IsNullOrEmpty(oi.SelectedOptions) 
                            ? null 
                            : System.Text.Json.JsonSerializer.Deserialize<List<SelectedOptionDto>>(oi.SelectedOptions)
                    }).ToList(),
                    
                    // Transaction history
                    Transactions = order.Transactions.Select(tx => new TransactionDto
                    {
                        Id = tx.Id,
                        Gateway = tx.Gateway,
                        Amount = tx.Amount,
                        Status = tx.Status,
                        GatewayTransactionId = tx.GatewayTransactionId,
                        CreatedAt = tx.CreatedAt,
                        CompletedAt = tx.CompletedAt
                    }).ToList()
                };

                return Ok(EnvelopeBuilder.Ok(HttpContext, "ORDER_DETAIL_RETRIEVED", detail));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving order {OrderId}", id);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(Guid id)
        {
            try
            {
                var uid = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
                if (!Guid.TryParse(uid, out var userId))
                {
                    return Unauthorized(EnvelopeBuilder.Fail<object>(HttpContext, "UNAUTHORIZED", new[] { new ErrorItem("auth", "Unauthorized", "UNAUTHORIZED") }, 401));
                }

                var order = await _context.Orders
                    .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.ProductVariant)
                    .FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId);
                
                if (order == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("id", "Order not found", "NOT_FOUND") }, 404));
                }
                if (order.Status != "Pending" && order.Status != "Processing")
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "INVALID_STATE", new[] { new ErrorItem("status", "Order cannot be cancelled in current state", "INVALID_STATE") }, 400));
                }

                // Return stock to variants directly
                foreach (var orderItem in order.OrderItems)
                {
                    orderItem.ProductVariant.Stock += orderItem.Quantity;
                }
                
                order.Status = "Cancelled";
                order.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(EnvelopeBuilder.Ok(HttpContext, "ORDER_CANCELLED", new { }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling order {OrderId}", id);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        private decimal CalculateShippingFee(decimal subTotal) => subTotal >= 500000 ? 0 : 30000;

        private async Task<string> GenerateOrderNumber()
        {
            var today = DateTime.UtcNow.ToString("yyyyMMdd");
            var lastOrder = await _context.Orders.Where(o => o.OrderNumber.StartsWith($"ORD{today}") )
                .OrderByDescending(o => o.OrderNumber).FirstOrDefaultAsync();
            var seq = 1;
            if (lastOrder != null)
            {
                var tail = lastOrder.OrderNumber.Substring(11);
                if (int.TryParse(tail, out var parsed)) seq = parsed + 1;
            }
            return $"ORD{today}{seq:D4}";
        }
    }

    public class CreateOrderRequest
    {
        [Required]
        public AddressDto ShippingAddress { get; set; } = null!;
        public AddressDto? BillingAddress { get; set; }
        [Required]
        [MaxLength(100)]
        public string PaymentMethod { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }
}