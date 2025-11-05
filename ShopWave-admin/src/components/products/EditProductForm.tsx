import { useEffect, useMemo, useState } from "react";
import { getProductDetail, type ProductDto, type ProductOptionDto, type VariantDto, updateProduct } from "../../services/productService";
import { getCategories, type CategoryDto } from "../../services/categoryService";
import ProductGeneralCard from "./ProductGeneralCard";
import ProductImagesCard from "./ProductImagesCard";
import ProductOptionsVariantsCard from "./ProductOptionsVariantsCard";
import ProductOrganizationCard from "./ProductOrganizationCard";
import type { VariantForm } from "./VariantTable";

interface EditProductFormProps {
	productId: string;
	onSuccess?: (updated?: ProductDto) => void;
}

type Status = "Đang bán" | "Nháp" | "Ngừng bán";

export default function EditProductForm({ productId, onSuccess }: EditProductFormProps) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	// General
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [descriptionHtml, setDescriptionHtml] = useState("");

	// Media
	const [mediaIds, setMediaIds] = useState<number[]>([]);
	const [mediaPreviews, setMediaPreviews] = useState<Record<number, string>>({});
	const [mainImageId, setMainImageId] = useState<number | null>(null);

	// Options & variants
	const [options, setOptions] = useState<ProductOptionDto[]>([]);
	const [variants, setVariants] = useState<VariantForm[]>([]);

	// Organization
	const [categories, setCategories] = useState<CategoryDto[]>([]);
	const [categoryId, setCategoryId] = useState<string>("");
	const [status, setStatus] = useState<Status>("Đang bán");
	const [tags, setTags] = useState<string[]>([]);

	const [fieldErrors, setFieldErrors] = useState<Partial<Record<"name" | "slug" | "categoryId", string>>>({});

	useEffect(() => {
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const [prod, cats] = await Promise.all([getProductDetail(productId), getCategories()]);
				setCategories(cats);
				hydrateFromProduct(prod, cats);
			} catch (e: any) {
				setError(e?.message || "Không thể tải thông tin sản phẩm");
			} finally {
				setLoading(false);
			}
		})();
	}, [productId]);

	const hydrateFromProduct = (prod: ProductDto, cats: CategoryDto[]) => {
		setName(prod.name || "");
		setSlug((prod.slug as string) || slugify(prod.name || ""));
		setDescriptionHtml(prod.description || "");
		// category match by name (backend returns name only)
		const foundCat = cats.find(c => c.name === prod.categoryName);
		setCategoryId(foundCat?.id || "");
		setStatus(prod.isActive === false ? "Ngừng bán" : "Đang bán");
		// media
		const ids: number[] = Array.isArray(prod.galleryImages) ? prod.galleryImages.map(g => g.id).filter(Boolean) as number[] : [];
		const preview: Record<number, string> = {};
		(prod.galleryImages || []).forEach(g => { if (g.id && g.url) preview[g.id] = g.url!; });
		setMediaIds(ids);
		setMediaPreviews(preview);
		setMainImageId((prod.mainImage && prod.mainImage.id) ? Number(prod.mainImage.id) : (ids[0] ?? null));
		// options & variants
		if (Array.isArray(prod.options)) setOptions(prod.options);
		if (Array.isArray(prod.variants)) {
			const mapped: VariantForm[] = prod.variants.map(v => ({
				id: v.id || undefined,
				sku: v.sku || undefined,
				price: v.price != null ? String(v.price) : "",
				stock: v.stock != null ? String(v.stock) : "",
				imageId: v.imageId ?? undefined,
				selected_options: (v.selected_options && Array.isArray(v.selected_options))
					? v.selected_options
					: [
							v.size ? { option_name: 'Size', value: v.size } : null,
							v.color ? { option_name: 'Color', value: v.color } : null,
						].filter(Boolean) as any,
			}));
			setVariants(mapped);
		} else {
			setVariants([]);
		}
	};

	const totalStock = useMemo(() => variants.reduce((s, v) => s + (Number(v.stock) || 0), 0), [variants]);

	function validate() {
		const errs: typeof fieldErrors = {};
		if (!name.trim()) errs.name = "Tên sản phẩm là bắt buộc";
		if (!categoryId) errs.categoryId = "Vui lòng chọn danh mục";
		if (!slug.trim()) errs.slug = "Slug không được trống";
		return errs;
	}

	const onImagesChange = (ids: number[], previews: Record<number, string>, mainId: number | null) => {
		setMediaIds(ids);
		setMediaPreviews(previews);
		setMainImageId(mainId);
	};

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setFieldErrors({});
		const errs = validate();
		if (Object.keys(errs).length) { setFieldErrors(errs); return; }
		setSaving(true);
		try {
			const payload = {
				name: name.trim(),
				slug: slug.trim(),
				description: descriptionHtml,
				categoryId,
				// If variants exist, base price can be 0; server may compute from variants
				price: variants.length ? 0 : undefined,
				stockQuantity: totalStock,
				options: options.length ? options : undefined,
				variants: variants.map(v => ({
					id: v.id,
					sku: v.sku || undefined,
					price: Number(v.price) || 0,
					stock: Number(v.stock) || 0,
					imageId: v.imageId ?? undefined,
					selected_options: (v.selected_options || []).filter(so => so && so.option_name && so.value),
				})) as VariantDto[],
				mainImageId: mainImageId ?? undefined,
				galleryMedia: mediaIds.map((mid, idx) => ({ mediaId: mid, sortOrder: idx })),
				isActive: status === 'Đang bán',
			} as const;
			const updated = await updateProduct(productId, payload as any);
			onSuccess?.(updated);
		} catch (e: any) {
			setError(e?.message || "Cập nhật sản phẩm thất bại");
		} finally {
			setSaving(false);
		}
	}

	if (loading) return <div>Đang tải thông tin sản phẩm...</div>;
	if (error) return <div className="text-red-600">{error}</div>;

	return (
		<form onSubmit={handleSubmit} className="space-y-5">
			<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
				<div className="xl:col-span-2 space-y-6">
					<ProductGeneralCard
						name={name}
						onNameChange={(v) => { setName(v); if (!slug || slugify(name) === slug) setSlug(slugify(v)); }}
						slug={slug}
						onSlugChange={setSlug}
						descriptionHtml={descriptionHtml}
						onDescriptionChange={setDescriptionHtml}
						errors={fieldErrors}
					/>

					<div className="rounded-lg border p-4">
						<ProductImagesCard mediaIds={mediaIds} mediaPreviews={mediaPreviews} mainImageId={mainImageId} onChange={onImagesChange} />
					</div>

					<ProductOptionsVariantsCard options={options} setOptions={setOptions} variants={variants} setVariants={setVariants} mediaPreviews={mediaPreviews} mediaIds={mediaIds} />
				</div>

				<div className="xl:col-span-1">
					<ProductOrganizationCard
						status={status}
						onStatusChange={setStatus}
						categories={categories.filter(c => c.parentId != null).map(c => ({ id: c.id, name: c.name }))}
						categoryId={categoryId}
						onCategoryChange={setCategoryId}
						tags={tags}
						onTagsChange={setTags}
					/>
				</div>
			</div>

			<div className="flex items-center justify-end gap-2 pt-1">
				<button type="submit" disabled={saving} className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white">{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
			</div>
		</form>
	);
}

function slugify(str: string) {
	return (str || "")
		.toLowerCase()
		.normalize('NFD').replace(/\p{Diacritic}/gu, '')
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');
}
