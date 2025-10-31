// product-recommendation.ts
// Gemini-based AI recommendation flow has been disabled/removed.
// This file now exports a safe stub so callers continue to work without runtime errors.

export type ProductRecommendationInput = { browsingHistory: string };
export type ProductRecommendationOutput = { recommendations: string };

export async function getProductRecommendations(
  _input: ProductRecommendationInput
): Promise<ProductRecommendationOutput> {
  // Return an empty recommendations string to preserve the original contract
  // used by the frontend. Frontend should handle empty results and fall back
  // to popularity/local suggestions.
  return { recommendations: '' };
}
