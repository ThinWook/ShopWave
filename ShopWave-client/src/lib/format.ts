// Formatting utilities (currency, numbers, etc.)

/**
 * Format a price value to Vietnamese Đồng by default.
 * Example: 269990000 -> 269.990.000 ₫
 */
export function formatPrice(
  value: number,
  {
    currency = 'VND',
    locale = 'vi-VN',
    minimumFractionDigits,
    maximumFractionDigits,
  }: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
) {
  const opts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
  };
  if (currency === 'VND') {
    opts.minimumFractionDigits = minimumFractionDigits ?? 0;
    opts.maximumFractionDigits = maximumFractionDigits ?? 0;
  } else {
    if (minimumFractionDigits !== undefined) opts.minimumFractionDigits = minimumFractionDigits;
    if (maximumFractionDigits !== undefined) opts.maximumFractionDigits = maximumFractionDigits;
  }
  return new Intl.NumberFormat(locale, opts).format(value);
}

/** Shorten very large VND numbers (tuỳ chọn) */
export function formatPriceCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)} tỷ`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)} triệu`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)} nghìn`;
  }
  return formatPrice(value);
}
