import React, { useEffect, useState } from 'react';
import type { CreateCategoryRequest, CategoryDto } from '../../services/categoryService';

export type CategoryFormProps = {
  initial?: Partial<CreateCategoryRequest> & { id?: string };
  categories: CategoryDto[];
  onCancel?: () => void;
  onSubmit: (payload: CreateCategoryRequest) => Promise<void> | void;
};

export default function CategoryForm({ initial, categories, onCancel, onSubmit }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name || '');
  // initial?.parentId can be null (explicit root). useState must not be initialized with null
  // so coerce null -> undefined here and restore null on submit when appropriate
  const [parentId, setParentId] = useState<string | undefined>(
    initial?.parentId ?? undefined
  );
  const [isActive, setIsActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(initial?.name || '');
  // normalize explicit null to undefined for control value; we'll convert back to null on submit
  setParentId(initial?.parentId ?? undefined);
    setIsActive(true);
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // When the user selects the root option we want parentId to be null (server expects null for root)
      const payloadParentId = parentId === undefined || parentId === '' ? null : parentId;
      await onSubmit({ name: name.trim(), parentId: payloadParentId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên danh mục</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-500/10" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Danh mục cha</label>
        <select value={parentId ?? ''} onChange={(e) => setParentId(e.target.value || undefined)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-500/10">
          <option value="">— Là danh mục gốc —</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-700 dark:text-gray-300">Trạng thái</label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={Boolean(isActive)} onChange={(e) => setIsActive(e.target.checked)} />
          <span className="text-sm">{isActive ? 'Hoạt động' : 'Ẩn'}</span>
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">Hủy</button>
        <button type="submit" disabled={submitting} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white">{submitting ? 'Đang lưu...' : 'Lưu'}</button>
      </div>
    </form>
  );
}
