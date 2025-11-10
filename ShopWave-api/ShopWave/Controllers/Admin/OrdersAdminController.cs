using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopWave.Models;
using ShopWave.DTOs.Admin;
using ShopWave.Models.Responses;
using ShopWave.Models.DTOs;
using System.Text.Json;

namespace ShopWave.Controllers.Admin
{
    [ApiController]
    [Route("api/v1/admin/orders")]
    [Authorize(Roles = "Admin")]
    public class OrdersAdminController : ControllerBase
    {
        private readonly ShopWaveDbContext _context;
        private readonly ILogger<OrdersAdminController> _logger;

        public OrdersAdminController(ShopWaveDbContext context, ILogger<OrdersAdminController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get admin order dashboard with statistics and paginated order list
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Items per page (default: 10)</param>
        /// <param name="status">Filter by order status (e.g., "PROCESSING", "SHIPPED")</param>
        /// <param name="paymentStatus">Filter by payment status (e.g., "PAID", "UNPAID")</param>
        /// <param name="search">Search by order number or customer name</param>
        /// <returns>Dashboard data with stats and orders</returns>
        [HttpGet]
        public async Task<IActionResult> GetAdminDashboard(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = null,
            [FromQuery] string? paymentStatus = null,
            [FromQuery] string? search = null)
        {
            try
            {
                // === 1. CALCULATE OVERVIEW STATS ===
                // These stats are typically not affected by filters
                
                var today = DateTime.UtcNow.Date;
                
                var stats = new AdminOrderStatsDto
                {
                    // Today's revenue from PAID orders
                    TodaysRevenue = await _context.Orders
                        .Where(o => o.OrderDate.Date == today && o.PaymentStatus == "PAID")
                        .SumAsync(o => o.TotalAmount),
                    
                    // Orders ready to ship (PROCESSING status)
                    ReadyToShipCount = await _context.Orders
                        .CountAsync(o => o.Status == "PROCESSING"),
                    
                    // Orders with pending payment issues
                    PendingPaymentCount = await _context.Orders
                        .CountAsync(o => o.Status == "PENDING_PAYMENT")
                };
                
                // New orders count = Ready to ship + Pending payment
                stats.NewOrdersCount = stats.ReadyToShipCount + stats.PendingPaymentCount;

                // === 2. BUILD QUERY FOR ORDER TABLE ===
                IQueryable<Order> query = _context.Orders.AsNoTracking();

                // 2a. Apply Status Filter
                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(o => o.Status == status);
                }

                // 2b. Apply Payment Status Filter
                if (!string.IsNullOrEmpty(paymentStatus))
                {
                    query = query.Where(o => o.PaymentStatus == paymentStatus);
                }

                // 2c. Apply Search (by order number or customer name)
                if (!string.IsNullOrEmpty(search))
                {
                    var searchLower = search.ToLower();
                    query = query.Where(o =>
                        o.OrderNumber.ToLower().Contains(searchLower) ||
                        o.ShippingFullName.ToLower().Contains(searchLower)
                    );
                }

                // 2d. Sort by newest first
                query = query.OrderByDescending(o => o.OrderDate);

                // === 3. EXECUTE PAGINATION ===
                var totalItems = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

                var orders = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // === 4. MAP TO DTOs ===
                var orderDtos = orders.Select(o => new AdminOrderListDto
                {
                    Id = o.Id,
                    OrderNumber = o.OrderNumber,
                    CustomerName = o.ShippingFullName, // Using flat field
                    OrderDate = o.OrderDate,
                    TotalAmount = o.TotalAmount,
                    PaymentStatus = o.PaymentStatus ?? "UNKNOWN",
                    Status = o.Status
                }).ToList();

                // === 5. CREATE COMPLETE RESPONSE ===
                var response = new AdminOrderDashboardDto
                {
                    Stats = stats,
                    Pagination = new PaginationMeta
                    {
                        CurrentPage = page,
                        PageSize = pageSize,
                        TotalItems = totalItems,
                        TotalPages = totalPages
                    },
                    Orders = orderDtos
                };

                return Ok(EnvelopeBuilder.Ok(HttpContext, "ADMIN_ORDERS_RETRIEVED", response));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving admin order dashboard");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(
                    HttpContext,
                    "INTERNAL_ERROR",
                    new[] { new ErrorItem("server", "Error retrieving orders", "INTERNAL_ERROR") },
                    500
                ));
            }
        }

        /// <summary>
        /// Get detailed information about a specific order
        /// </summary>
        /// <param name="id">Order ID</param>
        /// <returns>Complete order details with items, customer info, and transaction history</returns>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrderById(Guid id)
        {
            try
            {
                // 1. QUERY DATABASE - Include related data
                var order = await _context.Orders
                    .Include(o => o.OrderItems)    // Load order items
                    .Include(o => o.Transactions)  // Load transaction history
                    .AsNoTracking() // Performance optimization for read-only query
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(
                        HttpContext,
                        "NOT_FOUND",
                        new[] { new ErrorItem("id", "??n hàng không t?n t?i", "NOT_FOUND") },
                        404
                    ));
                }

                // 2. MAP TO DTO - Transform entity to response DTO
                var orderDto = new AdminOrderDetailDto
                {
                    Id = order.Id,
                    OrderNumber = order.OrderNumber,
                    OrderDate = order.OrderDate,
                    Status = order.Status,
                    PaymentMethod = order.PaymentMethod,
                    PaymentStatus = order.PaymentStatus,

                    // === SNAPSHOT PRICE BREAKDOWN ===
                    SubTotal = order.SubTotal,
                    ShippingFee = order.ShippingFee,
                    ProgressiveDiscountAmount = order.ProgressiveDiscountAmount,
                    VoucherDiscountAmount = order.VoucherDiscountAmount,
                    VoucherCode = order.VoucherCode,
                    TotalAmount = order.TotalAmount,

                    // === MAP FLATTENED ADDRESSES ===
                    ShippingAddress = new AdminOrderShippingAddressDto
                    {
                        FullName = order.ShippingFullName,
                        Phone = order.ShippingPhone,
                        Street = order.ShippingStreet,
                        Ward = order.ShippingWard,
                        District = order.ShippingDistrict,
                        Province = order.ShippingProvince,
                        Notes = order.ShippingNotes
                    },
                    
                    // Billing address (optional)
                    BillingAddress = !string.IsNullOrEmpty(order.BillingFullName) 
                        ? new AdminOrderBillingAddressDto
                        {
                            FullName = order.BillingFullName,
                            Phone = order.BillingPhone,
                            Street = order.BillingStreet,
                            Ward = order.BillingWard,
                            District = order.BillingDistrict,
                            Province = order.BillingProvince,
                            Notes = order.BillingNotes
                        }
                        : null,

                    // === MAP ORDER ITEMS WITH SNAPSHOT DATA ===
                    OrderItems = order.OrderItems.Select(item => new AdminOrderItemDto
                    {
                        Id = item.Id,
                        ProductName = item.ProductName, // Snapshot from order time
                        VariantImageUrl = item.VariantImageUrl, // Snapshot from order time
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice, // Snapshot from order time
                        TotalPrice = item.TotalPrice,
                        
                        // === DESERIALIZE SELECTED OPTIONS JSON ===
                        // Converts string "[{\"name\":\"Size\",\"value\":\"XL\"}]" to List<SelectedOptionDto>
                        SelectedOptions = DeserializeSelectedOptions(item.SelectedOptions)
                    }).ToList(),

                    // === MAP TRANSACTION HISTORY ===
                    Transactions = order.Transactions.Select(tx => new AdminTransactionDto
                    {
                        Id = tx.Id,
                        Gateway = tx.Gateway,
                        GatewayTransactionId = tx.GatewayTransactionId,
                        Amount = tx.Amount,
                        Status = tx.Status,
                        ErrorMessage = tx.ErrorMessage,
                        GatewayResponse = tx.GatewayResponse, // Full JSON for debugging
                        CreatedAt = tx.CreatedAt
                    }).ToList()
                };

                // 3. RETURN COMPLETE RESPONSE
                return Ok(EnvelopeBuilder.Ok(HttpContext, "ORDER_DETAIL_RETRIEVED", orderDto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving order {OrderId} for admin", id);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(
                    HttpContext,
                    "INTERNAL_ERROR",
                    new[] { new ErrorItem("server", "L?i khi truy xu?t ??n hàng", "INTERNAL_ERROR") },
                    500
                ));
            }
        }

        /// <summary>
        /// Helper method to safely deserialize SelectedOptions JSON string
        /// </summary>
        private List<SelectedOptionDto>? DeserializeSelectedOptions(string? json)
        {
            if (string.IsNullOrEmpty(json))
                return null;

            try
            {
                var options = JsonSerializer.Deserialize<List<SelectedOptionDto>>(
                    json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );
                return options;
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize SelectedOptions: {Json}", json);
                return null;
            }
        }

        /// <summary>
        /// Update order status (e.g., mark as PROCESSING, SHIPPED, DELIVERED)
        /// </summary>
        /// <param name="id">Order ID</param>
        /// <param name="request">Status update request</param>
        /// <returns>Success response</returns>
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);
                if (order == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(
                        HttpContext,
                        "NOT_FOUND",
                        new[] { new ErrorItem("id", "Order not found", "NOT_FOUND") },
                        404
                    ));
                }

                // Validate status transition
                var validStatuses = new[] { "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED" };
                if (!validStatuses.Contains(request.Status))
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(
                        HttpContext,
                        "INVALID_STATUS",
                        new[] { new ErrorItem("status", "Invalid order status", "INVALID_STATUS") },
                        400
                    ));
                }

                order.Status = request.Status;
                order.UpdatedAt = DateTime.UtcNow;

                // Update tracking dates
                if (request.Status == "SHIPPED" && !order.ShippedDate.HasValue)
                {
                    order.ShippedDate = DateTime.UtcNow;
                }
                else if (request.Status == "DELIVERED" && !order.DeliveredDate.HasValue)
                {
                    order.DeliveredDate = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Order {OrderNumber} status updated to {Status} by admin", order.OrderNumber, request.Status);

                return Ok(EnvelopeBuilder.Ok(HttpContext, "ORDER_STATUS_UPDATED", new { orderId = id, newStatus = request.Status }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating order status for {OrderId}", id);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(
                    HttpContext,
                    "INTERNAL_ERROR",
                    new[] { new ErrorItem("server", "Error updating order status", "INTERNAL_ERROR") },
                    500
                ));
            }
        }

        /// <summary>
        /// Update payment status of an order (e.g., mark as PAID, UNPAID, REFUNDED)
        /// This endpoint allows admin to manually update payment status
        /// </summary>
        /// <param name="id">Order ID</param>
        /// <param name="dto">Payment status update request</param>
        /// <returns>Success response with updated payment status</returns>
        [HttpPut("{id}/payment-status")]
        public async Task<IActionResult> UpdatePaymentStatus(Guid id, [FromBody] UpdatePaymentStatusDto dto)
        {
            try
            {
                // 1. Validate DTO
                if (string.IsNullOrWhiteSpace(dto.NewPaymentStatus))
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(
                        HttpContext,
                        "INVALID_REQUEST",
                        new[] { new ErrorItem("newPaymentStatus", "Tr?ng thái thanh toán là b?t bu?c", "REQUIRED") },
                        400
                    ));
                }

                // 2. Find Order
                var order = await _context.Orders
                    .Include(o => o.Transactions)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(
                        HttpContext,
                        "NOT_FOUND",
                        new[] { new ErrorItem("id", "Không tìm th?y ??n hàng", "NOT_FOUND") },
                        404
                    ));
                }

                // 3. Validate payment status value
                var validPaymentStatuses = new[] { "PAID", "UNPAID", "PENDING", "REFUNDED", "FAILED" };
                if (!validPaymentStatuses.Contains(dto.NewPaymentStatus.ToUpper()))
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(
                        HttpContext,
                        "INVALID_PAYMENT_STATUS",
                        new[] { new ErrorItem("newPaymentStatus", 
                            $"Tr?ng thái thanh toán không h?p l?. Cho phép: {string.Join(", ", validPaymentStatuses)}", 
                            "INVALID_VALUE") },
                        400
                    ));
                }

                // Store old status for logging
                var oldPaymentStatus = order.PaymentStatus;
                
                // 4. Update Payment Status
                order.PaymentStatus = dto.NewPaymentStatus.ToUpper();
                order.UpdatedAt = DateTime.UtcNow;

                // 5. Business logic based on status change
                if (dto.NewPaymentStatus.ToUpper() == "PAID")
                {
                    // If payment is confirmed as PAID and order is still PENDING_PAYMENT
                    if (order.Status == "PENDING_PAYMENT")
                    {
                        order.Status = "PROCESSING";
                        _logger.LogInformation("Order {OrderNumber} status automatically changed to PROCESSING after payment confirmation", 
                            order.OrderNumber);
                    }

                    // Update related transaction status if exists
                    var pendingTransaction = order.Transactions
                        .OrderByDescending(t => t.CreatedAt)
                        .FirstOrDefault(t => t.Status == "PENDING");
                    
                    if (pendingTransaction != null)
                    {
                        pendingTransaction.Status = "SUCCESS";
                        pendingTransaction.CompletedAt = DateTime.UtcNow;
                        pendingTransaction.UpdatedAt = DateTime.UtcNow;
                        _logger.LogInformation("Transaction {TransactionId} marked as SUCCESS", pendingTransaction.Id);
                    }
                }
                else if (dto.NewPaymentStatus.ToUpper() == "REFUNDED")
                {
                    // Add refund logic here if needed
                    // e.g., restore stock, create refund transaction record, etc.
                    _logger.LogInformation("Order {OrderNumber} payment status changed to REFUNDED", order.OrderNumber);
                }

                // 6. Save changes
                await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "Order {OrderNumber} payment status updated from {OldStatus} to {NewStatus} by admin",
                    order.OrderNumber,
                    oldPaymentStatus ?? "null",
                    order.PaymentStatus
                );

                // 7. Return success response
                return Ok(EnvelopeBuilder.Ok(
                    HttpContext,
                    "PAYMENT_STATUS_UPDATED",
                    new
                    {
                        orderId = id,
                        orderNumber = order.OrderNumber,
                        oldPaymentStatus = oldPaymentStatus,
                        newPaymentStatus = order.PaymentStatus,
                        orderStatus = order.Status
                    }
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating payment status for order {OrderId}", id);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(
                    HttpContext,
                    "INTERNAL_ERROR",
                    new[] { new ErrorItem("server", "L?i khi c?p nh?t tr?ng thái thanh toán", "INTERNAL_ERROR") },
                    500
                ));
            }
        }
    }

    /// <summary>
    /// Request model for updating order status
    /// </summary>
    public class UpdateOrderStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request model for updating payment status
    /// </summary>
    public class UpdatePaymentStatusDto
    {
        public string NewPaymentStatus { get; set; } = string.Empty;
    }
}
