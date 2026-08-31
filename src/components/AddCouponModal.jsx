import { useState } from 'react';
import { Modal } from './Modal.jsx';
import { adminApi } from '../api/index.js';

function emptyForm() {
  return {
    coupon_code: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_amount: "",
    max_discount_amount: "",
    usage_limit: "",
    valid_until: "",
  };
}

const inputClass = "w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm text-[#EDE7DD] focus:outline-none focus:border-[#C9A24B]";
const labelClass = "block text-[11px] uppercase tracking-[0.1em] text-[#8A8375] mb-1.5";

export function AddCouponModal({ open, onClose, onCouponCreated }) {
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const reset = () => {
    setForm(emptyForm());
    setFormError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async () => {
    if (!form.coupon_code.trim()) {
      setFormError('Coupon code is required.');
      return;
    }
    if (!form.discount_value || Number(form.discount_value) <= 0) {
      setFormError('Enter a valid discount value.');
      return;
    }
    if (form.discount_type === 'percentage' && Number(form.discount_value) > 100) {
      setFormError('Percentage discount cannot exceed 100.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const created = await adminApi.createCoupon({
        coupon_code: form.coupon_code.trim().toUpperCase(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : null,
        max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      });
      onCouponCreated(created);
      handleClose();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add Coupon" subtitle="Create a new discount code for customers">
      <div className="space-y-4">
        {formError && (
          <div className="px-3 py-2 rounded-md bg-[#3A1F1F] border border-[#5E2A2A] text-[#E0716A] text-sm">
            {formError}
          </div>
        )}
        <div>
          <label className={labelClass}>Coupon Code</label>
          <input
            className={inputClass}
            placeholder="e.g. FESTIVE20"
            value={form.coupon_code}
            onChange={(e) => update({ coupon_code: e.target.value.toUpperCase() })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Discount Type</label>
            <select
              className={inputClass}
              value={form.discount_type}
              onChange={(e) => update({ discount_type: e.target.value })}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat amount (₹)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>{form.discount_type === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}</label>
            <input
              type="number"
              className={inputClass}
              placeholder={form.discount_type === 'percentage' ? '20' : '150'}
              value={form.discount_value}
              onChange={(e) => update({ discount_value: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Min Order Amount (₹)</label>
            <input
              type="number"
              className={inputClass}
              placeholder="Optional"
              value={form.min_order_amount}
              onChange={(e) => update({ min_order_amount: e.target.value })}
            />
          </div>
          {form.discount_type === 'percentage' && (
            <div>
              <label className={labelClass}>Max Discount Cap (₹)</label>
              <input
                type="number"
                className={inputClass}
                placeholder="Optional"
                value={form.max_discount_amount}
                onChange={(e) => update({ max_discount_amount: e.target.value })}
              />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Usage Limit</label>
            <input
              type="number"
              className={inputClass}
              placeholder="Optional (unlimited)"
              value={form.usage_limit}
              onChange={(e) => update({ usage_limit: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Valid Until</label>
            <input
              type="date"
              className={inputClass}
              value={form.valid_until}
              onChange={(e) => update({ valid_until: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-md text-xs font-medium text-[#B8B2A3] hover:text-[#EDE7DD]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 rounded-md text-xs font-medium bg-[#C9A24B] text-[#1A1712] hover:bg-[#DAB65E] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Coupon"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
