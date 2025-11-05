import CategoryDropdown, { type CategoryItem } from "./CategoryDropdown";
import TagInput from "./TagInput";

type Status = "Đang bán" | "Nháp" | "Ngừng bán";

type Props = {
  status: Status;
  onStatusChange: (s: Status) => void;
  categories: CategoryItem[];
  categoryId?: string;
  onCategoryChange: (id: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
};

export default function ProductOrganizationCard({ status, onStatusChange, categories, categoryId, onCategoryChange, tags, onTagsChange }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Tổ chức</h3>

      <div className="rounded-lg border p-4 space-y-3">
        <div>
          <label className="mb-1 block text-sm text-gray-700">Trạng thái</label>
          <select className="h-10 w-full rounded border px-3 text-sm" value={status} onChange={e => onStatusChange(e.target.value as Status)}>
            <option>Đang bán</option>
            <option>Nháp</option>
            <option>Ngừng bán</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700">Danh mục</label>
          <CategoryDropdown categories={categories} value={categoryId} onSelect={onCategoryChange} />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700">Tags</label>
          <TagInput value={tags} onChange={onTagsChange} />
        </div>
      </div>
    </div>
  );
}
