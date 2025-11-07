
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
import session from '@/lib/session';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/format';

export function CartSummary() {
  const { getCartTotal, getItemCount, state, applyVoucher, removeVoucher } = useCart();
  const [voucherCode, setVoucherCode] = useState('');
  // showVoucherList removed — always display available vouchers
  const subTotal = state.subTotal || getCartTotal();
  const itemCount = state.totalItems || getItemCount();
  const shipping = state.shippingFee || 0;
  const grandTotal = state.total || (subTotal + shipping);
  const progressive = state.progressiveDiscount;
  const appliedVoucher = state.appliedVoucher;
  const available = state.availableVouchers || [];
  
  // Backend already calculated discount - compute voucher discount but prefer appliedVoucher value when present
  const voucherDiscount = subTotal + shipping - grandTotal;
  // The actual voucher-applied amount should be taken from state.appliedVoucher.discountAmount when available
  const voucherAppliedAmount = appliedVoucher && typeof appliedVoucher.discountAmount === 'number'
    ? Number(appliedVoucher.discountAmount)
    : (voucherDiscount > 0 ? voucherDiscount : 0);
  const [remoteVouchers, setRemoteVouchers] = useState<any[] | null>(null);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [vouchersError, setVouchersError] = useState<string | null>(null);

  useEffect(() => {
    // Always attempt to load available vouchers on mount (one-time)
    if (remoteVouchers !== null) return; // already loaded
    let mounted = true;
    setVouchersLoading(true);
    setVouchersError(null);

    // Import api dynamically to avoid circular deps if needed
    import('@/lib/api').then(({ api }) => {
      return api.cart.getAvailableVouchers();
    })
      .then((data) => {
        if (!mounted) return;
        setRemoteVouchers(data || []);
      })
      .catch(() => {
        if (!mounted) return;
        setVouchersError('Không thể tải voucher. Vui lòng thử lại.');
      })
      .finally(() => {
        if (!mounted) return;
        setVouchersLoading(false);
      });
    return () => { mounted = false; };
  }, [remoteVouchers]);

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
                onClick={() => {
                  // If user typed a code, apply it. Otherwise, if there are available vouchers, apply the first one.
                  const list = (remoteVouchers ?? available) as any[];
                  if (voucherCode && voucherCode.trim().length > 0) {
                    applyVoucher(voucherCode.trim());
                  } else if (list && list.length > 0) {
                    applyVoucher(list[0].code);
                  }
                }}
                className="rounded-l-none"
                variant="secondary"
              >
                Áp dụng
              </Button>
            </div>

            {/* Always show available vouchers inline (no toggle). If there are 2+ vouchers, render horizontally with scroll-snap */}
            <div className="mt-2">
              {vouchersLoading && <p className="text-sm text-muted-foreground">Đang tải voucher...</p>}
              {vouchersError && <p className="text-sm text-destructive">{vouchersError}</p>}

              {!vouchersLoading && !vouchersError && ((remoteVouchers ?? available).length === 0) && (
                <p className="text-sm text-muted-foreground">Hiện chưa có voucher khả dụng.</p>
              )}

              {!vouchersLoading && !vouchersError && ((remoteVouchers ?? available).length > 0) && (
                (() => {
                  const list = (remoteVouchers ?? available) as any[];
                  const horizontal = list.length >= 2;
                  return (
                    <div
                      className={`${horizontal ? 'overflow-x-auto' : ''} ${horizontal ? 'flex gap-3 py-2 snap-x snap-mandatory' : 'space-y-2'}`}
                    >
                      {list.map((v: any) => (
                        <div
                          key={v.code}
                          className={`${horizontal ? 'flex-shrink-0 w-80 snap-start' : ''} flex items-center justify-between border rounded-md p-2 bg-card`}
                        >
                          <div>
                            <p className="font-medium">{v.code}</p>
                            {v.description && <p className="text-sm text-muted-foreground">{v.description}</p>}
                            {v.discountType && v.discountValue != null && (
                              <p className="text-sm text-muted-foreground">{v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : formatPrice(Number(v.discountValue))}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); void applyVoucher(v.code); }}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3"
                          >
                            Áp dụng
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          </div>

        

        {/* Price details */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tạm tính ({itemCount} sản phẩm)</span>
            <span>{formatPrice(subTotal)}</span>
          </div>

          {progressive && (progressive.currentDiscountValue || 0) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Khuyến mãi đặc biệt</span>
              <span>-{formatPrice(progressive.currentDiscountValue)}</span>
            </div>
          )}

          {voucherAppliedAmount > 0 && (
            <div className="flex items-center justify-between text-green-600">
              <span>Voucher{appliedVoucher?.code ? ` (${appliedVoucher.code})` : ''}</span>
              <div className="flex items-center gap-2">
                <span>-{formatPrice(voucherAppliedAmount)}</span>
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
