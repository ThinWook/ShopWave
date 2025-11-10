import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../services/orderService';
import type { Order, GetOrdersParams, OrderStats } from '../types/order';
import { formatCurrencyVi, formatDateVi } from '../utils/format';

type StatusTab = 'ALL' | 'PROCESSING' | 'PENDING_PAYMENT' | 'SHIPPED' | 'CANCELLED' | 'COMPLETED';
type PaymentTab = 'ALL' | 'PAID' | 'UNPAID';

const PAGE_SIZE = 10;

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusTab, setStatusTab] = useState<StatusTab>('ALL'); // Show all orders by default
  const [paymentTab, setPaymentTab] = useState<PaymentTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<OrderStats | null>(null);

  const params: GetOrdersParams = useMemo(() => ({
    page,
    pageSize: PAGE_SIZE,
    status: statusTab === 'ALL' ? undefined : statusTab,
    paymentStatus: paymentTab === 'ALL' ? undefined : paymentTab,
    searchTerm: searchTerm || undefined,
  }), [page, statusTab, paymentTab, searchTerm]);

  // ✅ CHỈ 1 useEffect DUY NHẤT - Gọi API 1 lần, nhận TẤT CẢ (stats + orders + pagination)
  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const response = await getOrders(params);
        
        // 1️⃣ Set Stats cho các thẻ tổng quan
        setStats(response.stats);
        
        // 2️⃣ Set Orders cho bảng
        setOrders(response.orders);
        
        // 3️⃣ Set Pagination (ƯU TIÊN dùng totalPages từ backend)
        setTotal(response.pagination.totalRecords);
        setTotalPages(response.pagination.totalPages);
      } catch (e) {
        // TODO: surface error via toast context
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  // totalPages đã được set từ backend response, không cần tính lại

  const handleExportCsv = () => {
    const header = ['Mã đơn hàng','Khách hàng','Ngày đặt','Tổng cộng','Trạng thái TT','Trạng thái ĐH'];
    const rows = orders.map(o => [
      o.orderNumber,
      o.shippingFullName,
      formatDateVi(o.orderDate),
      formatCurrencyVi(o.totalAmount),
      o.paymentStatus,
      o.status,
    ]);
    const csv = [header, ...rows].map(r => r.map(field => '"' + String(field).replace(/"/g,'""') + '"').join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const StatCard: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="border-b p-5 sm:border-r lg:border-b-0">
      <p className="mb-1.5 text-sm text-gray-400 dark:text-gray-500">{label}</p>
      <h3 className="text-2xl font-semibold text-gray-800 dark:text-white/90">{value}</h3>
    </div>
  );

  return (
    <div className="p-4 mx-auto max-w-[1440px] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <nav>
          <ol className="flex items-center gap-1.5">
            <li>
              <Link className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400" to="/">
                Trang chủ
                <svg className="stroke-current" width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              </Link>
            </li>
            <li className="text-sm text-gray-800 dark:text-white/90">Đơn hàng</li>
          </ol>
        </nav>
      </div>

      {/* Overview */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-white/[0.03] dark:bg-gray-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 dark:text-white/90">Tổng quan</h2>
          <div className="flex gap-2">
            <button onClick={handleExportCsv} className="shadow-sm flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M16.6671 13.3333V15.4166C16.6671 16.1069 16.1074 16.6666 15.4171 16.6666H4.58301C3.89265 16.6666 3.33301 16.1069 3.33301 15.4166V13.3333M10.0013 3.33325L10.0013 13.3333M6.14553 7.18708L9.99958 3.33549L13.8539 7.18708" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              Xuất CSV
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 rounded-xl border border-gray-200 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0 dark:divide-gray-800 dark:border-gray-800">
          <StatCard label="Đơn hàng mới" value={stats ? stats.newOrdersCount : '...'} />
          <StatCard label="Sẵn sàng giao" value={stats ? stats.readyToShipCount : '...'} />
          <StatCard label="Doanh thu hôm nay" value={stats ? formatCurrencyVi(stats.todaysRevenue) : '...'} />
          <StatCard label="Chờ thanh toán" value={stats ? stats.pendingPaymentCount : '...'} />
        </div>
      </div>

      {/* Orders table container */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.03] dark:bg-gray-900">
        {/* Header with filters */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Đơn hàng</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Danh sách đơn hàng gần đây</p>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Status Tabs */}
            <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
              {(['ALL','PROCESSING','PENDING_PAYMENT','SHIPPED','CANCELLED','COMPLETED'] as StatusTab[]).map(tab => (
                <button key={tab} onClick={() => { setStatusTab(tab); setPage(1); }} className={`text-xs h-9 rounded-md px-3 py-2 font-medium transition ${ statusTab === tab ? 'shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400'}`}>{
                  tab === 'ALL' ? 'Tất cả' : tab === 'PROCESSING' ? 'Đang xử lý' : tab === 'PENDING_PAYMENT' ? 'Chờ thanh toán' : tab === 'SHIPPED' ? 'Đã giao' : tab === 'CANCELLED' ? 'Đã hủy' : 'Hoàn thành'
                }</button>
              ))}
            </div>
            {/* Payment Tabs */}
            <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
              {(['ALL','PAID','UNPAID'] as PaymentTab[]).map(tab => (
                <button key={tab} onClick={() => { setPaymentTab(tab); setPage(1); }} className={`text-xs h-9 rounded-md px-3 py-2 font-medium transition ${ paymentTab === tab ? 'shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400'}`}>{
                  tab === 'ALL' ? 'TT: Tất cả' : tab === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'
                }</button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                <svg className="fill-current" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z" /></svg>
              </span>
              <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} placeholder="Tìm kiếm..." className="h-9 w-48 rounded-md border border-gray-300 bg-transparent pl-8 pr-3 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="p-3 text-left font-medium text-gray-700 dark:text-gray-400">Mã đơn hàng</th>
                <th className="p-3 text-left font-medium text-gray-700 dark:text-gray-400">Khách hàng</th>
                <th className="p-3 text-left font-medium text-gray-700 dark:text-gray-400">Ngày đặt</th>
                <th className="p-3 text-left font-medium text-gray-700 dark:text-gray-400">Tổng cộng</th>
                <th className="p-3 text-left font-medium text-gray-700 dark:text-gray-400">Trạng thái TT</th>
                <th className="p-3 text-left font-medium text-gray-700 dark:text-gray-400">Trạng thái ĐH</th>
                <th className="p-3 text-left font-medium text-gray-700 dark:text-gray-400">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading && orders.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-gray-500 dark:text-gray-400">Đang tải...</td></tr>
              )}
              {!loading && orders.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-gray-500 dark:text-gray-400">Không có đơn hàng</td></tr>
              )}
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                  <td className="p-3">
                    <Link to={`/orders/${o.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">{o.orderNumber}</Link>
                  </td>
                  <td className="p-3">{o.shippingFullName}</td>
                  <td className="p-3">{formatDateVi(o.orderDate)}</td>
                  <td className="p-3">{formatCurrencyVi(o.totalAmount)}</td>
                  <td className="p-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${o.paymentStatus === 'PAID' ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500' : 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500'}`}>{o.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID'}</span>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${
                      o.status === 'PROCESSING' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-500' :
                      o.status === 'PENDING_PAYMENT' ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-500' :
                      o.status === 'SHIPPED' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-500' :
                      o.status === 'COMPLETED' ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400'
                    }`}>{
                      o.status === 'PROCESSING' ? 'PROCESSING' :
                      o.status === 'PENDING_PAYMENT' ? 'PENDING_PAYMENT' :
                      o.status === 'SHIPPED' ? 'SHIPPED' :
                      o.status === 'COMPLETED' ? 'COMPLETED' : 'CANCELLED'
                    }</span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link to={`/order/${o.id}`} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" title="Xem">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 6.5C7 6.5 3.73 9.61 2.25 12C3.73 14.39 7 17.5 12 17.5C17 17.5 20.27 14.39 21.75 12C20.27 9.61 17 6.5 12 6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </Link>
                      {/* Cancel button removed as per request */}
                      <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" title="In">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9V4H18V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 14H5C3.89543 14 3 13.1046 3 12V11C3 9.89543 3.89543 9 5 9H19C20.1046 9 21 9.89543 21 11V12C21 13.1046 20.1046 14 19 14H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 14H18V20H6V14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center flex-col sm:flex-row justify-between border-t border-gray-200 px-5 py-4 dark:border-gray-800">
          <div className="pb-3 sm:pb-0 text-xs text-gray-600 dark:text-gray-400">
            Hiển thị {orders.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, total)} trong tổng số {total}
          </div>
          <div className="flex items-center gap-1">
            {/* Previous Button */}
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              className={`flex h-8 w-8 items-center justify-center rounded-md text-xs border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 ${page === 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              «
            </button>
            
            {/* Page Numbers with Smart Ellipsis */}
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
                    <span key={`ellipsis-${idx}`} className="flex h-8 w-8 items-center justify-center text-gray-500 dark:text-gray-400">
                      ...
                    </span>
                  );
                }
                return (
                  <button 
                    key={p} 
                    onClick={() => setPage(p as number)} 
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                      p === page 
                        ? 'bg-blue-500 text-white' 
                        : 'border border-gray-300 bg-white hover:bg-blue-500 hover:text-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                );
              });
            })()}
            
            {/* Next Button */}
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              className={`flex h-8 w-8 items-center justify-center rounded-md text-xs border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 ${page === totalPages ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
