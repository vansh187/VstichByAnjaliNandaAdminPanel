import { useEffect, useState } from 'react';
import { adminApi } from '../api/index.js';
import { AddCouponModal } from '../components/AddCouponModal.jsx';

function formatDiscount(coupon) {
  const discount = coupon.discount_type === 'percentage' ? `${coupon.discount_value}% off` : `₹${coupon.discount_value} off`;
  const condition = coupon.min_order_amount ? `min ₹${coupon.min_order_amount.toLocaleString('en-IN')}` : 'no minimum';
  return `${discount} · ${condition}`;
}

export function MarketingTab() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    adminApi.getCoupons()
      .then(setCoupons)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCouponCreated = (coupon) => {
    setCoupons((prev) => [coupon, ...prev]);
  };

  return (
    <div className="p-8 grid grid-cols-2 gap-5">
      <div className="bg-[#1C1914] border border-[#2A2620] rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-[0.15em] text-[#8A8375]">Active Coupons</div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#C9A24B] text-[#1A1712] hover:bg-[#DAB65E]"
          >
            + Add Coupon
          </button>
        </div>
        {error && (
          <div className="mb-3 px-3 py-2 rounded-md bg-[#3A1F1F] border border-[#5E2A2A] text-[#E0716A] text-sm flex items-center justify-between">
            {error}
            <button onClick={load} className="underline text-xs">Retry</button>
          </div>
        )}
        <div className="space-y-2 text-sm">
          {loading && <div className="text-[#8A8375]">Loading coupons…</div>}
          {!loading && coupons.length === 0 && (
            <div className="text-[#8A8375]">No coupons yet. Click "+ Add Coupon" to create one.</div>
          )}
          {!loading && coupons.filter((c) => c.is_active).map((c) => (
            <div key={c.vstitch_coupon_id} className="flex justify-between">
              <span className="text-[#EDE7DD]">{c.coupon_code}</span>
              <span className="text-[#B8B2A3]">{formatDiscount(c)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#1C1914] border border-[#2A2620] rounded-lg p-5">
        <div className="text-[11px] uppercase tracking-[0.15em] text-[#8A8375] mb-3">Homepage Banner</div>
        <div className="h-20 rounded-md bg-gradient-to-r from-[#3A2E1F] to-[#2A2440] flex items-center justify-center text-[#E8C88A] font-serif text-sm">Festive Collection — Live</div>
      </div>

      <AddCouponModal open={modalOpen} onClose={() => setModalOpen(false)} onCouponCreated={handleCouponCreated} />
    </div>
  );
}
