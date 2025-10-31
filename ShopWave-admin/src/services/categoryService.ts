import { api } from "../utils/apiClient";

export type CategoryDto = {
  id: string;
  name: string;
  isActive?: boolean;
  [key: string]: unknown;
};

let cachedCategories: CategoryDto[] | null = null;
let cachedAt = 0;
const TTL = 5 * 60 * 1000; // 5 minutes

export async function getCategories(force = false): Promise<CategoryDto[]> {
  const now = Date.now();
  if (!force && cachedCategories && now - cachedAt < TTL) return cachedCategories;
  const res = await api.raw("/api/v1/Categories", { method: "GET", skipAuth: true });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = (data?.message as string) || message;
    } catch {}
    throw new Error(message || "Không thể tải danh mục");
  }
  const json = await res.json();
  // Envelope: data.data is the array per requirement
  const list = (json && typeof json === "object" && "data" in json ? (json as any).data?.data : json) as unknown;
  const arr = Array.isArray(list) ? (list as CategoryDto[]) : [];
  const activeOnly = arr.filter(c => c && (c.isActive == null || c.isActive));
  cachedCategories = activeOnly;
  cachedAt = now;
  return activeOnly;
}

export type CreateCategoryRequest = {
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  sortOrder?: number;
};

// Returns new category id (Guid)
export async function createCategory(payload: CreateCategoryRequest): Promise<string> {
  const res = await api.raw("/api/v1/Categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (res.status !== 201) {
    const message = (json && typeof json === "object" && (json as any).message) ? (json as any).message : res.statusText;
    const err = new Error(message || "Tạo danh mục thất bại");
    // @ts-expect-error
    err.status = res.status;
    throw err;
  }
  const id = (json && typeof json === "object" && (json as any).data?.id) || (json as any)?.id;
  if (!id || typeof id !== "string") throw new Error("Phản hồi không hợp lệ từ server khi tạo danh mục");
  // Invalidate cache so next getCategories fetches fresh data
  cachedCategories = null;
  cachedAt = 0;
  return id;
}

export async function updateCategory(id: string, payload: Partial<CreateCategoryRequest>): Promise<void> {
  const res = await api.raw(`/api/v1/Categories/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = (data?.message as string) || message;
    } catch {}
    throw new Error(message || "Cập nhật danh mục thất bại");
  }
  // invalidate cache
  cachedCategories = null;
  cachedAt = 0;
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await api.raw(`/api/v1/Categories/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = (data?.message as string) || message;
    } catch {}
    throw new Error(message || "Xóa danh mục thất bại");
  }
  // invalidate cache
  cachedCategories = null;
  cachedAt = 0;
}
