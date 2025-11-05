import OptionsEditor from "./OptionsEditor";
import VariantTable, { type VariantForm } from "./VariantTable";
import type { ProductOptionDto } from "../../services/productService";

type Props = {
  options: ProductOptionDto[];
  setOptions: (opts: ProductOptionDto[]) => void;
  variants: VariantForm[];
  setVariants: (v: VariantForm[]) => void;
  mediaPreviews: Record<number, string>;
  mediaIds: number[];
};

export default function ProductOptionsVariantsCard({ options, setOptions, variants, setVariants, mediaPreviews, mediaIds }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Phân loại</h3>
      <div className="space-y-4 rounded-lg border p-4">
        <OptionsEditor options={options} setOptions={setOptions} mediaIds={mediaIds} mediaPreviews={mediaPreviews} />
        <VariantTable variants={variants} setVariants={setVariants} mediaPreviews={mediaPreviews} mediaIds={mediaIds} options={options} hasVariants />
      </div>
    </div>
  );
}
