"use client";

import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Trang /checkout/result là ReturnUrl mà VNPay (hoặc MoMo) redirect người dùng quay về
 * sau khi người dùng hoàn tất hoặc hủy thanh toán ở cổng.
 *
 * Luồng chuẩn:
 * 1. Người dùng ở trang Checkout -> backend trả về paymentUrl -> window.location.href
 * 2. Người dùng thanh toán thành công -> cổng gọi Webhook (server to server) cập nhật trạng thái Order.
 * 3. Cổng redirect trình duyệt về ReturnUrl (trang này) kèm các query string.
 * 4. Trang này kiểm tra mã phản hồi và điều hướng tới trang Thank You.
 *
 * LƯU Ý: Nên để backend thêm tham số orderId vào URL: /checkout/result?orderId=123&vnp_ResponseCode=00
 * Hiện tại ví dụ sử dụng vnp_TxnRef làm orderId giả định. Điều chỉnh nếu backend khác đi.
 */

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // VNPay chuẩn: vnp_ResponseCode === '00' là thành công.
  const responseCode = searchParams.get('vnp_ResponseCode');
  // TxnRef (tham chiếu giao dịch) - giả sử chính là orderId nếu backend mapping.
  const txnRef = searchParams.get('vnp_TxnRef');
  // Nếu backend trả thẳng orderId thì ưu tiên dùng.
  const orderIdParam = searchParams.get('orderId');

  const isSuccess = responseCode === '00';
  const targetOrderId = orderIdParam || txnRef; // Fallback dùng txnRef nếu không có orderId.

  useEffect(() => {
    // Thành công -> chuyển tới trang cảm ơn. Tin tưởng webhook đã cập nhật DB.
    if (isSuccess && targetOrderId) {
      router.replace(`/thank-you?orderId=${encodeURIComponent(targetOrderId)}`);
    }
  }, [isSuccess, targetOrderId, router]);

  if (!isSuccess) {
    // UI khi thanh toán thất bại
    // Thiết kế lại 2 nút: "Thử thanh toán lại" (primary) và "Quay lại giỏ hàng" (secondary)
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-red-600">Thanh toán thất bại</h1>
        <p className="mb-1 text-gray-700">
          Mã phản hồi:
          <strong className="font-extrabold text-red-600 ml-2 text-lg">{responseCode || 'N/A'}</strong>
        </p>
  <p className="mb-6 text-gray-600">Vui lòng thử lại hoặc chọn phương thức khác.</p>

        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 place-items-center">
          {/* Primary: Thử thanh toán lại */}
          <Link
            href="/checkout"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Thử thanh toán lại"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Thử thanh toán lại
          </Link>

          {/* Secondary: Quay lại giỏ hàng */}
          <Link
            href="/cart"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md border border-gray-300 text-sm font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Quay lại giỏ hàng"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="15 18 9 12 15 6" />
              <path d="M19 12H9" />
            </svg>
            Quay lại giỏ hàng
          </Link>
        </div>
      </div>
    );
  }

  // Loading UI trong khi tự redirect.
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] p-10 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-6" />
      <p className="text-sm text-gray-600">Đang xác thực thanh toán, vui lòng chờ...</p>
      {targetOrderId && <p className="text-xs text-gray-400 mt-2">Đơn hàng: {targetOrderId}</p>}
    </div>
  );
}

export default function CheckoutResultPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Đang tải...</div>}>
      <ResultContent />
    </Suspense>
  );
}
