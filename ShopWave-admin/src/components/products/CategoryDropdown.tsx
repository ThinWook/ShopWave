import { useEffect, useRef, useState } from 'react';

export type CategoryItem = { id: string; name: string };

type Props = {
  categories: CategoryItem[];
  value?: string;
  disabled?: boolean;
  onSelect: (id: string) => void;
  // Note: this simplified dropdown only supports selection. CRUD operations
  // for categories are intentionally omitted here per UX request.
};

export default function CategoryDropdown({ categories, value, disabled, onSelect }: Props) {
  // no toast or CRUD in this simplified selector
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  // simple dropdown - no inline create/edit/delete

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const selected = categories.find(c => c.id === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className="h-11 inline-flex items-center gap-3 max-w-[260px] w-full truncate rounded-lg border px-4 py-2.5 text-sm bg-transparent text-left"
        title={selected?.name || ''}
      >
        <span className="truncate flex-1">{selected?.name || '-- Chọn danh mục --'}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[320px] rounded-lg border bg-white shadow-lg dark:bg-gray-900 dark:border-gray-800">
          <div className="max-h-56 overflow-y-auto divide-y">
            {categories.map(c => (
              <div key={c.id} className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                <button type="button" onClick={() => { onSelect(c.id); setOpen(false); }} className="truncate text-left w-full text-sm" title={c.name}>{c.name}</button>
              </div>
            ))}
            {categories.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">Chưa có danh mục</div>}
          </div>
        </div>
      )}
    </div>
  );
}
