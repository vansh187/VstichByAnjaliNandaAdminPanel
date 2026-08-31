import { useEffect, useMemo, useState } from 'react';
import { Icon, icons } from '../components/Icon.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { STATUS_LABELS, STATUS_STYLES, PENDING_ACTION_STATUSES } from '../data/seed.js';
import { adminApi } from '../api/index.js';

// The "Ready to Ship" action is only valid while the order is placed / confirmed
// / processing — the backend returns 409 for anything else.
function canMarkReadyToShip(order) {
  return PENDING_ACTION_STATUSES.has(order?.order_status);
}

function formatAmount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN')}` : '—';
}

function formatDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function describeItems(items) {
  if (!Array.isArray(items) || items.length === 0) return '—';
  return items
    .map((it) => `${it?.product_name_snapshot ?? 'Item'} x${it?.quantity ?? 1}`)
    .join(', ');
}

export function AllOrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [shippingId, setShippingId] = useState(null);
  const [flash, setFlash] = useState(null);

  // `force` bypasses the shared 10s orders cache — used for explicit Refresh /
  // Retry clicks so the admin never sees a stale list after acting.
  const loadOrders = (force = false) => {
    setLoading(true);
    setError(null);
    adminApi
      .getOrders(undefined, { force })
      .then((list) => setOrders(Array.isArray(list) ? list : []))
      .catch((err) => setError(err?.message || 'Could not load orders.'))
      .finally(() => setLoading(false));
  };

  // Silent resync — refreshes rows without clearing the current error banner or
  // flipping the page back into its loading state. Always bypasses the cache:
  // its whole job is to correct a row we know is stale.
  const resyncOrders = () => {
    adminApi
      .getOrders(undefined, { force: true })
      .then((list) => setOrders(Array.isArray(list) ? list : []))
      .catch(() => {});
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (!flash) return undefined;
    const t = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  const handleReadyToShip = async (orderId) => {
    if (shippingId) return; // one dispatch at a time keeps the UI unambiguous
    setShippingId(orderId);
    setError(null);
    try {
      const updated = await adminApi.markOrderReadyToShip(orderId);
      if (updated && typeof updated === 'object') {
        setOrders((prev) =>
          prev.map((o) => (o.vstitch_order_id === orderId ? { ...o, ...updated } : o))
        );
        setFlash(
          updated.awb_code
            ? `Order VS-${orderId} is ready to ship — AWB ${updated.awb_code} (${updated.courier_name || 'courier assigned'}).`
            : `Order VS-${orderId} is ready to ship.`
        );
        // Shiprocket booked the shipment but the status/AWB write lagged — pull
        // fresh data so the row reflects reality.
        if (updated.awb_code == null || updated.courier_name == null) resyncOrders();
      } else {
        setFlash(`Order VS-${orderId} is ready to ship.`);
        resyncOrders();
      }
    } catch (err) {
      const status = err?.status;
      setError(err?.message || 'Could not mark the order ready to ship.');
      // 401 is handled globally (client.js drops back to login).
      // 404 (order gone) and 409 (status moved on, or a dispatch already in
      // flight) both mean our local copy is stale — resync so the row + button
      // correct themselves. 502 / network errors leave the row alone for retry.
      if (status === 404 || status === 409) resyncOrders();
    } finally {
      setShippingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        String(o.vstitch_order_id ?? '').includes(q) ||
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.customer_email || '').toLowerCase().includes(q)
    );
  }, [orders, search]);

  const readyCount = orders.filter(canMarkReadyToShip).length;

  return (
    <div className="p-8">
      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-[#3A1F1F] border border-[#5E2A2A] text-[#E0716A] text-sm flex items-center justify-between gap-4">
          <span className="break-words">{error}</span>
          <button onClick={() => loadOrders(true)} className="underline text-xs shrink-0">Retry</button>
        </div>
      )}
      {flash && (
        <div className="mb-4 px-4 py-3 rounded-md bg-[#1F3A34] border border-[#2A5A4E] text-[#4FC3A1] text-sm break-words">
          {flash}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <StatCard label="Total Orders" value={loading ? "…" : orders.length} />
        <StatCard label="Awaiting Dispatch" value={loading ? "…" : readyCount} accent="text-[#D9A441]" />
      </div>

      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative w-72">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8375] pointer-events-none">
            <Icon path={icons.search} size={14} />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID, customer, email"
            className="w-full bg-[#141210] border border-[#2A2620] rounded-md pl-9 pr-3 py-2 text-xs text-[#EDE7DD] placeholder:text-[#6E6858] focus:outline-none focus:border-[#C9A24B]"
          />
        </div>
        <button
          onClick={() => loadOrders(true)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#2A2620] bg-[#141210] px-3 py-2 text-xs text-[#EDE7DD] hover:border-[#C9A24B] hover:text-[#F7D788] disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          <Icon path={icons.refresh} size={12} />
          Refresh
        </button>
      </div>

      <div className="bg-[#1C1914] border border-[#2A2620] rounded-lg overflow-x-auto">
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
              <th className="px-5 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-[#8A8375]">Loading orders…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-[#8A8375]">No orders found.</td></tr>
            )}
            {!loading && filtered.map((o, idx) => {
              const eligible = canMarkReadyToShip(o);
              const busy = shippingId === o.vstitch_order_id;
              return (
                <tr key={o.vstitch_order_id ?? idx} className={idx !== filtered.length - 1 ? "border-b border-[#221E17]" : ""}>
                  <td className="px-5 py-4 text-[#E8C88A] font-medium whitespace-nowrap">VS-{o.vstitch_order_id ?? '—'}</td>
                  <td className="px-5 py-4 text-[#EDE7DD]">{o.customer_name || '—'}</td>
                  <td className="px-5 py-4 text-[#B8B2A3]">{describeItems(o.items)}</td>
                  <td className="px-5 py-4 text-[#EDE7DD] whitespace-nowrap">{formatAmount(o.total_amount)}</td>
                  <td className="px-5 py-4 text-[#B8B2A3] capitalize">{o.payment_method || '—'}</td>
                  <td className="px-5 py-4 text-[#8A8375] whitespace-nowrap">{formatDate(o.created_date)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${STATUS_STYLES[o.order_status] || 'bg-[#2A2620] text-[#B8B2A3] border-[#3A362E]'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                      {STATUS_LABELS[o.order_status] || (o.order_status ? String(o.order_status).replaceAll('_', ' ') : 'Unknown')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleReadyToShip(o.vstitch_order_id)}
                      disabled={!eligible || busy || (shippingId != null && !busy) || o.vstitch_order_id == null}
                      title={eligible ? "Book the shipment, generate the AWB and mark the order shipped" : "Only placed, confirmed or processing orders can be marked ready to ship"}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#C9A24B] text-[#1A1712] hover:bg-[#DAB65E] disabled:bg-[#2A2620] disabled:text-[#6E6858] disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      <Icon path={icons.shipping} size={13} />
                      {busy ? "Processing…" : "Ready to Ship"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
