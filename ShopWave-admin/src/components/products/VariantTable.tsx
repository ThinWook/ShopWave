import React, { useState } from "react";
import Input from "../form/input/InputField";

export interface VariantForm {
  price: string;
  stock: string;
  imageId?: number;
  // optional file the user uploaded specifically for this variant (not part of product gallery)
  imageFile?: File;
  imagePreview?: string;
  sku?: string;
  size?: string;
  color?: string;
  id?: string;
  // attributes removed (backend no longer supports them)
}

interface Props {
  variants: VariantForm[];
  setVariants: (v: VariantForm[]) => void;
  mediaPreviews?: Record<number, string>;
}

const VariantTable: React.FC<Props> = ({ variants, setVariants, mediaPreviews }) => {
  const [open, setOpen] = useState<Record<number, boolean>>({});

  const handleChange = (idx: number, field: keyof VariantForm, value: any) => {
    const copy = [...variants];
    (copy[idx] as any)[field] = value;
    setVariants(copy);
  };

  // attributes removed - no handlers needed

  const addVariant = () => setVariants([...variants, { price: "", stock: "", imageId: undefined, sku: "", size: "", color: "" }]);
  const removeVariant = (idx: number) => setVariants(variants.filter((_, i) => i !== idx));

  // attributes removed - no-op helpers

  const toggleOpen = (idx: number) => setOpen(prev => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Biến thể sản phẩm</h3>
        <button
          type="button"
          onClick={addVariant}
          className="inline-flex items-center gap-2 rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
        >
          <span className="text-lg leading-none">+</span>
          <span>Thêm biến thể</span>
        </button>
      </div>

      {variants.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          Chưa có biến thể. Nhấn “Thêm biến thể” để tạo.
        </div>
      )}

      <div className="space-y-2">
        {variants.map((v, idx) => (
          <div key={idx} className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between px-4 py-2 cursor-pointer" onClick={() => toggleOpen(idx)}>
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {v.sku ? `${v.sku}` : `Biến thể ${idx + 1}`}
                </div>
                <div className="text-xs text-gray-500">Giá: <span className="font-medium text-gray-700">{v.price || '—'}</span></div>
                <div className="text-xs text-gray-500">Tồn kho: <span className="font-medium text-gray-700">{v.stock || '—'}</span></div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="text-sm text-brand-500" onClick={(e) => { e.stopPropagation(); removeVariant(idx); }}>Xóa</button>
                <button type="button" className="text-sm text-gray-500" onClick={(e) => { e.stopPropagation(); toggleOpen(idx); }}>
                  {open[idx] ? 'Thu gọn' : 'Mở'}
                </button>
              </div>
            </div>

            {open[idx] && (
              <div className="px-4 pb-4 pt-0 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Giá</label>
                    <Input value={v.price} onChange={e => handleChange(idx, 'price', e.target.value)} type="number" placeholder="Giá" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Tồn kho</label>
                    <Input value={v.stock} onChange={e => handleChange(idx, 'stock', e.target.value)} type="number" placeholder="Tồn kho" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Ảnh biến thể</label>
                    <div className="flex items-center gap-3">
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = URL.createObjectURL(file);
                        handleChange(idx, 'imageFile', file);
                        handleChange(idx, 'imagePreview', url);
                      }} className="text-xs" />
                      {(v.imagePreview) ? (
                        <img src={v.imagePreview} alt="preview" className="h-12 w-12 object-cover rounded" />
                      ) : (v.imageId && mediaPreviews && mediaPreviews[v.imageId]) ? (
                        <img src={mediaPreviews[v.imageId]} alt={`Thumb ${v.imageId}`} className="h-12 w-12 object-cover rounded" />
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">SKU</label>
                    <Input value={v.sku || ''} onChange={e => handleChange(idx, 'sku', e.target.value)} placeholder="SKU" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Size</label>
                    <Input value={v.size || ''} onChange={e => handleChange(idx, 'size', e.target.value)} placeholder="Size" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Màu</label>
                    <Input value={v.color || ''} onChange={e => handleChange(idx, 'color', e.target.value)} placeholder="Màu" />
                  </div>
                </div>

                {/* attributes removed - UI intentionally blank */}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VariantTable;
