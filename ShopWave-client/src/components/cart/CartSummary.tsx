
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart } from 'lucide-react';

export function CartSummary() {
  const { getCartTotal, getItemCount } = useCart();
  const total = getCartTotal();
  const itemCount = getItemCount();

  return (
    <Card className="sticky top-24 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl flex items-center"><ShoppingCart className="mr-2 h-5 w-5" />Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>Free</span> {/* Placeholder */}
        </div>
        <div className="flex justify-between font-semibold text-lg border-t pt-3">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button size="lg" className="w-full transition-transform transform hover:scale-105" disabled={total === 0}>
          Proceed to Checkout
        </Button>
      </CardFooter>
    </Card>
  );
}
