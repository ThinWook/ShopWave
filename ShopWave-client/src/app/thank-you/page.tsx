"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

// Local parse fallback (kept in case backend returns only shippingAddress JSON)

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  totalPrice: number;
  imageUrl?: string | null;
  // snapshot of selected options if backend provides
  selectedOptions?: Array<{ name: string; value: string }>;
}

interface OrderDetailResponse {
  id: string;
  orderNumber: string;
  totalAmount: number;
  subTotal?: number;
  shippingFee?: number;
  progressiveDiscountAmount?: number;
  voucherDiscountAmount?: number;
  discountAmount?: number;
  voucherCode?: string | null;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string | null;
  orderItems: OrderItem[];
  // Flattened shipping fields (preferred backend output)
  shippingFullName?: string;
  shippingPhone?: string;
  shippingStreet?: string;
  shippingWard?: string;
  shippingDistrict?: string;
  shippingProvince?: string;
  // Fallback raw address JSON string (older backend format)
  shippingAddress?: string | null;
}

function parseAddressFallback(addrJson: string | null | undefined) {
  if (!addrJson) return {} as const;
  try {
    const obj = JSON.parse(addrJson);
    return {
      shippingFullName: obj.fullName || obj.name || '',
      shippingPhone: obj.phone || obj.tel || '',
      shippingStreet: obj.street || obj.addressLine1 || obj.address || '',
      shippingWard: obj.ward || obj.subDistrict || '',
      shippingDistrict: obj.district || obj.cityDistrict || obj.city || '',
      shippingProvince: obj.province || obj.state || obj.region || '',
    };
  } catch {
    return {} as const;
  }
}

function formatCurrency(v: number | undefined) {
  if (typeof v !== 'number') return '0 ₫';
  return v.toLocaleString('vi-VN') + ' ₫';
}

function pretty(v: unknown) {
  const s = (v ?? '').toString().trim();
  return s || '—';
}

// Helpers to label Vietnamese address parts nicely
function labelWard(ward?: string | null) {
  const s = (ward ?? '').toString().trim();
  if (!s) return '';
  const lower = s.toLowerCase();
  if (/^(phường|xã|thị trấn)/i.test(lower)) return s; // already labeled
  return `Phường ${s}`;
}

function labelDistrict(d?: string | null) {
  const s = (d ?? '').toString().trim();
  if (!s) return '';
  const lower = s.toLowerCase();
  if (/^(quận|huyện|tp\.?|thành phố|thị xã|thị trấn)/i.test(lower)) return s; // already labeled
  if (/^\d+$/.test(s)) return `Quận ${s}`; // numbers like "2"
  return `Quận ${s}`;
}

function labelProvince(p?: string | null) {
  const s = (p ?? '').toString().trim();
  if (!s) return '';
  const lower = s.toLowerCase();
  if (/^(tp\.?|thành phố|tỉnh)/i.test(lower)) return s; // already labeled
  const centrallyRun = ['hồ chí minh', 'ha noi', 'hà nội', 'đà nẵng', 'da nang', 'hải phòng', 'hai phong', 'cần thơ', 'can tho'];
  if (centrallyRun.some(k => lower.includes(k))) return `TP. ${s}`;
  return `Tỉnh ${s}`;
}

function ThankYouContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;
    if (!orderId) {
      router.push('/');
      return;
    }

    const load = async () => {
      setIsLoading(true); setError(null);
      try {
        const data = await api.orders.getById(orderId!, { signal });
        const merged = {
          ...data,
          ...(parseAddressFallback((data as any).shippingAddress)),
        } as OrderDetailResponse;
        if (!signal.aborted) setOrder(merged);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        if (!signal.aborted) setError(err.message || 'Lỗi tải đơn hàng');
      } finally {
        if (!signal.aborted) setIsLoading(false);
      }
    };
    load();
    return () => { abortController.abort(); };
  }, [orderId, router]);

  if (isLoading) return <div className="p-10 text-center">Đang tải xác nhận đơn hàng...</div>;
  if (error) return <div className="p-10 text-center text-red-600">Lỗi: {error}</div>;
  if (!order) return <div className="p-10 text-center">Không tìm thấy thông tin đơn hàng.</div>;

  const addressLine = [
      order.shippingStreet,
      labelWard(order.shippingWard),
      labelDistrict(order.shippingDistrict),
      labelProvince(order.shippingProvince)
    ]
    .map((v) => (v ?? '').toString().trim())
    .filter(Boolean)
    .join(', ');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <svg className="mx-auto h-16 w-16 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12l2 2 4-4" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        <h1 className="text-3xl font-bold mt-4">Cảm ơn bạn đã đặt hàng!</h1>
        <p className="text-gray-600 mt-2">
          Đơn hàng của bạn (Mã: <strong>{order.orderNumber}</strong>) đã được tiếp nhận.
        </p>
      </div>

      <div className="p-6 border rounded-lg mb-6 bg-white/50">
        <h2 className="text-xl font-semibold mb-4">Sản phẩm đã đặt</h2>
        <div className="space-y-4">
          {order.orderItems.map(item => (
            <div key={item.id} className="flex gap-4 items-center border-b pb-4 last:border-b-0">
              {item.imageUrl && <img src={item.imageUrl} alt={item.productName} className="w-16 h-16 rounded-md object-cover" />}
              <div className="flex-grow">
                <p className="font-semibold">{item.productName}</p>
                {item.selectedOptions && item.selectedOptions.length > 0 && (
                  <p className="text-xs text-gray-500">{item.selectedOptions.map(o => `${o.name}: ${o.value}`).join(', ')}</p>
                )}
                <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
              </div>
              <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border rounded-lg bg-white/50">
          <h2 className="text-xl font-semibold mb-4">Thông tin Giao hàng</h2>
          <div className="space-y-1 text-sm">
            <p><strong>Khách hàng:</strong> {pretty(order.shippingFullName)}</p>
            <p><strong>Số điện thoại:</strong> {pretty(order.shippingPhone)}</p>
            <p><strong>Địa chỉ:</strong> {pretty(addressLine)}</p>
          </div>
        </div>
        <div className="p-6 border rounded-lg bg-white/50">
          <h2 className="text-xl font-semibold mb-4">Thông tin Thanh toán</h2>
          <p><strong>Phương thức:</strong> {order.paymentMethod}</p>
          <p><strong>Trạng thái:</strong> {order.paymentStatus}</p>
          <hr className="my-3" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span>{formatCurrency(order.subTotal ?? order.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Phí vận chuyển:</span>
              <span>{formatCurrency(order.shippingFee ?? 0)}</span>
            </div>
            {typeof order.progressiveDiscountAmount === 'number' && order.progressiveDiscountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá đặc biệt:</span>
                <span>- {formatCurrency(order.progressiveDiscountAmount)}</span>
              </div>
            )}
            {typeof order.voucherDiscountAmount === 'number' && order.voucherDiscountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Voucher{order.voucherCode ? ` (${order.voucherCode})` : ''}:</span>
                <span>- {formatCurrency(order.voucherDiscountAmount)}</span>
              </div>
            )}
            {typeof order.discountAmount === 'number' && order.discountAmount > 0 && (
              <div className="flex justify-between font-medium text-green-700">
                <span>Tổng giảm giá:</span>
                <span>- {formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Tổng cộng:</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-10">
        <Link href="/products" className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
          Tiếp tục mua sắm
        </Link>
        <Link href="/orders" className="inline-block ml-4 px-6 py-3 text-blue-600 hover:underline">
          Xem lịch sử đơn hàng
        </Link>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="text-center p-10">Đang tải xác nhận...</div>}>
      <ThankYouContent />
    </Suspense>
  );
}
