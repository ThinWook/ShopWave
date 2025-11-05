"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Package, Truck, CheckCircle } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
// Orders page is now accessible to guests (backend must support this); no auto-redirect to signin.

// TODO: Lấy dữ liệu đơn hàng thực từ backend
type Order = {
  id: string;
  date: string;
  total: number;
  status: string;
  items: { name: string; quantity: number }[];
};
const orders: Order[] = [];

const statusIcons = {
  Delivered: <CheckCircle className="h-5 w-5 text-green-500" />,
  Shipped: <Truck className="h-5 w-5 text-blue-500" />,
  Processing: <Package className="h-5 w-5 text-orange-500" />,
};

export default function OrdersPage() {
  // no auth required
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-4">Chưa có đơn hàng</h1>
        <p className="text-muted-foreground mb-8">Bạn chưa đặt đơn hàng nào. Hãy bắt đầu mua sắm để thấy đơn hàng ở đây!</p>
        <Button asChild size="lg">
          <Link href="/">Bắt đầu mua sắm</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Đơn hàng của tôi</h1>
      <div className="space-y-6">
        {orders.map((order) => (
          <Card key={order.id} className="shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-xl">Đơn hàng #{order.id}</CardTitle>
                <CardDescription>Ngày đặt: {new Date(order.date).toLocaleDateString("vi-VN")}</CardDescription>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ 
                    backgroundColor: order.status === 'Delivered' ? 'hsl(var(--primary)/0.1)' : order.status === 'Shipped' ? 'hsl(var(--accent)/0.1)' : 'hsl(var(--muted))',
                    color: order.status === 'Delivered' ? 'hsl(var(--primary))' : order.status === 'Shipped' ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))'
                }}
              >
                {statusIcons[order.status as keyof typeof statusIcons]}
                {order.status === 'Delivered' ? 'Đã giao' : order.status === 'Shipped' ? 'Đang giao' : 'Đang xử lý'}
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h4 className="font-semibold mb-1">Sản phẩm:</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {order.items.map((item, index) => (
                    <li key={index}>{item.name} (x{item.quantity})</li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <p className="font-semibold text-lg">Tổng: {formatPrice(order.total)}</p>
                <Button variant="outline" size="sm">Xem chi tiết</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

