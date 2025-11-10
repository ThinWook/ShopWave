import { api } from "../utils/apiClient";
import type { GetTransactionsParams, Transaction, TransactionsAdminResponse } from "../types/transaction";

/**
 * ✅ GỌI API DUY NHẤT - Backend trả về TẤT CẢ (stats, transactions, pagination)
 * Không cần gọi riêng getTransactionStats() nữa!
 */
export async function getTransactions(params: GetTransactionsParams = {}): Promise<TransactionsAdminResponse> {
	const { page = 1, pageSize = 20 } = params;
	const qs = new URLSearchParams();
	qs.set("page", String(page));
	qs.set("pageSize", String(pageSize));
	if (params.status && params.status !== "ALL") qs.set("status", params.status);
	if (params.gateway && params.gateway !== "ALL") qs.set("gateway", params.gateway);
	if (params.search) qs.set("search", params.search);
	if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
	if (params.dateTo) qs.set("dateTo", params.dateTo);

	// Using api.get expects envelope { data } or plain payload
	const res = await api.get<any>(`/api/v1/admin/transactions?${qs.toString()}`);
	const data = res?.data ?? res; // be resilient to envelope

	// 1️⃣ Parse Stats (từ backend)
	const statsRaw = data?.stats ?? {};
	const stats = {
		todaysRevenue: Number(statsRaw.todaysRevenue ?? 0),
		successfulTodayCount: Number(statsRaw.successfulTodayCount ?? 0),
		failedTodayCount: Number(statsRaw.failedTodayCount ?? 0),
	};

	// 2️⃣ Parse Transactions (từ backend)
	const transactionsRaw = Array.isArray(data?.transactions) ? data.transactions : [];
	const transactions: Transaction[] = transactionsRaw.map((t: any) => ({
		id: String(t.id ?? t.Id ?? ''),
		orderId: String(t.orderId ?? t.OrderId ?? ''),
		orderNumber: String(t.orderNumber ?? t.OrderNumber ?? ''),
		gatewayTransactionId: t.gatewayTransactionId ?? t.GatewayTransactionId ?? null,
		createdAt: String(t.createdAt ?? t.CreatedAt ?? new Date().toISOString()),
		gateway: (t.gateway ?? t.Gateway ?? 'COD') as Transaction['gateway'],
		amount: Number(t.amount ?? t.Amount ?? 0),
		status: (t.status ?? t.Status ?? 'PENDING') as Transaction['status'],
	}));

	// 3️⃣ Parse Pagination (từ backend)
	const paginationRaw = data?.pagination ?? {};
	const pagination = {
		currentPage: Number(paginationRaw.currentPage ?? page),
		pageSize: Number(paginationRaw.pageSize ?? pageSize),
		totalRecords: Number(paginationRaw.totalRecords ?? transactions.length),
		totalPages: Number(paginationRaw.totalPages ?? 1),
	};

	return { stats, transactions, pagination };
}

/**
 * ✅ Get transaction detail (including debug fields)
 */
export async function getTransactionDetail(transactionId: string): Promise<Transaction> {
	const res = await api.get<any>(`/api/v1/admin/transactions/${encodeURIComponent(transactionId)}`);
	const data = res?.data ?? res;
	const t = data?.transaction ?? data;
	
	return {
		id: String(t.id ?? t.Id ?? ''),
		orderId: String(t.orderId ?? t.OrderId ?? ''),
		orderNumber: String(t.orderNumber ?? t.OrderNumber ?? ''),
		gatewayTransactionId: t.gatewayTransactionId ?? t.GatewayTransactionId ?? null,
		createdAt: String(t.createdAt ?? t.CreatedAt ?? new Date().toISOString()),
		gateway: (t.gateway ?? t.Gateway ?? 'COD') as Transaction['gateway'],
		amount: Number(t.amount ?? t.Amount ?? 0),
		status: (t.status ?? t.Status ?? 'PENDING') as Transaction['status'],
		errorMessage: t.errorMessage ?? t.ErrorMessage ?? null,
		gatewayResponse: t.gatewayResponse ?? t.GatewayResponse ?? null,
		ipAddress: t.ipAddress ?? t.IpAddress ?? null,
		userAgent: t.userAgent ?? t.UserAgent ?? null,
	};
}

