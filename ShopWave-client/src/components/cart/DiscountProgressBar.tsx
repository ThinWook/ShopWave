"use client";

import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/format';

export default function DiscountProgressBar() {
  const { state } = useCart();
  const pd = state.progressiveDiscount;

  if (!pd) return null;

  const remaining = Math.max(0, Math.round(pd.nextThresholdRemaining || 0));
  const nextDiscount = Math.max(0, Math.round(pd.nextDiscountValue || 0));
  const percent = Math.max(0, Math.min(100, Math.round(pd.progressPercent || 0)));

  // If already at the max tier and no next discount, we can congratulate
  const isMaxed = remaining <= 0 && nextDiscount <= 0 && (pd.currentDiscountValue || 0) > 0;

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="font-semibold text-blue-700">
        {isMaxed
          ? `Bạn đã đạt mức giảm tối đa: ${formatPrice(pd.currentDiscountValue)} 🎉`
          : `Mua thêm ${formatPrice(remaining)} để được giảm ${formatPrice(nextDiscount)}!`}
      </p>
      <div className="w-full bg-blue-200 rounded-full h-2.5 mt-2">
        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}
