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

        public CheckoutController(
            ShopWaveDbContext context,
            ILogger<CheckoutController> logger,
            IPaymentGatewayService paymentGatewayService)
        {
            _context = context;
            _logger = logger;
            _paymentGatewayService = paymentGatewayService;
        }

        /// <summary>
        /// API Chính: T?o ??n hàng (POST /api/v1/checkout)
        /// Client g?i API này khi nh?n nút "Hoàn t?t ??n hàng"
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateCheckout([FromBody] CheckoutRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. L?Y THÔNG TIN NG??I DÙNG
                var uid = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
                if (!Guid.TryParse(uid, out var userId))
                {
                    return Unauthorized(EnvelopeBuilder.Fail<object>(HttpContext, "UNAUTHORIZED", 
                        new[] { new ErrorItem("auth", "Vui lòng ??ng nh?p", "UNAUTHORIZED") }, 401));
                }

                // 2. L?Y GI? HÀNG
                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                        .ThenInclude(ci => ci.ProductVariant)
                            .ThenInclude(v => v.Product)
                    .Include(c => c.AppliedDiscounts)
                        .ThenInclude(ad => ad.Discount)
                    .FirstOrDefaultAsync(c => c.UserId == userId);

                if (cart == null || !cart.CartItems.Any())
                {
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
                
                // Áp d?ng gi?m giá t? voucher n?u có (tính toán t? AppliedDiscounts)
                decimal voucherDiscount = 0;
                foreach (var appliedDiscount in cart.AppliedDiscounts)
                {
                    var discount = appliedDiscount.Discount;
                    if (discount.IsActive && subTotal >= discount.MinOrderAmount)
                    {
                        decimal discountAmount = discount.DiscountType == DiscountType.PERCENTAGE
                            ? subTotal * (discount.DiscountValue / 100)
                            : discount.DiscountValue;
                        
                        voucherDiscount += discountAmount;
                    }
                }

                var totalAmount = subTotal + shippingFee - voucherDiscount;
                var orderNumber = await GenerateOrderNumber();

                // 4. T?O ??N HÀNG (Order) VÀ CÁC M?C (OrderItems)
                var order = new Order
                {
                    UserId = userId,
                    OrderNumber = orderNumber,
                    TotalAmount = totalAmount,
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
                    var orderItem = new OrderItem
                    {
                        OrderId = order.Id,
                        ProductVariantId = cartItem.ProductVariantId,
                        ProductName = cartItem.ProductVariant.Product.Name,
                        Quantity = cartItem.Quantity,
                        UnitPrice = cartItem.UnitPrice,
                        TotalPrice = cartItem.Quantity * cartItem.UnitPrice,
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
                if (request.PaymentMethod == "VNPAY" || request.PaymentMethod == "MOMO")
                {
                    // T?O GIAO D?CH (Transaction)
                    var transaction_record = new Transaction
                    {
                        OrderId = order.Id,
                        Gateway = request.PaymentMethod,
                        Amount = order.TotalAmount,
                        Status = "PENDING",
                        GatewayTransactionId = null,
                        IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Transactions.Add(transaction_record);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    // G?i SDK c?a c?ng thanh toán
                    var returnUrl = $"{Request.Scheme}://{Request.Host}/checkout/payment-return";
                    var paymentUrl = await _paymentGatewayService.CreatePaymentUrl(
                        request.PaymentMethod,
                        order,
                        transaction_record.Id,
                        returnUrl
                    );

                    var response = new CheckoutResponse
                    {
                        Status = "OK",
                        PaymentMethod = request.PaymentMethod,
                        PaymentUrl = paymentUrl
                    };

                    return Ok(EnvelopeBuilder.Ok(HttpContext, "PAYMENT_URL_GENERATED", response));
                }

                // === K?CH B?N A: THANH TOÁN KHI NH?N HÀNG (COD) ===
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

                    // G?I EMAIL/SMS XÁC NH?N (TODO: Implement email service)
                    _logger.LogInformation("Order {OrderNumber} created successfully for user {UserId}. Email confirmation should be sent.", 
                        order.OrderNumber, userId);
                    // await _emailService.SendOrderConfirmationAsync(order);

                    var response = new CheckoutResponse
                    {
                        Status = "OK",
                        PaymentMethod = "COD",
                        Order = new OrderDto
                        {
                            Id = order.Id,
                            OrderNumber = order.OrderNumber,
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
                                TotalPrice = oi.TotalPrice
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
        public string PaymentMethod { get; set; } = string.Empty; // "COD", "VNPAY", "MOMO"

        [Required(ErrorMessage = "??a ch? giao hàng là b?t bu?c")]
        public AddressDto ShippingAddress { get; set; } = null!;

        public AddressDto? BillingAddress { get; set; }
    }

    public class CheckoutResponse
    {
        public string Status { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public string? PaymentUrl { get; set; }
        public OrderDto? Order { get; set; }
    }
}
