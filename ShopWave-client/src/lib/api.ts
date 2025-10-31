// Centralized API client for backend integration
// Backend response envelope: { success: boolean; message: string; data: T; errors: string[] }

// ---------- Envelope & Error Types (enhanced) ----------
export interface ApiFieldError {
  field: string | null;
  message: string;
  code?: string | null;
}

export interface ApiMeta {
  durationMs?: number;
  traceId?: string;
  generatedAt?: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors: ApiFieldError[]; // backend standardized object errors
  meta?: ApiMeta;
}

export class ApiError extends Error {
  status?: number;
  fieldErrors?: ApiFieldError[];
  traceId?: string;
  meta?: ApiMeta;
  constructor(message: string, init?: { status?: number; fieldErrors?: ApiFieldError[]; meta?: ApiMeta }) {
    super(message);
    this.name = 'ApiError';
    this.status = init?.status;
    this.fieldErrors = init?.fieldErrors;
    this.meta = init?.meta;
    this.traceId = init?.meta?.traceId;
  }
}

// ---------- DTOs from backend ----------

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string; // Admin | Customer | ...
  isActive: boolean;
  createdAt: string; // ISO8601
}

export interface CategoryDto {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  parentName: string | null;
  isActive: boolean;
  productCount: number;
}

export interface ProductDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryName: string;
  imageUrl: string | null;
  rating: number;
  reviewsCount: number;
  stockQuantity: number;
  isActive: boolean;
}
// Extended ProductDto shape (backend may include additional optional fields)
export interface ImageDto {
  id: number | string;
  url: string;
  altText?: string | null;
  sortOrder?: number;
}

export interface VariantDto {
  id: string;
  sku?: string;
  price?: number;
  stock?: number;
  imageId?: number | string | null;
  size?: string | null;
  color?: string | null;
}

// Augment ProductDto with optional fields the backend may return
export interface ProductDtoExtended extends ProductDto {
  size?: string | null;
  slug?: string | null;
  createdAt?: string | null;
  mainImage?: ImageDto | null;
  galleryImages?: ImageDto[] | null;
  variants?: VariantDto[] | null;
}

export interface ReviewDto {
  id: string;
  userName: string;
  rating: number; // 1-5
  comment: string | null;
  date: string; // ISO8601
  isVerified: boolean;
}

export interface WishlistItemDto {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImageUrl: string | null;
  productRating: number;
  productStockQuantity: number;
  categoryName: string;
  addedAt: string; // ISO8601
}

export interface CartItemDto {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  stockQuantity: number;
}

export interface CartResponseDto {
  items: CartItemDto[];
  totalItems: number;
  subTotal: number;
  shippingFee: number;
  total: number;
}

export interface OrderItemDto {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null; // detail only
  orderDate: string;
  shippedDate?: string | null;
  deliveredDate?: string | null;
  shippingAddress?: string; // JSON string (detail)
  billingAddress?: string | null; // JSON string (detail)
  orderItems: OrderItemDto[];
}

export interface PagedResponse<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalRecords: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ---------- Frontend domain models (mapped) ----------

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string; // mapped from categoryName
  imageUrl: string;
  slug?: string;
  createdAt?: string;
  mainImage?: ImageDto | null;
  galleryImages?: ImageDto[];
  variants?: VariantDto[];
  size?: string | null;
  rating: number;
  reviewsCount: number;
  popularity: number; // we can approximate using reviewsCount or 0
  stockQuantity: number;
  isActive: boolean;
  imageAiHint?: string;
  attributes?: Record<string, string | number>;
}

export interface Review {
  id: string;
  productId?: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verified?: boolean;
}

export interface WishlistItem extends Product {
  addedAt: string;
}

export interface CartItem extends Product {
  quantity: number;
  lineTotal: number;
}

// ---------- Helpers ----------

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// ---- Auth token store (prefer in-memory, fallback session/localStorage) ----
let accessTokenMemory: string | null = null;
let refreshTokenMemory: string | null = null;

function readAccessTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  // Prefer sessionStorage for access token
  return sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
}

function writeAccessTokenToStorage(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    sessionStorage.setItem('authToken', token);
    // keep a copy also in localStorage for simple F5 survival if sessionStorage cleared
    localStorage.setItem('authToken', token);
  } else {
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('authToken');
  }
}

function readRefreshTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

function writeRefreshTokenToStorage(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('refreshToken', token);
  else localStorage.removeItem('refreshToken');
}

export function setAuthTokens(tokens: { accessToken?: string | null; refreshToken?: string | null }) {
  if (tokens.accessToken !== undefined) {
    accessTokenMemory = tokens.accessToken ?? null;
    writeAccessTokenToStorage(accessTokenMemory);
  }
  if (tokens.refreshToken !== undefined) {
    refreshTokenMemory = tokens.refreshToken ?? null;
    writeRefreshTokenToStorage(refreshTokenMemory);
  }
}

export function clearAuthTokens() {
  accessTokenMemory = null;
  refreshTokenMemory = null;
  writeAccessTokenToStorage(null);
  writeRefreshTokenToStorage(null);
}

