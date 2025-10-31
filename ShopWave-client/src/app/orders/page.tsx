"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Package, Truck, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/use-require-auth";

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
  useRequireAuth();
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-4">No Orders Yet</h1>
        <p className="text-muted-foreground mb-8">
          You haven&apos;t placed any orders. Start shopping to see them here!
        </p>
        <Button asChild size="lg">
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      <div className="space-y-6">
        {orders.map((order) => (
          <Card key={order.id} className="shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-xl">Order #{order.id}</CardTitle>
                <CardDescription>Placed on: {new Date(order.date).toLocaleDateString()}</CardDescription>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ 
                    backgroundColor: order.status === 'Delivered' ? 'hsl(var(--primary)/0.1)' : order.status === 'Shipped' ? 'hsl(var(--accent)/0.1)' : 'hsl(var(--muted))',
                    color: order.status === 'Delivered' ? 'hsl(var(--primary))' : order.status === 'Shipped' ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))'
                }}
              >
                {statusIcons[order.status as keyof typeof statusIcons]}
                {order.status}
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h4 className="font-semibold mb-1">Items:</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {order.items.map((item, index) => (
                    <li key={index}>{item.name} (x{item.quantity})</li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <p className="font-semibold text-lg">Total: ${order.total.toFixed(2)}</p>
                <Button variant="outline" size="sm">View Details</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

