import { useEffect, useState } from "react";
import { api } from "../../utils/apiClient";

type Point = { date: string; revenue: number };

function formatCurrency(v: number) {
  return v.toLocaleString("vi-VN") + " ₫";
}

export default function SalesChart() {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get<any>(`/api/admin/stats/sales-chart?range=30d`).then((payload) => {
      if (!mounted) return;
      // Expect payload: { points: [{date, revenue}], ... } or array
      const points = Array.isArray(payload) ? payload : payload?.points ?? payload?.data ?? [];
      const mapped: Point[] = (points || []).map((p: any) => ({ date: String(p.date), revenue: Number(p.revenue ?? p.value ?? 0) }));
      setData(mapped);
      setLoading(false);
    }).catch((err) => {
      if (!mounted) return;
      console.error("SalesChart error", err);
      setError(String(err?.message ?? err));
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="rounded-lg p-4 bg-white dark:bg-slate-800">Loading chart…</div>;
  if (error) return <div className="rounded-lg p-4 bg-white dark:bg-slate-800 text-red-600">{error}</div>;

  // Simple SVG line chart implementation
  const width = 720;
  const height = 220;
  const padding = 28;

  const values = data.map((d) => d.revenue);
  const max = Math.max(1, ...values);

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2);
    const y = padding + (1 - d.revenue / max) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  const latest = data.length ? data[data.length - 1] : null;

  return (
    <div className="rounded-lg bg-white dark:bg-slate-800 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm text-slate-500">Doanh thu (30 ngày qua)</div>
          <div className="text-lg font-semibold text-slate-900 dark:text-white">{latest ? formatCurrency(latest.revenue) : "—"}</div>
        </div>
        <div className="text-xs text-slate-400">Đơn vị: VNĐ</div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={padding} x2={width - padding} y1={padding + t * (height - padding * 2)} y2={padding + t * (height - padding * 2)} stroke="#e6e9ef" strokeWidth={1} />
        ))}

        {/* area (slightly transparent) */}
        <polyline points={points} fill="none" stroke="#60a5fa" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* points */}
        {data.map((d, i) => {
          const x = padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2);
          const y = padding + (1 - d.revenue / max) * (height - padding * 2);
          return <circle key={d.date} cx={x} cy={y} r={2.5} fill="#2563eb" />;
        })}
      </svg>

      <div className="mt-3 text-xs text-slate-400">Dữ liệu cập nhật theo API</div>
    </div>
  );
}
