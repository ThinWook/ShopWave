import type { OrderDetail } from "../../types/order";

type Props = {
  order: OrderDetail;
};

export default function OrderBillingAddress({ order }: Props) {
  // Nếu không có địa chỉ thanh toán riêng, hiển thị thông báo
  if (!order.billingAddress) {
    return (
      <div className="p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          Giống địa chỉ giao hàng
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      <div className="text-sm text-gray-900 dark:text-white">
        {order.billingAddress}
      </div>
      {order.billingWard && (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {order.billingWard}
        </div>
      )}
      {order.billingDistrict && (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {order.billingDistrict}
        </div>
      )}
      {order.billingCity && (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {order.billingCity}
        </div>
      )}
    </div>
  );
}
