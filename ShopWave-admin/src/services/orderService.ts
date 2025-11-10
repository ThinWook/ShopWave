import { api } from "../utils/apiClient";
import type { GetOrdersParams, Order, OrdersAdminResponse, OrderDetail } from "../types/order";

function buildQuery(params: GetOrdersParams = {}): string {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.pageSize) q.set("pageSize", String(params.pageSize));
  if (params.searchTerm) q.set("searchTerm", params.searchTerm);
  if (params.status && params.status !== "ALL") q.set("status", params.status);
  if (params.paymentStatus && params.paymentStatus !== "ALL") q.set("paymentStatus", params.paymentStatus);
  if (params.dateFrom) q.set("dateFrom", params.dateFrom);
  if (params.dateTo) q.set("dateTo", params.dateTo);
  return q.toString();
}

/**
 * ✅ GỌI API DUY NHẤT - Backend trả về TẤT CẢ (stats, orders, pagination)
 * Không cần gọi riêng getOrderStats() hay countOrders() nữa!
 */
export async function getOrders(params: GetOrdersParams = {}): Promise<OrdersAdminResponse> {
  const qs = buildQuery(params);
  const res = await api.raw(`/api/v1/admin/orders${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw await toApiError(res);
  
  const json = await res.json();
  const data = json?.data ?? json; // support envelope
  
  // 1️⃣ Parse Stats (từ backend)
  const statsRaw = data?.stats ?? {};
  const stats = {
    newOrdersCount: Number(statsRaw.newOrdersCount ?? 0),
    readyToShipCount: Number(statsRaw.readyToShipCount ?? 0),
    todaysRevenue: Number(statsRaw.todaysRevenue ?? 0),
    pendingPaymentCount: Number(statsRaw.pendingPaymentCount ?? 0),
  };
  
  // 2️⃣ Parse Orders (từ backend)
  const ordersRaw: unknown[] = Array.isArray(data?.orders) ? data.orders : [];
  const orders: Order[] = ordersRaw.map(normalizeOrder);
  
  // 3️⃣ Parse Pagination (từ backend)
  const paginationRaw = data?.pagination ?? {};
  const pagination = {
    currentPage: Number(paginationRaw.currentPage ?? params.page ?? 1),
    pageSize: Number(paginationRaw.pageSize ?? params.pageSize ?? orders.length),
    totalRecords: Number(paginationRaw.totalRecords ?? orders.length),
    totalPages: Number(paginationRaw.totalPages ?? 1),
  };
  
  return { stats, orders, pagination };
}

function get(obj: any, key: string): unknown { return obj?.[key]; }
function getString(obj: any, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = get(obj, k);
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}
function getNumber(obj: any, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = get(obj, k);
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") { const n = Number(v); if (Number.isFinite(n)) return n; }
  }
  return undefined;
}

export function normalizeOrder(raw: any): Order {
  const id = getString(raw, "id", "_id", "orderId") ?? String(getNumber(raw, "id", "orderId") ?? cryptoRandomId());
  const orderNumber = getString(raw, "orderNumber", "OrderNumber", "code", "number") ?? id;
  const shippingFullName = getString(raw, "shippingFullName", "ShippingFullName", "customerName", "recipientName") ?? "Khách lẻ";
  const orderDate = getString(raw, "orderDate", "OrderDate", "createdAt", "created_at") ?? new Date().toISOString();
  const totalAmount = getNumber(raw, "totalAmount", "TotalAmount", "total", "amount") ?? 0;
  const paymentStatus = (getString(raw, "paymentStatus", "PaymentStatus") ?? "UNPAID") as Order["paymentStatus"];
  const status = (getString(raw, "status", "Status") ?? "PROCESSING") as Order["status"];
  return { id, orderNumber, shippingFullName, orderDate, totalAmount, paymentStatus, status };
}

async function toApiError(res: Response) {
  let message = res.statusText;
  try {
    const data = await res.json();
    if (data && typeof data === "object") message = (data as any).message ?? (data as any).title ?? message;
  } catch { /* ignore */ }
  const err = new Error(message) as Error & { status?: number };
  err.status = res.status;
  return err;
}

function cryptoRandomId(): string {
  try {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return String(Math.random()).slice(2);
  }
}

/**
 * ✅ LẤY CHI TIẾT ĐỌN HÀNG
 * GET /api/v1/admin/orders/{id}
 */
export async function getOrderDetail(orderId: string): Promise<OrderDetail> {
  // 🔍 Validation: Kiểm tra orderId hợp lệ
  if (!orderId || orderId === ":id" || orderId.trim() === "") {
    throw new Error("Order ID không hợp lệ");
  }
  
  // 🐛 Debug: Log URL đang gọi
  console.log(`[OrderService] Fetching order detail: /api/v1/admin/orders/${orderId}`);
  
  const res = await api.raw(`/api/v1/admin/orders/${orderId}`);
  if (!res.ok) throw await toApiError(res);
  
  const json = await res.json();
  const data = json?.data ?? json;
  
  // 🐛 Debug: Log raw data từ API
  console.log("[OrderService] Raw API response:", data);
  console.log("[OrderService] shippingAddress object:", data?.shippingAddress);
  console.log("[OrderService] billingAddress object:", data?.billingAddress);
  console.log("[OrderService] orderItems array:", data?.orderItems);
  console.log("[OrderService] transactions array:", data?.transactions);
  
  const normalized = normalizeOrderDetail(data);
  
  // 🐛 Debug: Log normalized data
  console.log("[OrderService] Normalized order:", {
    customerName: normalized.customerName,
    customerEmail: normalized.customerEmail,
    customerPhone: normalized.customerPhone,
    shippingAddress: normalized.shippingAddress,
    shippingWard: normalized.shippingWard,
    shippingDistrict: normalized.shippingDistrict,
    shippingCity: normalized.shippingCity,
    itemsCount: normalized.items.length,
    items: normalized.items,
    transactionsCount: normalized.transactions.length,
    transactions: normalized.transactions,
  });
  
  return normalized;
}

function normalizeOrderDetail(raw: any): OrderDetail {
  const id = getString(raw, "id", "_id", "orderId") ?? String(getNumber(raw, "id", "orderId") ?? cryptoRandomId());
  const orderNumber = getString(raw, "orderNumber", "OrderNumber") ?? id;
  const orderDate = getString(raw, "orderDate", "OrderDate", "createdAt") ?? new Date().toISOString();
  const status = (getString(raw, "status", "Status") ?? "PROCESSING") as OrderDetail["status"];
  const paymentStatus = (getString(raw, "paymentStatus", "PaymentStatus") ?? "UNPAID") as OrderDetail["paymentStatus"];
  
  // 🔍 Đọc từ object lồng nhau: shippingAddress
  const shippingAddressObj = raw?.shippingAddress ?? raw?.ShippingAddress ?? {};
  
  // Thông tin khách hàng (từ shippingAddress)
  const customerName = getString(shippingAddressObj, "fullName", "FullName") 
    ?? getString(raw, "customerName", "CustomerName", "shippingFullName", "ShippingFullName") 
    ?? "Khách lẻ";
  const customerEmail = getString(shippingAddressObj, "email", "Email") 
    ?? getString(raw, "customerEmail", "CustomerEmail") 
    ?? "";
  const customerPhone = getString(shippingAddressObj, "phone", "Phone") 
    ?? getString(raw, "customerPhone", "CustomerPhone") 
    ?? "";
  
  // Địa chỉ giao hàng (từ shippingAddress object)
  const shippingAddress = getString(shippingAddressObj, "street", "Street") 
    ?? getString(raw, "shippingAddress", "ShippingAddress") 
    ?? "";
  const shippingWard = getString(shippingAddressObj, "ward", "Ward") 
    ?? getString(raw, "shippingWard", "ShippingWard") 
    ?? "";
  const shippingDistrict = getString(shippingAddressObj, "district", "District") 
    ?? getString(raw, "shippingDistrict", "ShippingDistrict") 
    ?? "";
  const shippingCity = getString(shippingAddressObj, "province", "Province", "city", "City") 
    ?? getString(raw, "shippingCity", "ShippingCity", "shippingProvince", "ShippingProvince") 
    ?? "";
  const shippingNotes = getString(shippingAddressObj, "notes", "Notes") 
    ?? getString(raw, "shippingNotes", "ShippingNotes") 
    ?? null;
  
  // 🔍 Đọc từ object lồng nhau: billingAddress
  const billingAddressObj = raw?.billingAddress ?? raw?.BillingAddress;
  
  // Địa chỉ thanh toán (nếu có billingAddress object riêng)
  const billingAddress = billingAddressObj 
    ? (getString(billingAddressObj, "street", "Street") ?? null)
    : (getString(raw, "billingAddress", "BillingAddress") ?? null);
  const billingWard = billingAddressObj 
    ? (getString(billingAddressObj, "ward", "Ward") ?? null)
    : (getString(raw, "billingWard", "BillingWard") ?? null);
  const billingDistrict = billingAddressObj 
    ? (getString(billingAddressObj, "district", "District") ?? null)
    : (getString(raw, "billingDistrict", "BillingDistrict") ?? null);
  const billingCity = billingAddressObj 
    ? (getString(billingAddressObj, "province", "Province", "city", "City") ?? null)
    : (getString(raw, "billingCity", "BillingCity", "billingProvince", "BillingProvince") ?? null);
  
  // Tài chính
  const subTotal = getNumber(raw, "subTotal", "SubTotal") ?? 0;
  const shippingFee = getNumber(raw, "shippingFee", "ShippingFee") ?? 0;
  const progressiveDiscountAmount = getNumber(raw, "progressiveDiscountAmount", "ProgressiveDiscountAmount") ?? 0;
  const voucherDiscountAmount = getNumber(raw, "voucherDiscountAmount", "VoucherDiscountAmount") ?? 0;
  const voucherCode = getString(raw, "voucherCode", "VoucherCode") ?? null;
  const totalAmount = getNumber(raw, "totalAmount", "TotalAmount") ?? 0;
  
  // Items (từ orderItems array từ backend)
  const itemsRaw = Array.isArray(raw?.orderItems) 
    ? raw.orderItems 
    : (Array.isArray(raw?.OrderItems) 
      ? raw.OrderItems 
      : (Array.isArray(raw?.items) 
        ? raw.items 
        : (Array.isArray(raw?.Items) ? raw.Items : [])));
  
  const items = itemsRaw.map((item: any) => {
    // Parse selectedOptions từ array hoặc JSON string
    let parsedOptions = "[]";
    if (Array.isArray(item?.selectedOptions)) {
      // Backend trả về array of objects: [{ name, value }]
      parsedOptions = JSON.stringify(
        item.selectedOptions.map((opt: any) => ({
          optionName: opt.name ?? opt.Name ?? opt.optionName ?? opt.OptionName ?? "",
          optionValue: opt.value ?? opt.Value ?? opt.optionValue ?? opt.OptionValue ?? "",
        }))
      );
    } else if (typeof item?.selectedOptions === "string") {
      parsedOptions = item.selectedOptions;
    } else if (Array.isArray(item?.SelectedOptions)) {
      parsedOptions = JSON.stringify(
        item.SelectedOptions.map((opt: any) => ({
          optionName: opt.name ?? opt.Name ?? opt.optionName ?? opt.OptionName ?? "",
          optionValue: opt.value ?? opt.Value ?? opt.optionValue ?? opt.OptionValue ?? "",
        }))
      );
    }

    return {
      id: getString(item, "id", "_id", "Id") ?? cryptoRandomId(),
      productId: getString(item, "productId", "ProductId") ?? "",
      productName: getString(item, "productName", "ProductName") ?? "",
      variantId: getString(item, "variantId", "VariantId") ?? null,
      variantSku: getString(item, "variantSku", "VariantSku", "sku", "Sku") ?? null,
      variantImageUrl: getString(item, "variantImageUrl", "VariantImageUrl", "imageUrl", "ImageUrl") ?? null,
      selectedOptions: parsedOptions,
      priceAtPurchase: getNumber(item, "priceAtPurchase", "PriceAtPurchase", "unitPrice", "UnitPrice", "price", "Price") ?? 0,
      quantity: getNumber(item, "quantity", "Quantity") ?? 1,
      totalPrice: getNumber(item, "totalPrice", "TotalPrice") ?? 0,
    };
  });
  
  // Transactions
  const transactionsRaw = Array.isArray(raw?.transactions) ? raw.transactions : (Array.isArray(raw?.Transactions) ? raw.Transactions : []);
  const transactions = transactionsRaw.map((tx: any) => ({
    id: getString(tx, "id", "_id") ?? cryptoRandomId(),
    gateway: (getString(tx, "gateway", "Gateway") ?? "COD") as OrderDetail["transactions"][0]["gateway"],
    gatewayTransactionId: getString(tx, "gatewayTransactionId", "GatewayTransactionId") ?? null,
    status: (getString(tx, "status", "Status") ?? "PENDING") as OrderDetail["transactions"][0]["status"],
    amount: getNumber(tx, "amount", "Amount") ?? 0,
    createdAt: getString(tx, "createdAt", "CreatedAt") ?? new Date().toISOString(),
    gatewayResponse: getString(tx, "gatewayResponse", "GatewayResponse") ?? null,
    errorMessage: getString(tx, "errorMessage", "ErrorMessage") ?? null,
  }));
  
  return {
    id,
    orderNumber,
    orderDate,
    status,
    paymentStatus,
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    shippingWard,
    shippingDistrict,
    shippingCity,
    shippingNotes,
    billingAddress,
    billingWard,
    billingDistrict,
    billingCity,
    subTotal,
    shippingFee,
    progressiveDiscountAmount,
    voucherDiscountAmount,
    voucherCode,
    totalAmount,
    items,
    transactions,
  };
}

/**
 * Convert UPPER_CASE status to PascalCase format expected by backend
 * PENDING_PAYMENT -> PendingPayment
 * SHIPPED -> Shipped
 */
function convertStatusToPascalCase(status: string): string {
  // Handle underscore case: PENDING_PAYMENT -> PendingPayment
  if (status.includes('_')) {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
  // Handle single word: SHIPPED -> Shipped
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

/**
 * ✅ CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
 * PUT /api/v1/admin/orders/{id}/status
 */
export async function updateOrderStatus(orderId: string, status: OrderDetail["status"]): Promise<void> {
  // 🔍 Validation
  if (!orderId || orderId === ":id") {
    throw new Error("Order ID không hợp lệ");
  }
  if (!status) {
    throw new Error("Status không được để trống");
  }

  // Convert status format for backend (SHIPPED -> Shipped, PENDING_PAYMENT -> PendingPayment)
  const backendStatus = convertStatusToPascalCase(status);

  // 🐛 Debug log
  console.log(`[OrderService] Updating order status: ${orderId} -> ${status}`);
  console.log(`[OrderService] Converted to PascalCase: ${backendStatus}`);
  console.log(`[OrderService] Request body:`, { newStatus: backendStatus });

  const res = await api.raw(`/api/v1/admin/orders/${orderId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    // Backend expects "newStatus" field (based on UpdateOrderStatusDto)
    body: JSON.stringify({ newStatus: backendStatus }),
  });
  
  if (!res.ok) {
    console.error(`[OrderService] Update status failed:`, await res.text());
    throw await toApiError(res);
  }
  
  console.log(`[OrderService] Update status success`);
}

