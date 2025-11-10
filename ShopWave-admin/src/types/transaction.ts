export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export type TransactionGateway = 'COD' | 'VNPAY' | 'MOMO';

// Transaction item as returned by admin API
export type Transaction = {
  id: string; // Transactions.Id
  orderId: string; // Transactions.OrderId
  orderNumber: string; // Orders.OrderNumber (JOIN)
  gatewayTransactionId: string | null; // Transactions.GatewayTransactionId
  createdAt: string; // ISO string from Transactions.CreatedAt
  gateway: TransactionGateway; // Transactions.Gateway
  amount: number; // Transactions.Amount (VND)
  status: TransactionStatus; // Transactions.Status
  // Debug/Detail fields (optional, only available when fetching details)
  errorMessage?: string | null; // Transactions.ErrorMessage
  gatewayResponse?: string | null; // Transactions.GatewayResponse (JSON string)
  ipAddress?: string | null; // Transactions.IpAddress
  userAgent?: string | null; // Transactions.UserAgent
};

export type GetTransactionsParams = {
  page?: number;
  pageSize?: number;
  status?: TransactionStatus | 'ALL';
  gateway?: TransactionGateway | 'ALL';
  search?: string; // OrderNumber or GatewayTransactionId
  dateFrom?: string; // ISO date (optional for future backend support)
  dateTo?: string;   // ISO date (optional for future backend support)
};

export type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type TransactionStats = {
  todaysRevenue: number; // sum amount where status = SUCCESS and created today
  successfulTodayCount: number; // count SUCCESS today
  failedTodayCount: number;  // count FAILED today
};

// Response from GET /api/v1/admin/transactions (bao gồm cả stats, transactions, và pagination)
export type TransactionsAdminResponse = {
  stats: TransactionStats;
  transactions: Transaction[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
  };
};
