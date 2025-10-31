export type StockStatus = "In Stock" | "Out of Stock";

// UI-facing Product type used by pages/components
export interface Product {
  id: number | string;
  name: string;
  category: string;
  brand: string;
  size?: 'XL' | 'L' | 'M' | string;
  price: number;
  quantity?: number; // available stock quantity
  stockStatus: StockStatus;
  createdAt: string; // ISO date string
  image: string; // URL (can be absolute or relative)
}

// API product may vary; use 'any' and normalize in service
export type ApiProduct = Record<string, unknown>;

// Detailed product shape used for edit/detail pages
export type VariantAttribute = {
  name: string;
  value: string;
};

export type ProductVariant = {
  sku?: string | null;
  price: number;
  stock: number;
  imageId?: number | null;
  size?: string | null;
  // attributes removed
};

export type GalleryMedia = {
  mediaId: number;
  sortOrder?: number;
};

export interface ProductDetail {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  categoryName: string;
  imageUrl?: string | null;
  slug?: string | null;
  mainImageId?: number | null;
  galleryMedia?: GalleryMedia[];
  variants?: ProductVariant[];
  stockQuantity?: number;
  isActive?: boolean;
}
