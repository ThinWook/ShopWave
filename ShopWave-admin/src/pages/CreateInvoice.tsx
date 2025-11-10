import React, { useState } from 'react';
import { Link } from 'react-router';
import { formatCurrencyVi } from '../utils/format';

interface InvoiceItem {
  id: number;
  product: string;
  quantity: number;
  unitCost: number;
  discount: number;
  total: number;
}

interface NewItemForm {
  name: string;
  price: string;
  quantity: number;
  discount: number;
}

const CreateInvoice: React.FC = () => {
  const [invoiceNumber, setInvoiceNumber] = useState('WP-3434434');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  
  // Bắt đầu với danh sách trống, không dữ liệu mẫu
  const [items, setItems] = useState<InvoiceItem[]>([]);

  const [newItem, setNewItem] = useState<NewItemForm>({
    name: '',
    price: '',
    quantity: 1,
    discount: 0
  });

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateItemTotal = (unitCost: number, quantity: number, discount: number) => {
    const subtotal = unitCost * quantity;
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  };

  const addNewItem = () => {
    if (newItem.name && newItem.price) {
      const unitCost = parseFloat(newItem.price);
      const total = calculateItemTotal(unitCost, newItem.quantity, newItem.discount);
      
      const item: InvoiceItem = {
  id: items.length ? Math.max(...items.map(i => i.id)) + 1 : 1,
        product: newItem.name,
        quantity: newItem.quantity,
        unitCost: unitCost,
        discount: newItem.discount,
        total: total
      };
      
      setItems([...items, item]);
      setNewItem({ name: '', price: '', quantity: 1, discount: 0 });
    }
  };

  const updateQuantity = (change: number) => {
    setNewItem(prev => ({
      ...prev,
      quantity: Math.max(1, prev.quantity + change)
    }));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateVat = () => {
    return calculateSubtotal() * 0.1; // 10% VAT
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateVat();
  };

  const handleSaveInvoice = () => {
    console.log('Saving invoice:', {
      invoiceNumber,
      customerName,
      customerAddress,
      items,
      totals: {
        subtotal: calculateSubtotal(),
        vat: calculateVat(),
        total: calculateTotal()
      }
    });
    alert('Lưu hóa đơn thành công!');
  };

  const handlePreviewInvoice = () => {
    alert('Đang mở bản xem trước hóa đơn...');
  };

  return (
    <div className="p-4 mx-auto max-w-[1440px] md:p-6">
      <div>
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Tạo hóa đơn</h2>
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
              <li className="text-sm text-gray-800 dark:text-white/90">Tạo hóa đơn</li>
            </ol>
          </nav>
        </div>

        {/* Create Invoice Container */}
  <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.03] dark:bg-gray-900">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <h2 className="text-xl font-medium text-gray-800 dark:text-white">Tạo hóa đơn</h2>
          </div>

          {/* Customer Information Form */}
          <div className="border-b border-gray-200 p-4 sm:p-8 dark:border-gray-800">
            <form className="space-y-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Số hóa đơn</label>
                  <div className="relative">
                    <input 
                      placeholder="WP-3434434" 
                      className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-blue-300 focus:ring-blue-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-blue-800" 
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Tên khách hàng</label>
                  <div className="relative">
                    <input 
                      placeholder="John Deniyal" 
                      className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-blue-300 focus:ring-blue-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-blue-800" 
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-span-full">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Địa chỉ khách hàng</label>
                  <div className="relative">
                    <input 
                      placeholder={'Nhập địa chỉ khách hàng'} 
                      className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-blue-300 focus:ring-blue-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-blue-800" 
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Invoice Items */}
          <div className="border-b border-gray-200 p-4 sm:p-8 dark:border-gray-800">
            <div className="space-y-6">
              {/* Items Table */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-gray-700 dark:border-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr className="border-b border-gray-100 whitespace-nowrap dark:border-gray-800">
                        <th className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">STT</th>
                        <th className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">Sản phẩm</th>
                        <th className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">Số lượng</th>
                        <th className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">Đơn giá</th>
                        <th className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">Giảm giá</th>
                        <th className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">Tổng</th>
                        <th className="relative px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-400">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-white/[0.03]">
                      {items.map((item, index) => (
                        <tr key={item.id}>
                          <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">{index + 1}</td>
                          <td className="px-5 py-4 text-sm font-medium whitespace-nowrap text-gray-800 dark:text-white/90">{item.product}</td>
                          <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">{item.quantity}</td>
                          <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">{formatCurrencyVi(item.unitCost, 'USD')}</td>
                          <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">{item.discount}%</td>
                          <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">{formatCurrencyVi(item.total, 'USD')}</td>
                          <td className="px-5 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => removeItem(item.id)}
                                className="hover:fill-red-500 dark:hover:fill-red-500 cursor-pointer fill-gray-700 dark:fill-gray-400"
                              >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" clipRule="evenodd" d="M6.54142 3.7915C6.54142 2.54886 7.54878 1.5415 8.79142 1.5415H11.2081C12.4507 1.5415 13.4581 2.54886 13.4581 3.7915V4.0415H15.6252H16.666C17.0802 4.0415 17.416 4.37729 17.416 4.7915C17.416 5.20572 17.0802 5.5415 16.666 5.5415H16.3752V8.24638V13.2464V16.2082C16.3752 17.4508 15.3678 18.4582 14.1252 18.4582H5.87516C4.63252 18.4582 3.62516 17.4508 3.62516 16.2082V13.2464V8.24638V5.5415H3.3335C2.91928 5.5415 2.5835 5.20572 2.5835 4.7915C2.5835 4.37729 2.91928 4.0415 3.3335 4.0415H4.37516H6.54142V3.7915ZM14.8752 13.2464V8.24638V5.5415H13.4581H12.7081H7.29142H6.54142H5.12516V8.24638V13.2464V16.2082C5.12516 16.6224 5.46095 16.9582 5.87516 16.9582H14.1252C14.5394 16.9582 14.8752 16.6224 14.8752 16.2082V13.2464ZM8.04142 4.0415H11.9581V3.7915C11.9581 3.37729 11.6223 3.0415 11.2081 3.0415H8.79142C8.37721 3.0415 8.04142 3.37729 8.04142 3.7915V4.0415ZM8.3335 7.99984C8.74771 7.99984 9.0835 8.33562 9.0835 8.74984V13.7498C9.0835 14.1641 8.74771 14.4998 8.3335 14.4998C7.91928 14.4998 7.5835 14.1641 7.5835 13.7498V8.74984C7.5835 8.33562 7.91928 7.99984 8.3335 7.99984ZM12.4168 8.74984C12.4168 8.33562 12.081 7.99984 11.6668 7.99984C11.2526 7.99984 10.9168 8.33562 10.9168 8.74984V13.7498C10.9168 14.1641 11.2526 14.4998 11.6668 14.4998C12.081 14.4998 12.4168 14.1641 12.4168 13.7498V8.74984Z" fill=""></path>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add New Item Form */}
              <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:p-6 dark:border-gray-800 dark:bg-gray-900">
                <form onSubmit={(e) => { e.preventDefault(); addNewItem(); }}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-12">
                    <div className="w-full lg:col-span-3">
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Tên sản phẩm</label>
                      <div className="relative">
                        <input 
                          placeholder={'Nhập tên sản phẩm'} 
                          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-blue-300 focus:ring-blue-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-blue-800" 
                          type="text" 
                          value={newItem.name} 
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                          name="name"
                        />
                      </div>
                    </div>
                    <div className="w-full lg:col-span-3">
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Giá</label>
                      <div className="relative">
                        <input 
                          placeholder={'Nhập giá sản phẩm'} 
                          min="0" 
                          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-blue-300 focus:ring-blue-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-blue-800" 
                          type="number" 
                          value={newItem.price} 
                          onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                          name="price"
                        />
                      </div>
                    </div>
                    <div className="w-full lg:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Số lượng</label>
                      <div className="flex h-11 divide-x divide-gray-300 overflow-hidden rounded-lg border border-gray-300 dark:divide-gray-800 dark:border-gray-700">
                        <button 
                          type="button" 
                          onClick={() => updateQuantity(-1)}
                          className="inline-flex w-1/3 items-center justify-center bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                          <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6.66699 12H18.6677" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                          </svg>
                        </button>
                        <div className="w-1/3">
                          <input 
                            min="1" 
                            className="h-full w-full border-0 bg-white text-center text-sm text-gray-700 outline-none focus:ring-0 dark:bg-gray-900 dark:text-gray-400" 
                            type="number" 
                            value={newItem.quantity} 
                            onChange={(e) => setNewItem({ ...newItem, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                            name="quantity"
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => updateQuantity(1)}
                          className="inline-flex w-1/3 items-center justify-center bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                          <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6.66699 12.0002H18.6677M12.6672 6V18.0007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="w-full lg:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Giảm giá</label>
                      <div className="relative">
                        <select 
                          name="discount" 
                          value={newItem.discount}
                          onChange={(e) => setNewItem({ ...newItem, discount: parseInt(e.target.value) })}
                          className="shadow-sm bg-none appearance-none focus:border-blue-300 focus:ring-blue-500/10 dark:focus:border-blue-800 h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                        >
                          <option value="0">0%</option>
                          <option value="10">10%</option>
                          <option value="20">20%</option>
                          <option value="50">50%</option>
                        </select>
                        <svg className="absolute text-gray-700 dark:text-gray-400 right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4.79175 8.02075L10.0001 13.2291L15.2084 8.02075" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="flex w-full items-end lg:col-span-2">
                      <button 
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 rounded-lg transition w-full h-11 px-5 py-3.5 text-sm bg-blue-500 text-white shadow-sm hover:bg-blue-600 disabled:bg-blue-300"
                      >
                        Lưu sản phẩm
                      </button>
                    </div>
                  </div>
                </form>
                <div className="mt-5 flex max-w-2xl items-center gap-2">
                  <svg className="text-gray-500 dark:text-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 7.22485H10.0007" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M10.0004 9.34575V12.8661M17.7087 10.0001C17.7087 14.2573 14.2575 17.7084 10.0003 17.7084C5.74313 17.7084 2.29199 14.2573 2.29199 10.0001C2.29199 5.74289 5.74313 2.29175 10.0003 2.29175C14.2575 2.29175 17.7087 5.74289 17.7087 10.0001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sau khi điền thông tin sản phẩm, nhấn Enter/Return hoặc bấm "Lưu sản phẩm" để thêm vào danh sách.</p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="flex flex-wrap justify-between sm:justify-end">
                <div className="w-full space-y-1 text-right sm:w-[220px]">
                  <p className="mb-4 text-left text-sm font-medium text-gray-800 dark:text-white/90">Tổng kết đơn hàng</p>
                  <ul className="space-y-2">
                    <li className="flex justify-between gap-5">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Tạm tính</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-400">{formatCurrencyVi(calculateSubtotal(), 'USD')}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">VAT (10%):</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-400">{formatCurrencyVi(calculateVat(), 'USD')}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="font-medium text-gray-700 dark:text-gray-400">Tổng</span>
                      <span className="text-lg font-semibold text-gray-800 dark:text-white/90">{formatCurrencyVi(calculateTotal(), 'USD')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button 
                onClick={handlePreviewInvoice}
                className="inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M2.46585 10.7925C2.23404 10.2899 2.23404 9.71023 2.46585 9.20764C3.78181 6.35442 6.66064 4.375 10.0003 4.375C13.3399 4.375 16.2187 6.35442 17.5347 9.20765C17.7665 9.71024 17.7665 10.2899 17.5347 10.7925C16.2187 13.6458 13.3399 15.6252 10.0003 15.6252C6.66064 15.6252 3.78181 13.6458 2.46585 10.7925Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M13.0212 10C13.0212 11.6684 11.6687 13.0208 10.0003 13.0208C8.33196 13.0208 6.97949 11.6684 6.97949 10C6.97949 8.33164 8.33196 6.97917 10.0003 6.97917C11.6687 6.97917 13.0212 8.33164 13.0212 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                Xem trước hóa đơn
              </button>
              <button 
                onClick={handleSaveInvoice}
                className="inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-blue-500 text-white shadow-sm hover:bg-blue-600 disabled:bg-blue-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M13.333 16.6666V12.9166C13.333 12.2262 12.7734 11.6666 12.083 11.6666L7.91634 11.6666C7.22599 11.6666 6.66634 12.2262 6.66634 12.9166L6.66635 16.6666M9.99967 5.83325H6.66634M15.4163 16.6666H4.58301C3.89265 16.6666 3.33301 16.1069 3.33301 15.4166V4.58325C3.33301 3.8929 3.89265 3.33325 4.58301 3.33325H12.8171C13.1483 3.33325 13.4659 3.46468 13.7003 3.69869L16.2995 6.29384C16.5343 6.52832 16.6662 6.84655 16.6662 7.17841L16.6663 15.4166C16.6663 16.1069 16.1066 16.6666 15.4163 16.6666Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                Lưu hóa đơn
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;