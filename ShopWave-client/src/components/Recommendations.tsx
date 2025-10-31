"use client";

import useSWR from 'swr';
import React, { useEffect } from 'react';
import { ProductGrid } from './products/ProductGrid';
import type { Product } from '@/lib/types';
import { api } from '@/lib/api';

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Network error');
  return res.json();
};

export function Recommendations({ userId, productId, k = 8 }: { userId?: string; productId?: string; k?: number }) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (productId) params.set('productId', productId);
  params.set('k', String(k));

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const url = `${base.replace(/\/$/, '')}/api/v1/recommendations?${params.toString()}`;

  const { data, error } = useSWR(url, fetcher, { revalidateOnFocus: false, dedupingInterval: 60000 });

  useEffect(() => {
    // send impression tracking when data is available
    if (data && Array.isArray(data.recommendations)) {
      try {
        const ids = data.recommendations.map((r: any) => r.id || String(r));
        api.recommendationsTracking.impression({ userId: userId ?? null, productIds: ids, source: 'component_recommendations' });
      } catch (e) {
        // ignore
      }
    }
  }, [data, userId]);

  if (error) return <div>Error loading recommendations</div>;
  if (!data) return <div>Loading...</div>;

  // Expecting data.recommendations to be array of product-like objects or ids
  const recs: Product[] = Array.isArray(data.recommendations)
    ? data.recommendations.map((r: any) => ({
        id: r.id ?? String(r),
        name: r.title ?? r.name ?? String(r),
        description: r.description ?? '',
        price: Number(r.price ?? 0),
        category: r.category ?? r.categoryName ?? '',
        imageUrl: r.imageUrl ?? r.image ?? '/placeholder.png',
        rating: Number(r.score ?? r.rating ?? 0),
        reviewsCount: Number(r.reviewsCount ?? 0),
        popularity: Number(r.popularity ?? 0),
        stockQuantity: Number(r.stockQuantity ?? 0),
        isActive: true
      }))
    : [];

  return (
    <section>
      <h3 className="text-lg font-semibold mb-2">Recommended for you</h3>
      <ProductGrid products={recs} />
    </section>
  );
}

export default Recommendations;
