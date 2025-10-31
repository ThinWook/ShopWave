import { api } from "../utils/apiClient";
import type { Product, ApiProduct, StockStatus } from "../types/product";

export type GetProductsParams = {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: "price" | "rating" | "popularity" | "name";
  sortDirection?: "asc" | "desc";
};

export type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

// Backend Product DTO shape (from API spec)
// DTOs returned from the API for product detail / edit operations
export type VariantAttributeDto = {
  name: string;
  value: string;
};

export type VariantDto = {
  id?: string | null;
  sku?: string | null;
  price: number;
  stock: number;
  imageId?: number | null;
  size?: string | null;
  color?: string | null;
  // attributes removed
};

export type GalleryMediaDto = {
  id: number;
  url?: string;
  sortOrder?: number;
};

export type ProductDto = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  categoryName: string;
  imageUrl?: string | null;
  rating: number;
  reviewsCount: number;
  stockQuantity: number;
  isActive: boolean;
  size?: string | null;
  // Extended fields supported by backend/product detail
  slug?: string | null;
  mainImage?: {
    id?: number | null;
    url?: string | null;
    altText?: string | null;
  } | null;
  galleryImages?: GalleryMediaDto[];
  variants?: VariantDto[];
};

// ETag cache: key = query string
const etagCache = new Map<string, { etag: string; payload: PagedResult<Product> }>();

export async function getProducts(params: GetProductsParams = {}): Promise<PagedResult<Product>> {
  const { page = 1, pageSize = 20 } = params;
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("pageSize", String(pageSize));
  if (params.searchTerm) query.set("searchTerm", params.searchTerm);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (typeof params.minPrice === "number") query.set("minPrice", String(params.minPrice));
  if (typeof params.maxPrice === "number") query.set("maxPrice", String(params.maxPrice));
  if (typeof params.minRating === "number") query.set("minRating", String(params.minRating));
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDirection) query.set("sortDirection", params.sortDirection);

  const key = query.toString();
  const cached = etagCache.get(key);
  const headers: Record<string, string> = {};
  if (cached?.etag) headers["If-None-Match"] = cached.etag;

  const res = await api.raw(`/api/v1/products?${query.toString()}`, { method: "GET", headers, skipAuth: true });
  if (res.status === 304 && cached) return cached.payload;
  if (!res.ok) throw await toApiError(res);

  const etag = res.headers.get("etag") ?? undefined;
  const envelope = await res.json();
  // backend returns { success, code, data: { items: [...], currentPage, pageSize, totalRecords, ... } }
  const paged = envelope?.data;

  const list = Array.isArray(paged?.items) ? (paged.items as unknown[]) : [];
  const itemsRaw: ApiProduct[] = list as ApiProduct[];
  const items: Product[] = itemsRaw.map(normalizeProduct);
  const total = Number(paged?.totalRecords ?? items.length);
  const result: PagedResult<Product> = {
    items,
    total,
    page: Number(paged?.currentPage ?? page),
    pageSize: Number(paged?.pageSize ?? pageSize) || pageSize,
  };

  if (etag) etagCache.set(key, { etag, payload: result });
  return result;
}

async function toApiError(res: Response) {
  let message = res.statusText;
  let fieldErrors: Record<string, string> | undefined;
  try {
    const data = await res.json();
    if (data && typeof data === "object") {
      // Try common envelope shapes
      message = (data.message as string) || (data.title as string) || message;

      const rawErrors: unknown = (data as any).errors ?? (data as any).validationErrors ?? (data as any).error?.errors;
      // Support .NET ProblemDetails style { errors: { Field: ["msg1", "msg2"] } }
      if (rawErrors && typeof rawErrors === "object" && !Array.isArray(rawErrors)) {
        const map: Record<string, string> = {};
        for (const [key, val] of Object.entries(rawErrors as Record<string, unknown>)) {
          if (typeof val === "string" && val) map[key] = val;
          else if (Array.isArray(val)) {
            const first = val.find(v => typeof v === "string") as string | undefined;
            if (first) map[key] = first;
          }
        }
        if (Object.keys(map).length) fieldErrors = map;
      }
      // Support array style [{ field: "name", message: "..." }]
      if (!fieldErrors && Array.isArray(rawErrors)) {
        const map: Record<string, string> = {};
        for (const item of rawErrors) {
          if (item && typeof item === "object") {
            const f = (item as any).field ?? (item as any).name ?? (item as any).key;
            const m = (item as any).message ?? (item as any).error ?? (item as any).msg;
            if (typeof f === "string" && typeof m === "string") map[f] = m;
          }
        }
        if (Object.keys(map).length) fieldErrors = map;
      }
    }
  } catch {
    // ignore JSON parse errors; keep statusText
  }
  const err = new Error(message) as Error & { status?: number; fieldErrors?: Record<string, string> };
  err.status = res.status;
  if (fieldErrors) err.fieldErrors = fieldErrors;
  return err;
}

