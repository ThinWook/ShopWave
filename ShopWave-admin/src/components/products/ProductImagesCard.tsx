import { useState } from "react";
import { uploadMany } from "../../services/mediaService";

type Props = {
  mediaIds: number[];
  mediaPreviews: Record<number, string>;
  mainImageId: number | null;
  onChange: (nextIds: number[], nextPreviews: Record<number, string>, nextMainId: number | null) => void;
};

export default function ProductImagesCard({ mediaIds, mediaPreviews, mainImageId, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const ids = await uploadMany(files);
      const newPreviews: Record<number, string> = { ...mediaPreviews };
      ids.forEach((id, i) => {
        newPreviews[id] = URL.createObjectURL(files[i]);
      });
      const nextIds = [...mediaIds, ...ids];
      const nextMain = mainImageId ?? (ids.length ? ids[0] : null);
      onChange(nextIds, newPreviews, nextMain);
    } finally {
      setUploading(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    void handleFiles(files);
    e.currentTarget.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    void handleFiles(files);
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...mediaIds];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next, mediaPreviews, mainImageId);
  };

  const removeAt = (idx: number) => {
    const id = mediaIds[idx];
    const next = mediaIds.filter((_, i) => i !== idx);
    const previews = { ...mediaPreviews };
    delete previews[id];
    const nextMain = mainImageId === id ? (next[0] ?? null) : mainImageId;
    onChange(next, previews, nextMain);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Hình ảnh</h3>
      <div
        className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
        onDragOver={e => { e.preventDefault(); }}
        onDrop={onDrop}
      >
        Kéo-thả ảnh vào đây hoặc
        <label className="ml-1 inline-flex cursor-pointer items-center gap-1 text-brand-600">
          <input type="file" accept="image/*" multiple className="hidden" onChange={onInputChange} />
          <span>nhấn để tải lên</span>
        </label>
        {uploading && <div className="mt-2 text-xs">Đang tải ảnh...</div>}
      </div>

      {mediaIds.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {mediaIds.map((mid, idx) => (
            <div
              key={mid}
              className={`group relative overflow-hidden rounded-lg border bg-white dark:bg-gray-900 ${mainImageId === mid ? 'ring-2 ring-brand-500' : ''}`}
              draggable
              onDragStart={() => setDragIndex(idx)}
              onDragEnter={e => { e.preventDefault(); if (dragIndex != null && dragIndex !== idx) reorder(dragIndex, idx); setDragIndex(idx); }}
              onDragOver={e => e.preventDefault()}
              onDragEnd={() => setDragIndex(null)}
            >
              {mediaPreviews[mid] ? (
                <img src={mediaPreviews[mid]} alt={`media-${mid}`} className="h-40 w-full object-cover" />
              ) : (
                <div className="h-40 w-full bg-gray-100" />
              )}
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2">
                <span className="rounded bg-black/50 px-2 py-0.5 text-xs text-white">#{idx + 1}</span>
                <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <button title="Ảnh đại diện" type="button" onClick={() => onChange(mediaIds, mediaPreviews, mid)} className="h-7 w-7 rounded-full bg-white/90">★</button>
                  <button title="Xoá" type="button" onClick={() => removeAt(idx)} className="h-7 w-7 rounded-full bg-white/90 text-red-600">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
