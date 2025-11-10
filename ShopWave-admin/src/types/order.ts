export type PaymentStatus = 'PAID' | 'UNPAID';

export type OrderStatus =
  | 'PROCESSING'
  | 'PENDING_PAYMENT'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED';

export type Order = {
  id: string;
  orderNumber: string; // Orders.OrderNumber
  shippingFullName: string; // Orders.ShippingFullName
  orderDate: string; // ISO string
  totalAmount: number; // Orders.TotalAmount
  paymentStatus: PaymentStatus; // Orders.PaymentStatus
  status: OrderStatus; // Orders.Status
};

export type GetOrdersParams = {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: OrderStatus | 'ALL';
  paymentStatus?: PaymentStatus | 'ALL';
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
};

export type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type OrderStats = {
  newOrdersCount: number; // PROCESSING + PENDING_PAYMENT
  readyToShipCount: number; // PROCESSING
  todaysRevenue: number; // sum TotalAmount today
  pendingPaymentCount: number; // PENDING_PAYMENT
};

// Response from GET /api/v1/admin/orders (bao gồm cả stats, orders, và pagination)
export type OrdersAdminResponse = {
  stats: OrderStats;
  orders: Order[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
  };
};

// ==================== Chi tiết Đơn hàng (Order Detail) ====================

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  variantId: string | null;
  variantSku: string | null;
  variantImageUrl: string | null;
  selectedOptions: string; // JSON string: [{optionName, optionValue}]
  priceAtPurchase: number; // snapshot giá tại thời điểm mua
  quantity: number;
  totalPrice: number; // priceAtPurchase * quantity
};

export type OrderTransaction = {
  id: string;
  gateway: 'COD' | 'VNPAY' | 'MOMO';
  gatewayTransactionId: string | null;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  amount: number;
  createdAt: string; // ISO string
  gatewayResponse: string | null; // JSON string
  errorMessage: string | null;
};

export type OrderDetail = {
  // Thông tin cơ bản
  id: string;
  orderNumber: string;
  orderDate: string; // ISO string
  status: OrderStatus;
  paymentStatus: PaymentStatus;

  // Thông tin khách hàng
  customerName: string;
  customerEmail: string;
  customerPhone: string;

  // Địa chỉ giao hàng (flattened)
  shippingAddress: string;
  shippingWard: string;
  shippingDistrict: string;
  shippingCity: string;
  shippingNotes: string | null;

  // Địa chỉ thanh toán
  billingAddress: string | null; // null = giống địa chỉ giao hàng
  billingWard: string | null;
  billingDistrict: string | null;
  billingCity: string | null;

  // Tài chính (Price Breakdown)
  subTotal: number; // Tổng tiền hàng
  shippingFee: number; // Phí vận chuyển
  progressiveDiscountAmount: number; // Giảm giá bậc thang
  voucherDiscountAmount: number; // Giảm giá voucher
  voucherCode: string | null; // Mã voucher đã dùng
  totalAmount: number; // Tổng cuối cùng

  // Chi tiết sản phẩm
  items: OrderItem[];

  // Lịch sử giao dịch
  transactions: OrderTransaction[];
};