export function normalizeProduct(p: ApiProduct): Product {
  const get = (key: string): unknown => (p as Record<string, unknown>)[key];
  const getString = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = get(k);
      if (typeof v === "string" && v.length > 0) return v;
    }
    return undefined;
  };
  const getNumber = (...keys: string[]): number | undefined => {
    for (const k of keys) {
      const v = get(k);
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (typeof v === "string") {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
      }
    }
    return undefined;
  };
  const getBoolean = (...keys: string[]): boolean | undefined => {
    for (const k of keys) {
      const v = get(k);
      if (typeof v === "boolean") return v;
      if (typeof v === "number") return v > 0;
      if (typeof v === "string") {
        if (/^(true|1|yes|in\s*stock|available|còn\s*hàng)$/i.test(v.trim())) return true;
        if (/^(false|0|no|out\s*of\s*stock|hết\s*hàng)$/i.test(v.trim())) return false;
      }
    }
    return undefined;
  };

  const inStock = getBoolean("stockStatus", "stock", "inStock") ?? (getNumber("stockQuantity", "quantity", "qty") ?? 0) > 0;

  const createdAtStr = getString("createdAt", "created_at", "createdDate", "created_date", "createdOn");
  const createdAtNum = getNumber("createdAt", "created_at", "createdDate", "created_date", "createdOn");
  const createdAt = createdAtStr
    ? new Date(createdAtStr).toISOString()
    : typeof createdAtNum === "number"
      ? new Date(createdAtNum).toISOString()
      : new Date().toISOString();

  const image = getString("imageUrl", "image_url", "image", "thumbnail", "thumbUrl") ?? "";

  // Prefer thumbnailUrl from new backend shape
  const imagePref = getString("thumbnailUrl", "thumbnail_url", "thumbnail", "thumbUrl");
  const finalImage = imagePref ?? image ?? "";

  const priceNum = getNumber("price", "unitPrice", "amount") ?? 0;
  const quantity = getNumber("stockQuantity", "quantity", "qty");

  const idRaw = get("id") ?? get("_id");
  const id: string | number = typeof idRaw === "string" || typeof idRaw === "number" ? idRaw : String(Math.random());

  const name = getString("name", "title") ?? "Unnamed Product";
  const category = getString("category", "categoryName", "category_name") ?? "Unknown";
  const brand = getString("brand", "brandName", "brand_name") ?? "-";
  const size = getString("size", "Size", "productSize", "product_size");

  return {
    id,
    name,
    category,
    brand,
    size: size as any,
    price: priceNum,
    quantity: typeof quantity === "number" ? quantity : undefined,
    stockStatus: (inStock ? "In Stock" : "Out of Stock") as StockStatus,
    createdAt,
    image: finalImage,
  };
}

// Authorized endpoint: GET /api/v1/products/{id}
export async function getProductDetail(id: string): Promise<ProductDto> {
  const payload = await api.get<ProductDto>(`/api/v1/products/${encodeURIComponent(id)}`);
  return payload;
}

// Authorized DELETE /api/v1/products/{id}
export type DeleteProductResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

export async function deleteProduct(id: string): Promise<DeleteProductResponse> {
  const res = await api.raw(`/api/v1/products/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await toApiError(res);
    // Treat already inactive as a successful no-op per requirement
    if ((err as any)?.message === "PRODUCT_ALREADY_INACTIVE") {
      return { success: true, message: "PRODUCT_ALREADY_INACTIVE" };
    }
    throw err;
  }
  // Parse response body to surface message like PRODUCT_DEACTIVATED
  try {
    const json = await res.json();
    const payload = (json && typeof json === "object" && "data" in json) ? json : json;
    return {
      success: (payload as any)?.success ?? true,
      message: (payload as any)?.message,
      data: (payload as any)?.data,
    };
  } catch {
    return { success: true };
  }
}

export type CreateProductInput = {
  name: string;
  description?: string | null;
  price: number; // in VND per provided example
  categoryId: string; // Guid
  // imageUrl removed — backend uses mainImageId/mediaIds for media
  // Optional slug for the product (backend requires Slug in validation)
  slug?: string | null;
  size?: 'XL' | 'L' | 'M';
  stockQuantity: number;
  // Optional media support: array of uploaded media IDs and an optional main image id
  mediaIds?: number[];
  mainImageId?: number | null;
  // Gallery media request (backend expects an array of mediaId / sortOrder objects)
  galleryMedia?: { mediaId: number; sortOrder?: number }[];
  // Optional variants (each variant may include sku, price, stock, imageId, size, color)
  variants?: VariantDto[];
};

export async function createProduct(input: CreateProductInput): Promise<ProductDto> {
  // Diagnostic log: payload being sent
  try {
    console.debug('[productService] createProduct payload:', input);
  } catch {}

  const res = await api.raw(`/api/v1/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    // attempt to log response body for debugging without consuming original response
    try {
      const clone = res.clone();
      const text = await clone.text();
      console.error('[productService] createProduct failed status=', res.status, 'body=', text);
    } catch (e) {
      console.error('[productService] createProduct failed and response body could not be read', e);
    }
    throw await toApiError(res);
  }
  const json = await res.json();
  return (json && typeof json === "object" && "data" in json ? json.data : json) as ProductDto;
}

// NOTE: createProductV2 removed — use `createProduct` which returns the created ProductDto
