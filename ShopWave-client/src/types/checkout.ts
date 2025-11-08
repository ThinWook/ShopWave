// Types for Checkout page and address hierarchy

export interface ProvinceDto { id: string; name: string; code?: string }
export interface DistrictDto { id: string; name: string; provinceId?: string }
export interface WardDto { id: string; name: string; districtId?: string }

export interface CheckoutPayload {
  paymentMethod: string; // COD | VNPAY | MOMO
  shippingAddress: {
    fullName: string;
    phone: string;
    email?: string;
    // Backend expects 'address' and 'city' fields
    address: string;
    city: string;
    district: string;
    ward: string;
    notes?: string;
  };
  billingAddress: null | {
    fullName: string;
    phone?: string;
    address?: string;
    city?: string;
    district?: string;
    ward?: string;
  };
}
