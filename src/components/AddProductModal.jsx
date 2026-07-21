import { useState } from 'react';
import { Modal } from './Modal.jsx';
import { CategorySelect } from './CategorySelect.jsx';
import { adminApi } from '../api/index.js';

function emptyImage() {
  return {
    key: Math.random().toString(36).slice(2),
    image_url: "",
    is_primary: false,
  };
}

function emptyRow() {
  return {
    key: Math.random().toString(36).slice(2),
    product_name: "",
    category_id: "",
    description: "",
    size: "Standard",
    color: "Standard",
    sku: "",
    price: "",
    stock_quantity: "",
    weight_kg: "",
    length_cm: "",
    breadth_cm: "",
    height_cm: "",
    images: [emptyImage()],
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

  const updateImage = (rowKey, imageKey, patch) => {
    setRows((prev) =>
      prev.map((r) =>
        r.key === rowKey
          ? { ...r, images: r.images.map((img) => (img.key === imageKey ? { ...img, ...patch } : img)) }
          : r
      )
    );
  };
  const addImage = (rowKey) =>
    setRows((prev) => prev.map((r) => (r.key === rowKey ? { ...r, images: [...r.images, emptyImage()] } : r)));
  const removeImage = (rowKey, imageKey) =>
    setRows((prev) =>
      prev.map((r) =>
        r.key === rowKey ? { ...r, images: r.images.filter((img) => img.key !== imageKey) } : r
      )
    );

  const isShippingIncomplete = (r) =>
    !(Number(r.weight_kg) > 0 && Number(r.length_cm) >= 0.5 && Number(r.breadth_cm) >= 0.5 && Number(r.height_cm) >= 0.5);

  const validateLocal = () => {
    const errs = {};
    rows.forEach((r) => {
      if (!r.product_name.trim()) { errs[r.key] = "Product name is required."; return; }
      if (!r.category_id) { errs[r.key] = "Select a category."; return; }
      if (!r.sku.trim()) { errs[r.key] = "SKU is required."; return; }
      if (!r.price || Number(r.price) <= 0) { errs[r.key] = "Enter a valid price."; return; }
      if (r.weight_kg !== "" && Number(r.weight_kg) <= 0) { errs[r.key] = "Weight must be greater than 0."; return; }
      if (r.length_cm !== "" && Number(r.length_cm) < 0.5) { errs[r.key] = "Length must be at least 0.5 cm."; return; }
      if (r.breadth_cm !== "" && Number(r.breadth_cm) < 0.5) { errs[r.key] = "Breadth must be at least 0.5 cm."; return; }
      if (r.height_cm !== "" && Number(r.height_cm) < 0.5) { errs[r.key] = "Height must be at least 0.5 cm."; return; }
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
      const payload = rows.map((r) => {
        const images = r.images
          .filter((img) => img.image_url.trim())
          .map((img, idx) => ({
            image_url: img.image_url.trim(),
            is_primary: img.is_primary,
            display_order: idx,
          }));
        // Fall back to the first image if the admin added photos but never
        // checked one as primary — a product with images but no primary
        // flag would otherwise show no photo on the storefront.
        if (images.length > 0 && !images.some((img) => img.is_primary)) {
          images[0].is_primary = true;
        }
        return {
          product_name: r.product_name.trim(),
          description: r.description.trim() || undefined,
          category_id: Number(r.category_id),
          base_price: Number(r.price),
          variants: [
            {
              sku: r.sku.trim(),
              size: r.size.trim() || "Standard",
              color: r.color.trim() || "Standard",
              price: Number(r.price),
              stock_quantity: Number(r.stock_quantity) || 0,
              weight_kg: r.weight_kg !== "" ? Number(r.weight_kg) : undefined,
              length_cm: r.length_cm !== "" ? Number(r.length_cm) : undefined,
              breadth_cm: r.breadth_cm !== "" ? Number(r.breadth_cm) : undefined,
              height_cm: r.height_cm !== "" ? Number(r.height_cm) : undefined,
            },
          ],
          ...(images.length > 0 ? { images } : {}),
        };
      });
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
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-[0.1em] text-[#8A8375] block mb-1">Description</label>
                <textarea
                  value={row.description}
                  onChange={(e) => updateRow(row.key, { description: e.target.value })}
                  placeholder="Optional product description"
                  rows={2}
                  className="w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm text-[#EDE7DD] focus:outline-none focus:border-[#C9A24B] resize-y"
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
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-[0.1em] text-[#8A8375] block mb-1">
                  Shipping Dimensions
                  {isShippingIncomplete(row) && (
                    <span className="ml-2 normal-case tracking-normal text-[#E0A34B]">shipping info incomplete — required before this product can ship</span>
                  )}
                </label>
                <div className="grid grid-cols-4 gap-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Weight (kg)"
                    value={row.weight_kg}
                    onChange={(e) => updateRow(row.key, { weight_kg: e.target.value })}
                    className="w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm text-[#EDE7DD] focus:outline-none focus:border-[#C9A24B]"
                  />
                  <input
                    type="number"
                    min="0.5"
                    step="0.1"
                    placeholder="Length (cm)"
                    value={row.length_cm}
                    onChange={(e) => updateRow(row.key, { length_cm: e.target.value })}
                    className="w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm text-[#EDE7DD] focus:outline-none focus:border-[#C9A24B]"
                  />
                  <input
                    type="number"
                    min="0.5"
                    step="0.1"
                    placeholder="Breadth (cm)"
                    value={row.breadth_cm}
                    onChange={(e) => updateRow(row.key, { breadth_cm: e.target.value })}
                    className="w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm text-[#EDE7DD] focus:outline-none focus:border-[#C9A24B]"
                  />
                  <input
                    type="number"
                    min="0.5"
                    step="0.1"
                    placeholder="Height (cm)"
                    value={row.height_cm}
                    onChange={(e) => updateRow(row.key, { height_cm: e.target.value })}
                    className="w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm text-[#EDE7DD] focus:outline-none focus:border-[#C9A24B]"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-[0.1em] text-[#8A8375] block mb-1">Images</label>
                <div className="space-y-2">
                  {row.images.map((img) => (
                    <div key={img.key} className="flex items-center gap-2">
                      <input
                        value={img.image_url}
                        onChange={(e) => updateImage(row.key, img.key, { image_url: e.target.value })}
                        placeholder="https://…/image.jpg"
                        className="flex-1 bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm text-[#EDE7DD] focus:outline-none focus:border-[#C9A24B]"
                      />
                      <label className="flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-[#8A8375] whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={img.is_primary}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r) =>
                                r.key === row.key
                                  ? {
                                      ...r,
                                      images: r.images.map((i) => ({
                                        ...i,
                                        is_primary: i.key === img.key ? e.target.checked : e.target.checked ? false : i.is_primary,
                                      })),
                                    }
                                  : r
                              )
                            )
                          }
                        />
                        Primary
                      </label>
                      {row.images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImage(row.key, img.key)}
                          className="text-[#8A8375] hover:text-[#E0716A] text-lg leading-none px-1"
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addImage(row.key)}
                  className="mt-2 text-xs font-medium text-[#C9A24B] hover:text-[#DAB65E]"
                >
                  + Add image URL
                </button>
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
