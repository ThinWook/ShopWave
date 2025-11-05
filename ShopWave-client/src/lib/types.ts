// Legacy types now sourced from api.ts; keep backward compatible re-exports if some components still import from here.
export type { FEProduct as Product, FEReview as Review, FECartItem as CartItem } from './api';

export type SortOption = "price_asc" | "price_desc" | "popularity";

// Cart discount-related types used across UI/Context
export interface ProgressiveDiscount {
	// How much more to spend to reach next tier (in VND)
	nextThresholdRemaining: number;
	// Discount amount at next tier (in VND)
	nextDiscountValue: number;
	// Discount currently applied (in VND)
	currentDiscountValue: number;
	// 0-100 visual progress toward next tier
	progressPercent: number;
}

export interface AppliedVoucher {
	code: string;
	discountAmount: number;
	description?: string | null;
}

export interface AvailableVoucher {
	code: string;
	description?: string | null;
	// Optional preview of discount amount (depends on backend rules)
	discountAmount?: number;
}
