using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopWave.Models;
using ShopWave.Models.DTOs;
using ShopWave.Models.Responses;
using ShopWave.Services;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ShopWave.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class CheckoutController : ControllerBase
    {
        private readonly ShopWaveDbContext _context;
        private readonly ILogger<CheckoutController> _logger;
        private readonly IPaymentGatewayService _paymentGatewayService;
        private readonly IVnPayService _vnPayService;

        public CheckoutController(
            ShopWaveDbContext context,
            ILogger<CheckoutController> logger,
            IPaymentGatewayService paymentGatewayService,
            IVnPayService vnPayService)
        {
            _context = context;
            _logger = logger;
            _paymentGatewayService = paymentGatewayService;
            _vnPayService = vnPayService;
        }

        /// <summary>
        /// API Chính: T?o ??n hàng (POST /api/v1/checkout)
        /// Client g?i API này khi nh?n nút "Hoàn t?t ??n hàng"
        /// Support c? logged-in user và guest checkout
        /// </summary>
        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> CreateCheckout([FromBody] CheckoutRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. L?Y THÔNG TIN NG??I DÙNG (ho?c Guest)
                Guid? userId = null;
                var uid = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
                if (!string.IsNullOrEmpty(uid) && Guid.TryParse(uid, out var parsedUserId))
                {
                    userId = parsedUserId;
                }

                // 2. L?Y GI? HÀNG (t? userId ho?c sessionId)
                Cart? cart = null;
                if (userId.HasValue)
                {
                    // Logged-in user: get cart by userId
                    _logger.LogInformation("Getting cart for logged-in user {UserId}", userId);
                    cart = await _context.Carts
                        .Include(c => c.CartItems)
                            .ThenInclude(ci => ci.ProductVariant)
                                .ThenInclude(v => v.Product)
                        .Include(c => c.AppliedDiscounts)
                            .ThenInclude(ad => ad.Discount)
                        .FirstOrDefaultAsync(c => c.UserId == userId.Value);
                }
                else
                {
                    // Guest user: get cart by sessionId from header
                    var sessionId = Request.Headers["X-Session-Id"].FirstOrDefault();
                    _logger.LogInformation("Getting cart for guest with session ID: {SessionId}", sessionId);
                    
                    if (string.IsNullOrEmpty(sessionId))
                    {
                        _logger.LogWarning("No session ID provided for guest checkout");
                        return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "SESSION_REQUIRED",
                            new[] { new ErrorItem("session", "Vui lòng ??ng nh?p ho?c cung c?p session ID", "SESSION_REQUIRED") }, 400));
                    }

                    cart = await _context.Carts
                        .Include(c => c.CartItems)
                            .ThenInclude(ci => ci.ProductVariant)
                                .ThenInclude(v => v.Product)
                        .Include(c => c.AppliedDiscounts)
                            .ThenInclude(ad => ad.Discount)
                        .FirstOrDefaultAsync(c => c.SessionId == sessionId);
                    
                    if (cart == null)
                    {
                        _logger.LogWarning("Cart not found for session ID: {SessionId}", sessionId);
                    }
                    else
                    {
                        _logger.LogInformation("Found cart {CartId} with {ItemCount} items for session {SessionId}", 
                            cart.Id, cart.CartItems.Count, sessionId);
                    }
                }

                if (cart == null || !cart.CartItems.Any())
                {
                    _logger.LogWarning("Cart empty or not found for checkout. UserId: {UserId}, Cart: {Cart}", userId, cart?.Id);
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "CART_EMPTY",
                        new[] { new ErrorItem("cart", "Gi? hàng tr?ng", "CART_EMPTY") }, 400));
                }

                // 3. KI?M TRA T?N KHO & TÍNH TOÁN
                foreach (var cartItem in cart.CartItems)
                {
                    if (cartItem.ProductVariant.Stock < cartItem.Quantity)
                    {
                        return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "OUT_OF_STOCK",
                            new[] { new ErrorItem("product", $"S?n ph?m '{cartItem.ProductVariant.Product.Name}' ?ã h?t hàng", "OUT_OF_STOCK") }, 400));
                    }
                }

                var subTotal = cart.CartItems.Sum(ci => ci.Quantity * ci.UnitPrice);
                var shippingFee = CalculateShippingFee(subTotal);
                
                // === TÍNH GI?M GIÁ PROGRESSIVE (Theo b?c) ===
                decimal progressiveDiscount = 0;
                var tier = await _context.DiscountTiers
                    .Where(t => t.IsActive && subTotal >= t.ThresholdAmount)
                    .OrderByDescending(t => t.ThresholdAmount)
                    .FirstOrDefaultAsync();
                
                if (tier != null)
                {
                    progressiveDiscount = tier.DiscountValue;
                }
                
                // === TÍNH GI?M GIÁ VOUCHER ===
                decimal voucherDiscount = 0;
                string? voucherCode = null;
                
                foreach (var appliedDiscount in cart.AppliedDiscounts)
                {
                    var discount = appliedDiscount.Discount;
                    if (discount.IsActive && subTotal >= discount.MinOrderAmount)
                    {
                        decimal discountAmount = discount.DiscountType == DiscountType.PERCENTAGE
                            ? subTotal * (discount.DiscountValue / 100)
                            : discount.DiscountValue;
                        
                        voucherDiscount += discountAmount;
                        voucherCode = discount.Code; // L?u mã voucher
                    }
                }

                var totalDiscountAmount = progressiveDiscount + voucherDiscount;
                var totalAmount = subTotal + shippingFee - totalDiscountAmount;
                var orderNumber = await GenerateOrderNumber();

                // 4. T?O ??N HÀNG (Order) VÀ CÁC M?C (OrderItems)
                // For guest orders, userId will be null
                var order = new Order
                {
                    UserId = userId, // null for guest, Guid for logged-in user
                    OrderNumber = orderNumber,
                    
                    // === SNAPSHOT PRICE BREAKDOWN V?I CHI TI?T ===
                    SubTotal = subTotal,
                    ShippingFee = shippingFee,
                    ProgressiveDiscountAmount = progressiveDiscount,
                    VoucherDiscountAmount = voucherDiscount,
                    VoucherCode = voucherCode,
                    DiscountAmount = totalDiscountAmount, // T?ng (cho backward compatibility)
                    TotalAmount = totalAmount,
                    // ============================================
                    
                    Status = request.PaymentMethod == "COD" ? "PROCESSING" : "PENDING_PAYMENT",
                    // ??a ch? giao hàng
                    ShippingFullName = request.ShippingAddress.FullName,
                    ShippingPhone = request.ShippingAddress.Phone,
                    ShippingStreet = request.ShippingAddress.Address,
                    ShippingWard = request.ShippingAddress.Ward,
                    ShippingDistrict = request.ShippingAddress.District,
                    ShippingProvince = request.ShippingAddress.City,
                    ShippingNotes = request.ShippingAddress.Notes,
                    // ??a ch? thanh toán (tùy ch?n)
                    BillingFullName = request.BillingAddress?.FullName,
                    BillingPhone = request.BillingAddress?.Phone,
                    BillingStreet = request.BillingAddress?.Address,
                    BillingWard = request.BillingAddress?.Ward,
                    BillingDistrict = request.BillingAddress?.District,
                    BillingProvince = request.BillingAddress?.City,
                    BillingNotes = request.BillingAddress?.Notes,
                    PaymentMethod = request.PaymentMethod,
                    PaymentStatus = request.PaymentMethod == "COD" ? "UNPAID" : "UNPAID",
                    OrderDate = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // T?o OrderItems và tr? kho
                var orderItems = new List<OrderItem>();
                foreach (var cartItem in cart.CartItems)
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
                        
                        // === SNAPSHOT VARIANT DETAILS ===
                        VariantImageUrl = variant?.Image?.Url,
                        SelectedOptions = System.Text.Json.JsonSerializer.Serialize(selectedOptions),
                        // ================================
                        
                        CreatedAt = DateTime.UtcNow
                    };
                    orderItems.Add(orderItem);

                    // Tr? kho ch? khi COD (v?i online payment, tr? khi webhook confirm thành công)
                    if (request.PaymentMethod == "COD")
                    {
                        cartItem.ProductVariant.Stock -= cartItem.Quantity;
                    }
                }
                _context.OrderItems.AddRange(orderItems);

                // 5. T?O GIAO D?CH (Transaction)
                if (request.PaymentMethod == "VNPAY")
                {
                    // T?O GIAO D?CH (Transaction)
                    var transaction_record = new Transaction
                    {
                        OrderId = order.Id,
                        Gateway = "VNPAY",
                        Amount = order.TotalAmount,
                        Status = "PENDING",
                        TransactionType = "PAYMENT",
                        IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                        UserAgent = Request.Headers["User-Agent"].ToString(),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.Transactions.Add(transaction_record);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    // Store order ID in session for guest access
                    HttpContext.Session.SetString("LastOrderId", order.Id.ToString());

                    // Create payment information model with OrderId
                    var paymentModel = new PaymentInformationModel
                    {
                        OrderId = order.Id, // === FIX: Pass OrderId ===
                        Amount = (double)order.TotalAmount,
                        Name = request.ShippingAddress.FullName,
                        OrderDescription = $"Thanh toan don hang {order.OrderNumber}",
                        OrderType = "other"
                    };

                    // Generate VNPay payment URL using VnPayService
                    var paymentUrl = _vnPayService.CreatePaymentUrl(paymentModel, HttpContext, transaction_record.Id);

                    var response = new CheckoutResponse
                    {
                        Status = "OK",
                        PaymentMethod = "VNPAY",
                        PaymentUrl = paymentUrl,
                        OrderId = order.Id,
                        TransactionId = transaction_record.Id
                    };

                    _logger.LogInformation("VNPay payment URL created for Order {OrderNumber}, Transaction {TransactionId}", 
                        order.OrderNumber, transaction_record.Id);

                    return Ok(EnvelopeBuilder.Ok(HttpContext, "PAYMENT_URL_GENERATED", response));
                }

                // === MOMO PAYMENT (Keep existing) ===
                if (request.PaymentMethod == "MOMO")
                {
                    // T?O GIAO D?CH (Transaction)
                    var transaction_record = new Transaction
                    {
                        OrderId = order.Id,
                        Gateway = "MOMO",
                        Amount = order.TotalAmount,
                        Status = "PENDING",
                        TransactionType = "PAYMENT",
                        IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Transactions.Add(transaction_record);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    HttpContext.Session.SetString("LastOrderId", order.Id.ToString());

                    var returnUrl = $"{Request.Scheme}://{Request.Host}/api/v1/payments/return";
                    var paymentUrl = await _paymentGatewayService.CreatePaymentUrl(
                        "MOMO",
                        order,
                        transaction_record.Id,
                        returnUrl
                    );

                    var response = new CheckoutResponse
                    {
                        Status = "OK",
                        PaymentMethod = "MOMO",
                        PaymentUrl = paymentUrl,
                        OrderId = order.Id,
                        TransactionId = transaction_record.Id
                    };

                    return Ok(EnvelopeBuilder.Ok(HttpContext, "PAYMENT_URL_GENERATED", response));
                }

                // === COD (Keep existing) ===
                if (request.PaymentMethod == "COD")
                {
                    // T?O GIAO D?CH (Transaction Log) CHO COD
                    var codTransaction = new Transaction
                    {
                        OrderId = order.Id,
                        Gateway = "COD",
                        Amount = order.TotalAmount,
                        Status = "PENDING", // S? ???c c?p nh?t thành SUCCESS khi shipper confirm ?ã thu ti?n
                        TransactionType = "PAYMENT",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.Transactions.Add(codTransaction);

                    // D?N D?P GI? HÀNG (B?T BU?C)
                    _context.CartItems.RemoveRange(cart.CartItems);
                    _context.AppliedDiscounts.RemoveRange(cart.AppliedDiscounts);
                    _context.Carts.Remove(cart); // Xóa c? Cart record
                    
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    // Store order ID in session for guest access verification
                    HttpContext.Session.SetString("LastOrderId", order.Id.ToString());

                    // G?i EMAIL/SMS XÁC NH?N (TODO: Implement email service)
                    _logger.LogInformation("Order {OrderNumber} created successfully" + (userId.HasValue ? " for user {UserId}" : " for guest") + ". Email confirmation should be sent.", 
                        order.OrderNumber, userId);
                    // await _emailService.SendOrderConfirmationAsync(order);

                    var response = new CheckoutResponse
                    {
                        Status = "OK",
                        PaymentMethod = "COD",
                        OrderId = order.Id, // Added for client access
                        Order = new OrderDto
                        {
                            Id = order.Id,
                            OrderNumber = order.OrderNumber,
                            
                            // Price breakdown with detailed discounts
                            SubTotal = order.SubTotal,
                            ShippingFee = order.ShippingFee,
                            ProgressiveDiscountAmount = order.ProgressiveDiscountAmount,
                            VoucherDiscountAmount = order.VoucherDiscountAmount,
                            VoucherCode = order.VoucherCode,
                            DiscountAmount = order.DiscountAmount,
                            TotalAmount = order.TotalAmount,
                            
                            Status = order.Status,
                            PaymentStatus = order.PaymentStatus,
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
                        }
                    };

                    // Tr? v? 201 Created thay vì 200 OK
                    return StatusCode(201, EnvelopeBuilder.Ok(HttpContext, "ORDER_CREATED", response));
                }

                return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "INVALID_PAYMENT_METHOD",
                    new[] { new ErrorItem("paymentMethod", "Ph??ng th?c thanh toán không h?p l?", "INVALID_PAYMENT_METHOD") }, 400));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating checkout");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR",
                    new[] { new ErrorItem("server", "L?i không mong ??i", "INTERNAL_ERROR") }, 500));
            }
        }

        private decimal CalculateShippingFee(decimal subTotal)
        {
            // Mi?n phí v?n chuy?n cho ??n hàng >= 500,000 VND
            return subTotal >= 500000 ? 0 : 30000;
        }

        private async Task<string> GenerateOrderNumber()
        {
            var today = DateTime.UtcNow.ToString("yyyyMMdd");
            var lastOrder = await _context.Orders
                .Where(o => o.OrderNumber.StartsWith($"ORD{today}"))
                .OrderByDescending(o => o.OrderNumber)
                .FirstOrDefaultAsync();
            
            var seq = 1;
            if (lastOrder != null)
            {
                var tail = lastOrder.OrderNumber.Substring(11);
                if (int.TryParse(tail, out var parsed))
                {
                    seq = parsed + 1;
                }
            }
            
            return $"ORD{today}{seq:D4}";
        }
    }

    public class CheckoutRequest
    {
        [Required(ErrorMessage = "Ph??ng th?c thanh toán là b?t bu?c")]
        public string PaymentMethod { get; set; } = string.Empty;

        [Required(ErrorMessage = "??a ch? giao hàng là b?t bu?c")]
        public AddressDto ShippingAddress { get; set; } = null!;

        public AddressDto? BillingAddress { get; set; }
    }

    public class CheckoutResponse
    {
        public string Status { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public string? PaymentUrl { get; set; }
        public Guid? OrderId { get; set; }
        public Guid? TransactionId { get; set; }
        public OrderDto? Order { get; set; }
    }
}
