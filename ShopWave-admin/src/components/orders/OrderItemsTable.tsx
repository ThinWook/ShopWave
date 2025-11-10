import type { OrderItem } from "../../types/order";

type Props = {
  items: OrderItem[];
};

export default function OrderItemsTable({ items }: Props) {
  function parseSelectedOptions(optionsJson: string): { optionName: string; optionValue: string }[] {
    try {
      const parsed = JSON.parse(optionsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(amount) + " ₫";
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Sản phẩm
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Giá (Snapshot)
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Số lượng
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Tổng cộng
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {items.map((item) => {
            const options = parseSelectedOptions(item.selectedOptions);
            return (
              <tr key={item.id}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {item.variantImageUrl ? (
                      <img
                        src={item.variantImageUrl}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.productName}
                      </div>
                      {options.length > 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {options.map((opt, idx) => (
                            <span key={idx}>
                              {opt.optionName}: {opt.optionValue}
                              {idx < options.length - 1 && ", "}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-right text-gray-900 dark:text-white">
                  {formatCurrency(item.priceAtPurchase)}
                </td>
                <td className="px-4 py-4 text-sm text-right text-gray-900 dark:text-white">
                  {item.quantity}
                </td>
                <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                  {formatCurrency(item.totalPrice)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Nút xuất (tùy chọn) */}
      <div className="p-4 border-t dark:border-gray-700">
        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          Xuất sang Trang tính
        </button>
      </div>
    </div>
  );
}
