import RichTextEditor from "../form/RichTextEditor";

type Props = {
  name: string;
  onNameChange: (v: string) => void;
  slug: string;
  onSlugChange: (v: string) => void;
  descriptionHtml: string;
  onDescriptionChange: (html: string) => void;
  errors?: Partial<Record<"name" | "slug", string>>;
};

export default function ProductGeneralCard({ name, onNameChange, slug, onSlugChange, descriptionHtml, onDescriptionChange, errors = {} }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Thông tin chung</h3>
      <div className="rounded-lg border p-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Tên sản phẩm <span className="text-red-600">*</span></label>
          <input value={name} onChange={e => onNameChange(e.target.value)} className="h-11 w-full rounded-lg border px-4 text-sm" />
          {errors.name && <div className="text-xs text-red-600 mt-1">{errors.name}</div>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Đường dẫn (Slug)</label>
          <input value={slug} onChange={e => onSlugChange(e.target.value)} className="h-11 w-full rounded-lg border px-4 text-sm" placeholder="ao-polo-slim-fit" />
          {errors.slug && <div className="text-xs text-red-600 mt-1">{errors.slug}</div>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Mô tả</label>
          <RichTextEditor value={descriptionHtml} onChange={onDescriptionChange} placeholder="Mô tả sản phẩm…" />
        </div>
      </div>
    </div>
  );
}
