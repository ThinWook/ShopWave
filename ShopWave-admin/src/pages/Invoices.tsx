import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';

interface Invoice {
  id: string;
  customer: string;
  creationDate: string;
  dueDate: string;
  total: string;
  status: 'Paid' | 'Unpaid' | 'Draft';
}

const mockInvoices: Invoice[] = [];

const Invoices: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'All Invoices' | 'Unpaid' | 'Draft'>('All Invoices');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const filteredInvoices = mockInvoices.filter(invoice => {
    const matchesSearch = invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Invoices' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / 10));
  const startIndex = (currentPage - 1) * 10;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + 10);

  const handleSelectAll = () => {
    if (selectedInvoices.length === paginatedInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(paginatedInvoices.map(invoice => invoice.id));
    }
  };

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'Paid':
        return 'bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-500';
      case 'Unpaid':
        return 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500';
      case 'Draft':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400';
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  const SortArrows = () => (
    <span className="flex flex-col gap-0.5">
      <svg className="text-gray-300" width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.40962 0.585167C4.21057 0.300808 3.78943 0.300807 3.59038 0.585166L1.05071 4.21327C0.81874 4.54466 1.05582 5 1.46033 5H6.53967C6.94418 5 7.18126 4.54466 6.94929 4.21327L4.40962 0.585167Z" fill="currentColor"></path>
      </svg>
      <svg className="text-gray-300" width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z" fill="currentColor"></path>
      </svg>
    </span>
  );

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
              <li className="text-sm text-gray-800 dark:text-white/90">Hóa đơn</li>
            </ol>
          </nav>
        </div>

        <div className="h-full">
          {/* Overview Section */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-white/[0.03] dark:bg-gray-900">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-white/90">Tổng quan</h2>
              </div>
              <div>
                <Link className="bg-blue-500 hover:bg-blue-600 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition" to="/create-invoice">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 10.0002H15.0006M10.0002 5V15.0006" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  Tạo hóa đơn
                </Link>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 rounded-xl border border-gray-200 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0 dark:divide-gray-800 dark:border-gray-800">
              <div className="border-b p-5 sm:border-r lg:border-b-0">
                <p className="mb-1.5 text-sm text-gray-400 dark:text-gray-500">Quá hạn</p>
                <h3 className="text-3xl text-gray-800 dark:text-white/90">$120.80</h3>
              </div>
              <div className="border-b p-5 lg:border-b-0">
                <p className="mb-1.5 text-sm text-gray-400 dark:text-gray-500">Đến hạn trong 30 ngày tới</p>
                <h3 className="text-3xl text-gray-800 dark:text-white/90">0.00</h3>
              </div>
              <div className="border-b p-5 sm:border-r sm:border-b-0">
                <p className="mb-1.5 text-sm text-gray-400 dark:text-gray-500">Thời gian thanh toán trung bình</p>
                <h3 className="text-3xl text-gray-800 dark:text-white/90">24 days</h3>
              </div>
              <div className="p-5">
                <p className="mb-1.5 text-sm text-gray-400 dark:text-gray-500">Sắp nhận thanh toán</p>
                <h3 className="text-3xl text-gray-800 dark:text-white/90">$3,450.50</h3>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.03] dark:bg-gray-900">
            {/* Table Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Hóa đơn</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Danh sách hóa đơn gần đây của bạn</p>
              </div>
              <div className="flex gap-3.5">
                {/* Status Filter Tabs */}
                <div className="hidden h-11 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 lg:inline-flex dark:bg-gray-900">
                  <button 
                    className={`text-sm h-10 rounded-md px-3 py-2 font-medium hover:text-gray-900 dark:hover:text-white transition ${
                      statusFilter === 'All Invoices' 
                        ? 'shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                    onClick={() => setStatusFilter('All Invoices')}
                  >
                    Tất cả hóa đơn
                  </button>
                  <button 
                    className={`text-sm h-10 rounded-md px-3 py-2 font-medium hover:text-gray-900 dark:hover:text-white transition ${
                      statusFilter === 'Unpaid' 
                        ? 'shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                    onClick={() => setStatusFilter('Unpaid')}
                  >
                    Chưa thanh toán
                  </button>
                  <button 
                    className={`text-sm h-10 rounded-md px-3 py-2 font-medium hover:text-gray-900 dark:hover:text-white transition ${
                      statusFilter === 'Draft' 
                        ? 'shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                    onClick={() => setStatusFilter('Draft')}
                  >
                    Nháp
                  </button>
                </div>

                {/* Search and Filter Controls */}
                <div className="hidden flex-col gap-3 sm:flex sm:flex-row sm:items-center">
                  <div className="relative">
                    <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z" fill=""></path>
                      </svg>
                    </span>
                    <input 
                      placeholder={'Tìm kiếm...'} 
                      className="shadow-sm focus:border-blue-300 focus:ring-blue-500/10 dark:focus:border-blue-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:outline-none xl:w-[300px] dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="relative">
                    <button className="shadow-sm flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 sm:w-auto sm:min-w-[100px] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400" type="button">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M14.6537 5.90414C14.6537 4.48433 13.5027 3.33331 12.0829 3.33331C10.6631 3.33331 9.51206 4.48433 9.51204 5.90415M14.6537 5.90414C14.6537 7.32398 13.5027 8.47498 12.0829 8.47498C10.663 8.47498 9.51204 7.32398 9.51204 5.90415M14.6537 5.90414L17.7087 5.90411M9.51204 5.90415L2.29199 5.90411M5.34694 14.0958C5.34694 12.676 6.49794 11.525 7.91777 11.525C9.33761 11.525 10.4886 12.676 10.4886 14.0958M5.34694 14.0958C5.34694 15.5156 6.49794 16.6666 7.91778 16.6666C9.33761 16.6666 10.4886 15.5156 10.4886 14.0958M5.34694 14.0958L2.29199 14.0958M10.4886 14.0958L17.7087 14.0958" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                      Bộ lọc
                    </button>
                  </div>
                  
                  <button className="shadow-sm flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-[11px] text-sm font-medium text-gray-700 sm:w-auto dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M16.6671 13.3333V15.4166C16.6671 16.1069 16.1074 16.6666 15.4171 16.6666H4.58301C3.89265 16.6666 3.33301 16.1069 3.33301 15.4166V13.3333M10.0013 3.33325L10.0013 13.3333M6.14553 7.18708L9.99958 3.33549L13.8539 7.18708" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    Xuất
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                    <th className="p-4">
                      <div className="flex w-full cursor-pointer items-center justify-between">
                        <div className="flex items-center gap-3">
                          <label className="flex cursor-pointer items-center text-sm font-medium text-gray-700 select-none dark:text-gray-400">
                            <span className="relative">
                              <input 
                                className="sr-only" 
                                type="checkbox"
                                checked={selectedInvoices.length === paginatedInvoices.length && paginatedInvoices.length > 0}
                                onChange={handleSelectAll}
                              />
                              <span className="flex h-4 w-4 items-center justify-center rounded-sm border-[1.25px] bg-transparent border-gray-300 dark:border-gray-700">
                                <span className={`${selectedInvoices.length === paginatedInvoices.length && paginatedInvoices.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 3L4.5 8.5L2 6" stroke="#3B82F6" strokeWidth="1.6666" strokeLinecap="round" strokeLinejoin="round"></path>
                                  </svg>
                                </span>
                              </span>
                            </span>
                          </label>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-400">Số hóa đơn</p>
                        </div>
                      </div>
                    </th>
                    <th className="cursor-pointer p-4 text-left text-xs font-medium text-gray-700 dark:text-gray-400">
                      <div className="flex items-center gap-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-400">Khách hàng</p>
                        <SortArrows />
                      </div>
                    </th>
                    <th className="cursor-pointer p-4 text-left text-xs font-medium text-gray-700 dark:text-gray-400">
                      <div className="flex items-center gap-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-400">Ngày tạo</p>
                        <SortArrows />
                      </div>
                    </th>
                    <th className="cursor-pointer p-4 text-left text-xs font-medium text-gray-700 dark:text-gray-400">
                      <div className="flex items-center gap-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-400">Ngày đến hạn</p>
                        <SortArrows />
                      </div>
                    </th>
                    <th className="p-4 text-left text-xs font-medium text-gray-700 dark:text-gray-400">Tổng</th>
                    <th className="p-4 text-left text-xs font-medium text-gray-700 dark:text-gray-400">Trạng thái</th>
                    <th className="p-4 text-left text-xs font-medium text-gray-700 dark:text-gray-400">
                      <div className="relative">
                        <span className="sr-only">Action</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-x divide-y divide-gray-200 dark:divide-gray-800">
                  {paginatedInvoices.map((invoice) => (
                    <tr key={invoice.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="p-4 whitespace-nowrap">
                        <div className="group flex items-center gap-3">
                          <label className="flex cursor-pointer items-center text-sm font-medium text-gray-700 select-none dark:text-gray-400">
                            <span className="relative">
                              <input 
                                className="sr-only" 
                                type="checkbox"
                                checked={selectedInvoices.includes(invoice.id)}
                                onChange={() => handleSelectInvoice(invoice.id)}
                              />
                              <span className="flex h-4 w-4 items-center justify-center rounded-sm border-[1.25px] bg-transparent border-gray-300 dark:border-gray-700">
                                <span className={`${selectedInvoices.includes(invoice.id) ? 'opacity-100' : 'opacity-0'}`}>
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 3L4.5 8.5L2 6" stroke="#3B82F6" strokeWidth="1.6666" strokeLinecap="round" strokeLinejoin="round"></path>
                                  </svg>
                                </span>
                              </span>
                            </span>
                          </label>
                          <Link 
                            to={`/invoice/${invoice.id.substring(1)}`}
                            className="text-xs font-medium text-gray-700 group-hover:underline dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {invoice.id}
                          </Link>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">{invoice.customer}</span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <p className="text-sm text-gray-700 dark:text-gray-400">{invoice.creationDate}</p>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <p className="text-sm text-gray-700 dark:text-gray-400">{invoice.dueDate}</p>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <p className="text-sm text-gray-700 dark:text-gray-400">{invoice.total}</p>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${getStatusBadge(invoice.status)}`}>
                          {invoice.status === 'Paid' ? 'Đã thanh toán' : invoice.status === 'Unpaid' ? 'Chưa thanh toán' : 'Nháp'}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="relative flex justify-center">
                          <button 
                            className="text-gray-500 dark:text-gray-400"
                            onClick={() => setOpenDropdown(openDropdown === invoice.id ? null : invoice.id)}
                          >
                            <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" clipRule="evenodd" d="M5.99902 10.245C6.96552 10.245 7.74902 11.0285 7.74902 11.995V12.005C7.74902 12.9715 6.96552 13.755 5.99902 13.755C5.03253 13.755 4.24902 12.9715 4.24902 12.005V11.995C4.24902 11.0285 5.03253 10.245 5.99902 10.245ZM17.999 10.245C18.9655 10.245 19.749 11.0285 19.749 11.995V12.005C19.749 12.9715 18.9655 13.755 17.999 13.755C17.0325 13.755 16.249 12.9715 16.249 12.005V11.995C16.249 11.0285 17.0325 10.245 17.999 10.245ZM13.749 11.995C13.749 11.0285 12.9655 10.245 11.999 10.245C11.0325 10.245 10.249 11.0285 10.249 11.995V12.005C10.249 12.9715 11.0325 13.755 11.999 13.755C12.9655 13.755 13.749 12.9715 13.749 12.005V11.995Z" fill=""></path>
                            </svg>
                          </button>
                          {openDropdown === invoice.id && (
                            <div className="absolute right-0 top-8 z-10 w-40 bg-white border border-gray-200 rounded-2xl shadow-lg dark:border-gray-800 dark:bg-gray-900">
                              <div className="p-2">
                                <div className="space-y-1" role="menu">
                                  <Link
                                    to={`/invoice/${invoice.id.substring(1)}`}
                                    className="text-xs flex w-full rounded-lg px-3 py-2 text-left font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                    onClick={() => setOpenDropdown(null)}
                                  >
                                    Xem chi tiết
                                  </Link>
                                  <button className="text-xs flex w-full rounded-lg px-3 py-2 text-left font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">
                                    Chỉnh sửa
                                  </button>
                                  <button className="text-xs flex w-full rounded-lg px-3 py-2 text-left font-medium text-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300">
                                    Xóa
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center flex-col sm:flex-row justify-between border-t border-gray-200 px-5 py-4 dark:border-gray-800">
              <div className="pb-3 sm:pb-0">
                <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Hiển thị <span className="text-gray-800 dark:text-white/90">{filteredInvoices.length === 0 ? 0 : startIndex + 1}</span> đến{' '}
                  <span className="text-gray-800 dark:text-white/90">{Math.min(startIndex + 10, filteredInvoices.length)}</span> của{' '}
                  <span className="text-gray-800 dark:text-white/90">{filteredInvoices.length}</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-4 sm:p-0 rounded-lg w-full sm:w-auto bg-gray-50 dark:bg-white/[0.03] dark:sm:bg-transparent sm:bg-transparent gap-2 sm:justify-normal">
                <button 
                  className={`shadow-sm flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 hover:text-gray-800 sm:p-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 ${
                    currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M2.58203 9.99868C2.58174 10.1909 2.6549 10.3833 2.80152 10.53L7.79818 15.5301C8.09097 15.8231 8.56584 15.8233 8.85883 15.5305C9.15183 15.2377 9.152 14.7629 8.85921 14.4699L5.13911 10.7472L16.6665 10.7472C17.0807 10.7472 17.4165 10.4114 17.4165 9.99715C17.4165 9.58294 17.0807 9.24715 16.6665 9.24715L5.14456 9.24715L8.85919 5.53016C9.15199 5.23717 9.15184 4.7623 8.85885 4.4695C8.56587 4.1767 8.09099 4.17685 7.79819 4.46984L2.84069 9.43049C2.68224 9.568 2.58203 9.77087 2.58203 9.99715C2.58203 9.99766 2.58203 9.99817 2.58203 9.99868Z" fill=""></path>
                  </svg>
                </button>
                <span className="block text-sm font-medium text-gray-700 sm:hidden dark:text-gray-400">
                  Trang {currentPage} của {totalPages}
                </span>
                <ul className="hidden items-center gap-0.5 sm:flex">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <li key={page}>
                      <button 
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                          currentPage === page 
                            ? 'bg-blue-500 text-white' 
                            : 'hover:bg-blue-500 text-gray-700 hover:text-white dark:text-gray-400 dark:hover:text-white'
                        }`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    </li>
                  ))}
                </ul>
                <button 
                  className={`shadow-sm flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 hover:text-gray-800 sm:p-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 ${
                    currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M17.4165 9.9986C17.4168 10.1909 17.3437 10.3832 17.197 10.53L12.2004 15.5301C11.9076 15.8231 11.4327 15.8233 11.1397 15.5305C10.8467 15.2377 10.8465 14.7629 11.1393 14.4699L14.8594 10.7472L3.33203 10.7472C2.91782 10.7472 2.58203 10.4114 2.58203 9.99715C2.58203 9.58294 2.91782 9.24715 3.33203 9.24715L14.854 9.24715L11.1393 5.53016C10.8465 5.23717 10.8467 4.7623 11.1397 4.4695C11.4327 4.1767 11.9075 4.17685 12.2003 4.46984L17.1578 9.43049C17.3163 9.568 17.4165 9.77087 17.4165 9.99715C17.4165 9.99763 17.4165 9.99812 17.4165 9.9986Z" fill=""></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoices;