import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { getTransactions, getTransactionDetail } from "../../services/transactionService";
import type { Transaction } from "../../types/transaction";

function shortOrderNumber(orderNumber: string) {
  if (!orderNumber) return "—";
  if (orderNumber.length <= 8) return orderNumber;
  return `${orderNumber.slice(0, 3)}...${orderNumber.slice(-4)}`;
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 max-w-lg w-full bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg">
        <div className="mb-2 flex justify-end"><button className="text-sm text-slate-500" onClick={onClose}>Đóng</button></div>
        {children}
      </div>
    </div>
  );
}

export default function FailedTransactionsList() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getTransactions({ status: "FAILED", pageSize: 5 }).then((res) => {
      if (!mounted) return;
      setTxs(res.transactions ?? []);
      setLoading(false);
    }).catch((err) => {
      console.error("load failed txs", err);
      if (!mounted) return;
      setTxs([]);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  async function openDetail(id: string) {
    try {
      const d = await getTransactionDetail(id);
      setSelected(d as Transaction);
      setDetailOpen(true);
    } catch (err) {
      console.error("failed to load tx detail", err);
      alert("Không thể tải chi tiết giao dịch");
    }
  }

  return (
    <div className="rounded-lg bg-white dark:bg-slate-800 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-600">Giao dịch thất bại</div>
        <div className="text-xs text-slate-400">Mới nhất</div>
      </div>

      <div className="mt-3">
        {loading ? <div className="text-sm text-slate-400">Đang tải…</div> : (
          txs.length === 0 ? <div className="text-sm text-slate-400">Không có giao dịch thất bại.</div> : (
            <ul className="divide-y divide-slate-100">
              {txs.map((t) => (
                <li key={t.id} className="py-2">
                  <button onClick={() => openDetail(t.id)} className="w-full text-left flex items-center justify-between hover:bg-slate-50 rounded p-1">
                    <div className="text-sm text-slate-800">{shortOrderNumber(t.orderNumber)} <span className="text-slate-500">({t.gateway})</span></div>
                    <div className="text-sm text-slate-600">{t.amount.toLocaleString('vi-VN')} ₫</div>
                    <div className="text-xs text-slate-400 ml-3">{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</div>
                  </button>
                </li>
              ))}
            </ul>
          )
        )}
      </div>

      <Modal open={detailOpen} onClose={() => { setDetailOpen(false); setSelected(null); }}>
        {selected ? (
          <div>
            <h3 className="text-lg font-semibold mb-2">Giao dịch {selected.id}</h3>
            <div className="text-sm">Mã đơn: {selected.orderNumber}</div>
            <div className="text-sm">Cổng: {selected.gateway}</div>
            <div className="text-sm">Số tiền: {selected.amount.toLocaleString('vi-VN')} ₫</div>
            <div className="text-sm mt-2">Lỗi: {selected.errorMessage ?? 'Không có thông tin lỗi'}</div>
            <pre className="mt-2 text-xs bg-slate-100 p-2 rounded text-slate-700">{selected.gatewayResponse ?? '—'}</pre>
          </div>
        ) : (
          <div className="text-sm">Đang tải…</div>
        )}
      </Modal>
    </div>
  );
}
