import React from "react";
import type { ProductOptionDto } from "../../services/productService";
import { uploadMany } from "../../services/mediaService";

export interface OptionsEditorProps {
  options: ProductOptionDto[];
  setOptions: (opts: ProductOptionDto[]) => void;
  mediaIds?: number[];
  mediaPreviews?: Record<number, string>;
}

const emptyOption = (): ProductOptionDto => ({ name: "", displayType: "text_button", values: [] });

const OptionsEditor: React.FC<OptionsEditorProps> = ({ options, setOptions, mediaIds = [], mediaPreviews = {} }) => {
  const [uploading, setUploading] = React.useState(false);
  const addOption = () => setOptions([...options, emptyOption()]);
  const removeOption = (idx: number) => setOptions(options.filter((_, i) => i !== idx));

  const updateOptionField = (idx: number, field: keyof ProductOptionDto, value: any) => {
    const copy = [...options];
    (copy[idx] as any)[field] = value;
    setOptions(copy);
  };

  const addValue = (oIdx: number) => {
    const copy = [...options];
    copy[oIdx].values.push({ value: "" });
    setOptions(copy);
  };

  const removeValue = (oIdx: number, vIdx: number) => {
    const copy = [...options];
    copy[oIdx].values = copy[oIdx].values.filter((_, i) => i !== vIdx);
    setOptions(copy);
  };

  const updateValue = (oIdx: number, vIdx: number, field: "value" | "thumbnailId", value: any) => {
    const copy = [...options];
    (copy[oIdx].values[vIdx] as any)[field] = value;
    setOptions(copy);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Tuỳ chọn (Options)</h3>
        <button
          type="button"
          onClick={addOption}
          className="inline-flex items-center gap-2 rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <span className="text-lg leading-none">+</span>
          <span>Thêm tuỳ chọn</span>
        </button>
      </div>

      {options.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          Chưa có tuỳ chọn. Nhấn “Thêm tuỳ chọn” để tạo nhóm Size/Color...
        </div>
      )}

      <div className="space-y-3">
        {options.map((opt, oIdx) => (
          <div key={oIdx} className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-3">
                <input
                  className="h-9 rounded border px-3 text-sm"
                  placeholder="Tên tuỳ chọn (ví dụ: Size, Color)"
                  value={opt.name}
                  onChange={e => updateOptionField(oIdx, 'name', e.target.value)}
                />
                <select
                  className="h-9 rounded border px-3 text-sm"
                  value={opt.displayType}
                  onChange={e => updateOptionField(oIdx, 'displayType', e.target.value)}
                >
                  <option value="text_button">Text Button</option>
                  <option value="color_swatch">Color Swatch</option>
                  <option value="image_swatch">Image Swatch</option>
                  <option value="dropdown">Dropdown</option>
                </select>
              </div>
              <button type="button" className="text-sm text-red-600" onClick={() => removeOption(oIdx)}>Xoá</button>
            </div>

            <div className="px-4 pb-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-medium text-gray-600">Giá trị</div>
                <button type="button" className="text-xs text-brand-500" onClick={() => addValue(oIdx)}>+ Thêm giá trị</button>
              </div>

              <div className="space-y-2">
                {opt.values.map((val, vIdx) => (
                  <div key={vIdx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <input
                      className="h-9 rounded border px-3 text-sm"
                      placeholder="Giá trị (ví dụ: 42, Black)"
                      value={val.value}
                      onChange={e => updateValue(oIdx, vIdx, 'value', e.target.value)}
                    />
                    {(opt.displayType === 'color_swatch' || opt.displayType === 'image_swatch') ? (
                      <div className="col-span-1 md:col-span-2 flex items-center gap-3">
                        <select
                          className="h-9 rounded border px-3 text-sm"
                          value={val.thumbnailId ?? ''}
                          onChange={e => updateValue(oIdx, vIdx, 'thumbnailId', e.target.value ? Number(e.target.value) : undefined)}
                        >
                          <option value="">(Không thumbnail)</option>
                          {mediaIds.map(mid => (
                            <option key={mid} value={mid}>#{mid}</option>
                          ))}
                        </select>
                        <label className="inline-flex items-center gap-2 text-xs">
                          <input type="file" accept="image/*" disabled={uploading} onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploading(true);
                            try {
                              const [id] = await uploadMany([file]);
                              updateValue(oIdx, vIdx, 'thumbnailId', id);
                            } finally {
                              setUploading(false);
                            }
                          }} />
                          <span>{uploading ? 'Đang tải…' : 'Tải ảnh'}</span>
                        </label>
                        {val.thumbnailId && mediaPreviews[val.thumbnailId] && (
                          <img src={mediaPreviews[val.thumbnailId]} alt={`thumb-${val.thumbnailId}`} className="h-10 w-10 rounded object-cover" />
                        )}
                        <button type="button" className="text-xs text-red-600" onClick={() => removeValue(oIdx, vIdx)}>Xoá</button>
                      </div>
                    ) : (
                      <div className="col-span-1 md:col-span-2 flex items-center gap-3">
                        <span className="text-xs text-gray-500">(Không cần thumbnail)</span>
                        <button type="button" className="text-xs text-red-600" onClick={() => removeValue(oIdx, vIdx)}>Xoá</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OptionsEditor;
