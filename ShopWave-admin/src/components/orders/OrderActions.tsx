import type { OrderDetail, OrderStatus, PaymentStatus } from "../../types/order";

type Props = {
  order: OrderDetail;
  onStatusChange: (status: OrderStatus) => void;
  onPaymentStatusChange: (paymentStatus: PaymentStatus) => void;
  updating: boolean;
};

export default function OrderActions({
  order,
  onStatusChange,
  onPaymentStatusChange,
  updating,
}: Props) {
  const orderStatuses: { value: OrderStatus; label: string }[] = [
    { value: "PROCESSING", label: "Đang xử lý" },
    { value: "PENDING_PAYMENT", label: "Chờ thanh toán" },
    { value: "SHIPPED", label: "Đã giao" },
    { value: "COMPLETED", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Đã hủy" },
  ];

  const paymentStatuses: { value: PaymentStatus; label: string }[] = [
    { value: "UNPAID", label: "Chưa thanh toán" },
    { value: "PAID", label: "Đã thanh toán" },
  ];

  function handlePrintInvoice() {
    // TODO: Implement print invoice
    alert("Chức năng in hóa đơn đang được phát triển");
  }

  function handleResendEmail() {
    // TODO: Implement resend email
    alert("Chức năng gửi lại email đang được phát triển");
  }

  return (
    <div className="p-4 space-y-4">
      {/* Trạng thái Đơn hàng */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Trạng thái Đơn hàng:
        </label>
        <select
          value={order.status}
          onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
          disabled={updating}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {orderStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Trạng thái Thanh toán */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Trạng thái Thanh toán:
        </label>
        <select
          value={order.paymentStatus}
          onChange={(e) => onPaymentStatusChange(e.target.value as PaymentStatus)}
          disabled={updating}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paymentStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        {order.paymentStatus === "UNPAID" && (
          <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
            💡 Quan trọng cho COD: Chuyển sang "Đã thanh toán" khi shipper báo đã thu tiền
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="border-t dark:border-gray-700 my-4"></div>

      {/* Nút Phụ */}
      <div className="space-y-2">
        <button
          onClick={handlePrintInvoice}
          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          🖨️ In hóa đơn
        </button>
        <button
          onClick={handleResendEmail}
          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          📧 Gửi lại Email xác nhận
        </button>
      </div>

      {updating && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
