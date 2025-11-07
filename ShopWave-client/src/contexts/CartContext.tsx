
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { api, UnauthorizedError, getAuthToken } from '@/lib/api';
import { formatApiError, humanizeFieldErrors } from '@/lib/error-format';
import { useToast } from '@/hooks/use-toast';
import type { FECartItem as CartItem, FEProduct as Product } from '@/lib/api';
import type { ProgressiveDiscount, AppliedVoucher, AvailableVoucher } from '@/lib/types';

interface CartState {
  items: CartItem[];
  isSyncing: boolean;
  error: string | null;
  // Totals from backend when available
  totalItems: number;
  subTotal: number;
  shippingFee: number;
  total: number;
  progressiveDiscount?: ProgressiveDiscount | null;
  appliedVoucher?: AppliedVoucher | null;
  availableVouchers?: AvailableVoucher[] | null;
}

type CartAction =
  | { type: 'SET_CART'; items: CartItem[]; totals?: Partial<Pick<CartState, 'totalItems' | 'subTotal' | 'shippingFee' | 'total'>>; extras?: Partial<Pick<CartState, 'progressiveDiscount' | 'appliedVoucher' | 'availableVouchers'>> }
  | { type: 'SET_SYNCING'; value: boolean }
  | { type: 'SET_ERROR'; message: string | null };

