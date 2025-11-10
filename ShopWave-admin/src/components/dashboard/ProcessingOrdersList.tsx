import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { getOrders } from "../../services/orderService";
import type { Order } from "../../types/order";

function shortOrderNumber(orderNumber: string) {
  if (!orderNumber) return "—";
  if (orderNumber.length <= 8) return orderNumber;
  return `${orderNumber.slice(0, 3)}...${orderNumber.slice(-4)}`;
}

export default function ProcessingOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getOrders({ status: "PROCESSING", pageSize: 5 }).then((res) => {
      if (!mounted) return;
      setOrders(res.orders ?? []);
      setLoading(false);
    }).catch((err) => {
      console.error("load processing orders", err);
      if (!mounted) return;
      setOrders([]);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="rounded-lg bg-white dark:bg-slate-800 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-600">Đơn hàng chờ xử lý</div>
        <div className="text-xs text-slate-400">Mới nhất</div>
      </div>

      <div className="mt-3">
        {loading ? <div className="text-sm text-slate-400">Đang tải…</div> : (
          orders.length === 0 ? <div className="text-sm text-slate-400">Không có đơn hàng mới.</div> : (
            <ul className="divide-y divide-slate-100">
              {orders.map((o) => (
                <li key={o.id} className="py-2">
                  <Link to={`/orders/${o.id}`} className="flex items-center justify-between hover:bg-slate-50 rounded p-1">
                    <div className="text-sm font-medium text-slate-800">{shortOrderNumber(o.orderNumber)} <span className="text-slate-500">({o.shippingFullName})</span></div>
                    <div className="text-sm text-slate-600">{o.totalAmount.toLocaleString('vi-VN')} ₫</div>
                    <div className="text-xs text-slate-400 ml-3">{formatDistanceToNow(new Date(o.orderDate), { addSuffix: true })}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}