export function getAuthToken(): string | null {
  if (accessTokenMemory) return accessTokenMemory;
  const token = readAccessTokenFromStorage();
  accessTokenMemory = token;
  return token;
}

export function getRefreshToken(): string | null {
  if (refreshTokenMemory) return refreshTokenMemory;
  const rt = readRefreshTokenFromStorage();
  refreshTokenMemory = rt;
  return rt;
}

export class UnauthorizedError extends Error {
  status = 401;
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

interface RequestOptions extends RequestInit {
  auth?: boolean; // whether to attach Authorization header
  searchParams?: Record<string, string | number | boolean | undefined | null>;
  disableCache?: boolean; // bypass ETag cache
  redirectOn401?: boolean; // auto redirect to /signin when unauthorized (default: true on client)
}

interface CacheEntry {
  etag: string;
  data: any;
  meta?: ApiMeta;
  timestamp: number;
}

// Simple in-memory ETag cache (per browser tab lifecycle)
const etagCache = new Map<string, CacheEntry>();
let lastMeta: ApiMeta | undefined; // store meta of last successful request
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getLastResponseMeta(): ApiMeta | undefined { return lastMeta; }
export function clearApiCache(pattern?: RegExp) {
  if (!pattern) {
    etagCache.clear();
    return;
  }
  for (const key of etagCache.keys()) {
    if (pattern.test(key)) etagCache.delete(key);
  }
}

function normalizeJoin(base: string, path: string): string {
  // handle base that may already include /api/v1 while path also starts with /api/v1
  let b = base.replace(/\/+$/, '');
  let p = path;
  if (!p.startsWith('http')) {
    if (!p.startsWith('/')) p = '/' + p;
    // If base ends with /api/v1 and path starts with /api/v1 => drop one
    if (/\/api\/v\d+$/i.test(b) && /^\/api\/v\d+\b/i.test(p)) {
      p = p.replace(/^\/api\/v\d+/i, '');
      if (!p.startsWith('/')) p = '/' + p;
    }
    return b + p;
  }
  return p; // absolute path
}

function buildUrl(path: string, searchParams?: RequestOptions['searchParams']): string {
  let url = path.startsWith('http') ? path : normalizeJoin(API_BASE, path);
  if (searchParams) {
    const sp = Object.entries(searchParams)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (sp) url += (url.includes('?') ? '&' : '?') + sp;
  }
  return url;
}

let refreshingPromise: Promise<string | null> | null = null;

function redirectToLogin(from?: string) {
  if (typeof window === 'undefined') return; // don't redirect on server
  try {
    const current = from || (window.location.pathname + window.location.search);
    const url = new URL('/signin', window.location.origin);
    if (current) url.searchParams.set('from', current);
    // Avoid redirect loop when already on signin
    if (window.location.pathname.startsWith('/signin')) return;
    window.location.href = url.toString();
  } catch {
    // noop
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
    // imageAiHint / attributes are not provided by backend; leave undefined
  };
  if (options.auth) {
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const url = buildUrl(path, options.searchParams);

  // Attach If-None-Match if cached and not disabled
  const cacheKey = `${options.method || 'GET'} ${url}`;
  if (!options.disableCache) {
    const cached = etagCache.get(cacheKey);
    if (cached) {
      // TTL check
      if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
        etagCache.delete(cacheKey);
      } else if (cached.etag) {
        headers['If-None-Match'] = cached.etag;
      }
    }
  }

  const res = await fetch(url, { ...options, headers, credentials: options.credentials });
  let json: any = null;
  // Always attempt to parse JSON body when present. Some servers include a JSON
  // payload even on 304 responses; earlier we skipped parsing for 304 which
  // caused valid JSON to be ignored. Catch and ignore parse errors.
  try {
    json = await res.json();
  } catch {
    /* ignore parse errors / empty body */
  }
  // Debug: surface the parsed response for investigation (status + top-level keys)
  try {
    if (typeof window !== 'undefined' && typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.error('[api.request] parsed response for', url, 'status:', res.status, 'keys:', json && (Array.isArray(json) ? 'array' : Object.keys(json)));
    }
  } catch {
    // ignore
  }
  if (res.status === 304 && json) {
    // Server returned 304 but included a JSON body — accept it and continue
    // to the normal parsing logic below.
  } else if (!res.ok || !json) {
    // Attempt auto refresh once for 401 on auth requests
    if (res.status === 401 && options.auth) {
      // Refresh only once per concurrent burst
      if (!refreshingPromise) {
        const rt = getRefreshToken();
        if (!rt) {
          if (options.redirectOn401 !== false) redirectToLogin();
          throw new UnauthorizedError(json?.message || 'Unauthorized');
        }
        refreshingPromise = (async () => {
          try {
            const refreshed = await fetch(buildUrl('/api/v1/auth/refresh'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: rt })
            });
            const jr = await refreshed.json().catch(() => null);
            if (!refreshed.ok || !jr?.success) {
              clearAuthTokens();
              if (options.redirectOn401 !== false) redirectToLogin();
              return null;
            }
            const newAt = jr.data?.accessToken as string | undefined;
            const newRt = (jr.data?.refreshToken as string | undefined) ?? rt;
            setAuthTokens({ accessToken: newAt ?? null, refreshToken: newRt ?? null });
            return newAt ?? null;
          } finally {
            const p = refreshingPromise; // ensure we clear after awaiters read
            setTimeout(() => { if (refreshingPromise === p) refreshingPromise = null; }, 0);
          }
        })();
      }
      const newToken = await refreshingPromise;
      if (!newToken) {
        if (options.redirectOn401 !== false) redirectToLogin();
        throw new UnauthorizedError('Unauthorized');
      }
      // retry original request once with new token
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
      const retryRes = await fetch(url, { ...options, headers: retryHeaders, credentials: options.credentials });
      let retryJson: any = null;
      if (retryRes.status !== 304) { try { retryJson = await retryRes.json(); } catch { /* ignore */ } }
      if (!retryRes.ok || !retryJson) throw new ApiError(retryJson?.message || `Request failed (${retryRes.status})`, { status: retryRes.status });
      json = retryJson;
      // fall-through to parse normal envelope below
    } else {
      if (res.status === 401) {
        if (options.redirectOn401 !== false) redirectToLogin();
        throw new UnauthorizedError(json?.message || 'Unauthorized');
      }
      if (res.status === 304) {
        // Use cached data if present
        const cached = etagCache.get(cacheKey);
        if (cached) {
          lastMeta = cached.meta;
          return cached.data as T;
        }
        // No cache present but server returned 304. Retry once without If-None-Match
        try {
          const retryHeaders = { ...headers };
          delete retryHeaders['If-None-Match'];
          const retryRes = await fetch(url, { ...options, headers: retryHeaders, credentials: options.credentials });
          let retryJson: any = null;
          if (retryRes.status !== 304) {
            try { retryJson = await retryRes.json(); } catch { /* ignore */ }
          }
          if (!retryRes.ok || !retryJson) {
            throw new ApiError(retryJson?.message || `Request failed (${retryRes.status})`, { status: retryRes.status });
          }
          json = retryJson;
          // fall-through to parse normal envelope below
        } catch (err) {
          // If retry also fails, throw a clear error
          throw new ApiError('Not Modified and no cache present; retry failed', { status: 304 });
        }
      }
      const message = json?.message || `Request failed (${res.status})`;
      throw new ApiError(message, { status: res.status });
    }
  }

  const unauthorizedMessages = ['Vui lòng đăng nhập', 'Unauthorized', 'Không được phép'];

  // CASE 1: Standard envelope (preferred)
  if (typeof json === 'object' && json && Object.prototype.hasOwnProperty.call(json, 'success')) {
    const env = json as ApiEnvelope<any>;
    if (!env.success) {
      if (res.status === 401 || unauthorizedMessages.includes(env.message)) {
        if (options.redirectOn401 !== false) redirectToLogin();
        throw new UnauthorizedError(env.message || 'Unauthorized');
      }
      throw new ApiError(env.message || 'Request unsuccessful', { status: res.status, fieldErrors: env.errors, meta: env.meta });
    }
    lastMeta = env.meta;
    // Normalize common envelope shape where backend returns { success: true, data: { items: [...] , ... } }
    // Convert to either a plain array (when no paging metadata) or to a paged-like object
    try {
      if (env.data && typeof env.data === 'object' && Array.isArray((env.data as any).items)) {
        const d = env.data as any;
        const hasPaging = ('currentPage' in d) || ('totalPages' in d) || ('pageSize' in d) || ('totalRecords' in d);
        if (hasPaging) {
          // ensure consumers expecting PagedResponse.data find the array
          if (!Array.isArray(d.data)) d.data = d.items;
        } else {
          // consumers expecting plain arrays (e.g. featured/related) should receive the items array
          const etag = res.headers.get('ETag');
          if (etag && !options.disableCache) {
            etagCache.set(cacheKey, { etag, data: d.items, meta: env.meta, timestamp: Date.now() });
          }
          return d.items as T;
        }
      }
    } catch (e) {
      // best-effort normalization, ignore errors and fall back to returning env.data
    }
    const etag = res.headers.get('ETag');
    if (etag && !options.disableCache) {
      etagCache.set(cacheKey, { etag, data: env.data, meta: env.meta, timestamp: Date.now() });
    }
    return env.data as T;
  }

  // CASE 2: Unwrapped PagedResponse<T> (backend current format for /api/products)
  if (json && typeof json === 'object' && Array.isArray((json as any).data) &&
      ('currentPage' in json) && ('totalPages' in json) && ('pageSize' in json)) {
    // Treat as full payload already
    lastMeta = undefined;
    const etag = res.headers.get('ETag');
    if (etag && !options.disableCache) {
      etagCache.set(cacheKey, { etag, data: json, meta: undefined, timestamp: Date.now() });
    }
    return json as T;
  }

  // CASE 3: Plain array response (e.g. featured, related)
  if (Array.isArray(json)) {
    return json as T;
  }

  // CASE 4: Plain object (single DTO) possibly unauthorized disguised
  if (json && typeof json === 'object') {
    if ((json as any).message && unauthorizedMessages.includes((json as any).message)) {
      if (options.redirectOn401 !== false) redirectToLogin();
      throw new UnauthorizedError((json as any).message);
    }
    lastMeta = undefined;
    const etag = res.headers.get('ETag');
    if (etag && !options.disableCache) {
      etagCache.set(cacheKey, { etag, data: json, meta: undefined, timestamp: Date.now() });
    }
    return json as T; // assume direct DTO
  }

  throw new ApiError('Unexpected response format', { status: res.status });
}

