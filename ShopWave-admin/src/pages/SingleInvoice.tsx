import React from 'react';
import { Link, useParams } from 'react-router';
import { formatCurrencyVi, formatDateVi } from '../utils/format';

interface InvoiceItem {
  id: number;
  product: string;
  quantity: number;
  unitCost: number;
  discount: number;
  total: number;
}

interface InvoiceData {
  id: string;
  from: {
    company: string;
    address: string;
  };
  to: {
    name: string;
    address: string;
  };
  issuedOn: string;
  dueOn: string;
  items: InvoiceItem[];
  subtotal: number;
  vat: number;
  vatRate: number;
  total: number;
}

// No built-in mock data; expect integration data. Keep empty map as placeholder.
const mockInvoiceData: { [key: string]: InvoiceData } = {};

const SingleInvoice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // Get invoice data based on ID; no fallback to demo. Render empty state if missing
  const invoiceData = id ? mockInvoiceData[id] : undefined;

  const handlePrint = () => {
    window.print();
  };

  const handleProceedToPayment = () => {
    // Xử lý thanh toán tại đây
    alert('Đang chuyển đến cổng thanh toán...');
  };

  return (
    <div className="p-4 mx-auto max-w-[1440px] md:p-6">
      <div>
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <nav>
            <ol className="flex items-center gap-1.5">
              <li>
                <Link className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400" to="/">
                  Trang chủ
                  <svg className="stroke-current" width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366" stroke="" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </Link>
              </li>
              <li>
                <Link className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400" to="/invoices">
                  Hóa đơn
                  <svg className="stroke-current" width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366" stroke="" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </Link>
              </li>
              <li className="text-sm text-gray-800 dark:text-white/90">Hóa đơn</li>
            </ol>
          </nav>
        </div>

        {/* Invoice Container */}
  <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.03] dark:bg-gray-900 w-full">
          {/* Invoice Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-medium text-gray-800 text-xl dark:text-white/90">Hóa đơn</h3>
            <h4 className="text-base font-medium text-gray-700 dark:text-gray-400">ID : {invoiceData?.id || '-'}</h4>
          </div>

          <div className="p-5 xl:p-8">
            {/* Invoice Details */}
            <div className="flex flex-col gap-6 mb-9 sm:flex-row sm:items-center sm:justify-between">
              {/* From Section */}
              <div>
                <span className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">Từ</span>
                <h5 className="mb-2 text-base font-semibold text-gray-800 dark:text-white/90">{invoiceData?.from.company || '-'}</h5>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">{invoiceData?.from.address || '-'}</p>
                <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Ngày phát hành:</span>
                <span className="block text-sm text-gray-500 dark:text-gray-400">{invoiceData ? formatDateVi(invoiceData.issuedOn) : '-'}</span>
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-gray-200 dark:bg-gray-800 sm:h-[158px] sm:w-px"></div>

              {/* To Section */}
              <div className="sm:text-right">
                <span className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-400">Đến</span>
                <h5 className="mb-2 text-base font-semibold text-gray-800 dark:text-white/90">{invoiceData?.to.name || '-'}</h5>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">{invoiceData?.to.address || '-'}</p>
                <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Ngày đến hạn:</span>
                <span className="block text-sm text-gray-500 dark:text-gray-400">{invoiceData ? formatDateVi(invoiceData.dueOn) : '-'}</span>
              </div>
            </div>

            {/* Invoice Items Table */}
            <div>
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="min-w-full text-left text-gray-700 dark:text-gray-400">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="px-5 py-3 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">STT</th>
                      <th className="px-5 py-3 text-xs font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">Sản phẩm</th>
                      <th className="px-5 py-3 text-center text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">Số lượng</th>
                      <th className="px-5 py-3 text-center text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">Đơn giá</th>
                      <th className="px-5 py-3 text-center text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">Giảm giá</th>
                      <th className="px-5 py-3 text-right text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">Tổng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {!invoiceData || invoiceData.items.length === 0 ? (
                      <tr>
                        <td className="px-5 py-6 text-sm text-gray-500 dark:text-gray-400" colSpan={6}>Không có mặt hàng</td>
                      </tr>
                    ) : (
                      invoiceData.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{item.id}</td>
                          <td className="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white/90">{item.product}</td>
                          <td className="px-5 py-3 text-center text-sm text-gray-500 dark:text-gray-400">{item.quantity}</td>
                          <td className="px-5 py-3 text-center text-sm text-gray-500 dark:text-gray-400">{formatCurrencyVi(item.unitCost, 'USD')}</td>
                          <td className="px-5 py-3 text-center text-sm text-gray-500 dark:text-gray-400">{item.discount}%</td>
                          <td className="px-5 py-3 text-right text-sm text-gray-500 dark:text-gray-400">{formatCurrencyVi(item.total, 'USD')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoice Totals */}
            <div className="pb-6 my-6 text-right border-b border-gray-100 dark:border-gray-800">
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Tạm tính: {invoiceData ? formatCurrencyVi(invoiceData.subtotal, 'USD') : '-'}
              </p>
              <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                {invoiceData ? (
                  <>VAT ({invoiceData.vatRate}%): {formatCurrencyVi(invoiceData.vat, 'USD')}</>
                ) : (
                  'VAT: -'
                )}
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Tổng: {invoiceData ? formatCurrencyVi(invoiceData.total, 'USD') : '-'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={handleProceedToPayment}
                disabled={!invoiceData}
                className="inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300"
              >
                Tiến hành thanh toán
              </button>
              <button 
                onClick={handlePrint}
                disabled={!invoiceData}
                className="inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-blue-500 text-white shadow-sm hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M6.99578 4.08398C6.58156 4.08398 6.24578 4.41977 6.24578 4.83398V6.36733H13.7542V5.62451C13.7542 5.42154 13.672 5.22724 13.5262 5.08598L12.7107 4.29545C12.5707 4.15983 12.3835 4.08398 12.1887 4.08398H6.99578ZM15.2542 6.36902V5.62451C15.2542 5.01561 15.0074 4.43271 14.5702 4.00891L13.7547 3.21839C13.3349 2.81151 12.7733 2.58398 12.1887 2.58398H6.99578C5.75314 2.58398 4.74578 3.59134 4.74578 4.83398V6.36902C3.54391 6.41522 2.58374 7.40415 2.58374 8.61733V11.3827C2.58374 12.5959 3.54382 13.5848 4.74561 13.631V15.1665C4.74561 16.4091 5.75297 17.4165 6.99561 17.4165H13.0041C14.2467 17.4165 15.2541 16.4091 15.2541 15.1665V13.6311C16.456 13.585 17.4163 12.596 17.4163 11.3827V8.61733C17.4163 7.40414 16.4561 6.41521 15.2542 6.36902ZM4.74561 11.6217V12.1276C4.37292 12.084 4.08374 11.7671 4.08374 11.3827V8.61733C4.08374 8.20312 4.41953 7.86733 4.83374 7.86733H15.1663C15.5805 7.86733 15.9163 8.20312 15.9163 8.61733V11.3827C15.9163 11.7673 15.6269 12.0842 15.2541 12.1277V11.6217C15.2541 11.2075 14.9183 10.8717 14.5041 10.8717H5.49561C5.08139 10.8717 4.74561 11.2075 4.74561 11.6217ZM6.24561 12.3717V15.1665C6.24561 15.5807 6.58139 15.9165 6.99561 15.9165H13.0041C13.4183 15.9165 13.7541 15.5807 13.7541 15.1665V12.3717H6.24561Z" fill=""></path>
                </svg>
                In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleInvoice;