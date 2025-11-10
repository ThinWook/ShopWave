import type { OrderDetail } from "../../types/order";

type Props = {
  order: OrderDetail;
};

export default function PriceBreakdown({ order }: Props) {
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(amount) + " ₫";
  }

  return (
    <div className="p-4 space-y-3">
      {/* Tạm tính */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Tạm tính:</span>
        <span className="text-gray-900 dark:text-white">{formatCurrency(order.subTotal)}</span>
      </div>

      {/* Phí vận chuyển */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Phí vận chuyển:</span>
        <span className="text-gray-900 dark:text-white">{formatCurrency(order.shippingFee)}</span>
      </div>

      {/* Giảm giá Bậc thang */}
      {order.progressiveDiscountAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Giảm giá (Bậc thang):</span>
          <span className="text-red-600 dark:text-red-400">
            -{formatCurrency(order.progressiveDiscountAmount)}
          </span>
        </div>
      )}

      {/* Giảm giá Voucher */}
      {order.voucherDiscountAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Giảm giá (Voucher: {order.voucherCode}):
          </span>
          <span className="text-red-600 dark:text-red-400">
            -{formatCurrency(order.voucherDiscountAmount)}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t dark:border-gray-700 my-3"></div>

      {/* Tổng cộng */}
      <div className="flex justify-between text-lg font-bold">
        <span className="text-gray-900 dark:text-white">TỔNG CỘNG (Đã thu):</span>
        <span className="text-blue-600 dark:text-blue-400">{formatCurrency(order.totalAmount)}</span>
      </div>
    </div>
  );
}