// ---------- Mappers ----------

function mapProduct(dto: ProductDto | ProductDtoExtended): Product {
  const d = dto as ProductDtoExtended;
  // Resolve a primary image URL from several possible fields
  const imageUrl = ((d as any).thumbnailUrl as string | undefined) ?? d.imageUrl ?? d.mainImage?.url ?? '/placeholder.png';

  // Build a lookup map from gallery image id -> url so variants that reference
  // imageId can be resolved to an actual image URL. Accept multiple id shapes.
  const gallery = d.galleryImages ?? [];
  const galleryMap = new Map<string, string>();
  for (const img of gallery) {
    if (!img) continue;
    const possibleIds = [img.id, (img as any).imageId, (img as any)._id, (img as any).uuid, (img as any).name];
    const url = img.url ?? (img as any).src ?? (img as any).path ?? '';
    for (const pid of possibleIds) {
      if (pid == null) continue;
      galleryMap.set(String(pid), url);
    }
  }

  // Map variants and attach resolved imageUrl where possible. Fallback to product mainImage.url.
  const variants = (d.variants ?? []).map((v: VariantDto & Record<string, any>) => {
    const imageIdCandidate = v.imageId ?? (v as any).image?.id ?? (v as any).image;
    const imageKey = imageIdCandidate != null ? String(imageIdCandidate) : '';
    const resolved = galleryMap.get(imageKey) ?? d.mainImage?.url ?? imageUrl ?? null;
    return {
      ...v,
      imageUrl: resolved,
    } as VariantDto & { imageUrl?: string | null };
  });

  return {
    id: d.id,
    name: d.name,
    // backend may return slightly different shapes
    description: d.description ?? '',
    price: Number(d.price ?? 0),
    category: d.categoryName ?? (d as any).category ?? '',
    imageUrl,
    slug: d.slug ?? undefined,
    createdAt: d.createdAt ?? undefined,
    mainImage: d.mainImage ?? null,
    galleryImages: gallery,
    variants,
    size: d.size ?? null,
    rating: d.rating ?? 0,
    reviewsCount: d.reviewsCount ?? 0,
    popularity: d.reviewsCount ?? 0,
    stockQuantity: d.stockQuantity ?? 0,
    isActive: d.isActive,
  };
}

