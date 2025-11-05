
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/format';

export function CartSummary() {
  const { getCartTotal, getItemCount, state, applyVoucher, removeVoucher } = useCart();
  const [voucherCode, setVoucherCode] = useState('');
  const [showVoucherList, setShowVoucherList] = useState(false);
  const subTotal = getCartTotal();
  const itemCount = getItemCount();
  const shipping = state.shippingFee || 0;
  const grandTotal = typeof state.total === 'number' && state.total > 0 ? state.total : (subTotal + shipping);
  const progressive = state.progressiveDiscount;
  const appliedVoucher = state.appliedVoucher;
  const available = state.availableVouchers || [];

  return (
    <Card className="sticky top-24 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl flex items-center"><ShoppingCart className="mr-2 h-5 w-5" />Tóm tắt đơn hàng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voucher input */}
        <div>
          <label htmlFor="voucher" className="block text-sm font-medium text-foreground">Mã giảm giá</label>
          <div className="mt-1 flex rounded-md">
            <Input
              id="voucher"
              placeholder="Nhập mã voucher"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              className="rounded-r-none"
            />
            <Button
              type="button"
              onClick={() => voucherCode && applyVoucher(voucherCode)}
              className="rounded-l-none"
              variant="secondary"
            >
              Áp dụng
            </Button>
          </div>
          <Button variant="link" className="px-0 h-auto text-blue-600" onClick={() => setShowVoucherList(v => !v)}>
            {showVoucherList ? 'Ẩn voucher hiện có' : 'Xem voucher hiện có'}
          </Button>
          {showVoucherList && (
            <div className="mt-2 space-y-2">
              {available.length === 0 && (
                <p className="text-sm text-muted-foreground">Hiện chưa có voucher khả dụng.</p>
              )}
              {available.map(v => (
                <div key={v.code} className="flex items-center justify-between border rounded-md p-2">
                  <div>
                    <p className="font-medium">{v.code}</p>
                    {v.description && <p className="text-sm text-muted-foreground">{v.description}</p>}
                  </div>
                  <Button size="sm" onClick={() => applyVoucher(v.code)}>Áp dụng</Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price details */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tạm tính ({itemCount} sản phẩm)</span>
            <span>{formatPrice(subTotal)}</span>
          </div>

          {progressive && (progressive.currentDiscountValue || 0) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Giảm giá bậc</span>
              <span>-{formatPrice(progressive.currentDiscountValue)}</span>
            </div>
          )}

          {appliedVoucher && (
            <div className="flex items-center justify-between text-green-600">
              <span>Voucher ({appliedVoucher.code})</span>
              <div className="flex items-center gap-2">
                <span>-{formatPrice(appliedVoucher.discountAmount)}</span>
                <Button variant="ghost" size="sm" onClick={() => removeVoucher()} className="text-muted-foreground hover:text-foreground">Gỡ</Button>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-muted-foreground">Phí vận chuyển</span>
            <span>{shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}</span>
          </div>
        </div>

        <div className="flex justify-between font-semibold text-lg border-t pt-3">
          <span>Tổng cộng</span>
          <span>{formatPrice(grandTotal)}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button size="lg" className="w-full transition-transform transform hover:scale-105" disabled={grandTotal === 0}>
          Tiến hành thanh toán
        </Button>
      </CardFooter>
    </Card>
  );
}
