
"use client";

import { useCart } from '@/contexts/CartContext';
import { CartItemCard } from '@/components/cart/CartItemCard';
import { CartSummary } from '@/components/cart/CartSummary';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useRequireAuth } from '@/hooks/use-require-auth';

export default function CartPage() {
  useRequireAuth();
  const { state, clearCart } = useCart();

  if (state.items.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8">Looks like you haven&apos;t added anything to your cart yet.</p>
        <Button asChild size="lg">
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Your Shopping Cart</h1>
        {state.items.length > 0 && (
          <Button variant="outline" onClick={clearCart} className="text-destructive hover:text-destructive hover:bg-destructive/10">
            Clear Cart
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          {state.items.map((item) => (
            <CartItemCard key={item.cartItemId} item={item} />
          ))}
        </div>
        <div className="lg:col-span-1">
          <CartSummary />
        </div>
      </div>
    </div>
  );
}
