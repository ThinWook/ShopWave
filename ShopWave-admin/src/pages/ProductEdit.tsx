import { Link, useParams } from "react-router";
import EditProductForm from "../components/products/EditProductForm";

export default function ProductEdit() {
  const { id } = useParams();
  return (
    <div className="p-4 mx-auto max-w-[--breakpoint-2xl] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <nav>
          <ol className="flex items-center gap-1.5">
            <li>
              <Link className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400" to="/">
                Trang chủ
                <svg className="stroke-current" width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366" stroke="" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </li>
            <li className="text-sm text-gray-800 dark:text-white/90">Chỉnh sửa sản phẩm</li>
          </ol>
        </nav>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        {id ? <EditProductForm productId={id} /> : <p className="text-sm text-gray-600 dark:text-gray-300">Không tìm thấy sản phẩm cần sửa.</p>}
      </div>
    </div>
  );
}