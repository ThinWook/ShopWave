export interface Voucher {
  id: number;
  code: string;
  description: string;
  discountType: 'FIXED_AMOUNT' | 'PERCENTAGE';
  discountValue: number;
  minOrderAmount: number;
  usageLimit: number;
  usageCount: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type VoucherStatus = 'active' | 'scheduled' | 'expired' | 'disabled' | 'out_of_stock';
