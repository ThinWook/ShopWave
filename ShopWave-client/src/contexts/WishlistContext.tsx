
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { api, UnauthorizedError, getAuthToken } from '@/lib/api';
import { formatApiError, humanizeFieldErrors } from '@/lib/error-format';
import type { FEWishlistItem as WishlistItem, FEProduct as Product } from '@/lib/api';

interface WishlistState {
  items: WishlistItem[];
  isSyncing: boolean;
  error: string | null;
}

type WishlistAction =
  | { type: 'SET_WISHLIST'; items: WishlistItem[] }
  | { type: 'SET_SYNCING'; value: boolean }
  | { type: 'SET_ERROR'; message: string | null };

const initialState: WishlistState = {
  items: [],
  isSyncing: false,
  error: null,
};

const WishlistContext = createContext<{
  state: WishlistState;
  dispatch: React.Dispatch<WishlistAction>;
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  reload: () => Promise<void>;
} | undefined>(undefined);

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case 'SET_WISHLIST':
      return { ...state, items: action.items };
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.message };
    default:
      return state;
  }
}

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);

  const loadRemote = useCallback(async () => {
    // If not logged in, keep wishlist empty without calling backend
    if (!getAuthToken()) {
      dispatch({ type: 'SET_WISHLIST', items: [] });
      return;
    }
    dispatch({ type: 'SET_SYNCING', value: true });
    dispatch({ type: 'SET_ERROR', message: null });
    try {
      const res = await api.wishlist.list(1, 100);
      dispatch({ type: 'SET_WISHLIST', items: res.data });
      localStorage.setItem('shopwave-wishlist', JSON.stringify(res.data));
    } catch (e: any) {
      if (e instanceof UnauthorizedError) {
        // Không đăng nhập: giữ wishlist local trống (không báo lỗi)
        dispatch({ type: 'SET_ERROR', message: null });
        dispatch({ type: 'SET_WISHLIST', items: [] });
        return;
      }
      const fe = formatApiError(e);
      const storedWishlist = localStorage.getItem('shopwave-wishlist');
      if (storedWishlist) {
        try { dispatch({ type: 'SET_WISHLIST', items: JSON.parse(storedWishlist) as WishlistItem[] }); } catch { localStorage.removeItem('shopwave-wishlist'); }
      }
      dispatch({ type: 'SET_ERROR', message: humanizeFieldErrors(fe.fieldErrors) || fe.message || 'Failed to load wishlist' });
    } finally {
      dispatch({ type: 'SET_SYNCING', value: false });
    }
  }, []);

  useEffect(() => { loadRemote(); }, [loadRemote]);

  useEffect(() => {
    if (state.items.length > 0) {
      localStorage.setItem('shopwave-wishlist', JSON.stringify(state.items));
    } else if (localStorage.getItem('shopwave-wishlist')) {
      localStorage.removeItem('shopwave-wishlist');
    }
  }, [state.items]);

  const syncWrapper = async (fn: () => Promise<any>) => {
    dispatch({ type: 'SET_SYNCING', value: true });
    dispatch({ type: 'SET_ERROR', message: null });
    try {
      await fn();
      await loadRemote();
    } catch (e: any) {
      if (e instanceof UnauthorizedError) {
        // Silent fail if not logged in
        return;
      }
      const fe = formatApiError(e);
      dispatch({ type: 'SET_ERROR', message: humanizeFieldErrors(fe.fieldErrors) || fe.message || 'Wishlist action failed' });
      throw e;
    } finally {
      dispatch({ type: 'SET_SYNCING', value: false });
    }
  };

  const addToWishlist = async (product: Product) => {
    await syncWrapper(() => api.wishlist.add(product.id));
  };
  const removeFromWishlist = async (productId: string) => {
    await syncWrapper(() => api.wishlist.remove(productId));
  };
  const isInWishlist = (productId: string) => !!state.items.find(item => item.id === productId);

  return (
    <WishlistContext.Provider value={{ state, dispatch, addToWishlist, removeFromWishlist, isInWishlist, reload: loadRemote }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
