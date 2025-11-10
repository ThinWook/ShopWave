import { useState } from "react";
import type { OrderTransaction } from "../../types/order";

type Props = {
  transactions: OrderTransaction[];
};

export default function TransactionsTable({ transactions }: Props) {
  const [selectedTransaction, setSelectedTransaction] = useState<OrderTransaction | null>(null);

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(amount) + " ₫";
  }

  function getStatusBadge(status: OrderTransaction["status"]) {
    const styles = {
      SUCCESS: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };

    const labels = {
      SUCCESS: "Thành công",
      FAILED: "Thất bại",
      PENDING: "Đang xử lý",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  }

  function handleViewDetails(transaction: OrderTransaction) {
    setSelectedTransaction(transaction);
  }

  function closeModal() {
    setSelectedTransaction(null);
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Cổng TT
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Mã GD (Gateway)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Số tiền
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Chi tiết
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  Chưa có giao dịch nào
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {tx.gateway}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {tx.gatewayTransactionId ? (
                      <span className="font-mono text-xs">
                        {tx.gatewayTransactionId.length > 20
                          ? `${tx.gatewayTransactionId.slice(0, 8)}...${tx.gatewayTransactionId.slice(-8)}`
                          : tx.gatewayTransactionId}
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm">{getStatusBadge(tx.status)}</td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {new Date(tx.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-4 text-sm text-center">
                    <button
                      onClick={() => handleViewDetails(tx)}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Xem
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Nút xuất (tùy chọn) */}
        {transactions.length > 0 && (
          <div className="p-4 border-t dark:border-gray-700">
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Xuất sang Trang tính
            </button>
          </div>
        )}
      </div>

      {/* Modal hiển thị chi tiết giao dịch */}
      {selectedTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Chi tiết Giao dịch</h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {/* Thông tin cơ bản */}
              <div className="space-y-3 mb-4">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Cổng thanh toán: </span>
                  <span className="text-gray-900 dark:text-white">{selectedTransaction.gateway}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Mã giao dịch: </span>
                  <span className="text-gray-900 dark:text-white font-mono text-sm">
                    {selectedTransaction.gatewayTransactionId || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Trạng thái: </span>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Số tiền: </span>
                  <span className="text-gray-900 dark:text-white">
                    {formatCurrency(selectedTransaction.amount)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Ngày tạo: </span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(selectedTransaction.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>

              {/* Gateway Response */}
              {selectedTransaction.gatewayResponse && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gateway Response:
                  </h4>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedTransaction.gatewayResponse), null, 2)}
                  </pre>
                </div>
              )}

              {/* Error Message */}
              {selectedTransaction.errorMessage && (
                <div>
                  <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
                    Thông báo lỗi:
                  </h4>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-sm text-red-700 dark:text-red-300">
                    {selectedTransaction.errorMessage}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t dark:border-gray-700 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
