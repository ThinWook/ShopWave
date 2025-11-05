
"use client";

import type { SortOption } from '@/lib/types';
import { api } from '@/lib/api';
import { formatApiError, humanizeFieldErrors } from '@/lib/error-format';
import type { FEProduct as Product } from '@/lib/api';
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface ProductFilters {
  category: string | null;
  priceRange: [number, number];
  searchQuery: string;
}

interface ProductContextState {
  allProducts: Product[];
  filteredProducts: Product[];
  filters: ProductFilters;
  setFilters: (filters: Partial<ProductFilters>) => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  categories: string[];
  minMaxPrice: [number, number];
  browsingHistory: string[]; // Store product IDs
  addToBrowsingHistory: (productId: string) => void;
  getProductById: (id: string) => Product | undefined;
  reload: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const initialFilters: ProductFilters = {
  category: null,
  priceRange: [0, 1000], // Default wide range
  searchQuery: '',
};

const ProductContext = createContext<ProductContextState | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(allProducts);
  const [filters, setInternalFilters] = useState<ProductFilters>(initialFilters);
  const [sortOption, setSortOption] = useState<SortOption>('popularity');
  const [categories, setCategories] = useState<string[]>([]);
  const [minMaxPrice, setMinMaxPrice] = useState<[number, number]>([0, 0]);
  const [browsingHistory, setBrowsingHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.products.list({ page: 1, pageSize: 100 }); // initial load
      setAllProducts(result.data);
    } catch (e: any) {
      const fe = formatApiError(e);
      // If backend response shape caused the error, fallback to empty list to avoid breaking the UI
      const msg = fe.message || String(e || '');
      console.error('Failed to load products from backend:', fe.traceId ? `[traceId=${fe.traceId}]` : '', e);
      if (msg.includes('Unexpected products response shape') || msg.includes('Not Modified')) {
        // Try to recover from the saved raw payload (we persist it when parsing fails)
        try {
          const saved = (typeof window !== 'undefined' && (window as any).__LAST_API_PRODUCTS_RAW) || (typeof window !== 'undefined' && localStorage.getItem('shopwave_last_products_raw'));
          let raw: any = null;
          if (saved) {
            raw = typeof saved === 'string' ? JSON.parse(saved) : saved;
          }
          // Extract items from common locations
          const items = raw?.data?.items ?? raw?.items ?? raw?.data ?? (Array.isArray(raw) ? raw : null);
          if (Array.isArray(items)) {
            // Minimal mapping to FEProduct to keep UI functional while backend shape is fixed
            const mapDtoToFE = (d: any): Product => ({
              id: d.id,
              name: d.name,
              description: d.description ?? '',
              price: Number(d.price ?? 0),
              category: d.categoryName ?? d.category ?? '',
              imageUrl: d.imageUrl ?? d.mainImage?.url ?? '/placeholder.png',
              slug: d.slug ?? undefined,
              createdAt: d.createdAt ?? undefined,
              mainImage: d.mainImage ?? null,
              galleryImages: d.galleryImages ?? [],
              variants: d.variants ?? [],
              size: d.size ?? null,
              rating: Number(d.rating ?? 0),
              reviewsCount: Number(d.reviewsCount ?? 0),
              popularity: Number(d.reviewsCount ?? 0),
              stockQuantity: Number(d.stockQuantity ?? 0),
              isActive: Boolean(d.isActive ?? true),
            });
            const mapped = items.map(mapDtoToFE);
            setAllProducts(mapped);
            setError(null);
          } else {
            console.warn('ProductProvider: falling back to empty products due to response parsing issue');
            setAllProducts([]);
            setError(null);
          }
        } catch (inner) {
          console.warn('ProductProvider fallback mapping failed', inner);
          setAllProducts([]);
          setError(null);
        }
      } else {
        setError(humanizeFieldErrors(fe.fieldErrors) || fe.message || 'Failed to load products');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Only preload list on non-detail pages to avoid extra traffic on product detail
  const pathname = usePathname();
  useEffect(() => {
    // Avoid preloading the product list on product detail and cart pages
    const onProductDetail = pathname?.startsWith('/product/');
    const onCartPage = pathname?.startsWith('/cart');
    if (!onProductDetail && !onCartPage) {
      loadProducts();
    }
  }, [pathname, loadProducts]);

  useEffect(() => {
    if (allProducts.length === 0) return;
    const uniqueCategories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
    setCategories(uniqueCategories);

    const prices = allProducts.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    setMinMaxPrice([min, max]);
    setInternalFilters(prev => ({ ...prev, priceRange: [min, max] }));
  }, [allProducts]);
  
  useEffect(() => {
    const storedHistory = localStorage.getItem('shopwave-browsing-history');
    if (storedHistory) {
      try {
        setBrowsingHistory(JSON.parse(storedHistory));
      } catch (e) {
        localStorage.removeItem('shopwave-browsing-history');
      }
    }
  }, []);

  const addToBrowsingHistory = useCallback((productId: string) => {
    setBrowsingHistory(prevHistory => {
      const newHistory = [productId, ...prevHistory.filter(id => id !== productId)].slice(0, 10); // Keep last 10 viewed
      localStorage.setItem('shopwave-browsing-history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const setFilters = (newFilters: Partial<ProductFilters>) => {
    setInternalFilters(prev => ({ ...prev, ...newFilters }));
  };

  useEffect(() => {
    let products = [...allProducts];

    // Apply search query
    if (filters.searchQuery) {
      products = products.filter(p =>
        p.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (filters.category) {
      products = products.filter(p => p.category === filters.category);
    }

    // Apply price range filter
    products = products.filter(p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]);

    // Rating filter removed

    // Apply sorting
    switch (sortOption) {
      case 'price_asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'popularity':
        products.sort((a, b) => b.popularity - a.popularity);
        break;
      // 'rating' sort removed
    }

    setFilteredProducts(products);
  }, [filters, sortOption, allProducts]);
  
  const getProductById = useCallback((id: string): Product | undefined => {
    return allProducts.find(p => p.id === id);
  }, [allProducts]);

  return (
    <ProductContext.Provider value={{ 
        allProducts, 
        filteredProducts, 
        filters, 
        setFilters, 
        sortOption, 
        setSortOption, 
        categories, 
        minMaxPrice,
        browsingHistory,
        addToBrowsingHistory,
        getProductById,
        reload: loadProducts,
        isLoading,
        error
      }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
