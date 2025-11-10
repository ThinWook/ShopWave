import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import AddProductForm from "../components/products/AddProductForm";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router";

export default function AddProduct() {
  const { show } = useToast();
  const navigate = useNavigate();

  return (
    <div>
      <PageMeta title={`Thêm sản phẩm | Admin`} description="Tạo sản phẩm mới" />
      <div className="p-4 mx-auto max-w-[--breakpoint-2xl] md:p-6">
        <PageBreadcrumb pageTitle="Thêm sản phẩm" />
  <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.03] dark:bg-gray-900">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <h2 className="text-lg font-medium text-gray-800 dark:text-white">Thông tin chính</h2>
          </div>
          <div className="p-4 sm:p-6">
            <AddProductForm
              onSuccess={(p) => {
                show({ type: 'success', message: `Đã tạo sản phẩm: ${p.name}` });
                navigate('/products');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}