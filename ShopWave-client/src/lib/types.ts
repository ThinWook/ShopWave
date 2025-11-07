// Legacy types now sourced from api.ts; keep backward compatible re-exports if some components still import from here.
export type { FEProduct as Product, FEReview as Review, FECartItem as CartItem } from './api';

export type SortOption = "price_asc" | "price_desc" | "popularity";

// Cart discount-related types used across UI/Context
export interface ProgressiveDiscount {
	// Discount currently applied (in VND)
	currentDiscountValue: number;
	// Next discount threshold (in VND) - null if max tier reached
	nextDiscountThreshold: number | null;
	// Discount amount at next tier (in VND) - null if max tier reached
	nextDiscountValue: number | null;
	// Amount to spend to reach next tier (in VND) - null if max tier reached
	amountToNext: number | null;
	// Legacy fields (deprecated but kept for backward compatibility)
	nextThresholdRemaining?: number;
	progressPercent?: number;
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
