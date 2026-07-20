import { useState } from 'react';
import { Modal } from './Modal.jsx';
import { CategorySelect } from './CategorySelect.jsx';
import { adminApi } from '../api/index.js';

function emptyRow() {
  return {
    key: Math.random().toString(36).slice(2),
    product_name: "",
    category_id: "",
    size: "Standard",
    color: "Standard",
    sku: "",
    price: "",
    stock_quantity: "",
  };
}

export function AddProductModal({ open, onClose, categories, onCategoriesChanged, onProductsCreated }) {
  const [rows, setRows] = useState([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [rowErrors, setRowErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const reset = () => {
    setRows([emptyRow()]);
    setRowErrors({});
    setFormError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const updateRow = (key, patch) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (key) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));

  const validateLocal = () => {
    const errs = {};
    rows.forEach((r) => {
      if (!r.product_name.trim()) errs[r.key] = "Product name is required.";
      else if (!r.category_id) errs[r.key] = "Select a category.";
      else if (!r.sku.trim()) errs[r.key] = "SKU is required.";
      else if (!r.price || Number(r.price) <= 0) errs[r.key] = "Enter a valid price.";
    });
    return errs;
  };

  const handleSubmit = async () => {
    const localErrs = validateLocal();
    if (Object.keys(localErrs).length > 0) {
      setRowErrors(localErrs);
      return;
    }
    setSaving(true);
    setFormError(null);
    setRowErrors({});
    try {
      const payload = rows.map((r) => ({
        product_name: r.product_name.trim(),
        category_id: Number(r.category_id),
        base_price: Number(r.price),
        variants: [
          {
            sku: r.sku.trim(),
            size: r.size.trim() || "Standard",
            color: r.color.trim() || "Standard",
            price: Number(r.price),
            stock_quantity: Number(r.stock_quantity) || 0,
          },
        ],
      }));
      const { created, errors } = await adminApi.createProducts(payload);
      if (created.length > 0) {
        onProductsCreated(created);
      }
      if (!errors || errors.length === 0) {
        handleClose();
        return;
      }
      // Partial success: drop the rows that already saved so a resubmit
      // only retries the ones that actually failed, instead of re-sending
      // already-created SKUs.
      const failedIndexes = new Set(errors.map((e) => e.index));
      const errMap = {};
      const remainingRows = rows.filter((r, i) => {
        if (!failedIndexes.has(i)) return false;
        errMap[r.key] = errors.find((e) => e.index === i).message;
        return true;
      });
      setRows(remainingRows.length > 0 ? remainingRows : [emptyRow()]);
      setRowErrors(errMap);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add Products" subtitle="Add one or more products to the catalogue at once" wide>
      {formError && (
        <div className="mb-4 px-4 py-3 rounded-md bg-[#3A1F1F] border border-[#5E2A2A] text-[#E0716A] text-sm">{formError}</div>
      )}
      <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
        {rows.map((row) => (
          <div key={row.key} className="border border-[#2A2620] rounded-lg p-4 relative">
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                className="absolute top-2 right-2 text-[#8A8375] hover:text-[#E0716A] text-lg leading-none"
                aria-label="Remove product"
              >
                ×
              </button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-[0.1em] text-[#8A8375] block mb-1">Product Name</label>
                <input
                  value={row.product_name}
                  onChange={(e) => updateRow(row.key, { product_name: e.target.value })}
                  placeholder="e.g. Banarasi Silk Saree - Maroon"
                  className="w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm text-[#EDE7DD] focus:outline-none focus:border-[#C9A24B]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-[#8A8375] block mb-1">Category</label>
                <CategorySelect
                  categories={categories}
                  value={row.category_id}
                  onChange={(val) => updateRow(row.key, { category_id: val })}
                  onCategoryCreated={onCategoriesChanged}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-[#8A8375] block mb-1">SKU</label>
                <input
                  value={row.sku}
                  onChange={(e) => updateRow(row.key, { sku: e.target.value })}
                  placeholder="e.g. SAR-0142"
                  className="w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm text-[#EDE7DD] focus:outline-none focus:border-[#C9A24B]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-[#8A8375] block mb-1">Size</label>
                <input
                  value={row.size}
                  onChange={(e) => updateRow(row.key, { size: e.target.value })}
                  className="w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm text-[#EDE7DD] focus:outline-none focus:border-[#C9A24B]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-[#8A8375] block mb-1">Color</label>
                <input
                  value={row.color}
                  onChange={(e) => updateRow(row.key, { color: e.target.value })}
                  className="w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm text-[#EDE7DD] focus:outline-none focus:border-[#C9A24B]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-[#8A8375] block mb-1">Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={row.price}
                  onChange={(e) => updateRow(row.key, { price: e.target.value })}
                  className="w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm text-[#EDE7DD] focus:outline-none focus:border-[#C9A24B]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-[#8A8375] block mb-1">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={row.stock_quantity}
                  onChange={(e) => updateRow(row.key, { stock_quantity: e.target.value })}
                  className="w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm text-[#EDE7DD] focus:outline-none focus:border-[#C9A24B]"
                />
              </div>
            </div>
            {rowErrors[row.key] && <p className="text-[#E0716A] text-xs mt-2">{rowErrors[row.key]}</p>}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-4 text-xs font-medium text-[#C9A24B] hover:text-[#DAB65E]"
      >
        + Add another product
      </button>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#2A2620]">
        <button
          type="button"
          onClick={handleClose}
          className="px-4 py-2 rounded-md text-xs font-medium text-[#B8B2A3] hover:text-[#EDE7DD]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="px-4 py-2 rounded-md text-xs font-medium bg-[#C9A24B] text-[#1A1712] hover:bg-[#DAB65E] disabled:opacity-50"
        >
          {saving ? "Saving…" : `Add ${rows.length > 1 ? `${rows.length} Products` : "Product"}`}
        </button>
      </div>
    </Modal>
  );
}
