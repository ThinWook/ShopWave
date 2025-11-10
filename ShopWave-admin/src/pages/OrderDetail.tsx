import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  getOrderDetail, 
  updateOrderStatus, 
  updateOrderPaymentStatus 
} from "../services/orderService";
import type { OrderDetail, OrderStatus, PaymentStatus } from "../types/order";
import { useToast } from "../context/ToastContext";
import OrderItemsTable from "../components/orders/OrderItemsTable";
import PriceBreakdown from "../components/orders/PriceBreakdown";
import TransactionsTable from "../components/orders/TransactionsTable";
import OrderActions from "../components/orders/OrderActions";
import OrderCustomerInfo from "../components/orders/OrderCustomerInfo";
import OrderShippingAddress from "../components/orders/OrderShippingAddress";
import OrderBillingAddress from "../components/orders/OrderBillingAddress";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // 🔍 Validation: Kiểm tra ID hợp lệ
    if (!id || id === ":id" || id.trim() === "") {
      console.error("[OrderDetail] Invalid ID:", id);
      toast.show({ type: "error", message: "ID đơn hàng không hợp lệ" });
      navigate("/orders");
      return;
    }
    
    // 🐛 Debug: Log ID đang được sử dụng
    console.log("[OrderDetail] Loading order with ID:", id);
    
    loadOrderDetail();
  }, [id]);

  async function loadOrderDetail() {
    // Double-check ID trước khi gọi API
    if (!id || id === ":id") {
      setError("ID đơn hàng không hợp lệ");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getOrderDetail(id);
      setOrder(data);
    } catch (err: any) {
      const message = err?.message ?? "Không thể tải chi tiết đơn hàng";
      setError(message);
      toast.show({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: OrderStatus) {
    if (!order || updating) return;
    
    // 🐛 Debug: Verify giá trị đang được gửi
    console.log("[OrderDetail] handleStatusChange called with:", newStatus);
    console.log("[OrderDetail] newStatus type:", typeof newStatus);
    
    try {
      setUpdating(true);
      await updateOrderStatus(order.id, newStatus);
      setOrder({ ...order, status: newStatus });
      toast.show({ type: "success", message: "Cập nhật trạng thái đơn hàng thành công" });
    } catch (err: any) {
      const message = err?.message ?? "Không thể cập nhật trạng thái";
      console.error("[OrderDetail] Update status error:", err);
      toast.show({ type: "error", message });
    } finally {
      setUpdating(false);
    }
  }

  async function handlePaymentStatusChange(newPaymentStatus: PaymentStatus) {
    if (!order || updating) return;
    
    // 🐛 Debug: Verify giá trị đang được gửi
    console.log("[OrderDetail] handlePaymentStatusChange called with:", newPaymentStatus);
    console.log("[OrderDetail] newPaymentStatus type:", typeof newPaymentStatus);
    
    try {
      setUpdating(true);
      await updateOrderPaymentStatus(order.id, newPaymentStatus);
      setOrder({ ...order, paymentStatus: newPaymentStatus });
      toast.show({ type: "success", message: "Cập nhật trạng thái thanh toán thành công" });
    } catch (err: any) {
      const message = err?.message ?? "Không thể cập nhật trạng thái thanh toán";
      console.error("[OrderDetail] Update payment status error:", err);
      toast.show({ type: "error", message });
    } finally {
      setUpdating(false);
    }
  }

  function handleGoBack() {
    navigate("/orders");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-red-600 text-lg">{error || "Không tìm thấy đơn hàng"}</div>
        <button
          onClick={handleGoBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={handleGoBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Quay lại"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold">Chi tiết Đơn hàng #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ngày đặt: {new Date(order.orderDate).toLocaleString("vi-VN")}
          </p>
        </div>
      </div>

      {/* Layout 2 cột */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột chính (Bên trái) - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thẻ Chi tiết Sản phẩm */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold">Chi tiết Sản phẩm</h2>
            </div>
            <OrderItemsTable items={order.items} />
          </div>

          {/* Thẻ Tài chính */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold">Tài chính</h2>
            </div>
            <PriceBreakdown order={order} />
          </div>

          {/* Thẻ Lịch sử Giao dịch */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold">Lịch sử Giao dịch</h2>
            </div>
            <TransactionsTable transactions={order.transactions} />
          </div>
        </div>

        {/* Cột phụ (Sidebar Bên phải) - 1/3 */}
        <div className="lg:col-span-1 space-y-6">
          {/* Sticky sidebar */}
          <div className="lg:sticky lg:top-6 space-y-6">
            {/* Thẻ Hành động */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4 border-b dark:border-gray-700">
                <h2 className="text-lg font-semibold">Hành động</h2>
              </div>
              <OrderActions
                order={order}
                onStatusChange={handleStatusChange}
                onPaymentStatusChange={handlePaymentStatusChange}
                updating={updating}
              />
            </div>

            {/* Thẻ Khách hàng */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4 border-b dark:border-gray-700">
                <h2 className="text-lg font-semibold">Khách hàng</h2>
              </div>
              <OrderCustomerInfo order={order} />
            </div>

            {/* Thẻ Địa chỉ Giao hàng */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4 border-b dark:border-gray-700">
                <h2 className="text-lg font-semibold">Địa chỉ Giao hàng</h2>
              </div>
              <OrderShippingAddress order={order} />
            </div>

            {/* Thẻ Địa chỉ Thanh toán */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4 border-b dark:border-gray-700">
                <h2 className="text-lg font-semibold">Địa chỉ Thanh toán</h2>
              </div>
              <OrderBillingAddress order={order} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
