import { useState } from "react";

type Props = {
	value: string[];
	onChange: (tags: string[]) => void;
	placeholder?: string;
};

export default function TagInput({ value, onChange, placeholder = "Nhập tag và nhấn Enter" }: Props) {
	const [input, setInput] = useState("");

	const addTag = (tag: string) => {
		const t = tag.trim();
		if (!t) return;
		if (value.includes(t)) return;
		onChange([...value, t]);
		setInput("");
	};

	const removeTag = (t: string) => onChange(value.filter(v => v !== t));

	return (
		<div className="rounded-lg border px-2 py-1">
			<div className="flex flex-wrap items-center gap-2">
				{value.map(t => (
					<span key={t} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs">
						{t}
						<button type="button" onClick={() => removeTag(t)} className="text-gray-500 hover:text-red-600">×</button>
					</span>
				))}
				<input
					value={input}
					onChange={e => setInput(e.target.value)}
					onKeyDown={e => {
						if (e.key === "Enter" || e.key === ",") {
							e.preventDefault();
							addTag(input);
						} else if (e.key === "Backspace" && !input && value.length) {
							removeTag(value[value.length - 1]);
						}
					}}
					className="min-w-[160px] flex-1 py-1 outline-none text-sm"
					placeholder={placeholder}
				/>
			</div>
		</div>
	);
}

