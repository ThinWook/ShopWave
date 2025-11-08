"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api, ApiEnvelope, CartResponseDto } from "@/lib/api";
import type { ProvinceDto, DistrictDto, WardDto, CheckoutPayload } from "@/lib/types/checkout";
import { Field, Select } from "@/components/ui/FormFields";

// Simple fetch wrapper that respects NEXT_PUBLIC_API_BASE_URL so client calls
// go to the configured backend rather than the frontend origin.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
async function apiGet<T>(url: string, init?: RequestInit): Promise<T> {
  const target = url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  // Always include credentials by default to preserve cart session across pages
  const { credentials: _discard, ...rest } = (init || {}) as any;
  const res = await fetch(target, { ...rest, credentials: 'include' } as any);
  if (!res.ok) {
    let msg = res.status + " " + res.statusText;
    try { const j = await res.json().catch(() => null); msg = (j?.errors?.[0]?.message || j?.message) ?? msg; } catch {/* ignore */}
    throw new Error(msg);
  }
  return res.json();
}

// (Field & Select moved to components/ui/FormFields)

export default function CheckoutPage() {
  const router = useRouter();

  // ===== Remote Data State =====
  const [cart, setCart] = useState<CartResponseDto | null>(null);
  const [provinces, setProvinces] = useState<ProvinceDto[]>([]);
  const [districts, setDistricts] = useState<DistrictDto[]>([]);
  const [wards, setWards] = useState<WardDto[]>([]);
  const [shippingFee, setShippingFee] = useState<number>(0);

  // ===== Form State =====
  const [formData, setFormData] = useState({
    email: "",
    shippingFullName: "",
    shippingPhone: "",
    shippingStreet: "",
    shippingProvince: "",
    shippingDistrict: "",
    shippingWard: "",
    shippingNotes: "",
    billingSameAsShipping: true,
    billingFullName: "",
    billingPhone: "",
    billingStreet: "",
    billingProvince: "",
    billingDistrict: "",
    billingWard: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<string>("COD");

  // ===== UI State =====
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // AbortControllers to avoid race conditions on cascading selects
  const provinceAbortRef = React.useRef<AbortController | null>(null);
  const districtAbortRef = React.useRef<AbortController | null>(null);
  const feeAbortRef = React.useRef<AbortController | null>(null);

  // ===== Helpers =====
  const updateForm = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> = (e) => {
    const { name, type } = e.target;
    const value = type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    updateForm(name, value);
  };

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.shippingFullName.trim()) newErrors.shippingFullName = "Vui lòng nhập họ tên";
    if (!/^\+?\d{8,14}$/.test(formData.shippingPhone.trim())) newErrors.shippingPhone = "Số điện thoại không hợp lệ";
    if (!formData.shippingStreet.trim()) newErrors.shippingStreet = "Vui lòng nhập địa chỉ chi tiết";
    if (!formData.shippingProvince) newErrors.shippingProvince = "Chọn tỉnh";
    if (!formData.shippingDistrict) newErrors.shippingDistrict = "Chọn quận/huyện";
    if (!formData.shippingWard) newErrors.shippingWard = "Chọn phường/xã";

    if (!formData.billingSameAsShipping) {
      if (!formData.billingFullName.trim()) newErrors.billingFullName = "Nhập họ tên thanh toán";
      if (formData.billingPhone && !/^\+?\d{8,14}$/.test(formData.billingPhone.trim())) newErrors.billingPhone = "SĐT thanh toán không hợp lệ";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // ===== Initial Load =====
  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    const loadInitialData = async () => {
      setIsLoading(true);
      setErrors(prev => ({ ...prev, submit: '' }));
      try {
        // use centralized API client for cart so it hits the configured backend base
        const cartData = await api.cart.get();
        if (!cartData || !cartData.items || cartData.items.length === 0) {
          router.push("/");
          return;
        }
        if (signal.aborted) return;
        setCart(cartData as any);
        const provRes: ApiEnvelope<ProvinceDto[]> = await apiGet("/api/v1/provinces", { signal });
        if (!signal.aborted) setProvinces(provRes.data);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Lỗi tải dữ liệu checkout", err);
          setErrors(prev => ({ ...prev, submit: err?.message || 'Không thể tải giỏ hàng. Vui lòng thử lại.' }));
        }
      } finally {
        if (!signal.aborted) setIsLoading(false);
      }
    };

    loadInitialData();

    return () => abortController.abort();
  }, [router]);

  const handleRetry = () => {
    // Clear previous submit error and re-run initial load by toggling isLoading and re-invoking effect
    setErrors(prev => ({ ...prev, submit: '' }));
    setIsLoading(true);
    // Re-run the effect by calling the same sequence (simpler than refactoring effect deps)
    // We'll directly call the API helper here (no AbortController for this quick retry)
    (async () => {
      try {
        const cartData = await api.cart.get();
        if (!cartData || !cartData.items || cartData.items.length === 0) {
          router.push("/");
          return;
        }
        setCart(cartData as any);
        const provRes: ApiEnvelope<ProvinceDto[]> = await apiGet("/api/v1/provinces");
        setProvinces(provRes.data);
      } catch (err: any) {
        console.error("Retry failed", err);
        setErrors(prev => ({ ...prev, submit: err?.message || 'Không thể tải giỏ hàng. Vui lòng thử lại.' }));
      } finally {
        setIsLoading(false);
      }
    })();
  };

  // ===== When Province Changes: fetch districts + fee =====
  useEffect(() => {
    const provinceName = formData.shippingProvince;
    if (!provinceName) return;

    // Reset dependent selects
    setDistricts([]); setWards([]); updateForm("shippingDistrict", ""); updateForm("shippingWard", "");

    // Abort previous pending fetches
    provinceAbortRef.current?.abort(); feeAbortRef.current?.abort();
    const abortDist = new AbortController();
    const abortFee = new AbortController();
    provinceAbortRef.current = abortDist; feeAbortRef.current = abortFee;

    (async () => {
      try {
        const dRes: ApiEnvelope<DistrictDto[]> = await apiGet(`/api/v1/districts?province=${encodeURIComponent(provinceName)}`, { signal: abortDist.signal });
        setDistricts(dRes.data);
      } catch (e) { if ((e as any).name !== "AbortError") console.error("district fetch error", e); }
    })();

    (async () => {
      try {
        const feeRes: { fee: number; success?: boolean } = await apiGet(`/api/v1/shipping-fee?province=${encodeURIComponent(provinceName)}`, { signal: abortFee.signal });
        setShippingFee(feeRes.fee ?? 0);
      } catch (e) { if ((e as any).name !== "AbortError") console.error("shipping fee fetch error", e); }
    })();
  }, [formData.shippingProvince]);

  // ===== When District Changes: fetch wards =====
  useEffect(() => {
    const districtName = formData.shippingDistrict;
    if (!districtName) return;
    districtAbortRef.current?.abort();
    const abort = new AbortController();
    districtAbortRef.current = abort;
    setWards([]); updateForm("shippingWard", "");
    (async () => {
      try {
        const wRes: ApiEnvelope<WardDto[]> = await apiGet(`/api/v1/wards?district=${encodeURIComponent(districtName)}`, { signal: abort.signal });
        setWards(wRes.data);
      } catch (e) { if ((e as any).name !== "AbortError") console.error("ward fetch error", e); }
    })();
  }, [formData.shippingDistrict]);

  // ===== Derived totals =====
  // Support both normalized cart (FECartItem) and raw DTO casing from backend
  const { subTotal, applied_voucher, progressive_discount } = (cart || {}) as any;

  const voucherDiscount = useMemo(() => {
    const d = applied_voucher?.discount_amount ?? (cart as any)?.appliedVoucher?.discountAmount ?? 0;
    return Number(d) || 0;
  }, [cart, applied_voucher]);

  const progressiveDiscount = useMemo(() => {
    const pd = progressive_discount?.current_discount_value ?? (cart as any)?.progressiveDiscount?.currentDiscountValue ?? 0;
    return Number(pd) || 0;
  }, [cart, progressive_discount]);

  const finalTotal = useMemo(() => {
    if (!cart) return 0;
    // Prefer backend-provided total when present (assumed already includes discounts & shipping)
    const backendTotal = (cart as any).total;
    if (typeof backendTotal === 'number' && backendTotal >= 0) return backendTotal;
    const base = Number(subTotal || 0);
    return Math.max(0, base - voucherDiscount - progressiveDiscount + Number(shippingFee || 0));
  }, [cart, subTotal, voucherDiscount, progressiveDiscount, shippingFee]);

  // ===== Submit Handler =====
  const handlePlaceOrder: React.FormEventHandler = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    const payload: CheckoutPayload = {
      paymentMethod,
      shippingAddress: {
        fullName: formData.shippingFullName,
        phone: formData.shippingPhone,
        email: formData.email || undefined,
        // Backend expects 'address' and 'city' keys
        address: formData.shippingStreet,
        city: formData.shippingProvince,
        district: formData.shippingDistrict,
        ward: formData.shippingWard,
        notes: formData.shippingNotes || undefined,
      },
      billingAddress: formData.billingSameAsShipping ? null : {
        fullName: formData.billingFullName,
        phone: formData.billingPhone || undefined,
        address: formData.billingStreet || undefined,
        city: formData.billingProvince || undefined,
        district: formData.billingDistrict || undefined,
        ward: formData.billingWard || undefined,
      }
    };

    try {
      // Use centralized API client so auth, cookies and errors are handled consistently
      const data = await api.checkout.create(payload);
      // data is normalized by request() to the response's data object
      if (data?.paymentUrl) {
        // === CỔNG THANH TOÁN ONLINE ===
        // Backend trả về URL của VNPay. Trình duyệt sẽ rời khỏi site.
        // Sau khi người dùng thanh toán xong, cổng sẽ chuyển hướng về ReturnUrl:
        //   /checkout/result?vnp_ResponseCode=00&vnp_TxnRef={TransactionId}
        // (Hoặc backend nên bổ sung orderId vào URL để chính xác hơn.)
        window.location.href = data.paymentUrl; // Redirect to gateway
        return;
      }
      // === COD (hoặc payment không cần redirect) ===
      // Chuyển thẳng tới trang cảm ơn. Webhook không cần vì không qua cổng.
      router.push(`/thank-you?orderId=${data?.orderId}`);
    } catch (err: any) {
      setErrors(prev => ({
        ...prev,
        submit: err?.message || "Đã có lỗi xảy ra, vui lòng thử lại.",
      }));
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8">Đang tải...</div>;

  if (errors.submit && !cart) {
    return (
      <div className="p-8">
        <p className="mb-4 text-sm text-red-600">{errors.submit}</p>
        <div className="flex gap-3">
          <button onClick={handleRetry} className="rounded-md bg-blue-600 text-white py-2 px-4">Thử lại</button>
          <button onClick={() => router.push('/')} className="rounded-md border border-gray-300 py-2 px-4">Về trang chủ</button>
        </div>
      </div>
    );
  }

  if (!cart) return <div className="p-8">Giỏ hàng trống.</div>;

  // (Field & Select moved outside component scope for performance)

  return (
    <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 lg:px-0">
      {/* LEFT COLUMN */}
      <div className="lg:col-span-2 space-y-10">
        {/* Cart Summary */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Giỏ hàng của bạn</h2>
          <div className="space-y-3 divide-y">
            {cart.items.map((item: any) => (
              <div key={(item.cartItemId || item.id)} className="flex items-center justify-between pt-3">
                <div className="flex items-center gap-3 min-w-0">
                  {(item.imageUrl || item.variantImageUrl) && (
                    <img src={(item.imageUrl || item.variantImageUrl) as string} alt={(item.name || item.productName || 'Sản phẩm') as string} className="w-14 h-14 rounded object-cover" />
                  )}
                  <div className="truncate">
                    <p className="text-sm font-medium truncate">{(item.name || item.productName) as string}</p>
                    {Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0 && (
                      <p className="text-xs text-gray-500 truncate">{item.selectedOptions.map((o: any) => o.value).join(" / ")}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm font-semibold whitespace-nowrap">{(item.lineTotal ?? item.totalPrice ?? 0).toLocaleString('vi-VN')} ₫</p>
              </div>
            ))}
          </div>
        </section>

        {/* Shipping Info */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Thông tin Giao hàng</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Email" name="email" value={formData.email} onChange={handleFormChange} type="email" placeholder="you@example.com" error={errors.email} />
            <Field label="Họ tên" name="shippingFullName" value={formData.shippingFullName} onChange={handleFormChange} required error={errors.shippingFullName} />
            <Field label="Số điện thoại" name="shippingPhone" value={formData.shippingPhone} onChange={handleFormChange} required placeholder="09xxxxxxxx" error={errors.shippingPhone} />
            <Field label="Đường / Số nhà" name="shippingStreet" value={formData.shippingStreet} onChange={handleFormChange} required error={errors.shippingStreet} />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Select label="Tỉnh/Thành" name="shippingProvince" value={formData.shippingProvince} onChange={handleFormChange} required options={provinces.map(p => ({ value: p.name, label: p.name }))} error={errors.shippingProvince} />
            <Select label="Quận/Huyện" name="shippingDistrict" value={formData.shippingDistrict} onChange={handleFormChange} required disabled={!districts.length} options={districts.map(d => ({ value: d.name, label: d.name }))} error={errors.shippingDistrict} />
            <Select label="Phường/Xã" name="shippingWard" value={formData.shippingWard} onChange={handleFormChange} required disabled={!wards.length} options={wards.map(w => ({ value: w.name, label: w.name }))} error={errors.shippingWard} />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="shippingNotes">Ghi chú thêm</label>
            <textarea id="shippingNotes" name="shippingNotes" value={formData.shippingNotes} onChange={handleFormChange} rows={3} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ví dụ: Giao giờ hành chính" />
          </div>
        </section>

        {/* Billing Address */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Địa chỉ Thanh toán</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="billingSameAsShipping" checked={formData.billingSameAsShipping} onChange={handleFormChange} />
            Giống địa chỉ giao hàng
          </label>
          {!formData.billingSameAsShipping && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Họ tên" name="billingFullName" value={formData.billingFullName} onChange={handleFormChange} required error={errors.billingFullName} />
                <Field label="Số điện thoại" name="billingPhone" value={formData.billingPhone} onChange={handleFormChange} error={errors.billingPhone} />
                <Field label="Đường / Số nhà" name="billingStreet" value={formData.billingStreet} onChange={handleFormChange} error={errors.billingStreet} />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <Select label="Tỉnh/Thành" name="billingProvince" value={formData.billingProvince} onChange={handleFormChange} options={provinces.map(p => ({ value: p.name, label: p.name }))} error={errors.billingProvince} />
                <Select label="Quận/Huyện" name="billingDistrict" value={formData.billingDistrict} onChange={handleFormChange} options={districts.map(d => ({ value: d.name, label: d.name }))} error={errors.billingDistrict} />
                <Select label="Phường/Xã" name="billingWard" value={formData.billingWard} onChange={handleFormChange} options={wards.map(w => ({ value: w.name, label: w.name }))} error={errors.billingWard} />
              </div>
            </div>
          )}
        </section>

        {/* Payment Methods */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Phương thức Thanh toán</h2>
          {/* Redesigned as two large selectable cards (COD & VNPAY). */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              { key: 'COD', label: 'COD (Thanh toán khi nhận hàng)',
                icon: (
                  <img src="/Delivery/cash-on-delivery.png" alt="COD" className="h-5 w-5 object-contain" />
                )
              },
              { key: 'VNPAY', label: 'VNPay (Thẻ/QR online)',
                icon: (
                  <img src="/Delivery/vnpay-icon.webp" alt="VNPay" className="h-5 w-5 object-contain" />
                )
              }
            ] as const).map(opt => {
              const active = paymentMethod === opt.key;
              const isVnpay = opt.key === 'VNPAY';
              return (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => setPaymentMethod(opt.key)}
                  aria-pressed={active}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-4 text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${active ? 'border-blue-600 bg-blue-50 text-blue-700' : (isVnpay ? 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50')}`}
                >
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${active ? 'bg-blue-600 text-white' : (isVnpay ? 'bg-white text-gray-600' : 'bg-gray-100 text-gray-600')}`}>
                    {opt.icon}
                  </span>
                  <span className="text-left">{opt.label}</span>
                </button>
              );
            })}
          </div>  
        </section>
      </div>

      {/* RIGHT COLUMN (Sticky Summary) */}
      <aside className="lg:col-span-1">
        <div className="sticky top-24 space-y-5 rounded-lg border border-gray-200 p-6 shadow-sm bg-white">
          <h2 className="text-xl font-semibold">Tóm tắt đơn hàng</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Tạm tính</span><span>{Number(subTotal || 0).toLocaleString('vi-VN')} ₫</span></div>
            {voucherDiscount > 0 && (
              <div className="flex justify-between text-green-600"><span>Voucher{applied_voucher?.code ? ` (${applied_voucher.code})` : ''}</span><span>- {voucherDiscount.toLocaleString('vi-VN')} ₫</span></div>
            )}
            {progressiveDiscount > 0 && (
              <div className="flex justify-between text-green-600"><span>Giảm thêm</span><span>- {progressiveDiscount.toLocaleString('vi-VN')} ₫</span></div>
            )}
            <div className="flex justify-between"><span>Phí vận chuyển</span><span>{shippingFee.toLocaleString('vi-VN')} ₫</span></div>
          </div>
          <hr />
          <div className="flex justify-between text-lg font-bold"><span>Tổng cộng</span><span>{finalTotal.toLocaleString('vi-VN')} ₫</span></div>

          {errors.submit && (
            <p className="text-sm text-red-600">{errors.submit}</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang xử lý...' : 'HOÀN TẤT ĐƠN HÀNG'}
          </button>
        </div>
      </aside>
    </form>
  );
}
