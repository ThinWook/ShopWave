import { api as apiClient } from '../utils/apiClient';
import { Voucher } from '../types/voucher';

export type CreateVoucherDto = Omit<Voucher, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>;
export type UpdateVoucherDto = Partial<CreateVoucherDto>;

interface GetVouchersParams {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

interface GetVouchersResponse {
  vouchers: Voucher[];
  total: number;
  page: number;
  limit: number;
}

export const getVouchers = async (params: GetVouchersParams): Promise<GetVouchersResponse> => {
  try {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    // apiClient.get will unwrap { data: ... } envelopes. Backend supports two shapes:
    // - raw array when no paging requested: [ Voucher, ... ]
    // - envelope when page+limit provided: { success, message, data: { vouchers: [...], total, page, limit }, ... }
    // So payload can be an array or an object. Make the client tolerant.
    const payload = await apiClient.get<any>(`/api/admin/vouchers?${query}`);

    // Case 1: backend returned raw array
    if (Array.isArray(payload)) {
      const vouchers = payload as Voucher[];
      return { vouchers, total: vouchers.length, page: 1, limit: vouchers.length } as GetVouchersResponse;
    }

    // Case 2: backend returned an object (possibly already unwrapped data)
    // payload may be: { vouchers: [...], total, page, limit } or { items: [...] } etc.
    const vouchers = payload?.vouchers ?? payload?.items ?? (Array.isArray(payload) ? payload : undefined);
    if (Array.isArray(vouchers)) {
      const total = payload.total ?? payload?.data?.total ?? vouchers.length;
      const page = payload.page ?? payload?.data?.page ?? 1;
      const limit = payload.limit ?? payload?.data?.limit ?? vouchers.length;
      return { vouchers, total, page, limit } as GetVouchersResponse;
    }
  } catch (error) {
    console.error("Failed to fetch vouchers from /api/admin/vouchers", error);
    // Fail fast: do not return mock data. Let the caller handle the error.
    throw error;
  }
  // If the response shape is unexpected, throw so caller can handle it (no mock fallback)
  throw new Error('Unexpected response shape from /api/admin/vouchers');
};

export const createVoucher = async (voucherData: CreateVoucherDto): Promise<Voucher> => {
  // Backend expects discountType as numeric enum: FIXED_AMOUNT=0, PERCENTAGE=1
  const payload = {
    ...voucherData,
    discountType: voucherData.discountType === 'PERCENTAGE' ? 1 : 0,
  };
  return apiClient.post<Voucher>('/api/admin/vouchers', payload);
};

export const updateVoucher = async (id: number, voucherData: UpdateVoucherDto): Promise<Voucher> => {
  // Backend expects discountType as numeric enum: FIXED_AMOUNT=0, PERCENTAGE=1
  const payload = {
    ...voucherData,
    discountType: voucherData.discountType === 'PERCENTAGE' ? 1 : 0,
  };
  return apiClient.post<Voucher>(`/api/admin/vouchers/${id}`, payload, { method: 'PUT' });
};

export const deleteVoucher = async (id: number): Promise<void> => {
  await apiClient.raw(`/api/admin/vouchers/${id}`, { method: 'DELETE' });
};

export const generateRandomCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Fetch admin vouchers from backend endpoint that returns an array
// Example backend path: GET /api/admin/vouchers -> [ Voucher, ... ]
export const getAdminVouchers = async (): Promise<Voucher[]> => {
  try {
    // apiClient.get will unwrap { data: ... } if present, so this works for both raw-array and envelope
    const payload = await apiClient.get<Voucher[]>('/api/admin/vouchers');
    if (Array.isArray(payload)) return payload;
    // Fallback: sometimes backend returns { data: [...] }
    const data = (payload as any)?.data ?? payload;
    return Array.isArray(data) ? data as Voucher[] : [];
  } catch (err) {
    console.error('Failed to fetch /api/admin/vouchers', err);
    throw err;
  }
};
