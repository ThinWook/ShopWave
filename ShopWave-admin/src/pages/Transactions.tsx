import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { formatCurrencyVi, formatDateVi } from "../utils/format";
import { getTransactions } from "../services/transactionService";
import type { Transaction, TransactionGateway, TransactionStatus, TransactionStats } from "../types/transaction";
import { useModal } from "../hooks/useModal";
import TransactionDetailModal from "../components/ecommerce/TransactionDetailModal";

// Map backend status to badge styling & label
const statusConfig: Record<TransactionStatus, { label: string; className: string }> = {
  SUCCESS: { label: "Thành công", className: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400" },
  FAILED: { label: "Thất bại", className: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400" },
  PENDING: { label: "Đang chờ", className: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400" },
};

export default function Transactions() {
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  
  // Modal for transaction detail
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | TransactionStatus>("ALL");
  const [gateway, setGateway] = useState<"ALL" | TransactionGateway>("ALL");
  const [timeFilter, setTimeFilter] = useState("Tất cả"); // Default to show all transactions

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Sorting (optional; currently not exposed in UI)

  // Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState<TransactionStats | null>(null);

  // ✅ CHỈ 1 useEffect DUY NHẤT - Gọi API 1 lần, nhận TẤT CẢ (stats + transactions + pagination)
  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        // Map simple time filter to date range (optional backend support)
        let dateFrom: string | undefined;
        let dateTo: string | undefined;
        
        // Only apply date filter if NOT "Tất cả"
        if (timeFilter !== "Tất cả") {
          const match = timeFilter.match(/(\d+)/);
          if (match) {
            const days = Math.max(1, parseInt(match[1], 10));
            const to = new Date();
            const from = new Date();
            from.setDate(to.getDate() - (days - 1));
            dateFrom = from.toISOString();
            dateTo = to.toISOString();
          }
        }
        
        const response = await getTransactions({ page, pageSize, status, gateway, search: search.trim() || undefined, dateFrom, dateTo });
        if (ignore) return;
        
        // 1️⃣ Set Stats cho các thẻ tổng quan
        setStats(response.stats);
        
        // 2️⃣ Set Transactions cho bảng
        setTransactions(response.transactions);
        
        // 3️⃣ Set Pagination (ƯU TIÊN dùng totalPages từ backend)
        setTotal(response.pagination.totalRecords);
        setTotalPages(response.pagination.totalPages);
      } catch (e) {
        if (!ignore) setError((e as Error).message || 'Lỗi tải dữ liệu');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [page, pageSize, status, gateway, search, timeFilter]);

  // totalPages đã được set từ backend response, không cần tính lại
  const sortedTransactions = transactions;

  const paginatedTransactions = sortedTransactions; // Already server paginated; keep variable for clarity

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(paginatedTransactions.map(t => t.id)); else setSelectedIds([]);
  };
  const handleSelectTransaction = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const cfg = statusConfig[status];
    return `text-theme-xs rounded-full px-2 py-0.5 font-medium ${cfg.className}`;
  };
  
  const handleViewDetail = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    openModal();
    setDropdownOpen(null); // Close dropdown
  };

  return (
    <div>
      <PageMeta title={`Giao dịch | Admin`} description={"Danh sách giao dịch gần đây"} />
      
      <div className="p-4 mx-auto max-w-[--breakpoint-2xl] md:p-6 space-y-6">
        <PageBreadcrumb pageTitle={"Giao dịch"} hideTitle />

        {/* Overview Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Doanh thu (Hôm nay)" value={formatCurrencyVi(stats?.todaysRevenue ?? 0, 'VND')} subtitle="Tổng amount SUCCESS" />
          <StatCard title="Giao dịch Thành công (Hôm nay)" value={String(stats?.successfulTodayCount ?? 0)} subtitle="Số giao dịch thành công" />
          <StatCard title="Giao dịch Thất bại (Hôm nay)" value={String(stats?.failedTodayCount ?? 0)} subtitle="Số giao dịch thất bại" />
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.03] dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                {"Danh sách giao dịch gần đây"}
              </h2>
            </div>
            <div className="flex gap-3.5">
              <div className="hidden flex-col gap-3 sm:flex sm:flex-row sm:items-center">
                {/* Search */}
                <div className="relative">
                  <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    <svg
                      className="fill-current"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                        fill=""
                      />
                    </svg>
                  </span>
                  <input
                    placeholder="Mã đơn hoặc Mã giao dịch"
                    className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden xl:w-[300px] dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                    type="text"
                    value={search}
                    onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    className="shadow-theme-xs bg-none appearance-none focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    value={status}
                    onChange={(e) => { setPage(1); setStatus(e.target.value as any); }}
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="SUCCESS">Thành công</option>
                    <option value="FAILED">Thất bại</option>
                    <option value="PENDING">Đang chờ</option>
                  </select>
                </div>

                {/* Gateway Filter */}
                <div>
                  <select
                    className="shadow-theme-xs bg-none appearance-none focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    value={gateway}
                    onChange={(e) => { setPage(1); setGateway(e.target.value as any); }}
                  >
                    <option value="ALL">Tất cả cổng TT</option>
                    <option value="COD">COD</option>
                    <option value="VNPAY">VNPay</option>
                    <option value="MOMO">MoMo</option>
                  </select>
                </div>
                
                {/* Time Filter (placeholder for date range) */}
                <div className="hidden lg:block relative">
                  <select
                    className="shadow-theme-xs bg-none appearance-none focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                    value={timeFilter}
                    onChange={(e) => { setTimeFilter(e.target.value); setPage(1); }}
                  >
                    <option>Tất cả</option>
                    <option>7 ngày gần đây</option>
                    <option>10 ngày gần đây</option>
                    <option>15 ngày gần đây</option>
                    <option>30 ngày gần đây</option>
                  </select>
                  <svg
                    className="absolute text-gray-700 dark:text-gray-400 right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.79175 8.02075L10.0001 13.2291L15.2084 8.02075"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                
                {/* Export Button */}
                <div>
                  <button onClick={() => exportCsv(paginatedTransactions)} className="shadow-theme-xs flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M16.6661 13.3333V15.4166C16.6661 16.1069 16.1064 16.6666 15.4161 16.6666H4.58203C3.89168 16.6666 3.33203 16.1069 3.33203 15.4166V13.3333M10.0004 3.33325L10.0004 13.3333M6.14456 7.18708L9.9986 3.33549L13.8529 7.18708"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {"Xuất CSV"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="custom-scrollbar overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                  <th className="p-4">
                    <div className="flex w-full items-center gap-3">
                      <label className="flex cursor-pointer items-center text-sm font-medium text-gray-700 select-none dark:text-gray-400">
                        <span className="relative">
                          <input
                            className="sr-only"
                            type="checkbox"
                            checked={selectedIds.length === paginatedTransactions.length && paginatedTransactions.length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                          />
                          <span className="flex h-4 w-4 items-center justify-center rounded-sm border-[1.25px] bg-transparent border-gray-300 dark:border-gray-700">
                            <span className={selectedIds.length === paginatedTransactions.length && paginatedTransactions.length > 0 ? "opacity-100" : "opacity-0"}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.6666" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </span>
                          </span>
                        </span>
                      </label>
                      <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Mã đơn hàng</p>
                    </div>
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Mã giao dịch (Gateway)</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Ngày tạo</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Cổng TT</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Số tiền</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Trạng thái</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    <div className="relative">
                      <span className="sr-only">Hành động</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-x divide-y divide-gray-200 dark:divide-gray-800">
                {loading && (
                  <tr><td colSpan={8} className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</td></tr>
                )}
                {error && !loading && (
                  <tr><td colSpan={8} className="p-6 text-center text-sm text-red-600 dark:text-red-400">{error}</td></tr>
                )}
                {!loading && !error && paginatedTransactions.length === 0 && (
                  <tr><td colSpan={8} className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">Không có giao dịch</td></tr>
                )}
                {!loading && !error && paginatedTransactions.map((t) => (
                  <tr key={t.id} className={`transition hover:bg-gray-50 dark:hover:bg-gray-900 ${t.status === 'FAILED' ? 'bg-red-50/30 dark:bg-red-500/5' : ''}`}>            
                    <td className="p-4 whitespace-nowrap">
                      <div className="group flex items-center gap-3">
                        <label className="flex cursor-pointer items-center text-sm font-medium text-gray-700 select-none dark:text-gray-400">
                          <span className="relative">
                            <input
                              className="sr-only"
                              type="checkbox"
                              checked={selectedIds.includes(t.id)}
                              onChange={(e) => handleSelectTransaction(t.id, e.target.checked)}
                            />
                            <span className="flex h-4 w-4 items-center justify-center rounded-sm border-[1.25px] bg-transparent border-gray-300 dark:border-gray-700">
                              <span className={selectedIds.includes(t.id) ? "opacity-100" : "opacity-0"}>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.6666" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </span>
                            </span>
                          </span>
                        </label>
                        <Link className="text-theme-xs font-medium text-gray-700 group-hover:underline dark:text-gray-400" to={`/orders/${encodeURIComponent(t.orderId)}`}>{t.orderNumber}</Link>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-400">{t.gatewayTransactionId || 'N/A'}</td>
                    <td className="p-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-400">{formatDateVi(t.createdAt)}</td>
                    <td className="p-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-400">[{t.gateway}]</td>
                    <td className="p-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-400">{formatCurrencyVi(t.amount, 'VND')}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={getStatusBadge(t.status)}>{statusConfig[t.status].label}</span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="relative inline-block">
                        <div>
                          <button
                            className="text-gray-500 dark:text-gray-400"
                            onClick={() => setDropdownOpen(dropdownOpen === t.id ? null : t.id)}
                          >
                            <svg
                              className="fill-current"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M5.99902 10.245C6.96552 10.245 7.74902 11.0285 7.74902 11.995V12.005C7.74902 12.9715 6.96552 13.755 5.99902 13.755C5.03253 13.755 4.24902 12.9715 4.24902 12.005V11.995C4.24902 11.0285 5.03253 10.245 5.99902 10.245ZM17.999 10.245C18.9655 10.245 19.749 11.0285 19.749 11.995V12.005C19.749 12.9715 18.9655 13.755 17.999 13.755C17.0325 13.755 16.249 12.9715 16.249 12.005V11.995C16.249 11.0285 17.0325 10.245 17.999 10.245ZM13.749 11.995C13.749 11.0285 12.9655 10.245 11.999 10.245C11.0325 10.245 10.249 11.0285 10.249 11.995V12.005C10.249 12.9715 11.0325 13.755 11.999 13.755C12.9655 13.755 13.749 12.9715 13.749 12.005V11.995Z"
                                fill=""
                              />
                            </svg>
                          </button>
                          {dropdownOpen === t.id && (
                            <div className="absolute right-0 top-8 z-10">
                              <div className="p-2 bg-white border border-gray-200 rounded-2xl shadow-lg dark:border-gray-800 dark:bg-gray-900 w-40">
                                <div className="space-y-1" role="menu" aria-orientation="vertical">
                                  <button 
                                    onClick={() => handleViewDetail(t.id)}
                                    className="text-xs flex w-full rounded-lg px-3 py-2 text-left font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                  >
                                    {"Xem chi tiết"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-200 px-5 py-4 dark:border-gray-800">
            <div className="flex justify-center pb-4 sm:hidden">
              {(() => {
                const start = total > 0 ? (page - 1) * pageSize + 1 : 0;
                const end = total > 0 ? Math.min(total, (page - 1) * pageSize + paginatedTransactions.length) : 0;
                return (
                  <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Hiển thị <span className="text-gray-800 dark:text-white/90">{start}</span> đến {" "}
                    <span className="text-gray-800 dark:text-white/90">{end}</span> trong {" "}
                    <span className="text-gray-800 dark:text-white/90">{total}</span>
                  </span>
                );
              })()}
            </div>
            <div className="flex items-center justify-between">
              <div className="hidden sm:block">
                <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">Tổng: <span className="text-gray-800 dark:text-white/90">{total}</span></span>
              </div>
              <div className="flex w-full items-center justify-between gap-2 rounded-lg bg-gray-50 p-4 sm:w-auto sm:justify-normal sm:rounded-none sm:bg-transparent sm:p-0 dark:bg-gray-900 dark:sm:bg-transparent">
                <button
                  className={`shadow-theme-xs flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 hover:text-gray-800 sm:p-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 ${page === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M2.58203 9.99868C2.58174 10.1909 2.6549 10.3833 2.80152 10.53L7.79818 15.5301C8.09097 15.8231 8.56584 15.8233 8.85883 15.5305C9.15183 15.2377 9.152 14.7629 8.85921 14.4699L5.13911 10.7472L16.6665 10.7472C17.0807 10.7472 17.4165 10.4114 17.4165 9.99715C17.4165 9.58294 17.0807 9.24715 16.6665 9.24715L5.14456 9.24715L8.85919 5.53016C9.15199 5.23717 9.15184 4.7623 8.85885 4.4695C8.56587 4.1767 8.09099 4.17685 7.79819 4.46984L2.84069 9.43049C2.68224 9.568 2.58203 9.77087 2.58203 9.99715C2.58203 9.99766 2.58203 9.99817 2.58203 9.99868Z"
                      fill=""
                    />
                  </svg>
                </button>
                <span className="block text-sm font-medium text-gray-700 sm:hidden dark:text-gray-400">Trang {page} trong {totalPages}</span>
                <ul className="hidden items-center gap-0.5 sm:flex">
                  {(() => {
                    const pages: (number | string)[] = [];
                    const showEllipsisStart = page > 3;
                    const showEllipsisEnd = page < totalPages - 2;
                    
                    if (totalPages <= 7) {
                      // Show all pages if 7 or less
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      // Always show first page
                      pages.push(1);
                      
                      if (showEllipsisStart) pages.push('...');
                      
                      // Show current page and neighbors
                      const start = Math.max(2, page - 1);
                      const end = Math.min(totalPages - 1, page + 1);
                      for (let i = start; i <= end; i++) {
                        if (i !== 1 && i !== totalPages) pages.push(i);
                      }
                      
                      if (showEllipsisEnd) pages.push('...');
                      
                      // Always show last page
                      if (totalPages > 1) pages.push(totalPages);
                    }
                    
                    return pages.map((p, idx) => {
                      if (p === '...') {
                        return (
                          <li key={`ellipsis-${idx}`} className="flex h-10 w-10 items-center justify-center text-gray-500 dark:text-gray-400">
                            ...
                          </li>
                        );
                      }
                      return (
                        <li key={p}>
                          <button
                            className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                              page === p 
                                ? 'bg-brand-500 text-white' 
                                : 'text-gray-700 hover:bg-brand-500 hover:text-white dark:text-gray-400 dark:hover:text-white'
                            }`}
                            onClick={() => setPage(p as number)}
                          >
                            {p}
                          </button>
                        </li>
                      );
                    });
                  })()}
                </ul>
                <button
                  className={`shadow-theme-xs flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 hover:text-gray-800 sm:p-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 ${page === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M17.4165 9.9986C17.4168 10.1909 17.3437 10.3832 17.197 10.53L12.2004 15.5301C11.9076 15.8231 11.4327 15.8233 11.1397 15.5305C10.8467 15.2377 10.8465 14.7629 11.1393 14.4699L14.8594 10.7472L3.33203 10.7472C2.91782 10.7472 2.58203 10.4114 2.58203 9.99715C2.58203 9.58294 2.91782 9.24715 3.33203 9.24715L14.854 9.24715L11.1393 5.53016C10.8465 5.23717 10.8467 4.7623 11.1397 4.4695C11.4327 4.1767 11.9075 4.17685 12.2003 4.46984L17.1578 9.43049C17.3163 9.568 17.4165 9.77087 17.4165 9.99715C17.4165 9.99763 17.4165 9.99812 17.4165 9.9986Z"
                      fill=""
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Transaction Detail Modal */}
      {selectedTransactionId && (
        <TransactionDetailModal
          isOpen={isOpen}
          onClose={closeModal}
          transactionId={selectedTransactionId}
        />
      )}
    </div>
  );
}

// Small stat card component (local to this page)
function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <p className="text-lg font-semibold text-gray-800 dark:text-white/90">{value}</p>
      {subtitle && <p className="mt-0.5 text-[11px] text-gray-400 dark:text-white/40">{subtitle}</p>}
    </div>
  );
}

function exportCsv(rows: Transaction[]) {
  if (!rows.length) return;
  const header = ["OrderNumber","GatewayTransactionId","CreatedAt","Gateway","Amount","Status"];
  const csv = [header.join(","), ...rows.map(r => [r.orderNumber, r.gatewayTransactionId ?? '', r.createdAt, r.gateway, r.amount, r.status].map(field => `"${String(field).replace(/"/g,'""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `transactions-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}