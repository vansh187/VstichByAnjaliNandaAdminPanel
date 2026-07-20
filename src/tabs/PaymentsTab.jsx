import { useEffect, useState } from 'react';
import { StatCard } from '../components/StatCard.jsx';
import { adminApi } from '../api/index.js';
import { REVENUE_COUNTING_STATUSES, COD_PENDING_STATUSES } from '../data/seed.js';

function paymentStatusFor(order) {
  if (order.payment_method === "cod") {
    return order.order_status === "delivered" ? "COD — Collected" : "COD — Pending collection";
  }
  if (order.order_status === "payment_pending") return "Pending";
  if (order.order_status === "payment_failed") return "Failed";
  if (order.order_status === "cancelled") return "Refund initiated";
  return "Captured";
}

export function PaymentsTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.getOrders().then(setOrders).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const todaysOrders = orders.filter((o) => new Date(o.created_date).toDateString() === today.toDateString());
  const capturedToday = todaysOrders.filter((o) => REVENUE_COUNTING_STATUSES.has(o.order_status)).reduce((s, o) => s + o.total_amount, 0);
  const capturedTotal = orders.filter((o) => o.payment_method === "razorpay" && REVENUE_COUNTING_STATUSES.has(o.order_status)).reduce((s, o) => s + o.total_amount, 0);
  const refunds = orders.filter((o) => o.order_status === "cancelled" && o.payment_method === "razorpay").reduce((s, o) => s + o.total_amount, 0);
  const codPending = orders.filter((o) => o.payment_method === "cod" && COD_PENDING_STATUSES.has(o.order_status)).reduce((s, o) => s + o.total_amount, 0);

  return (
    <div className="p-8">
      {error && <div className="mb-4 px-4 py-3 rounded-md bg-[#3A1F1F] border border-[#5E2A2A] text-[#E0716A] text-sm">{error}</div>}
      <div className="flex gap-4 mb-6">
        <StatCard label="Today's Revenue" value={loading ? "…" : `₹${capturedToday.toLocaleString("en-IN")}`} accent="text-[#6FCF7A]" />
        <StatCard label="Captured (Razorpay)" value={loading ? "…" : `₹${capturedTotal.toLocaleString("en-IN")}`} />
        <StatCard label="Refunds Initiated" value={loading ? "…" : `₹${refunds.toLocaleString("en-IN")}`} accent="text-[#E0716A]" />
        <StatCard label="COD Pending" value={loading ? "…" : `₹${codPending.toLocaleString("en-IN")}`} accent="text-[#D9A441]" />
      </div>
      <div className="bg-[#1C1914] border border-[#2A2620] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A2620] text-left text-[11px] uppercase tracking-[0.1em] text-[#8A8375]">
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Gateway</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-5 py-8 text-center text-[#8A8375]">Loading payments…</td></tr>}
            {!loading && orders.map((o, i) => (
              <tr key={o.vstitch_order_id} className={i !== orders.length - 1 ? "border-b border-[#221E17]" : ""}>
                <td className="px-5 py-4 text-[#E8C88A]">VS-{o.vstitch_order_id}</td>
                <td className="px-5 py-4 text-[#EDE7DD]">{o.customer_name}</td>
                <td className="px-5 py-4 text-[#EDE7DD] capitalize">{o.payment_method}</td>
                <td className="px-5 py-4 text-[#EDE7DD]">₹{o.total_amount.toLocaleString("en-IN")}</td>
                <td className="px-5 py-4 text-[#B8B2A3]">{paymentStatusFor(o)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