/**
 * ✅ CẬP NHẬT TRẠNG THÁI THANH TOÁN
 * PUT /api/v1/admin/orders/{id}/payment-status
 */
export async function updateOrderPaymentStatus(orderId: string, paymentStatus: OrderDetail["paymentStatus"]): Promise<void> {
  // 🔍 Validation
  if (!orderId || orderId === ":id") {
    throw new Error("Order ID không hợp lệ");
  }
  if (!paymentStatus) {
    throw new Error("Payment status không được để trống");
  }

  // Convert payment status format for backend (UNPAID -> Unpaid, PAID -> Paid)
  const backendPaymentStatus = convertStatusToPascalCase(paymentStatus);

  // 🐛 Debug log
  console.log(`[OrderService] Updating payment status: ${orderId} -> ${paymentStatus}`);
  console.log(`[OrderService] Converted to PascalCase: ${backendPaymentStatus}`);
  console.log(`[OrderService] Request body:`, { newPaymentStatus: backendPaymentStatus });

  const res = await api.raw(`/api/v1/admin/orders/${orderId}/payment-status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    // Backend expects "newPaymentStatus" field (based on UpdatePaymentStatusDto)
    body: JSON.stringify({ newPaymentStatus: backendPaymentStatus }),
  });
  
  if (!res.ok) {
    console.error(`[OrderService] Update payment status failed:`, await res.text());
    throw await toApiError(res);
  }
  
  console.log(`[OrderService] Update payment status success`);
}
