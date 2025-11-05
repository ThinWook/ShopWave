import { useEffect, useState, type FormEvent } from "react";
import VariantTable, { type VariantForm } from "./VariantTable";
import { getCategories, type CategoryDto } from "../../services/categoryService";
import CategoryDropdown from './CategoryDropdown';
import { createProduct, type CreateProductInput, type ProductDto, type VariantDto, type ProductOptionDto } from "../../services/productService";
import { uploadMany } from "../../services/mediaService";
import { useToast } from "../../context/ToastContext";
import OptionsEditor from "./OptionsEditor";

export type AddProductFormProps = {
  onSuccess?: (created: ProductDto) => void;
  onCancel?: () => void;
  initial?: Partial<ProductDto> | null;
};

export default function AddProductForm({ onSuccess, onCancel, initial }: AddProductFormProps) {
  const { show } = useToast();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateProductInput | 'categoryName', string>>>({});
  const [variantErrors, setVariantErrors] = useState<string[]>([]);

  // form state
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [name, setName] = useState("");
  // single product fields (when not using variants)
  const [singlePrice, setSinglePrice] = useState<string>("");
  const [singleSku, setSingleSku] = useState<string>("");
  const [singleStock, setSingleStock] = useState<string>("0");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  // no shared stock field; singleStock used when !hasVariants
  const [options, setOptions] = useState<ProductOptionDto[]>([]);
  const [hasVariants, setHasVariants] = useState(false);

  // media
  const [files, setFiles] = useState<File[]>([]); // retained for local names if needed
  const [mediaIds, setMediaIds] = useState<number[]>([]); // ids returned by uploadMany, in same order as files
  const [mainImageId, setMainImageId] = useState<number | null>(null);
  const [mediaPreviews, setMediaPreviews] = useState<Record<number, string>>({});
  const [mediaNames, setMediaNames] = useState<Record<number, string>>({});
  const [uploadingMedia, setUploadingMedia] = useState(false);
  

  const max = { name: 120, description: 2000 } as const;

  useEffect(() => {
    (async () => {
      setLoadingCategories(true);
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch {
        // ignore
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, []);

  // initial prefill
  useEffect(() => {
    if (!initial) return;
    setName(initial.name || "");
  setSinglePrice(initial.price ? String(initial.price) : "");
    setDescription(initial.description || "");
    const possibleCategoryId = (initial as any).category?.id ?? (initial as any).categoryId ?? (initial as any).categoryName ?? null;
    if (possibleCategoryId) setCategoryId(String(possibleCategoryId));
  if ((initial as any).mainImage && (initial as any).mainImage.id) setMainImageId((initial as any).mainImage.id as number);
    if ((initial as any).galleryImages && (initial as any).galleryImages.length) {
      const ids = (initial as any).galleryImages.map((g: any) => g.id).filter(Boolean) as number[];
      setMediaIds(ids);
      const previews: Record<number, string> = {};
      for (const g of (initial as any).galleryImages as any[]) {
        if (g.id && g.url) previews[g.id] = g.url;
      }
      setMediaPreviews(previews);
    }
    if ((initial as any).options && Array.isArray((initial as any).options)) {
      setOptions((initial as any).options as ProductOptionDto[]);
    }
    if ((initial as any).variants && (initial as any).variants.length) {
      const mapped: VariantForm[] = (initial as any).variants.map((v: any) => ({
        id: v.id,
        sku: v.sku ?? "",
        price: v.price ? String(v.price) : "",
        stock: v.stock ? String(v.stock) : "",
        imageId: v.imageId,
        selected_options: Array.isArray(v.selected_options)
          ? v.selected_options
          : [
              v.size ? { option_name: 'Size', value: v.size } : null,
              v.color ? { option_name: 'Color', value: v.color } : null,
            ].filter(Boolean) as any,
      }));
      setVariants(mapped);
      setHasVariants(true);
    }
  }, [initial]);

  // helpers
  const addFileList = (selected: File[]) => setFiles(prev => [...prev, ...selected]);

  // no separate main image upload; main image is chosen from gallery

  const handleGallerySelect = async (selected: File[]) => {
    if (!selected || selected.length === 0) return;
    setUploadingMedia(true);
    try {
      const ids = await uploadMany(selected);
      // map ids -> file by index
      const mappingIds: number[] = [];
      ids.forEach((id, i) => {
        if (typeof id === 'number') {
          mappingIds.push(id);
          setMediaPreviews(prev => ({ ...prev, [id]: URL.createObjectURL(selected[i]) }));
          setMediaNames(prev => ({ ...prev, [id]: selected[i].name }));
        }
      });
      setMediaIds(prev => [...prev, ...mappingIds]);
      if (!mainImageId && mappingIds.length) setMainImageId(mappingIds[0]);
    } catch (err) {
      console.warn('Gallery auto-upload failed', err);
    } finally {
      setUploadingMedia(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setVariantErrors([]);

    // basic client validation
    if (!name.trim()) {
      setErrors({ name: 'Tên sản phẩm là bắt buộc' });
      setSubmitting(false);
      return;
    }
    const priceNum = Number(singlePrice);
    // If single product, price must be > 0
    if (!hasVariants) {
      if (!singlePrice || !(priceNum > 0)) {
        setErrors({ price: 'Giá phải lớn hơn 0' } as any);
        setSubmitting(false);
        return;
      }
    }
    if (!categoryId) {
      setErrors(prev => ({ ...prev, categoryId: 'Vui lòng chọn danh mục' }));
      setSubmitting(false);
      return;
    }

    try {
      // 1) Variant images are selected from existing media; no per-variant upload here
      const variantsCopy = [...variants];

      // 2) Upload gallery files
      let uploadedMediaIds: number[] = [];
      if (files.length) {
        uploadedMediaIds = await uploadMany(files);
        setMediaIds(uploadedMediaIds);
        const previews: Record<number, string> = {};
        uploadedMediaIds.forEach((mid, i) => {
          try {
            previews[mid] = URL.createObjectURL(files[i]);
          } catch {}
        });
        setMediaPreviews(prev => ({ ...prev, ...previews }));
  if (!mainImageId && uploadedMediaIds.length) setMainImageId(uploadedMediaIds[0]);
      }

      // 4) Build payload
      const payload: CreateProductInput = {
        name: name.trim(),
        description: description.trim() || null,
        categoryId,
        price: hasVariants ? 0 : priceNum,
        stockQuantity: hasVariants ? variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : Math.max(0, Number(singleStock) || 0),
        // slug required by backend — simple slugify from name
        slug: name.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'),
      };

      if (hasVariants && options.length) {
        payload.options = options;
      }

      if (hasVariants && variantsCopy.length) {
        payload.variants = variantsCopy.map(v => ({
          sku: v.sku || undefined,
          price: Number(v.price) || 0,
          stock: Number(v.stock) || 0,
          imageId: v.imageId,
          selected_options: (v.selected_options || []).filter(so => so && so.option_name && so.value),
        } as VariantDto));
      } else if (!hasVariants) {
        payload.variants = [{
          sku: singleSku || undefined,
          price: Number(singlePrice) || 0,
          stock: Number(singleStock) || 0,
          imageId: mainImageId ?? undefined,
        } as VariantDto];
      }

      if (mediaIds.length) {
        payload.mediaIds = mediaIds;
      }
      if (mainImageId) payload.mainImageId = mainImageId;
      // Build galleryMedia array expected by backend (mediaId + optional sortOrder)
      if (mediaIds && mediaIds.length) {
        payload.galleryMedia = mediaIds.map((mid, idx) => ({ mediaId: mid, sortOrder: idx }));
      }

      const created = await createProduct(payload);
      show({ type: 'success', message: `Đã tạo sản phẩm: ${created.name}` });
      onSuccess?.(created);
    } catch (err) {
      const anyErr = err as any;
      const fieldErrs: Record<string, string> | undefined = anyErr?.fieldErrors;
      if (fieldErrs && typeof fieldErrs === 'object') {
        const mapped: Partial<Record<keyof CreateProductInput, string>> = {};
        for (const [k, v] of Object.entries(fieldErrs)) {
          (mapped as Record<string, string>)[k] = String(v);
        }
        if (Object.keys(mapped).length) setErrors(mapped);
        const firstMsg = Object.values(fieldErrs)[0];
        show({ type: 'error', message: typeof firstMsg === 'string' ? firstMsg : (anyErr?.message || 'Tạo sản phẩm thất bại') });
      } else {
        show({ type: 'error', message: (anyErr && anyErr.message) || 'Tạo sản phẩm thất bại' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {variantErrors.length > 0 && (
            <div className="text-sm text-red-600 dark:text-red-400">{variantErrors.map((err, i) => <div key={i}>{err}</div>)}</div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Tên sản phẩm <span className="text-red-600">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={max.name}
              className="h-11 w-full rounded-lg border px-4 text-sm" />
            <div className="mt-1 text-xs text-gray-500">{name.length}/{max.name}</div>
            {errors.name && <div className="text-xs text-red-600">{errors.name}</div>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Danh mục <span className="text-red-600">*</span></label>
            <CategoryDropdown categories={categories.filter(c => c.parentId != null).map(c => ({ id: c.id, name: c.name }))}
              value={categoryId} onSelect={id => setCategoryId(id)} />
            <div className="mt-1 text-xs text-gray-500">{loadingCategories ? 'Đang tải...' : `${categories.length} danh mục`}</div>
            {errors.categoryId && <div className="text-xs text-red-600">{errors.categoryId}</div>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Danh sách Media (upload)</label>
            <input type="file" accept="image/*,video/*" multiple onChange={e => {
              const selected = Array.from(e.target.files || []);
              addFileList(selected);
              void handleGallerySelect(selected);
            }} className="block w-full text-sm" />
            {uploadingMedia && <div className="text-xs text-gray-500 mt-1">Đang tải ảnh...</div>}
            <p className="mt-1 text-xs text-gray-500">Chọn ảnh đại diện bằng cách nhấn biểu tượng ★ trên ảnh trong danh sách bên dưới.</p>
          </div>

              {mediaIds.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {mediaIds.map((mid, idx) => {
                    const url = mediaPreviews[mid];
                    const name = mediaNames[mid] ?? `file-${mid}`;
                    const isMain = mainImageId === mid;
                    return (
                      <div key={mid} className={`relative rounded-lg overflow-hidden border bg-white dark:bg-gray-900 ${isMain ? 'ring-2 ring-brand-500' : ''}`}>
                        {url ? <img src={url} alt={name} className="h-36 w-full object-cover" onLoad={() => URL.revokeObjectURL(url)} /> : <div className="h-36 w-full bg-gray-100" />}
                        <div className="absolute left-2 top-2"><span className="inline-flex items-center rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">#{idx+1}</span></div>
                        <div className="absolute right-2 top-2 flex flex-col items-end gap-2">
                          <button type="button" title="Đặt làm ảnh đại diện" onClick={() => setMainImageId(mid)} className="h-8 w-8 rounded-full bg-white/90">★</button>
                          <button type="button" title="Xóa" onClick={() => { setMediaIds(prev => prev.filter(id => id !== mid)); setMediaPreviews(prev => { const c = { ...prev }; delete c[mid]; return c; }); setMediaNames(prev => { const c = { ...prev }; delete c[mid]; return c; }); if (isMain) setMainImageId(null); }} className="h-8 w-8 rounded-full bg-white/90 text-red-600">✕</button>
                        </div>
                        <div className="p-2 text-xs text-gray-700 dark:text-gray-200"><div className="truncate" title={name}>{name}</div></div>
                      </div>
                    );
                  })}
                </div>
              )}


          <div>
            <label className="block text-sm font-medium text-gray-700">Mô tả</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={8} maxLength={max.description} className="w-full rounded-lg border px-4 py-2 text-sm" />
            <div className="mt-1 text-xs text-gray-500">{description.length}/{max.description}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={hasVariants} onChange={e => setHasVariants(e.target.checked)} />
              <span>Sản phẩm này có nhiều phiên bản (ví dụ: Size, Màu sắc)</span>
            </label>
          </div>

          {!hasVariants && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Giá (VND)</label>
                  <input type="number" min={0} step="1" value={singlePrice} onChange={e => setSinglePrice(e.target.value)} className="h-11 w-full rounded-lg border px-4 text-sm" />
                  {(errors as any).price && <div className="text-xs text-red-600">{(errors as any).price}</div>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">SKU</label>
                  <input value={singleSku} onChange={e => setSingleSku(e.target.value)} className="h-11 w-full rounded-lg border px-4 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Số lượng tồn kho</label>
                  <input type="number" min={0} value={singleStock} onChange={e => setSingleStock(e.target.value)} className="h-11 w-full rounded-lg border px-4 text-sm" />
                </div>
              </div>
            </div>
          )}

          {hasVariants && (
            <>
              <OptionsEditor options={options} setOptions={setOptions} mediaIds={mediaIds} mediaPreviews={mediaPreviews} />
              <VariantTable variants={variants} setVariants={setVariants} mediaPreviews={mediaPreviews} mediaIds={mediaIds} options={options} hasVariants />
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm">Hủy</button>}
        <button type="submit" disabled={submitting || uploadingMedia} className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white">{submitting ? 'Đang lưu...' : uploadingMedia ? 'Đang tải ảnh...' : 'Tạo sản phẩm'}</button>
      </div>
    </form>
  );
}
 
