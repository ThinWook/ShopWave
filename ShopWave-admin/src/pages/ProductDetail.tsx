import { useEffect, useState } from "react";
import { formatCurrencyVi } from '../utils/format';
import { useParams, Link } from "react-router";
import { getProductDetail, type ProductDto } from "../services/productService";

export default function ProductDetail() {
  const { id } = useParams();
  const [data, setData] = useState<ProductDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await getProductDetail(id);
        if (!ignore) setData(res);
      } catch (e: unknown) {
        const msg = typeof e === 'object' && e && 'message' in e ? String((e as any).message) : 'Không thể tải chi tiết sản phẩm';
        if (!ignore) setError(msg);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [id]);

  return (
    <div className="p-4 mx-auto max-w-[--breakpoint-2xl] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <nav>
          <ol className="flex items-center gap-1.5">
            <li>
              <Link className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400" to="/">
                Trang chủ
                <svg className="stroke-current" width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366" stroke="" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </li>
            <li className="text-sm text-gray-800 dark:text-white/90">Chi tiết sản phẩm</li>
          </ol>
        </nav>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải...</p>}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {!loading && !error && data && (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
                {/* prefer mainImage.url if present */}
                <img src={data.mainImage?.url || "/images/product/default.png"} alt={data.mainImage?.altText || data.name} className="h-full w-full object-cover" />
              </div>

              {data.galleryImages && data.galleryImages.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {data.galleryImages.map(g => (
                    <img key={g.id} src={g.url} alt={data.name} className="h-20 w-20 flex-shrink-0 rounded object-cover" />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">{data.name}</h1>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{data.description || 'Không có mô tả.'}</p>
              <div className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">{formatCurrencyVi(data.price, 'VND')}</div>
              <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">Danh mục: {data.categoryName}</div>
              <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300 mb-4">
                <span>Rating: {data.rating?.toFixed ? data.rating.toFixed(1) : String(data.rating)} ({data.reviewsCount ?? 0} đánh giá)</span>
                <span>Số lượng: {data.stockQuantity ?? 0}</span>
                <span>Trạng thái: {data.isActive ? 'Đang bán' : 'Ngưng bán'}</span>
              </div>

              {data.variants && data.variants.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Biến thể</h3>
                  <div className="space-y-2">
                    {data.variants.map(v => (
                      <div key={v.id ?? v.sku ?? `${v.size}-${v.color}-${v.price}`} className="flex items-center gap-3 rounded-md border p-3">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                          {/* show variant image from media id if present using main/gallery mapping is not available here; try using mediaPreviews if present on page */}
                          {/* Fallback to mainImage or nothing */}
                          <img src={String(v.imageId ? (data.galleryImages?.find(g => g.id === v.imageId)?.url ?? data.mainImage?.url) : (data.mainImage?.url || '/images/product/default.png'))} alt={v.sku || data.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold">{v.sku || `${data.name} ${v.size ?? ''} ${v.color ?? ''}`}</div>
                          <div className="text-sm text-gray-500">Giá: {formatCurrencyVi(Number(v.price ?? data.price), 'VND')}</div>
                          <div className="text-sm text-gray-500">Kho: {v.stock}</div>
                          <div className="text-sm text-gray-500">Kích thước: {v.size}</div>
                          <div className="text-sm text-gray-500">Màu: {v.color}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}