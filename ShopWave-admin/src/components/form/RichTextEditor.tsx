import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
};

// Lightweight contenteditable rich text editor (bold/italic/underline, lists)
// Avoids heavy external deps. Stores HTML string in `value`.
export default function RichTextEditor({ value, onChange, placeholder, className, minHeight = 160 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Only update DOM if external value changed (avoid caret jumps)
    if (ref.current.innerHTML !== (value || "")) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const onInput = () => {
    if (!ref.current) return;
    onChange(ref.current.innerHTML);
  };

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => exec("bold")}>B</button>
        <button type="button" className="rounded border px-2 py-1 text-xs italic" onClick={() => exec("italic")}>I</button>
        <button type="button" className="rounded border px-2 py-1 text-xs underline" onClick={() => exec("underline")}>U</button>
        <span className="mx-1 text-gray-400">|</span>
        <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => exec("insertUnorderedList")}>• Danh sách</button>
        <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => exec("insertOrderedList")}>1. Danh sách</button>
        <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => exec("removeFormat")}>Xoá định dạng</button>
      </div>
      <div
        ref={ref}
        className="w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        style={{ minHeight }}
        contentEditable
        onInput={onInput}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
      {!value && (
        <div className="pointer-events-none -mt-[min(140px,50%)] px-5 text-sm text-gray-400 select-none">{placeholder}</div>
      )}
    </div>
  );
}
