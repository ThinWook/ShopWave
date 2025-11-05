"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import ProductVariantSelector from '@/components/products/ProductVariantSelector';

type Variant = any;

export default function ProductPurchasePanel({
  product,
  onAddToCart,
  onBuyNow,
}: {
  product: any;
  onAddToCart: (variantId: string | null, quantity: number) => void;
  onBuyNow: (variantId: string | null, quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [currentVariant, setCurrentVariant] = useState<any | null>(null);

  // Debug: log product.options on mount/update to help diagnose missing selectors
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.debug('[ProductPurchasePanel] product.id=', product?.id, 'options=', product?.options);
    } catch (e) {
      // noop
    }
  }, [product]);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  const variants: Variant[] = product.variants ?? [];

  // Prefer variant.sku, then product.sku, then product.slug, and finally product.id as last resort
  const sku = (currentVariant?.sku ?? product.sku ?? product.slug ?? product.id) || '—';

  const promoList = product.promotions ?? [
    'Freeship toàn quốc',
    'Giảm 20K cho đơn từ 299K',
  ];

  const vouchers = product.vouchers ?? [
    { code: 'VOUCHER20K', label: 'VOUCHER 20K' },
    { code: 'VOUCHER40K', label: 'VOUCHER 40K' },
  ];

  const inc = () => setQuantity(q => Math.max(1, q + 1));
  const dec = () => setQuantity(q => Math.max(1, q - 1));

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCoupon(code);
      setTimeout(() => setCopiedCoupon(null), 2000);
    } catch (e) {
      // ignore
    }
  };

  const handleAdd = () => onAddToCart(selectedVariantId, quantity);
  const handleBuy = () => onBuyNow(selectedVariantId, quantity);

  return (
    <div className="space-y-6">
      {/* Block 1 - Basic info */}
      <div>
        <h1 className="pro-title text-3xl font-bold">{product.name}</h1>
  <div className="pro-sku text-sm text-muted-foreground mt-2">Mã sản phẩm: {sku}</div>
        <div className="price-box mt-4">
          <div className="text-3xl font-semibold text-primary">{formatPrice(currentVariant?.price ?? product.price)}</div>
        </div>
      </div>

      {/* Promotions removed as requested */}

      {/* Block 3 - Variant selectors */}
      <div className="select-swatch space-y-3">
        
        <ProductVariantSelector
          product={product}
          hideActions
          onVariantChange={(v) => {
            if (v && v !== 'unavailable') {
              setSelectedVariantId(String((v as any).id));
              setCurrentVariant(v as any);
            } else {
              setSelectedVariantId(null);
              setCurrentVariant(null);
            }
          }}
        />
      </div>

      {/* Block 4 - Actions */}
      <div className="quantity-area space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-md overflow-hidden">
            <button onClick={dec} className="px-3 py-2">-</button>
            <div className="px-4 py-2">{quantity}</div>
            <button onClick={inc} className="px-3 py-2">+</button>
          </div>
          <Button id="add-to-cart" onClick={handleAdd} className="flex-1">Thêm vào giỏ</Button>
        </div>
        <div>
          <Button id="buy-now" variant="outline" onClick={handleBuy} className="w-full">Mua ngay</Button>
        </div>
      </div>
    </div>
  );
}
