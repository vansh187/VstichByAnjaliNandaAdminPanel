import { useEffect, useState } from 'react';
import { Icon, icons } from '../components/Icon.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { STATUS_FLOW, STATUS_LABELS, STATUS_STYLES, PENDING_ACTION_STATUSES } from '../data/seed.js';
import { adminApi } from '../api/index.js';

export function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingStatus, setPendingStatus] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [log, setLog] = useState([]);

  const loadOrders = () => {
    setLoading(true);
    setError(null);
    adminApi
      .getOrders()
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleDropdownChange = (orderId, value) => {
    setPendingStatus((prev) => ({ ...prev, [orderId]: value }));
  };

  const handleUpdate = async (orderId) => {
    const newStatus = pendingStatus[orderId];
    if (!newStatus) return;
    setUpdatingId(orderId);
    try {
      const updated = await adminApi.updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.vstitch_order_id === orderId ? { ...o, ...updated } : o)));
      const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      setLog((prev) => [{ id: Date.now(), text: `Order ${orderId} updated to ${STATUS_LABELS[newStatus]}`, time }, ...prev].slice(0, 6));
      setPendingStatus((prev) => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRefreshStatus = async (orderId) => {
    setSyncingId(orderId);
    try {
      const updated = await adminApi.syncOrderStatus(orderId);
      setOrders((prev) => prev.map((o) => (o.vstitch_order_id === orderId ? { ...o, ...updated } : o)));
      const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      setLog((prev) => [{ id: Date.now(), text: `Order ${orderId} live status refreshed`, time }, ...prev].slice(0, 6));
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncingId(null);
    }
  };

  const counts = {
    pending: orders.filter((o) => PENDING_ACTION_STATUSES.has(o.order_status)).length,
    shipped: orders.filter((o) => ["shipped", "out_for_delivery"].includes(o.order_status)).length,
    delivered: orders.filter((o) => o.order_status === "delivered").length,
  };

  return (
    <div className="p-8">
      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-[#3A1F1F] border border-[#5E2A2A] text-[#E0716A] text-sm flex items-center justify-between">
          {error}
          <button onClick={loadOrders} className="underline text-xs">Retry</button>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <StatCard label="Total Orders" value={loading ? "…" : orders.length} />
        <StatCard label="Pending" value={loading ? "…" : counts.pending} accent="text-[#D9A441]" />
        <StatCard label="Shipped" value={loading ? "…" : counts.shipped} accent="text-[#4FC3A1]" />
        <StatCard label="Delivered" value={loading ? "…" : counts.delivered} accent="text-[#6FCF7A]" />
      </div>

      <div className="bg-[#1C1914] border border-[#2A2620] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A2620] text-left text-[11px] uppercase tracking-[0.1em] text-[#8A8375]">
              <th className="px-5 py-3 font-medium">Order ID</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Payment</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Update</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-[#8A8375]">Loading orders…</td></tr>
            )}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-[#8A8375]">No orders yet.</td></tr>
            )}
            {!loading && orders.map((o, idx) => (
              <tr key={o.vstitch_order_id} className={idx !== orders.length - 1 ? "border-b border-[#221E17]" : ""}>
                <td className="px-5 py-4 text-[#E8C88A] font-medium">VS-{o.vstitch_order_id}</td>
                <td className="px-5 py-4 text-[#EDE7DD]">{o.customer_name}</td>
                <td className="px-5 py-4 text-[#B8B2A3]">
                  {o.items.map((it) => `${it.product_name_snapshot} x${it.quantity}`).join(", ")}
                </td>
                <td className="px-5 py-4 text-[#EDE7DD]">₹{o.total_amount.toLocaleString("en-IN")}</td>
                <td className="px-5 py-4 text-[#B8B2A3] capitalize">{o.payment_method}</td>
                <td className="px-5 py-4 text-[#8A8375] whitespace-nowrap">
                  {new Date(o.created_date).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${STATUS_STYLES[o.order_status]}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                      {STATUS_LABELS[o.order_status]}
                    </span>
                    <button
                      onClick={() => handleRefreshStatus(o.vstitch_order_id)}
                      disabled={syncingId === o.vstitch_order_id}
                      className="inline-flex items-center gap-1 rounded-md border border-[#2A2620] bg-[#141210] px-2 py-1 text-[11px] text-[#EDE7DD] hover:border-[#C9A24B] hover:text-[#F7D788] disabled:opacity-60 disabled:cursor-not-allowed"
                      title="Refresh live status from Shiprocket"
                    >
                      <Icon path={icons.refresh} size={12} />
                      {syncingId === o.vstitch_order_id ? "Syncing…" : "Refresh"}
                    </button>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <select
                        value={pendingStatus[o.vstitch_order_id] || ""}
                        onChange={(e) => handleDropdownChange(o.vstitch_order_id, e.target.value)}
                        className="appearance-none bg-[#141210] border border-[#2A2620] rounded-md pl-3 pr-7 py-1.5 text-xs text-[#EDE7DD] focus:outline-none focus:border-[#C9A24B] cursor-pointer"
                      >
                        <option value="" disabled>Set status</option>
                        {STATUS_FLOW.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8A8375] pointer-events-none"><Icon path={icons.chevron} size={12} /></span>
                    </div>
                    <button
                      onClick={() => handleUpdate(o.vstitch_order_id)}
                      disabled={!pendingStatus[o.vstitch_order_id] || updatingId === o.vstitch_order_id}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#C9A24B] text-[#1A1712] hover:bg-[#DAB65E] disabled:bg-[#2A2620] disabled:text-[#6E6858] disabled:cursor-not-allowed transition-colors"
                    >
                      {updatingId === o.vstitch_order_id ? "..." : "Update"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-[0.15em] text-[#8A8375] mb-3">Live Tracking Feed</div>
        <div className="bg-[#1C1914] border border-[#2A2620] rounded-lg divide-y divide-[#221E17]">
          {log.length === 0 && (
            <div className="px-5 py-3 text-sm text-[#6E6858]">No status updates yet this session.</div>
          )}
          {log.map((l) => (
            <div key={l.id} className="px-5 py-3 flex items-center justify-between text-sm">
              <span className="text-[#EDE7DD]">{l.text}</span>
              <span className="text-[#6E6858] text-xs">{l.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
