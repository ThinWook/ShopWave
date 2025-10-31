
// Placeholder utilities removed as per requirement: always load from backend.
// Keeping empty exports (if any legacy import remains, it won't break the build).
import type { Product, Review } from '@/lib/types';

export const placeholderProducts: Product[] = [];
export const placeholderReviews: Review[] = [];
export const getProductById = (_id: string): Product | undefined => undefined;
export const getReviewsByProductId = (_productId: string): Review[] => [];