function mapWishlistItem(dto: WishlistItemDto): WishlistItem {
  return {
    id: dto.productId, // use productId as id for consistency with product-based components
    name: dto.productName,
    description: '',
    price: dto.productPrice,
    category: dto.categoryName,
    imageUrl: dto.productImageUrl || '/placeholder.png',
    rating: dto.productRating,
    reviewsCount: 0,
    popularity: 0,
    stockQuantity: dto.productStockQuantity,
    isActive: true,
    addedAt: dto.addedAt,
  };
}

function mapCartItem(dto: CartItemDto): CartItem {
  return {
    id: dto.productId, // product scope
    name: dto.productName,
    description: '',
    price: dto.unitPrice,
    category: '',
    imageUrl: dto.productImageUrl || '/placeholder.png',
    rating: 0,
    reviewsCount: 0,
    popularity: 0,
    stockQuantity: dto.stockQuantity,
    isActive: true,
    quantity: dto.quantity,
    lineTotal: dto.totalPrice,
  };
}

// ---------- API surface ----------

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const data = await request<{ accessToken: string; refreshToken: string; user: UserDto; accessTokenExpiresAt?: string; refreshTokenExpiresAt?: string }>(
        '/api/v1/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      );
      setAuthTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return data;
    },
    register: async (payload: { email: string; fullName: string; phone?: string | null; password: string }) => {
      const data = await request<{ accessToken: string; refreshToken: string; user: UserDto; accessTokenExpiresAt?: string; refreshTokenExpiresAt?: string }>(
        '/api/v1/auth/register',
        { method: 'POST', body: JSON.stringify(payload) }
      );
      setAuthTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return data;
    },
    me: async () => {
      // Use relative path to leverage Next.js rewrites and avoid hard-coded base URL
      const user = await request<UserDto>('/api/v1/auth/me', { auth: true });
      return user;
    },
    logout: async () => {
      try {
        await request<null>('/api/v1/auth/logout', { auth: true, method: 'POST' });
      } finally {
        clearAuthTokens();
      }
    },
    refresh: async () => {
      const rt = getRefreshToken();
      if (!rt) throw new UnauthorizedError('No refresh token');
      const data = await request<{ accessToken: string; refreshToken?: string }>('/api/v1/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: rt }) });
      setAuthTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken ?? rt });
      return data;
    },
    forgotPassword: async (email: string) => {
      return await request<{ message: string }>('/api/v1/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
    },
    resetPassword: async (payload: { token: string; newPassword: string; confirmPassword: string }) => {
      return await request<{ message: string }>('/api/v1/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) });
    },
    google: async (idToken: string) => {
      const data = await request<{ accessToken: string; refreshToken: string; user: UserDto }>(
        '/api/v1/auth/google',
        { method: 'POST', body: JSON.stringify({ idToken }), credentials: 'include' }
      );
      setAuthTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return data;
    }
  },
  products: {
    list: async (params: {
      searchTerm?: string;
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      minRating?: number;
      sortBy?: 'name' | 'price' | 'rating' | 'popularity';
      sortDirection?: 'asc' | 'desc';
      page?: number;
      pageSize?: number;
    } = {}) => {
  // Hướng B: migrate endpoints to versioned prefix /api/v1
    const raw = await request<any>('/api/v1/products', { searchParams: params });

    // Simple, deterministic normalizer for product list payloads.
    const normalizeProductsResponse = (resp: any) => {
      if (!resp) return null;
      let payload = resp;
      // If an envelope was returned, use its data
      if (payload && typeof payload === 'object' && payload.success && payload.data) payload = payload.data;
      // If nested data includes items -> prefer that
      if (payload && typeof payload === 'object' && payload.data && Array.isArray(payload.data.items)) payload = { ...payload, data: payload.data.items, meta: payload.data };
      // If top-level items -> convert to data
      if (payload && typeof payload === 'object' && Array.isArray(payload.items) && !Array.isArray(payload.data)) payload = { ...payload, data: payload.items };
      // At this point, payload.data may be an array
      if (payload && Array.isArray(payload.data)) {
        return {
          data: payload.data,
          currentPage: Number(payload.currentPage ?? payload.page ?? 1),
          totalPages: Number(payload.totalPages ?? payload.pages ?? 1),
          pageSize: Number(payload.pageSize ?? payload.limit ?? payload.data.length),
          totalRecords: Number(payload.totalRecords ?? payload.total ?? payload.data.length),
          hasPreviousPage: Boolean(payload.hasPreviousPage ?? payload.hasPrev ?? false),
          hasNextPage: Boolean(payload.hasNextPage ?? payload.hasMore ?? false),
        } as PagedResponse<ProductDto> & { data: ProductDto[] };
      }
      // If payload itself is an array, wrap it
      if (Array.isArray(payload)) {
        return {
          data: payload,
          currentPage: 1,
          totalPages: 1,
          pageSize: payload.length,
          totalRecords: payload.length,
          hasPreviousPage: false,
          hasNextPage: false,
        } as PagedResponse<ProductDto> & { data: ProductDto[] };
      }
      return null;
    };

    const normalized = normalizeProductsResponse(raw);
    if (normalized) {
      const mapped = normalized.data.map(mapProduct);
      return { ...normalized, data: mapped } as PagedResponse<ProductDto> & { data: ReturnType<typeof mapProduct>[] };
    }
    // TEMP DEBUG: dump the exact object received from the API so we can diagnose
    // unexpected shape issues in the wild. Remove after debugging.
    try {
      // Use console.error so the message is visible even if debug level is filtered
      if (typeof window !== 'undefined' && typeof console !== 'undefined') {
        // eslint-disable-next-line no-console
        console.error('[api.products.list] RAW_RECEIVED (type, keys):', typeof raw, raw && Object.keys(raw));
        // eslint-disable-next-line no-console
        console.error('[api.products.list] RAW_JSON:', JSON.stringify(raw, null, 2));
      }
    } catch (e) {
      /* ignore debug failures */
    }
    // Debug: log raw response shape to help troubleshoot unexpected formats (only in browser)
    try {
      if (typeof window !== 'undefined' && typeof console !== 'undefined' && typeof console.debug === 'function') {
        // eslint-disable-next-line no-console
        console.debug('[api.products.list] raw response:', raw);
      }
    } catch (e) {
      // ignore logging failures
    }
    // --- Robust, unified extraction for common backend shapes ---
    try {
      // Accept envelopes: { success: true, data: { items: [...] , ... } }
      let payload: any = raw;
      if (payload && typeof payload === 'object' && payload.success && payload.data) payload = payload.data;
      // If payload.data is an envelope with items, prefer that
      if (payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object' && Array.isArray(payload.data.items)) {
        payload = payload.data;
      }

      // Determine items array from common locations
      let itemsArr: any[] | null = null;
      if (payload && Array.isArray(payload.items)) itemsArr = payload.items;
      else if (payload && Array.isArray(payload.data)) itemsArr = payload.data;
      else if (Array.isArray(payload)) itemsArr = payload;
      else if (raw && Array.isArray((raw as any).data)) itemsArr = (raw as any).data;

      if (itemsArr) {
        // Map items safely
        let mapped: ReturnType<typeof mapProduct>[] = [];
        try {
          mapped = itemsArr.map((it: any) => mapProduct(it as ProductDto));
        } catch (mapErr) {
          console.error('[api.products.list] mapping error in unified extraction', mapErr, 'items:', itemsArr);
          mapped = itemsArr as any;
        }

        // Pull paging fields from payload if present
        const metaSource = payload && typeof payload === 'object' ? payload : {};
        return {
          data: mapped,
          currentPage: Number(metaSource.currentPage ?? metaSource.page ?? 1),
          totalPages: Number(metaSource.totalPages ?? metaSource.pages ?? 1),
          pageSize: Number(metaSource.pageSize ?? metaSource.limit ?? mapped.length),
          totalRecords: Number(metaSource.totalRecords ?? metaSource.total ?? mapped.length),
          hasPreviousPage: Boolean(metaSource.hasPreviousPage ?? metaSource.hasPrev ?? false),
          hasNextPage: Boolean(metaSource.hasNextPage ?? metaSource.hasMore ?? false)
        } as PagedResponse<ProductDto> & { data: ReturnType<typeof mapProduct>[] };
      }
    } catch (err) {
      console.warn('[api.products.list] unified extraction failed, falling back to legacy paths', err);
    }
      // raw can be one of many shapes (legacy and newer backends). Try to robustly extract
      // an items array and paging fields from common locations before giving up.
      if (Array.isArray(raw)) {
        const mapped = raw.map(mapProduct);
        return {
          data: mapped,
          currentPage: 1,
          totalPages: 1,
          pageSize: mapped.length,
          totalRecords: mapped.length,
          hasPreviousPage: false,
          hasNextPage: false
        } as PagedResponse<ProductDto> & { data: ReturnType<typeof mapProduct>[] };
      }

// --- REPLACEMENT START ---
      const tryExtract = (candidate: any) => {
        if (!candidate) return null;

        // If candidate is an array of products
        if (Array.isArray(candidate)) return { items: candidate, meta: {} };

        // Direct common envelopes
        if (Array.isArray(candidate.items)) return { items: candidate.items, meta: { ...candidate } };
        if (Array.isArray(candidate.data)) return { items: candidate.data, meta: { ...candidate } };
        if (Array.isArray(candidate.payload)) return { items: candidate.payload, meta: { ...candidate } };

        // Candidate may be { success: true, data: { items: [...] } } or similar
        if ((candidate.success === true || candidate.status === 'ok' || candidate.ok === true) && candidate.data) {
          const d = candidate.data;
          if (Array.isArray(d.items)) return { items: d.items, meta: { ...d } };
          if (Array.isArray(d.data)) return { items: d.data, meta: { ...d } };
          if (Array.isArray(d)) return { items: d, meta: { ...candidate } };
          // If d is object with paging fields and items maybe nested deeper
          if (d.items && Array.isArray(d.items)) return { items: d.items, meta: { ...d } };
        }

        // Candidate.data might itself be an envelope
        const d = candidate.data ?? candidate.Data ?? null;
        if (d) {
          if (Array.isArray(d.items)) return { items: d.items, meta: { ...d } };
          if (Array.isArray(d.data)) return { items: d.data, meta: { ...d } };
          if (Array.isArray(d)) return { items: d, meta: candidate };
        }

        // legacy: nested 'result' or 'payload' or other common wrappers
        if (candidate.result && Array.isArray(candidate.result.items)) return { items: candidate.result.items, meta: candidate.result };
        if (Array.isArray(candidate.payload)) return { items: candidate.payload, meta: candidate };

        return null;
      };

      // Try multiple starting points (raw, raw.data, raw.data.data, raw.data.data.data...)
      const extracted =
        tryExtract(raw) ||
        tryExtract(raw?.data) ||
        tryExtract(raw?.data?.data) ||
        tryExtract(raw?.data?.data?.data);

      // If extracted found, map safely
      if (extracted) {
        const items = extracted.items as ProductDto[] || [];
        let mapped: ReturnType<typeof mapProduct>[] = [];
        try {
          mapped = items.map(mapProduct);
        } catch (mapErr) {
          console.error('[api.products.list] mapProduct threw error while mapping items', mapErr, 'items:', items);
          // still return best-effort raw items (without mapping) to avoid crash
          mapped = items as any;
        }

        const meta = extracted.meta || {};
        return {
          data: mapped,
          currentPage: Number(meta.currentPage ?? meta.page ?? meta.current ?? 1),
          totalPages: Number(meta.totalPages ?? meta.pages ?? 1),
          pageSize: Number(meta.pageSize ?? meta.limit ?? mapped.length),
          totalRecords: Number(meta.totalRecords ?? meta.total ?? mapped.length),
          hasPreviousPage: Boolean(meta.hasPreviousPage ?? meta.hasPrev ?? false),
          hasNextPage: Boolean(meta.hasNextPage ?? meta.hasMore ?? false)
        } as PagedResponse<ProductDto> & { data: ReturnType<typeof mapProduct>[] };
      }

      // Legacy paged format with top-level data array
      if (raw && Array.isArray((raw as any).data)) {
        let mapped;
        try {
          mapped = (raw.data as ProductDto[]).map(mapProduct);
        } catch (err) {
          console.error('[api.products.list] error mapping raw.data array', err);
          mapped = raw.data;
        }
        return { ...raw, data: mapped };
      }
// --- REPLACEMENT END ---

      // Single DTO
      if (raw && raw.id) {
        const mapped = mapProduct(raw as ProductDto);
        return {
          data: [mapped],
          currentPage: 1,
          totalPages: 1,
          pageSize: 1,
          totalRecords: 1,
          hasPreviousPage: false,
          hasNextPage: false
        } as PagedResponse<ProductDto> & { data: ReturnType<typeof mapProduct>[] };
      }

      // Last-resort: try to find any plausible products array inside the response
      try {
        // Log the unexpected shape for debugging
        console.warn('[api.products.list] Unexpected products response shape, trying best-effort extraction:', raw);
        const findArray = (obj: any, depth = 0): any[] | null => {
          if (!obj || depth > 4) return null;
          if (Array.isArray(obj)) {
            // check if first element looks like a product
            const first = obj[0];
            if (first && (first.id || first.name)) return obj;
            // otherwise search inside elements
            for (const el of obj) {
              const found = findArray(el, depth + 1);
              if (found) return found;
            }
            return null;
          }
          if (typeof obj === 'object') {
            for (const k of Object.keys(obj)) {
              const found = findArray(obj[k], depth + 1);
              if (found) return found;
            }
          }
          return null;
        };
        const found = findArray(raw) || findArray(raw?.data) || findArray(raw?.data?.items);
        if (found && Array.isArray(found)) {
          const mapped = (found as any[]).map((it: any) => mapProduct(it as ProductDto));
          return {
            data: mapped,
            currentPage: 1,
            totalPages: 1,
            pageSize: mapped.length,
            totalRecords: mapped.length,
            hasPreviousPage: false,
            hasNextPage: false
          } as PagedResponse<ProductDto> & { data: ReturnType<typeof mapProduct>[] };
        }
      } catch (err) {
        console.error('[api.products.list] fallback extraction failed', err);
      }

      // Expose the raw payload to the window for easier remote inspection
      try {
        if (typeof window !== 'undefined') {
          // @ts-ignore - debug hook
          (window as any).__LAST_API_PRODUCTS_RAW = raw;
        }
      } catch {
        // ignore
      }

      // Deep-search fallback: try to find any plausible products array nested anywhere
      const deepFindProductsArray = (obj: any, depth = 0, maxDepth = 6): any[] | null => {
        if (!obj || depth > maxDepth) return null;
        try {
          if (Array.isArray(obj)) {
            if (obj.length === 0) return null;
            const first = obj[0];
            if (first && (first.id || first.name || first.sku || first.slug)) return obj;
            // Search inside array elements
            for (const el of obj) {
              const found = deepFindProductsArray(el, depth + 1, maxDepth);
              if (found) return found;
            }
            return null;
          }
          if (typeof obj === 'object') {
            for (const k of Object.keys(obj)) {
              const val = obj[k];
              // If string that looks like JSON array, try parse
              if (typeof val === 'string' && val.trim().startsWith('[')) {
                try {
                  const parsed = JSON.parse(val);
                  if (Array.isArray(parsed)) {
                    const pf = deepFindProductsArray(parsed, depth + 1, maxDepth);
                    if (pf) return pf;
                  }
                } catch { /* ignore parse errors */ }
              }
              const found = deepFindProductsArray(val, depth + 1, maxDepth);
              if (found) return found;
            }
          }
        } catch (err) {
          // ignore errors during deep search
        }
        return null;
      };

      try {
        const found = deepFindProductsArray(raw) || deepFindProductsArray(raw?.data) || deepFindProductsArray(raw?.data?.items);
        if (found && Array.isArray(found)) {
          const mapped = found.map((it: any) => mapProduct(it as ProductDto));
          return {
            data: mapped,
            currentPage: 1,
            totalPages: 1,
            pageSize: mapped.length,
            totalRecords: mapped.length,
            hasPreviousPage: false,
            hasNextPage: false
          } as PagedResponse<ProductDto> & { data: ReturnType<typeof mapProduct>[] };
        }
      } catch (err) {
        console.error('[api.products.list] deep fallback mapping failed', err);
      }

      // Always log the raw response shape to help debugging on client-side
      try {
        if (typeof window !== 'undefined' && typeof console !== 'undefined' && typeof console.error === 'function') {
          // eslint-disable-next-line no-console
          console.error('[api.products.list] final unexpected shape (saved to window.__LAST_API_PRODUCTS_RAW)', raw);
        }
      } catch (e) {
        // ignore logging errors
      }

      // Persist raw payload to localStorage for offline debugging (if available)
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('shopwave_last_products_raw', JSON.stringify(raw));
        }
      } catch (e) {
        // ignore storage errors
      }

      throw new Error('Unexpected products response shape');
    },
    get: async (id: string) => {
  const dto = await request<ProductDto>(`/api/v1/products/${id}`, { auth: true });
      return mapProduct(dto);
    },
    reviews: async (id: string, page = 1, pageSize = 10) => {
  const data = await request<PagedResponse<ReviewDto>>(`/api/v1/products/${id}/reviews`, { searchParams: { page, pageSize } });
      return data;
    },
    featured: async (take = 8) => {
  const data = await request<ProductDto[]>(`/api/v1/products/featured`, { searchParams: { take } });
      return data.map(mapProduct);
    },
    related: async (id: string, take = 4) => {
  const data = await request<ProductDto[]>(`/api/v1/products/${id}/related`, { searchParams: { take } });
      return data.map(mapProduct);
    }
  },
  recommendations: {
    // Call backend recommendation service. `history` can be an array of product IDs or a comma-separated string.
    get: async (history: string[] | string) => {
      const body = Array.isArray(history) ? history : (typeof history === 'string' ? history.split(',').map(s => s.trim()).filter(Boolean) : []);
      // Use local proxy route to avoid CORS. Next server will forward to backend POC.
      const resp = await request<any>('/api/recommendations', { method: 'POST', body: JSON.stringify({ browsingHistory: body }) });

      // Normalize response to an array of recommendation ids or names.
      // Common possible shapes:
      // - { success: true, data: { recommendations: ['id1','id2'] } }
      // - { recommendations: ['id1','id2'] }
      // - ['id1','id2']
      try {
        if (!resp) return [] as string[];
        if (Array.isArray(resp)) return resp as string[];
        if (resp.recommendations && Array.isArray(resp.recommendations)) return resp.recommendations as string[];
        if (resp.data && resp.data.recommendations && Array.isArray(resp.data.recommendations)) return resp.data.recommendations as string[];
        // If backend returned a comma-separated string
        const possible = (resp.data && resp.data.recommendations) || resp.recommendations || resp.data || resp;
        if (typeof possible === 'string') return possible.split(',').map((s: string) => s.trim()).filter(Boolean);
      } catch (e) {
        // fallthrough
      }
      return [] as string[];
    }
  },
  // Impression and click tracking for recommendations (useful for training/metrics)
  recommendationsTracking: {
    impression: async (payload: { userId?: string | null; productIds: string[]; source?: string }) => {
      try {
        await request('/api/recommendations/impression', { method: 'POST', body: JSON.stringify(payload) });
      } catch (e) {
        // don't block UI on tracking failures
        console.warn('Failed to send recommendations impression', e);
      }
    },
    click: async (payload: { userId?: string | null; productIdClicked: string; recommendationId?: string; position?: number; source?: string }) => {
      try {
        await request('/api/recommendations/click', { method: 'POST', body: JSON.stringify(payload) });
      } catch (e) {
        console.warn('Failed to send recommendations click', e);
      }
    }
  },
  wishlist: {
    list: async (page = 1, pageSize = 50) => {
  const data = await request<PagedResponse<WishlistItemDto>>('/api/v1/wishlist', { auth: true, searchParams: { page, pageSize } });
      return { ...data, data: data.data.map(mapWishlistItem) };
    },
    add: async (productId: string) => {
  await request<null>('/api/v1/wishlist', { auth: true, method: 'POST', body: JSON.stringify({ productId }) });
    },
    remove: async (productId: string) => {
  await request<null>(`/api/v1/wishlist/${productId}`, { auth: true, method: 'DELETE' });
    },
    clear: async () => {
  await request<null>('/api/v1/wishlist/clear', { auth: true, method: 'DELETE' });
    },
    moveToCart: async (productId: string) => {
  await request<null>(`/api/v1/wishlist/move-to-cart/${productId}`, { auth: true, method: 'POST' });
    },
    check: async (productId: string) => {
  const data = await request<boolean>(`/api/v1/wishlist/check/${productId}`, { auth: false });
      return data;
    }
  },
  cart: {
    get: async () => {
  const data = await request<CartResponseDto>('/api/v1/cart', { auth: true });
      return { ...data, items: data.items.map(mapCartItem) };
    },
    add: async (productId: string, quantity = 1) => {
  const data = await request<CartResponseDto>('/api/v1/cart/add', { auth: true, method: 'POST', body: JSON.stringify({ productId, quantity }) });
      return { ...data, items: data.items.map(mapCartItem) };
    },
    update: async (cartItemId: string, quantity: number) => {
  const data = await request<CartResponseDto>(`/api/v1/cart/${cartItemId}`, { auth: true, method: 'PUT', body: JSON.stringify({ quantity }) });
      return { ...data, items: data.items.map(mapCartItem) };
    },
    remove: async (cartItemId: string) => {
  const data = await request<CartResponseDto>(`/api/v1/cart/${cartItemId}`, { auth: true, method: 'DELETE' });
      return { ...data, items: data.items.map(mapCartItem) };
    },
    clear: async () => {
  const data = await request<CartResponseDto>('/api/v1/cart/clear', { auth: true, method: 'DELETE' });
      return { ...data, items: data.items.map(mapCartItem) };
    }
  }
};

export type { Product as FEProduct, Review as FEReview, CartItem as FECartItem, WishlistItem as FEWishlistItem };
