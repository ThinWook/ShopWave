import { useParams } from "react-router";
import { formatCurrencyVi } from '../utils/format';
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

interface OrderItem {
  id: number;
  product: string;
  quantity: number;
  unitCost: number;
  discount: number;
  total: number;
}

interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  country: string;
  address: string;
}

interface OrderHistory {
  id: number;
  title: string;
  description: string;
  time: string;
  date: string;
  icon: React.ReactNode;
}

const mockOrderItems: OrderItem[] = [];

const mockCustomer: CustomerDetails = {
  name: "",
  email: "",
  phone: "",
  country: "",
  address: "",
};

const mockOrderHistory: OrderHistory[] = [];

export default function SingleTransaction() {
  const { id } = useParams();
  
  // Calculate totals
  const subtotal = mockOrderItems.reduce((sum, item) => sum + item.total, 0);
  const vatRate = 0.1;
  const vat = subtotal * vatRate;
  const total = subtotal + vat;

  const formatCurrency = (amount: number) => {
    // Show amounts in Vietnamese Dong throughout the admin UI
    return formatCurrencyVi(amount, 'VND');
  };

  const formatDiscount = (discount: number) => {
    return `${discount}%`;
  };

  return (
    <div>
      <PageMeta
        title="Single Transaction | TailAdmin - React.js Admin Dashboard Template"
        description="View detailed information about a specific transaction"
      />
      
      <div className="p-4 mx-auto max-w-[--breakpoint-2xl] md:p-6">
        <PageBreadcrumb pageTitle="Single Transaction" />
        
        <div className="space-y-6">
          {/* Transaction Header */}
          <div className="flex flex-col justify-between gap-6 rounded-2xl border border-gray-200 bg-white px-6 py-5 sm:flex-row sm:items-center dark:border-white/[0.03] dark:bg-gray-900">
            <div className="flex flex-col gap-2.5 divide-gray-300 sm:flex-row sm:divide-x dark:divide-gray-700">
              <div className="flex items-center gap-2 sm:pr-3">
                <span className="text-base font-medium text-gray-700 dark:text-gray-400">
                  Order ID : #{id || "34834"}
                </span>
                <span className="bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500 inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium">
                  Completed
                </span>
              </div>
              <p className="text-sm text-gray-500 sm:pl-3 dark:text-gray-400">
                Due date: 25 August 2025
              </p>
            </div>
            <div className="flex gap-3">
              <button className="bg-brand-500 shadow-theme-xs hover:bg-brand-600 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition">
                View Receipt
              </button>
              <button className="shadow-theme-xs inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-700 ring-1 ring-gray-300 transition hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]">
                Refund
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Order Details */}
            <div className="lg:col-span-8 2xl:col-span-9">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.03] dark:bg-gray-900">
                <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
                  Order Details
                </h2>
                
                <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="custom-scrollbar overflow-x-auto">
                    <table className="min-w-full text-left text-sm text-gray-700 dark:border-gray-800">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr className="border-b border-gray-100 whitespace-nowrap dark:border-gray-800">
                          <th className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">
                            S. No.
                          </th>
                          <th className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">
                            Products
                          </th>
                          <th className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">
                            Quantity
                          </th>
                          <th className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">
                            Unit Cost
                          </th>
                          <th className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">
                            Discount
                          </th>
                          <th className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
                        {mockOrderItems.length === 0 ? (
                          <tr>
                            <td className="px-5 py-6 text-sm text-gray-500 dark:text-gray-400" colSpan={6}>No items</td>
                          </tr>
                        ) : (
                        mockOrderItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                              {item.id}
                            </td>
                            <td className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-800 dark:text-white/90">
                              {item.product}
                            </td>
                            <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                              {item.quantity}
                            </td>
                            <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                              {formatCurrency(item.unitCost)}
                            </td>
                            <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                              {formatDiscount(item.discount)}
                            </td>
                            <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="flex flex-wrap justify-between sm:justify-end">
                  <div className="mt-6 w-full space-y-1 text-right sm:w-[220px]">
                    <p className="mb-4 text-left text-sm font-medium text-gray-800 dark:text-white/90">
                      Order summary
                    </p>
                    <ul className="space-y-2">
                      <li className="flex justify-between gap-5">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Sub Total</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                          {formatCurrency(subtotal)}
                        </span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Vat (10%):</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                          {formatCurrency(vat)}
                        </span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="font-medium text-gray-700 dark:text-gray-400">Total</span>
                        <span className="text-lg font-semibold text-gray-800 dark:text-white/90">
                          {formatCurrency(total)}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 lg:col-span-4 2xl:col-span-3">
              {/* Customer Details */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
                  Customer Details
                </h2>
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  <li className="flex items-start gap-5 py-2.5">
                    <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">Name</span>
                    <span className="w-1/2 text-sm text-gray-700 sm:w-2/3 dark:text-gray-400">
                      {mockCustomer.name || '-'}
                    </span>
                  </li>
                  <li className="flex items-start gap-5 py-2.5">
                    <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">Email</span>
                    <span className="w-1/2 text-sm text-gray-700 sm:w-2/3 dark:text-gray-400">
                      {mockCustomer.email || '-'}
                    </span>
                  </li>
                  <li className="flex items-start gap-5 py-2.5">
                    <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">Phone</span>
                    <span className="w-1/2 text-sm text-gray-700 sm:w-2/3 dark:text-gray-400">
                      {mockCustomer.phone || '-'}
                    </span>
                  </li>
                  <li className="flex items-start gap-5 py-2.5">
                    <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">Country</span>
                    <span className="w-1/2 text-sm text-gray-700 sm:w-2/3 dark:text-gray-400">
                      {mockCustomer.country || '-'}
                    </span>
                  </li>
                  <li className="flex items-start gap-5 py-2.5">
                    <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">Address</span>
                    <span className="w-1/2 text-sm text-gray-700 sm:w-2/3 dark:text-gray-400">
                      {mockCustomer.address || '-'}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Order History */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
                  Order History
                </h2>
                
                {mockOrderHistory.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No history</p>
                ) : (
                mockOrderHistory.map((history, index) => (
                  <div 
                    key={history.id} 
                    className={`relative ${index < mockOrderHistory.length - 1 ? 'pb-7' : ''} pl-11`}
                  >
                    <div className="absolute top-0 left-0 z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-50 bg-white text-gray-700 ring ring-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-800">
                      {history.icon}
                    </div>
                    <div className="ml-4 flex justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-white/90">
                          {history.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {history.description}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {history.time}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {history.date}
                        </p>
                      </div>
                    </div>
                    {index < mockOrderHistory.length - 1 && (
                      <div className="absolute top-8 left-6 h-full w-px border border-dashed border-gray-300 dark:border-gray-700"></div>
                    )}
                  </div>
                ))
                )}

                <div className="mt-5 flex items-center justify-center gap-2">
                  <button className="shadow-theme-xs rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                    Resend
                  </button>
                  <button className="shadow-theme-xs rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                    Forward
                  </button>
                  <button className="shadow-theme-xs rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                    Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}