const initialState: CartState = {
  items: [],
  isSyncing: false,
  error: null,
  totalItems: 0,
  subTotal: 0,
  shippingFee: 0,
  total: 0,
  progressiveDiscount: null,
  appliedVoucher: null,
  availableVouchers: null,
};

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getItemCount: () => number;
  reload: () => Promise<void>;
  applyVoucher: (code: string) => Promise<void>;
  removeVoucher: () => Promise<void>;
} | undefined>(undefined);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_CART':
      return {
        ...state,
        items: action.items,
        totalItems: action.totals?.totalItems ?? action.items.reduce((c, it) => c + it.quantity, 0),
        subTotal: action.totals?.subTotal ?? action.items.reduce((s, it) => s + it.price * it.quantity, 0),
        shippingFee: action.totals?.shippingFee ?? state.shippingFee,
        total: action.totals?.total ?? ((action.totals?.subTotal ?? action.items.reduce((s, it) => s + it.price * it.quantity, 0)) + (action.totals?.shippingFee ?? state.shippingFee)),
        progressiveDiscount: action.extras?.progressiveDiscount ?? state.progressiveDiscount ?? null,
        appliedVoucher: action.extras?.appliedVoucher ?? state.appliedVoucher ?? null,
        availableVouchers: action.extras?.availableVouchers ?? state.availableVouchers ?? null,
      };
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.message };
    default:
      return state;
  }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { toast } = useToast();
  // Prevent race conditions between initial load and user actions (add/update/remove)
  // by tracking the latest async operation. Older responses will be ignored.
  const latestOpIdRef = useRef(0);

  const beginOp = () => {
    latestOpIdRef.current += 1;
    const opId = latestOpIdRef.current;
    dispatch({ type: 'SET_SYNCING', value: true });
    dispatch({ type: 'SET_ERROR', message: null });
    return opId;
  };

  const loadRemote = useCallback(async () => {
    const opId = beginOp();
    try {
      const res = await api.cart.get();
      // Ignore if a newer operation has started since this one began
      if (opId !== latestOpIdRef.current) return;
      // Extract totals from either res.data or res itself
      const dataObj = res.data && typeof res.data === 'object' ? res.data : res;
      const extras = extractExtras(res);
      dispatch({ type: 'SET_CART', items: res.items, totals: {
        totalItems: dataObj.totalItems ?? dataObj.total_items,
        subTotal: dataObj.subTotal ?? dataObj.sub_total,
        shippingFee: dataObj.shippingFee ?? dataObj.shipping_fee ?? 0,
        total: dataObj.total,
      }, extras });
      localStorage.setItem('shopwave-cart', JSON.stringify(res.items));
    } catch (e: any) {
      if (opId !== latestOpIdRef.current) return;
      if (e instanceof UnauthorizedError) {
        // Do not treat as hard error; just keep empty cart until login
        dispatch({ type: 'SET_ERROR', message: null });
        dispatch({ type: 'SET_CART', items: [] });
        return;
      }
      const fe = formatApiError(e);
      const storedCart = localStorage.getItem('shopwave-cart');
      if (storedCart) {
        try { dispatch({ type: 'SET_CART', items: JSON.parse(storedCart) as CartItem[] }); } catch { localStorage.removeItem('shopwave-cart'); }
      }
      dispatch({ type: 'SET_ERROR', message: humanizeFieldErrors(fe.fieldErrors) || fe.message || 'Failed to load cart' });
    } finally {
      if (opId === latestOpIdRef.current) {
        dispatch({ type: 'SET_SYNCING', value: false });
      }
    }
  }, []);

  // Avoid loading cart on product detail pages to reduce unnecessary calls
  const pathname = usePathname();
  useEffect(() => {
    // Whitelist routes where we should load the remote cart.
    // Loading cart on every route is expensive; prefer explicit routes where cart data is needed.
    const CART_WHITELIST = ['/cart', '/checkout', '/profile', '/orders'];
    if (pathname && CART_WHITELIST.some(p => pathname.startsWith(p))) {
        loadRemote();
      }
  }, [pathname, loadRemote]);

  useEffect(() => {
    if (state.items.length > 0) {
      localStorage.setItem('shopwave-cart', JSON.stringify(state.items));
    } else if (localStorage.getItem('shopwave-cart')) {
      localStorage.removeItem('shopwave-cart');
    }
  }, [state.items]);

  const syncWrapper = async <T,>(fn: () => Promise<T>) => {
    const opId = beginOp();
    try {
      const result: any = await fn();
      if (result?.items) {
        if (opId === latestOpIdRef.current) {
          // Extract totals from either result.data or result itself
          const dataObj = result.data && typeof result.data === 'object' ? result.data : result;
          const extras = extractExtras(result);
          dispatch({ type: 'SET_CART', items: result.items, totals: {
            totalItems: dataObj.totalItems ?? dataObj.total_items,
            subTotal: dataObj.subTotal ?? dataObj.sub_total,
            shippingFee: dataObj.shippingFee ?? dataObj.shipping_fee ?? 0,
            total: dataObj.total,
          }, extras });
          localStorage.setItem('shopwave-cart', JSON.stringify(result.items));
        }
      }
      return result;
    } catch (e: any) {
      if (opId !== latestOpIdRef.current) return;
      if (e instanceof UnauthorizedError) {
        // user not logged in - silent
        return;
      }
      const fe = formatApiError(e);
      // Friendly toast + set error state. Show traceId when available to help support.
      let toastDesc = humanizeFieldErrors(fe.fieldErrors) || fe.message || 'Cart action failed';
      if (fe.message === 'OUT_OF_STOCK') toastDesc = 'Insufficient stock for selected variant.';
      else if (fe.message === 'NOT_FOUND') toastDesc = 'Requested item not found. It may have been removed.';
      else if (fe.message === 'INTERNAL_ERROR') toastDesc = 'Unexpected server error. Please try again later.';
      const trace = fe.traceId ? ` Ref: ${fe.traceId}` : '';
      try { toast({ title: 'Cart update failed', description: `${toastDesc}${trace}` }); } catch {}
      dispatch({ type: 'SET_ERROR', message: toastDesc });
      throw e;
    } finally {
      if (opId === latestOpIdRef.current) {
        dispatch({ type: 'SET_SYNCING', value: false });
      }
    }
  };

  const addItem = async (product: Product, quantity = 1) => {
    // For products with variants, product.id may be the variant id provided by caller
    await syncWrapper(() => api.cart.add(product.id, quantity));
  };
  const removeItem = async (cartItemId: string) => {
    await syncWrapper(() => api.cart.remove(cartItemId));
  };
  const updateQuantity = async (cartItemId: string, quantity: number) => {
    await syncWrapper(() => api.cart.update(cartItemId, quantity));
  };
  const clearCart = async () => {
    await syncWrapper(() => api.cart.clear());
  };

  const applyVoucher = async (code: string) => {
    // Log and show a short toast on apply to help ensure correct code is being sent/applied
    try {
      // keep a local copy of code to avoid any closure/stale issues
      const voucherCode = String(code ?? '');
      // debug console to help trace issues in dev
      try { console.debug('[Cart] applying voucher', voucherCode); } catch {}
      const res = await syncWrapper(() => api.cart.applyVoucher(voucherCode));
      try { if (res) { toast({ title: 'Đã áp dụng voucher', description: voucherCode }); } } catch {}
      return res;
    } catch (e) {
      // rethrow to allow callers to handle errors/toasts
      throw e;
    }
  };
  const removeVoucher = async () => {
    await syncWrapper(() => api.cart.removeVoucher());
  };

  const getCartTotal = () => state.subTotal;

  const getItemCount = () => state.totalItems;

  return (
    <CartContext.Provider value={{ state, dispatch, addItem, removeItem, updateQuantity, clearCart, getCartTotal, getItemCount, reload: loadRemote, applyVoucher, removeVoucher }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// ---- helpers to extract extras from various backend shapes ----
function extractExtras(payload: any): Partial<Pick<CartState, 'progressiveDiscount' | 'appliedVoucher' | 'availableVouchers'>> {
  const root = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  const pd = root?.progressive_discount ?? root?.progressiveDiscount ?? null;
  const av = root?.applied_voucher ?? root?.appliedVoucher ?? null;
  const list = root?.available_vouchers ?? root?.availableVouchers ?? null;
  const progressiveDiscount: ProgressiveDiscount | null = pd ? {
    currentDiscountValue: Number(pd.currentDiscountValue ?? pd.current_discount_value ?? 0),
    nextDiscountThreshold: pd.nextDiscountThreshold ?? pd.next_discount_threshold ?? null,
    nextDiscountValue: pd.nextDiscountValue ?? pd.next_discount_value ?? null,
    amountToNext: pd.amountToNext ?? pd.amount_to_next ?? null,
    // Legacy fields for backward compatibility
    nextThresholdRemaining: Number(pd.next_threshold_remaining ?? pd.nextThresholdRemaining ?? pd.amountToNext ?? pd.amount_to_next ?? 0),
    progressPercent: Number(pd.progress_percent ?? pd.progressPercent ?? 0),
  } : null;
  const appliedVoucher: AppliedVoucher | null = av ? {
    code: String(av.code ?? ''),
    discountAmount: Number(av.discount_amount ?? av.discountAmount ?? 0),
    description: av.description ?? null,
  } : null;
  const availableVouchers: AvailableVoucher[] | null = Array.isArray(list)
    ? list.map((v: any) => ({ code: String(v.code ?? ''), description: v.description ?? null, discountAmount: typeof v.discount_amount === 'number' ? v.discount_amount : (typeof v.discountAmount === 'number' ? v.discountAmount : undefined) }))
    : null;
  return { progressiveDiscount, appliedVoucher, availableVouchers };
}
