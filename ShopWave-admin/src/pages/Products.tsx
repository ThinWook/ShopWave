import { useState, useMemo, useEffect, Fragment } from 'react';
import { SkeletonTableRows } from '../components/ui/Skeleton';
import { formatCurrencyVi } from '../utils/format';
import { Link } from 'react-router';
import type { Product } from '../types/product';
import { getProducts, getProductDetail, deleteProduct, type ProductDto } from '../services/productService';
import Modal from '../components/ui/modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const initialProducts: Product[] = [];

export default function Products() {
  const { show } = useToast();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Removed dropdown menu; actions are now inline icon buttons
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<ProductDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  // Master-detail: expanded rows map and cached product details per product id
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [detailCache, setDetailCache] = useState<Record<string, ProductDto | { loading: true }>>({});
  const [confirmOpen, setConfirmOpen] = useState<{ id: string | number | null; name?: string } | null>(null);
  const pageSize = 7; // matches provided layout display

  const getErrorMessage = (err: unknown): string => {
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object' && 'message' in err) {
      const m = (err as { message?: unknown }).message;
      if (typeof m === 'string') return m;
    }
    return 'Đã xảy ra lỗi';
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await getProducts({ page: currentPage, pageSize, searchTerm: search.trim() || undefined });
        if (!ignore) {
          setProducts(res.items);
          setTotal(res.total);
        }
      } catch (e: unknown) {
        if (!ignore) setError(getErrorMessage(e) || 'Không thể tải danh sách sản phẩm');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [currentPage, pageSize, search]);

  

  const filtered = useMemo(() => {
    // when server paging is used, products already filtered; return as-is
    if (total) return products;
    const q = search.toLowerCase();
    return products.filter(p => (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    ));
  }, [products, search, total]);

  // If backend handles paging, use total from API; else fallback to filtered length
  const effectiveTotal = total || filtered.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));
  const pageProducts = total ? products : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Use the global helper to ensure consistent currency formatting across the app
  const formatMoney = (v: number) => formatCurrencyVi(v, 'VND');
  // formatDate was removed as it's not used in this master/detail table

  return (
    <>
    <div className="p-4 mx-auto max-w-[--breakpoint-2xl] md:p-6">
      {/* Breadcrumb */}
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
            <li className="text-sm text-gray-800 dark:text-white/90">Danh sách sản phẩm</li>
          </ol>
        </nav>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header */}
        <div className="flex flex-col justify-between gap-5 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center dark:border-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Theo dõi tiến trình cửa hàng để tăng doanh số.</h2>
          </div>
          <div className="flex gap-3">
            <button className="inline-flex items-center justify-center gap-2 rounded-lg transition  px-5 py-3.5 text-sm bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300">
              Xuất
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M16.667 13.3333V15.4166C16.667 16.1069 16.1074 16.6666 15.417 16.6666H4.58295C3.89259 16.6666 3.33295 16.1069 3.33295 15.4166V13.3333M10.0013 13.3333L10.0013 3.33325M6.14547 9.47942L9.99951 13.331L13.8538 9.47942" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <Link to="/add-product" className="bg-brand-500 shadow-sm hover inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 10.0002H15.0006M10.0002 5V15.0006" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Thêm sản phẩm
            </Link>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div className="flex gap-3 sm:justify-between">
            <div className="relative flex-1 sm:flex-auto">
              <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.04199 9.37337C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z" fill="" />
                </svg>
              </span>
              <input
                placeholder="Tìm kiếm..."
                className="shadow-sm focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-none sm:w-[300px] sm:min-w-[300px] dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                type="text"
                value={search}
                onChange={(e) => { setCurrentPage(1); setSearch(e.target.value); }}
              />
            </div>
            <div className="relative">
              <button className="shadow-theme-xs flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 sm:w-auto sm:min-w-[100px] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M14.6537 5.90414C14.6537 4.48433 13.5027 3.33331 12.0829 3.33331C10.6631 3.33331 9.51206 4.48433 9.51204 5.90415M14.6537 5.90414C14.6537 7.32398 13.5027 8.47498 12.0829 8.47498C10.663 8.47498 9.51204 7.32398 9.51204 5.90415M14.6537 5.90414L17.7087 5.90411M9.51204 5.90415L2.29199 5.90411M5.34694 14.0958C5.34694 12.676 6.49794 11.525 7.91777 11.525C9.33761 11.525 10.4886 12.676 10.4886 14.0958M5.34694 14.0958C5.34694 15.5156 6.49794 16.6666 7.91778 16.6666C9.33761 16.6666 10.4886 15.5156 10.4886 14.0958M5.34694 14.0958L2.29199 14.0958M10.4886 14.0958L17.7087 14.0958" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Bộ lọc
              </button>
            </div>
          </div>
        </div>

  {/* Table */}
  {/* Ensure dropdown menus inside the table are above the footer */}
  <div className="relative z-10 overflow-x-auto custom-scrollbar">
          {error && (
            <div className="px-5 py-4 text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
          {loading && !products.length && (
            <div className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">Đang tải sản phẩm...</div>
          )}
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                <th className="lg:w-14 px-5 py-4 text-left whitespace-nowrap">{/* expand */}</th>
                <th className="px-5 py-4 text-left whitespace-nowrap">Sản phẩm</th>
                <th className="px-5 py-4 text-left whitespace-nowrap">Trạng thái</th>
                <th className="px-5 py-4 text-left whitespace-nowrap">Biến thể</th>
                <th className="px-5 py-4 text-left whitespace-nowrap">Kho hàng (Tổng)</th>
                <th className="px-5 py-4 text-left whitespace-nowrap">Giá (Khoảng)</th>
                <th className="px-5 py-4 text-left whitespace-nowrap">&nbsp;</th>
              </tr>
            </thead>
            <tbody className="divide-x divide-y divide-gray-200 dark:divide-gray-800">
              {pageProducts.map(p => {
                const key = String(p.id);
                const cached = detailCache[key] as ProductDto | { loading: true } | undefined;
                const isOpen = Boolean(expanded[key]);

                // derived master values
                const variantsCount = (cached && 'variants' in cached && Array.isArray((cached as ProductDto).variants)) ? (cached as ProductDto).variants!.length : undefined;
                const totalStock = (cached && 'variants' in cached && Array.isArray((cached as ProductDto).variants)) ? (cached as ProductDto).variants!.reduce((s, v) => s + (v.stock ?? 0), 0) : (p.quantity ?? 0);
                let priceLabel = formatMoney(p.price);
                if (cached && 'variants' in cached && Array.isArray((cached as ProductDto).variants) && (cached as ProductDto).variants!.length > 0) {
                  const prices = (cached as ProductDto).variants!.map(v => Number(v.price ?? 0)).filter(n => Number.isFinite(n));
                  if (prices.length > 0) {
                    const min = Math.min(...prices);
                    const max = Math.max(...prices);
                    // Nếu tất cả giá giống nhau -> hiển thị một giá duy nhất
                    // Nếu khác nhau -> hiển thị khoảng giá 'min - max'
                    priceLabel = min === max ? formatMoney(min) : `${formatMoney(min)} - ${formatMoney(max)}`;
                  }
                }

                return (
                  <Fragment key={key}>
                    <tr key={key} className="transition hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="lg:w-14 px-5 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={async () => {
                            setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
                            if (!detailCache[key]) {
                              // fetch and cache product detail
                              setDetailCache(prev => ({ ...prev, [key]: { loading: true } }));
                              try {
                                const res = await getProductDetail(key);
                                setDetailCache(prev => ({ ...prev, [key]: res }));
                              } catch (e: unknown) {
                                setDetailCache(prev => {
                                  const copy = { ...prev } as any;
                                  delete copy[key];
                                  return copy;
                                });
                                setDetailError(getErrorMessage(e));
                              }
                            }
                          }}
                          className="inline-flex items-center justify-center rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                          aria-label={isOpen ? 'Thu gọn' : 'Mở rộng'}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${isOpen ? 'rotate-90' : ''} transition-transform`}>
                            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12">
                            <img className="h-12 w-12 rounded-md object-cover" alt={p.name} src={p.image || '/images/product/default.png'} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-400">{p.name}</div>
                            <div className="text-xs text-gray-500">{p.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${((p.quantity ?? 0) > 0) ? 'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-500' : 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-500'}`}>
                          {((p.quantity ?? 0) > 0) ? 'Published' : 'Out of stock'}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700 dark:text-gray-400">{variantsCount ?? (p.quantity !== undefined ? '—' : '-')}{variantsCount ? ` biến thể` : variantsCount === 1 ? ' biến thể' : ''}</div>
                        {/* if variantsCount unknown, show placeholder as we may fetch on expand */}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap"><p className="text-sm text-gray-700 dark:text-gray-400">{totalStock}</p></td>
                      <td className="px-5 py-4 whitespace-nowrap"><p className="text-sm text-gray-700 dark:text-gray-400">{priceLabel}</p></td>
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* View details */}
                      <button
                        type="button"
                        title="Xem chi tiết"
                        aria-label="Xem chi tiết"
                        className="inline-flex items-center justify-center rounded-lg border border-transparent p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
                        onClick={async () => {
                          setDetailOpen(true);
                          setDetailLoading(true);
                          setDetailError(null);
                          setDetailData(null);
                          try {
                            const res = await getProductDetail(String(p.id));
                            setDetailData(res);
                          } catch (e: unknown) {
                            setDetailError(getErrorMessage(e) || 'Không thể tải chi tiết sản phẩm');
                          } finally {
                            setDetailLoading(false);
                          }
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </button>

                      {/* Edit */}
                      <Link
                        to={`/products/${p.id}/edit`}
                        title="Sửa"
                        aria-label="Sửa"
                        className="inline-flex items-center justify-center rounded-lg border border-transparent p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 20h4l10.5-10.5a2.121 2.121 0 0 0-3-3L5 17v3Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                      </Link>

                      {/* Delete (admin only) */}
                      {String(user?.role || '').toLowerCase() === 'admin' && (
                        <button
                          type="button"
                          title="Xóa"
                          aria-label="Xóa"
                          className="inline-flex items-center justify-center rounded-lg border border-transparent p-2 text-red-600 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                          onClick={() => setConfirmOpen({ id: p.id, name: p.name })}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                        </button>
                      )}
                    </div>
                    </td>
                    </tr>

                    {/* Variant detail rows when expanded and data available */}
                    {isOpen && detailCache[key] && !('loading' in (detailCache[key] as any)) && (detailCache[key] as ProductDto).variants && (
                      (detailCache[key] as ProductDto).variants!.map((v, vi) => (
                        <tr key={`${key}-v-${vi}`} className="bg-white/50 even:bg-gray-50 dark:even:bg-gray-900">
                          <td />
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-3 text-sm">
                              {/* variant image if available by id -> attempt to find in galleryImages */}
                              <div className="h-10 w-10">
                                {/* no direct url; show placeholder */}
                                <img src={(detailCache[key] as ProductDto).galleryImages?.find(g => g.id === v.imageId)?.url || '/images/product/default.png'} alt={v.sku || ''} className="h-10 w-10 rounded object-cover" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{[v.size, v.color].filter(Boolean).join(' / ') || v.sku || 'Biến thể'}</div>
                                <div className="text-xs text-gray-500">SKU: {v.sku || '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">&nbsp;</td>
                          <td className="px-5 py-3 whitespace-nowrap"><p className={`text-sm ${v.price === undefined ? 'text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>{v.price ? formatMoney(Number(v.price)) : '—'}</p></td>
                          <td className="px-5 py-3 whitespace-nowrap"><p className={`text-sm ${v.stock && v.stock > 0 ? 'text-gray-700 dark:text-gray-300' : 'text-red-600 font-medium'}`}>{v.stock ?? 0}{v.stock === 0 ? ' (Hết hàng)' : ''}</p></td>
                          <td className="px-5 py-3 whitespace-nowrap">&nbsp;</td>
                          <td className="px-5 py-3 whitespace-nowrap">&nbsp;</td>
                        </tr>
                      ))
                    )}

                      {/* Loading skeleton while variants are being fetched */}
                      {isOpen && detailCache[key] && ('loading' in (detailCache[key] as any)) && (
                        <>
                          {/* use reusable SkeletonTableRows - default to 2 rows */}
                          <SkeletonTableRows />
                        </>
                      )}
    </Fragment>);
      })}
              {!loading && pageProducts.length === 0 && (
                <tr>
                  <td className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={8}>
                    Không có sản phẩm nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

  {/* Footer Pagination */}
  <div className="relative z-0 flex items-center flex-col sm:flex-row justify-between border-t border-gray-200 px-5 py-4 dark:border-gray-800">
          <div className="pb-3 sm:pb-0">
            <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              Hiển thị <span className="text-gray-800 dark:text-white/90">{(total ? total : filtered.length) === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> đến <span className="text-gray-800 dark:text-white/90">{Math.min(currentPage * pageSize, total ? total : filtered.length)}</span> của <span className="text-gray-800 dark:text-white/90">{total ? total : filtered.length}</span>
            </span>
          </div>
          <div className="flex w-full items-center justify-between gap-2 rounded-lg bg-gray-50 p-4 sm:w-auto sm:justify-normal sm:rounded-none sm:bg-transparent sm:p-0 dark:bg-gray-900 dark:sm:bg-transparent">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="shadow-sm flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:p-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
            >
              <span>
                <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M2.58203 9.99868C2.58174 10.1909 2.6549 10.3833 2.80152 10.53L7.79818 15.5301C8.09097 15.8231 8.56584 15.8233 8.85883 15.5305C9.15183 15.2377 9.152 14.7629 8.85921 14.4699L5.13911 10.7472L16.6665 10.7472C17.0807 10.7472 17.4165 10.4114 17.4165 9.99715C17.4165 9.58294 17.0807 9.24715 16.6665 9.24715L5.14456 9.24715L8.85919 5.53016C9.15199 5.23717 9.15184 4.7623 8.85885 4.4695C8.56587 4.1767 8.09099 4.17685 7.79819 4.46984L2.84069 9.43049C2.68224 9.568 2.58203 9.77087 2.58203 9.99715C2.58203 9.99766 2.58203 9.99817 2.58203 9.99868Z" /></svg>
              </span>
            </button>
            <span className="block text-sm font-medium text-gray-700 sm:hidden dark:text-gray-400">
              Trang <span>{currentPage}</span> của <span>{totalPages}</span>
            </span>
            <ul className="hidden items-center gap-0.5 sm:flex">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <li key={p}>
                  <button
                    onClick={() => setCurrentPage(p)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${p === currentPage ? 'bg-brand-500 text-white' : 'text-gray-700 dark:text-gray-400 hover:bg-brand-500 hover:text-white dark:hover:text-white'}`}
                  >
                    <span>{p}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="shadow-sm flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:p-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
            >
              <span>
                <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M17.4165 9.9986C17.4168 10.1909 17.3437 10.3832 17.197 10.53L12.2004 15.5301C11.9076 15.8231 11.4327 15.8233 11.1397 15.5305C10.8467 15.2377 10.8465 14.7629 11.1393 14.4699L14.8594 10.7472L3.33203 10.7472C2.91782 10.7472 2.58203 10.4114 2.58203 9.99715C2.58203 9.58294 2.91782 9.24715 3.33203 9.24715L14.854 9.24715L11.1393 5.53016C10.8465 5.23717 10.8467 4.7623 11.1397 4.4695C11.4327 4.1767 11.9075 4.17685 12.2003 4.46984L17.1578 9.43049C17.3163 9.568 17.4165 9.77087 17.4165 9.99715C17.4165 9.99763 17.4165 9.99812 17.4165 9.9986Z" /></svg>
              </span>
            </button>
          </div>
        </div>
      </div>
  </div>

  {/* Detail Modal */}
    <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} className="max-w-4xl">
      <div className="min-w-[280px]">
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-gray-200 pb-3 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Chi tiết sản phẩm</h3>
        </div>
        {detailLoading && (
          <div className="grid gap-6 md:grid-cols-2 animate-pulse">
            <div>
              <div className="aspect-square w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="space-y-3">
              <div className="h-6 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-5 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-24 w-full rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        )}
        {detailError && <p className="text-sm text-red-600 dark:text-red-400">{detailError}</p>}
        {!detailLoading && !detailError && detailData && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Media */}
            <div>
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-ignore allow null imageUrl */}
                <img src={detailData.imageUrl || "/images/product/default.png"} alt={detailData.name} className="h-full w-full object-cover" />
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-4">
              {/* Title & chips */}
              <div className="border-b border-gray-200 pb-3 dark:border-gray-800">
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">{detailData.name}</h4>
              </div>

              {/* Price */}
              <div className="border-b border-gray-200 pb-3 dark:border-gray-800">
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatMoney(detailData.price)}
                </div>
              </div>

              {/* Key info list (inline 'Label: Value') */}
              <div className="divide-y divide-gray-200 border-b border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                <div className="py-2.5 flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Danh mục:</span>
                  <span className="text-gray-800 dark:text-white/90">{detailData.categoryName}</span>
                </div>
                <div className="py-2.5 flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tồn kho:</span>
                  <span className="text-gray-800 dark:text-white/90">{detailData.stockQuantity}</span>
                </div>
                <div className="py-2.5 flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Size:</span>
                  <span className="text-gray-800 dark:text-white/90">{detailData.size ?? '-'}</span>
                </div>
                <div className="py-2.5 flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Trạng thái bán:</span>
                  <span className="text-gray-800 dark:text-white/90">{detailData.isActive ? 'Đang bán' : 'Ngưng bán'}</span>
                </div>
                
              </div>

              {/* Description */}
              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Mô tả:</div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{detailData.description || 'Không có mô tả.'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>

    {/* Confirm Delete Modal */}
    <Modal isOpen={Boolean(confirmOpen?.id)} onClose={() => setConfirmOpen(null)}>
      <div className="min-w-[280px]">
        <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Xóa sản phẩm</h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Bạn có chắc muốn xóa sản phẩm <span className="font-medium text-gray-800 dark:text-white/90">{confirmOpen?.name}</span>? Hành động sẽ ẩn sản phẩm khỏi hệ thống.</p>
        <div className="flex justify-end gap-2">
          <button
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/10"
            onClick={() => setConfirmOpen(null)}
          >
            Hủy
          </button>
          <button
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            onClick={async () => {
              const id = confirmOpen?.id;
              if (id == null) return;
              setConfirmOpen(null);
              // Optimistic update
              const prev = products;
              setProducts(prev.filter(x => x.id !== id));
              if (total) setTotal(t => Math.max(0, t - 1));
              try {
                const resp = await deleteProduct(String(id));
                const msg = (resp?.message === 'PRODUCT_ALREADY_INACTIVE') ? 'Đã xóa (đã ẩn) sản phẩm' : 'Đã xóa (đã ẩn) sản phẩm';
                show({ type: 'success', message: msg });
              } catch (e: unknown) {
                // revert
                setProducts(prev);
                if (total) setTotal(t => t + 1);
                const status = (e && typeof e === 'object' && 'status' in e) ? Number((e as any).status) : undefined;
                let message = getErrorMessage(e) || 'Xóa sản phẩm thất bại';
                if (status === 404) message = 'Sản phẩm không tìm thấy';
                else if (status === 403) message = 'Không đủ quyền';
                else if (status === 401) message = 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại';
                show({ type: 'error', message });
              }
            }}
          >
            Xóa
          </button>
        </div>
      </div>
    </Modal>

    {/* Add Product moved to dedicated page: /add-product */}
    </>
  );
}
