
import { useEffect, useState } from "react";
import { getProductDetail } from "../../services/productService";
import { getCategories } from "../../services/categoryService";
import InputField from "../form/input/InputField";
import Label from "../form/Label";
import Checkbox from "../form/input/Checkbox";
// import type { ProductDto } from "../../services/productService";

interface EditProductFormProps {
	productId: string;
	onSuccess?: () => void;
}

export default function EditProductForm({ productId, onSuccess }: EditProductFormProps) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
		// Removed unused product state
	const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
	const [form, setForm] = useState<any>({});
	const [saving, setSaving] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		async function fetchData() {
			setLoading(true);
			setError(null);
			try {
				const prod = await getProductDetail(productId);
						// Find categoryId by matching categoryName
						let catId = "";
					const fetchedCats = await getCategories();
					setCategories(fetchedCats.map(c => ({ id: c.id, name: c.name })));
					const foundCat = fetchedCats.find(c => c.name === prod.categoryName);
					if (foundCat) catId = foundCat.id;
						setForm({
							name: prod.name || "",
							description: prod.description || "",
							price: prod.price || 0,
							categoryId: catId,
							imageUrl: prod.imageUrl || "",
							size: prod.size || "",
							stockQuantity: prod.stockQuantity || 0,
							isActive: prod.isActive ?? true,
						});
				const cats = await getCategories();
				setCategories(cats.map(c => ({ id: c.id, name: c.name })));
			} catch (e: any) {
				setError(e?.message || "Không thể tải thông tin sản phẩm");
			} finally {
				setLoading(false);
			}
		}
		fetchData();
	}, [productId]);

		function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
			const { name, value, type } = e.target;
			if (type === "checkbox") {
				setForm((f: any) => ({ ...f, [name]: (e.target as HTMLInputElement).checked }));
			} else {
				setForm((f: any) => ({ ...f, [name]: value }));
			}
		}

		function handleCheckboxChange(checked: boolean) {
			setForm((f: any) => ({ ...f, isActive: checked }));
		}

	function validate() {
		const errors: Record<string, string> = {};
		if (!form.name?.trim()) errors.name = "Tên sản phẩm không được để trống";
		if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) errors.price = "Giá phải là số lớn hơn 0";
		if (!form.categoryId) errors.categoryId = "Vui lòng chọn danh mục";
		if (!form.size) errors.size = "Vui lòng chọn size";
		if (form.stockQuantity == null || isNaN(Number(form.stockQuantity))) errors.stockQuantity = "Số lượng kho phải là số";
		return errors;
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setFieldErrors({});
		const errors = validate();
		if (Object.keys(errors).length) {
			setFieldErrors(errors);
			return;
		}
		setSaving(true);
		try {
			// TODO: Call updateProduct API here
			// await updateProduct(productId, { ...form });
			if (onSuccess) onSuccess();
		} catch (e: any) {
			setError(e?.message || "Cập nhật sản phẩm thất bại");
		} finally {
			setSaving(false);
		}
	}

	if (loading) return <div>Đang tải thông tin sản phẩm...</div>;
	if (error) return <div className="text-red-600">{error}</div>;

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div>
				<Label htmlFor="name">Tên sản phẩm</Label>
		<InputField name="name" value={form.name} onChange={handleChange} error={!!fieldErrors.name} />
			</div>
			<div>
				<Label htmlFor="description">Mô tả</Label>
				<textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded p-2" rows={3} />
			</div>
			<div>
				<Label htmlFor="price">Giá</Label>
		<InputField name="price" type="number" value={String(form.price)} onChange={handleChange} error={!!fieldErrors.price} min="0" />
			</div>
			<div>
				<Label htmlFor="categoryId">Danh mục</Label>
				<select name="categoryId" value={form.categoryId} onChange={handleChange} className="w-full border rounded p-2">
					<option value="">-- Chọn danh mục --</option>
					{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
				</select>
				{fieldErrors.categoryId && <div className="text-red-600 text-sm">{fieldErrors.categoryId}</div>}
			</div>
					<div>
						<Label htmlFor="imageUrl">Ảnh sản phẩm</Label>
						<div className="flex items-center gap-4">
							{form.imageUrl ? (
								<img src={form.imageUrl} alt="Ảnh sản phẩm" className="w-24 h-24 object-cover rounded border" />
							) : (
								<div className="w-24 h-24 flex items-center justify-center bg-gray-100 text-gray-400 rounded border">Không có ảnh</div>
							)}
							<div>
								<input
									type="file"
									accept="image/*"
									id="upload-image"
									style={{ display: "none" }}
									onChange={e => {
										const file = e.target.files?.[0];
										if (file) {
											const reader = new FileReader();
											reader.onload = ev => {
												setForm((f: any) => ({ ...f, imageUrl: ev.target?.result as string }));
											};
											reader.readAsDataURL(file);
										}
									}}
								/>
								<label htmlFor="upload-image" className="inline-block bg-brand-500 text-white px-3 py-2 rounded cursor-pointer hover:bg-brand-600">
									Tải ảnh lên
								</label>
							</div>
						</div>
					</div>
			<div>
				<Label htmlFor="size">Size</Label>
				<select name="size" value={form.size} onChange={handleChange} className="w-full border rounded p-2">
					<option value="">-- Chọn size --</option>
					<option value="XL">XL</option>
					<option value="L">L</option>
					<option value="M">M</option>
				</select>
				{fieldErrors.size && <div className="text-red-600 text-sm">{fieldErrors.size}</div>}
			</div>
			<div>
				<Label htmlFor="stockQuantity">Số lượng kho</Label>
		<InputField name="stockQuantity" type="number" value={String(form.stockQuantity)} onChange={handleChange} error={!!fieldErrors.stockQuantity} min="0" />
			</div>
			<div>
				<Label htmlFor="isActive">Trạng thái hoạt động</Label>
		<Checkbox checked={!!form.isActive} onChange={handleCheckboxChange} label="Đang bán" />
			</div>
			<div>
				<button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded" disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</button>
			</div>
		</form>
	);
}
