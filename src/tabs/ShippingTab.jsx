import { useEffect, useState } from 'react';
import { adminApi } from '../api/index.js';

export function ShippingTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.getOrders().then(setOrders).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const shippable = orders.filter((o) =>
    ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"].includes(o.order_status)
  );

  return (
    <div className="p-8">
      {error && <div className="mb-4 px-4 py-3 rounded-md bg-[#3A1F1F] border border-[#5E2A2A] text-[#E0716A] text-sm">{error}</div>}
      <div className="bg-[#1C1914] border border-[#2A2620] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A2620] text-left text-[11px] uppercase tracking-[0.1em] text-[#8A8375]">
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">AWB</th>
              <th className="px-5 py-3 font-medium">Courier</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">City</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-5 py-8 text-center text-[#8A8375]">Loading shipments…</td></tr>}
            {!loading && shippable.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-[#8A8375]">No orders ready for shipping yet.</td></tr>
            )}
            {!loading && shippable.map((o, i) => (
              <tr key={o.vstitch_order_id} className={i !== shippable.length - 1 ? "border-b border-[#221E17]" : ""}>
                <td className="px-5 py-4 text-[#E8C88A]">VS-{o.vstitch_order_id}</td>
                <td className="px-5 py-4 text-[#B8B2A3] font-mono text-xs">{o.awb_code || "—"}</td>
                <td className="px-5 py-4 text-[#EDE7DD]">{o.courier_name || "Not assigned"}</td>
                <td className="px-5 py-4 text-[#B8B2A3] capitalize">{o.order_status.replaceAll("_", " ")}</td>
                <td className="px-5 py-4 text-[#8A8375]">{o.shipping_city}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
