// Formatting helpers extracted from previous i18n utilities, without any translation logic.

export const formatCurrencyVi = (
  value: number,
  currency: string = "VND",
  options: Intl.NumberFormatOptions = {}
) => {
  if (isNaN(value)) return "";
  const formatted = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    ...options,
  }).format(value);
  // Remove any non-breaking spaces between number and currency symbol and
  // collapse regular spaces so the currency symbol appears immediately after
  // the number: e.g. "40.000₫" instead of "40.000 ₫".
  return formatted.replace(/\u00A0/g, '').replace(/\s+/g, '');
};

export const parseAmountString = (raw: string): number => {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export const formatDateVi = (dateStr: string) => {
  if (!dateStr) return "";
  const monthsMap: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };
  let date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    const parts = dateStr.replace(/,/g, "").split(/\s+/);
    if (parts.length === 3) {
      const [dayStr, monthStr, yearStr] = parts;
      const d = parseInt(dayStr, 10);
      const m = monthsMap[monthStr.toLowerCase()];
      const y = parseInt(yearStr, 10);
      if (!isNaN(d) && m !== undefined && !isNaN(y)) {
        date = new Date(y, m, d);
      }
    }
  }
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("vi-VN");
};

export const formatDateRange = (start?: string | Date | null, end?: string | Date | null): string => {
  if (!start) return 'Không xác định';

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  const formatDate = (date: Date) => date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }
  
  return `Từ ${formatDate(startDate)}`;
};
