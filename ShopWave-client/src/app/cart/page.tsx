
"use client";

import { useCart } from '@/contexts/CartContext';
import { CartItemCard } from '@/components/cart/CartItemCard';
import { CartSummary } from '@/components/cart/CartSummary';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
// Cart page is available to guests; no redirect to signin required.

export default function CartPage() {
  const { state, clearCart } = useCart();

  if (state.items.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-4">Giỏ hàng của bạn trống</h1>
        <p className="text-muted-foreground mb-8">Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
        <Button asChild size="lg">
          <Link href="/">Bắt đầu mua sắm</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Giỏ hàng của bạn</h1>
        {state.items.length > 0 && (
          <Button variant="outline" onClick={clearCart} className="text-destructive hover:text-destructive hover:bg-destructive/10">
            Xóa giỏ hàng
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          {/* Progressive discount banner (moved here) - split into progress bar + sale block */}
          {state.progressiveDiscount && (() => {
            const pd = state.progressiveDiscount;
            const threshold = Number(pd.nextDiscountThreshold || 0);
            const amountToNext = Number(pd.amountToNext || 0);
            const percent = threshold > 0 ? Math.min(100, Math.max(0, ((threshold - amountToNext) / threshold) * 100)) : 100;
            const hasNext = amountToNext > 0;
            return (
              <>
                <div className="flashsale__progressbar w-full bg-primary/20 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="flashsale___percent bg-primary h-2.5 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="cart-sale-one mt-3 p-3 bg-primary text-primary-foreground rounded-lg flex items-center justify-between">
                  <div className="cart_title-new">
                    <h4 className="text-sm font-semibold text-primary-foreground">
                      {hasNext ? (
                        pd.currentDiscountValue && Number(pd.currentDiscountValue) > 0 ?
                          `Bạn đã được giảm ${formatPrice(Number(pd.currentDiscountValue || 0))}, mua thêm ${formatPrice(amountToNext)} để được giảm ${formatPrice(Number(pd.nextDiscountValue || 0))}!` :
                          `Bạn được giảm đến ${formatPrice(Number(pd.nextDiscountValue || 0))}, mua thêm ${formatPrice(amountToNext)} để giảm ngay ${formatPrice(Number(pd.nextDiscountValue || 0))}!`
                      ) : (
                        `Đơn hàng của bạn đã đủ điều kiện giảm ${formatPrice(Math.max(Number(pd.currentDiscountValue || 0), Number(pd.nextDiscountValue || 0)))}!`
                      )}
                    </h4>
                  </div>

                  <Link href="/products" aria-label="Xem sản phẩm" className="cart_button-add ml-3 inline-flex items-center">
                    <span className="inline-flex items-center justify-center h-6 w-6 p-0.5 rounded-sm bg-primary text-primary-foreground">
                      <img width={14} height={14} alt="icon" src="https://file.hstatic.net/1000360022/file/images__3_-removebg-preview.png" className="block" />
                    </span>
                  </Link>
                </div>
              </>
            );
          })()}
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
