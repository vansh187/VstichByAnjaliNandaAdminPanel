import { useEffect, useState } from 'react';
import { StatCard } from '../components/StatCard.jsx';
import { adminApi } from '../api/index.js';

export function DashboardTab() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.getRevenueSummary().then(setSummary).catch((err) => setError(err.message));
  }, []);

  return (
    <div className="p-8">
      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-[#3A1F1F] border border-[#5E2A2A] text-[#E0716A] text-sm">{error}</div>
      )}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Today's Orders" value={summary ? summary.today_orders_count : "…"} />
        <StatCard
          label="Today's Revenue"
          value={summary ? `₹${summary.today_revenue.toLocaleString("en-IN")}` : "…"}
          accent="text-[#6FCF7A]"
        />
        <StatCard label="Low Stock Items" value={summary ? summary.low_stock_count : "…"} accent="text-[#D9A441]" />
        <StatCard label="Pending Shipments" value={summary ? summary.pending_shipments_count : "…"} accent="text-[#E0716A]" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1C1914] border border-[#2A2620] rounded-lg p-5">
          <div className="text-[11px] uppercase tracking-[0.15em] text-[#8A8375] mb-3">Revenue Overview</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#EDE7DD]">Total Revenue (all-time)</span><span className="text-[#6FCF7A]">{summary ? `₹${summary.total_revenue.toLocaleString("en-IN")}` : "…"}</span></div>
            <div className="flex justify-between"><span className="text-[#EDE7DD]">Total Orders</span><span className="text-[#B8B2A3]">{summary ? summary.total_orders_count : "…"}</span></div>
            <div className="flex justify-between"><span className="text-[#EDE7DD]">Orders Awaiting Action</span><span className="text-[#D9A441]">{summary ? summary.pending_orders_count : "…"}</span></div>
          </div>
        </div>
        <div className="bg-[#1C1914] border border-[#2A2620] rounded-lg p-5">
          <div className="text-[11px] uppercase tracking-[0.15em] text-[#8A8375] mb-3">Top Products This Week</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#EDE7DD]">Chikankari Lehenga - Ivory</span><span className="text-[#B8B2A3]">14 orders</span></div>
            <div className="flex justify-between"><span className="text-[#EDE7DD]">Banarasi Silk Saree - Maroon</span><span className="text-[#B8B2A3]">11 orders</span></div>
            <div className="flex justify-between"><span className="text-[#EDE7DD]">Anarkali Kurti Set - Teal</span><span className="text-[#B8B2A3]">9 orders</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
