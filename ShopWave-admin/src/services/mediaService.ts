import { api } from "../utils/apiClient";

// Upload multiple images, keeping order of provided files
export async function uploadMany(files: File[], category?: string): Promise<number[]> {
	const fd = new FormData();
	files.forEach(f => fd.append("files", f));
	if (category) fd.append("category", category);
	const res = await api.raw("/api/Media/upload-many", { method: "POST", body: fd });
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || "Upload ảnh thất bại");
	}
	const ids = (await res.json()) as unknown;
	if (!Array.isArray(ids) || !ids.every(x => typeof x === "number")) throw new Error("Phản hồi upload không hợp lệ");
	return ids as number[];
}
