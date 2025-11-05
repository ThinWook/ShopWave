"use client";

import { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type DisplayType = 'text_button' | 'color_swatch' | 'image_swatch';

type OptionValue = {
  value: string;
  thumbnailId?: number | string | null;
  colorHex?: string | null;
};

type OptionGroup = {
  name: string; // e.g. Size, Color
  displayType?: DisplayType;
  values: OptionValue[];
};

type VariantLike = {
  id: string;
  sku?: string | null;
  price?: number | null;
  stock?: number | null;
  imageId?: number | string | null;
  imageUrl?: string | null;
  size?: string | null;
  color?: string | null;
  selectedOptions?: { optionName: string; value: string }[];
};

type ProductLike = {
  id: string;
  name: string;
  price?: number;
  sku?: string | null;
  options?: OptionGroup[];
  variants?: VariantLike[];
};

export type VariantSelection = VariantLike | 'unavailable' | null;

export default function ProductVariantSelector({
  product,
  initialSelected,
  onVariantChange,
  hideActions = true,
  onAddToCart,
}: {
  product: ProductLike;
  initialSelected?: Record<string, string>;
  onVariantChange?: (v: VariantSelection) => void;
  hideActions?: boolean;
  onAddToCart?: (variant: VariantLike) => void;
}) {
  const variants = (product.variants ?? []) as VariantLike[];

  // Use product.options only. If none are provided, we hide option selectors.
  const optionGroups: OptionGroup[] = useMemo(() => {
    return product.options && Array.isArray(product.options) ? product.options : [];
  }, [product.options]);

  // Debug: help diagnose missing options in browser console
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.debug('[ProductVariantSelector] product.id=', product?.id, 'options=', product?.options, 'variants=', product?.variants?.length ?? 0);
    } catch (e) {
      // noop
    }
  }, [product]);

  const requiredCount = optionGroups.length;
  const [selected, setSelected] = useState<Record<string, string>>(
    () => ({ ...(initialSelected || {}) })
  );

  // Compute current variant by matching selected options
  const currentVariant: VariantSelection = useMemo(() => {
    // If no optionGroups, choose default variant when exactly one variant exists.
    if (optionGroups.length === 0) {
      if (variants.length === 1) return variants[0];
      return null;
    }

    // If options exist, require user to select all
    const selectedCount = Object.keys(selected).length;
    if (selectedCount < requiredCount) return null;

    const match = variants.find((v) => {
      if (!Array.isArray(v.selectedOptions)) return false;
      return v.selectedOptions.every((o) => selected[o.optionName] === o.value);
    });
    return match || 'unavailable';
  }, [selected, requiredCount, variants, optionGroups.length]);

  useEffect(() => {
    onVariantChange?.(currentVariant);
  }, [currentVariant, onVariantChange]);

  const usableVariant = useMemo<VariantLike | null>(() => {
    return currentVariant && currentVariant !== 'unavailable' ? (currentVariant as VariantLike) : null;
  }, [currentVariant]);

  const handlePick = (name: string, value: string) => {
    setSelected((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Render groups */}
      {optionGroups.length === 0 && (
        <div className="text-sm text-muted-foreground">Sản phẩm không có biến thể</div>
      )}
      {optionGroups.map((opt) => (
        <div key={opt.name}>
          <h4 className="text-sm font-medium mb-2">
            {opt.name}
            <span className="ml-2 font-normal text-muted-foreground">
              {selected[opt.name] || 'Vui lòng chọn'}
            </span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {opt.values.map((val) => {
              const isActive = selected[opt.name] === val.value;
              if (opt.displayType === 'color_swatch') {
                const hex = (val.colorHex || val.value || '').toString();
                return (
                  <button
                    key={val.value}
                    onClick={() => handlePick(opt.name, val.value)}
                    aria-label={val.value}
                    className={cn(
                      'w-10 h-10 rounded-full border-2',
                      isActive ? 'border-primary ring-2 ring-primary' : 'border-input'
                    )}
                    style={{ backgroundColor: hex.toLowerCase() }}
                  />
                );
              }
              // text_button or default
              return (
                <button
                  key={val.value}
                  onClick={() => handlePick(opt.name, val.value)}
                  className={cn(
                    'px-4 py-2 border rounded-md text-sm',
                    isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-input'
                  )}
                >
                  {val.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Summary removed as per request; selection updates propagate via onVariantChange */}
    </div>
  );
}
