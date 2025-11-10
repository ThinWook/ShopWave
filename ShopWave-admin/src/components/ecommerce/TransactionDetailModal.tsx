import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Modal } from "../ui/modal";
import { formatCurrencyVi, formatDateVi } from "../../utils/format";
import { getTransactionDetail } from "../../services/transactionService";
import type { Transaction, TransactionStatus } from "../../types/transaction";

// Status badge configuration
const statusConfig: Record<TransactionStatus, { label: string; className: string }> = {
  SUCCESS: { label: "THÀNH CÔNG", className: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400" },
  FAILED: { label: "THẤT BẠI", className: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400" },
  PENDING: { label: "ĐANG CHỜ", className: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400" },
};

type TransactionDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
};

export default function TransactionDetailModal({ isOpen, onClose, transactionId }: TransactionDetailModalProps) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !transactionId) return;
    
    let ignore = false;
    async function loadDetail() {
      setLoading(true);
      setError(null);
      try {
        const detail = await getTransactionDetail(transactionId);
        if (!ignore) setTransaction(detail);
      } catch (e) {
        if (!ignore) setError((e as Error).message || 'Lỗi tải chi tiết giao dịch');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadDetail();
    return () => { ignore = true; };
  }, [isOpen, transactionId]);

  const formatGatewayResponse = (response: string | null | undefined): string => {
    if (!response) return 'N/A';
    try {
      // Try to parse and prettify JSON
      const parsed = JSON.parse(response);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Return as-is if not valid JSON
      return response;
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const cfg = statusConfig[status];
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${cfg.className}`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="space-y-6">
        {/* 1. Header with Title and Status */}
        <div className="flex items-start justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Chi tiết Giao dịch</h2>
          </div>
          {transaction && (
            <div className="ml-4">
              {getStatusBadge(transaction.status)}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-lg bg-red-50 p-4 dark:bg-red-500/10">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Content */}
        {transaction && !loading && !error && (
          <div className="space-y-6">
            {/* 2. Summary Information */}
            <div className="rounded-lg bg-gray-50 p-5 dark:bg-gray-800/50">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">📋 Thông tin Tóm tắt</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Mã Đơn hàng</dt>
                  <dd className="text-base font-semibold text-blue-600 hover:underline dark:text-blue-400">
                    <Link to={`/orders/${encodeURIComponent(transaction.orderId)}`}>
                      {transaction.orderNumber}
                    </Link>
                  </dd>
                </div>

                <div>
                  <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Số tiền</dt>
                  <dd className="text-base font-semibold text-gray-900 dark:text-white">
                    {formatCurrencyVi(transaction.amount, 'VND')}
                  </dd>
                </div>

                <div>
                  <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Cổng Thanh toán</dt>
                  <dd className="text-base font-semibold text-gray-900 dark:text-white">
                    {transaction.gateway}
                  </dd>
                </div>

                <div>
                  <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Ngày tạo</dt>
                  <dd className="text-base font-semibold text-gray-900 dark:text-white">
                    {formatDateVi(transaction.createdAt)}
                  </dd>
                </div>

                <div>
                  <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Mã GD Cổng TT</dt>
                  <dd className="text-base font-mono text-gray-900 dark:text-white">
                    {transaction.gatewayTransactionId || 'N/A'}
                  </dd>
                </div>

                <div>
                  <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Địa chỉ IP</dt>
                  <dd className="text-base font-mono text-gray-900 dark:text-white">
                    {transaction.ipAddress || 'N/A'}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">User Agent</dt>
                  <dd className="text-sm font-mono text-gray-700 dark:text-gray-300">
                    {transaction.userAgent || 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* 3. Debug Information */}
            <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-5 dark:border-orange-800 dark:bg-orange-500/10">
              <h3 className="mb-4 text-lg font-semibold text-orange-900 dark:text-orange-300">🐞 Thông tin Gỡ lỗi (Debug)</h3>
              
              {/* Error Message */}
              <div className="mb-4">
                <dt className="mb-2 text-sm font-medium text-orange-800 dark:text-orange-400">
                  Thông báo Lỗi (từ hệ thống):
                </dt>
                <dd className="rounded-md bg-white p-3 text-sm text-gray-900 dark:bg-gray-900 dark:text-white">
                  {transaction.errorMessage || 'Không có lỗi'}
                </dd>
              </div>

              {/* Gateway Response */}
              <div>
                <dt className="mb-2 text-sm font-medium text-orange-800 dark:text-orange-400">
                  Phản hồi Gốc từ Cổng thanh toán (Gateway Response):
                </dt>
                <dd>
                  <pre className="max-h-96 overflow-auto rounded-md bg-gray-900 p-4 text-xs text-green-400 dark:bg-black">
                    <code>{formatGatewayResponse(transaction.gatewayResponse)}</code>
                  </pre>
                </dd>
              </div>
            </div>
          </div>
        )}

        {/* 4. Footer with Close Button */}
        <div className="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-800">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
