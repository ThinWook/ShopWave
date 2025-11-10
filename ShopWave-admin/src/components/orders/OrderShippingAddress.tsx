import type { OrderDetail } from "../../types/order";

type Props = {
  order: OrderDetail;
};

export default function OrderShippingAddress({ order }: Props) {
  return (
    <div className="p-4 space-y-2">
      <div className="text-sm text-gray-900 dark:text-white">
        {order.shippingAddress}
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-300">
        {order.shippingWard}
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-300">
        {order.shippingDistrict}
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-300">
        {order.shippingCity}
      </div>
      
      {order.shippingNotes && (
        <div className="mt-3 pt-3 border-t dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ghi chú:</div>
          <div className="text-sm text-gray-900 dark:text-white italic">
            "{order.shippingNotes}"
          </div>
        </div>
      )}
    </div>
  );
}
