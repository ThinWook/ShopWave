import { useEffect, useState } from "react";
import KpiCard from "../components/common/KpiCard";
import SalesChart from "../components/dashboard/SalesChart";
import ProcessingOrdersList from "../components/dashboard/ProcessingOrdersList";
import FailedTransactionsList from "../components/dashboard/FailedTransactionsList";
import { getOrders } from "../services/orderService";
import { getTransactions } from "../services/transactionService";

export default function AdminDashboardPage() {
	const [ordersStats, setOrdersStats] = useState<any>(null);
	const [txStats, setTxStats] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		setLoading(true);
		Promise.all([getOrders({ pageSize: 5 }), getTransactions({ pageSize: 5 })]).then(([ordersRes, txRes]) => {
			if (!mounted) return;
			setOrdersStats(ordersRes.stats ?? {});
			setTxStats(txRes.stats ?? {});
			setLoading(false);
		}).catch((err) => {
			console.error("dashboard stats load", err);
			if (!mounted) return;
			setOrdersStats({});
			setTxStats({});
			setLoading(false);
		});
		return () => { mounted = false; };
	}, []);

	function formatMoney(v: number | undefined | null) {
		if (v == null) return "—";
		return v.toLocaleString("vi-VN") + " ₫";
	}

	return (
		<div className="p-4 space-y-4">
			{/* Row 1: KPI cards (4 x col-span-3) */}
			<div className="grid grid-cols-12 gap-4">
				<div className="col-span-12 sm:col-span-6 md:col-span-3">
					<KpiCard title="Doanh thu hôm nay" value={loading ? '…' : formatMoney(ordersStats?.todaysRevenue ?? txStats?.todaysRevenue ?? 0)} subtitle={loading ? 'Đang tải…' : 'So với hôm qua: +5%'} />
				</div>

				<div className="col-span-12 sm:col-span-6 md:col-span-3">
					<KpiCard title="Đơn hàng chờ xử lý" value={loading ? '…' : (ordersStats?.readyToShipCount ?? ordersStats?.newOrdersCount ?? 0)} subtitle={"(Tổng các đơn PROCESSING)"} trend={loading ? undefined : undefined} />
				</div>

				<div className="col-span-12 sm:col-span-6 md:col-span-3">
					<KpiCard title="Khách hàng mới (tháng này)" value={"—"} subtitle={"(Tổng Users mới)"} />
				</div>

				<div className="col-span-12 sm:col-span-6 md:col-span-3">
					<KpiCard title="Giao dịch lỗi (hôm nay)" value={loading ? '…' : (txStats?.failedTodayCount ?? 0)} subtitle={"(Tổng Transactions FAILED)"} />
				</div>
			</div>

			{/* Row 2 + 3: Chart + Activity lists */}
			<div className="grid grid-cols-12 gap-4">
				<div className="col-span-12 lg:col-span-8">
					<SalesChart />
				</div>

				<div className="col-span-12 lg:col-span-4 space-y-4">
					<ProcessingOrdersList />
					<FailedTransactionsList />
				</div>
			</div>
		</div>
	);
}
