import React, { useEffect, useMemo } from "react";
import Input from "../form/input/InputField";
import type { ProductOptionDto, VariantSelectedOptionDto } from "../../services/productService";

export interface VariantForm {
  price: string;
  stock: string;
  imageId?: number;
  // optional file the user uploaded specifically for this variant (not part of product gallery)
  imageFile?: File;
  imagePreview?: string;
  sku?: string;
  // New flexible selected options instead of hard-coded size/color
  selected_options?: VariantSelectedOptionDto[];
  id?: string;
  // attributes removed (backend no longer supports them)
}

interface Props {
  variants: VariantForm[];
  setVariants: (v: VariantForm[]) => void;
  mediaPreviews?: Record<number, string>;
  mediaIds?: number[];
  options?: ProductOptionDto[];
  hasVariants?: boolean;
}

const VariantTable: React.FC<Props> = ({ variants, setVariants, mediaPreviews, mediaIds = [], options = [], hasVariants = true }) => {

  const handleChange = (idx: number, field: keyof VariantForm, value: any) => {
    const copy = [...variants];
    (copy[idx] as any)[field] = value;
    setVariants(copy);
  };

  // attributes removed - no handlers needed

  // Auto-generate combinations from options
  const valueSets = useMemo(() => (options || []).map(o => (o.values || []).map(v => v.value).filter(Boolean)), [options]);
  const combinations: VariantSelectedOptionDto[][] = useMemo(() => {
    if (!hasVariants) return [];
    if (!options || options.length === 0) return [];
    if (valueSets.some(s => s.length === 0)) return [];
    const result: VariantSelectedOptionDto[][] = [];
    const helper = (idx: number, acc: VariantSelectedOptionDto[]) => {
      if (idx === options.length) { result.push(acc); return; }
      const opt = options[idx];
      for (const val of valueSets[idx]) helper(idx + 1, [...acc, { option_name: opt.name, value: val }]);
    };
    helper(0, []);
    return result;
  }, [options, valueSets, hasVariants]);

  const comboKey = (sel: VariantSelectedOptionDto[]) => sel.map(s => `${s.option_name}=${s.value}`).join('|');

  useEffect(() => {
    if (!hasVariants) return;
    const map = new Map<string, VariantForm>();
    for (const v of variants) {
      const key = comboKey(v.selected_options || []);
      map.set(key, v);
    }
    const next: VariantForm[] = combinations.map(sel => {
      const key = comboKey(sel);
      const existing = map.get(key);
      return existing ? existing : { price: "", stock: "", sku: "", imageId: undefined, selected_options: sel };
    });
    if (next.length !== variants.length || next.some((v, i) => comboKey(v.selected_options || []) !== comboKey(variants[i]?.selected_options || []))) {
      setVariants(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinations, hasVariants]);

  const removeVariant = (idx: number) => setVariants(variants.filter((_, i) => i !== idx));

  if (!hasVariants) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Biến thể sản phẩm</h3>
      </div>

      {(options.length === 0 || valueSets.some(s => s.length === 0)) && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          Hãy thêm tuỳ chọn và giá trị để hệ thống tự động tạo biến thể (VD: Màu: Đen/Be; Size: S/M).
        </div>
      )}

      {variants.length > 0 && (
        <div className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="min-w-[720px] divide-y divide-gray-200 dark:divide-gray-800">
            <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_0.8fr] items-center bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 dark:bg-gray-900">
              <div>Biến thể</div>
              <div>Ảnh</div>
              <div>SKU</div>
              <div>Giá</div>
              <div>Tồn kho</div>
            </div>
            {variants.map((v, idx) => {
              const label = (v.selected_options || []).map(s => `${s.option_name}: ${s.value}`).join(' / ') || `Biến thể ${idx + 1}`;
              return (
                <div key={idx} className="grid grid-cols-[1.6fr_1fr_1fr_1fr_0.8fr] items-center px-3 py-2">
                  <div className="text-sm text-gray-800 dark:text-white/90">{label}</div>
                  <div className="flex items-center gap-2">
                    <select
                      className="h-9 rounded border px-2 text-sm"
                      value={v.imageId ?? ''}
                      onChange={e => handleChange(idx, 'imageId', e.target.value ? Number(e.target.value) : undefined)}
                    >
                      <option value="">(Không chọn)</option>
                      {mediaIds.map(mid => (
                        <option key={mid} value={mid}>#{mid}</option>
                      ))}
                    </select>
                    {(v.imageId && mediaPreviews && mediaPreviews[v.imageId]) ? (
                      <img src={mediaPreviews[v.imageId]} alt={`Thumb ${v.imageId}`} className="h-9 w-9 object-cover rounded" />
                    ) : null}
                  </div>
                  <div>
                    <Input value={v.sku || ''} onChange={e => handleChange(idx, 'sku', e.target.value)} placeholder="SKU" />
                  </div>
                  <div>
                    <Input value={v.price} onChange={e => handleChange(idx, 'price', e.target.value)} type="number" placeholder="Giá" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input value={v.stock} onChange={e => handleChange(idx, 'stock', e.target.value)} type="number" placeholder="Tồn kho" />
                    <button type="button" className="text-xs text-red-600" onClick={() => removeVariant(idx)}>Xoá</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VariantTable;
