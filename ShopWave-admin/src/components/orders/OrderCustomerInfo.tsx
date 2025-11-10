import type { OrderDetail } from "../../types/order";

type Props = {
  order: OrderDetail;
};

export default function OrderCustomerInfo({ order }: Props) {
  return (
    <div className="p-4 space-y-3">
      {/* Tên khách hàng */}
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Tên khách hàng</div>
        <div className="text-base font-medium text-gray-900 dark:text-white mt-1">
          {order.customerName}
        </div>
      </div>

      {/* Email */}
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
        <div className="text-base text-gray-900 dark:text-white mt-1">
          <a
            href={`mailto:${order.customerEmail}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {order.customerEmail}
          </a>
        </div>
      </div>

      {/* Số điện thoại */}
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Số điện thoại</div>
        <div className="text-base text-gray-900 dark:text-white mt-1">
          <a
            href={`tel:${order.customerPhone}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {order.customerPhone}
          </a>
        </div>
      </div>
    </div>
  );
}
