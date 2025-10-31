// Legacy types now sourced from api.ts; keep backward compatible re-exports if some components still import from here.
export type { FEProduct as Product, FEReview as Review, FECartItem as CartItem, FEWishlistItem as WishlistItem } from './api';

export type SortOption = "price_asc" | "price_desc" | "popularity" | "rating";
