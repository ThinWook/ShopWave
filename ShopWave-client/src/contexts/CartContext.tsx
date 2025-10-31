
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { api, UnauthorizedError, getAuthToken } from '@/lib/api';
import { formatApiError, humanizeFieldErrors } from '@/lib/error-format';
import type { FECartItem as CartItem, FEProduct as Product } from '@/lib/api';

interface CartState {
  items: CartItem[];
  isSyncing: boolean;
  error: string | null;
}

type CartAction =
  | { type: 'SET_CART'; items: CartItem[] }
  | { type: 'SET_SYNCING'; value: boolean }
  | { type: 'SET_ERROR'; message: string | null };

const initialState: CartState = {
  items: [],
  isSyncing: false,
  error: null,
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
} | undefined>(undefined);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, items: action.items };
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

  const loadRemote = useCallback(async () => {
    // If not logged in, keep cart empty without calling backend
    if (!getAuthToken()) {
      dispatch({ type: 'SET_CART', items: [] });
      return;
    }
    dispatch({ type: 'SET_SYNCING', value: true });
    dispatch({ type: 'SET_ERROR', message: null });
    try {
      const res = await api.cart.get();
      dispatch({ type: 'SET_CART', items: res.items });
      localStorage.setItem('shopwave-cart', JSON.stringify(res.items));
    } catch (e: any) {
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
      dispatch({ type: 'SET_SYNCING', value: false });
    }
  }, []);

  useEffect(() => {
    loadRemote();
  }, [loadRemote]);

  useEffect(() => {
    if (state.items.length > 0) {
      localStorage.setItem('shopwave-cart', JSON.stringify(state.items));
    } else if (localStorage.getItem('shopwave-cart')) {
      localStorage.removeItem('shopwave-cart');
    }
  }, [state.items]);

  const syncWrapper = async <T,>(fn: () => Promise<T>) => {
    dispatch({ type: 'SET_SYNCING', value: true });
    dispatch({ type: 'SET_ERROR', message: null });
    try {
      const result: any = await fn();
      if (result?.items) {
        dispatch({ type: 'SET_CART', items: result.items });
        localStorage.setItem('shopwave-cart', JSON.stringify(result.items));
      }
      return result;
    } catch (e: any) {
      if (e instanceof UnauthorizedError) {
        // user not logged in - silent
        return;
      }
      const fe = formatApiError(e);
      dispatch({ type: 'SET_ERROR', message: humanizeFieldErrors(fe.fieldErrors) || fe.message || 'Cart action failed' });
      throw e;
    } finally {
      dispatch({ type: 'SET_SYNCING', value: false });
    }
  };

  const addItem = async (product: Product, quantity = 1) => {
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

  const getCartTotal = () => {
    return state.items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ state, dispatch, addItem, removeItem, updateQuantity, clearCart, getCartTotal, getItemCount, reload: loadRemote }}>
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
