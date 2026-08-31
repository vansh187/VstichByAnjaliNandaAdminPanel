import { useEffect, useMemo, useState } from 'react';
import { Modal } from './Modal.jsx';
import { ImageUploadField } from './ImageUploadField.jsx';
import { adminApi } from '../api/index.js';
import { SEASON_LABELS } from '../data/collections.js';

// Curate the ordered product list and manage the banner images for one
// collection. Product order is edited locally and saved in one PUT; image
// changes each hit their own endpoint and refresh immediately.
export function ManageCollectionModal({ open, onClose, collectionId, allProducts, onSaved }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(null);

  const [orderedIds, setOrderedIds] = useState([]);
  const [savingProducts, setSavingProducts] = useState(false);
  const [search, setSearch] = useState('');
  const [imageBusy, setImageBusy] = useState(false);

  const productById = useMemo(() => {
    const m = new Map();
    (allProducts || []).forEach((p) => m.set(p.vstitch_product_id, p));
    return m;
  }, [allProducts]);

  const loadDetail = () => {
    if (collectionId == null) return;
    setLoading(true);
    setError(null);
    adminApi
      .getCollection(collectionId)
      .then((c) => {
        setDetail(c);
        setOrderedIds(Array.isArray(c.product_ids) ? [...c.product_ids] : []);
      })
      .catch((err) => setError(err?.message || 'Could not load the collection.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open) return;
    setDetail(null);
    setOrderedIds([]);
    setSearch('');
    setFlash(null);
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, collectionId]);

  const showFlash = (msg) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3500);
  };

  const dirty = useMemo(() => {
    const original = detail?.product_ids || [];
    return original.length !== orderedIds.length || original.some((id, i) => id !== orderedIds[i]);
  }, [detail, orderedIds]);

  const move = (index, delta) => {
    setOrderedIds((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };
  const removeId = (id) => setOrderedIds((prev) => prev.filter((x) => x !== id));
  const addId = (id) => setOrderedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

  const addable = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (allProducts || [])
      .filter((p) => p.is_active !== false && !orderedIds.includes(p.vstitch_product_id))
      .filter((p) => !q || (p.product_name || '').toLowerCase().includes(q) || String(p.vstitch_product_id).includes(q));
  }, [allProducts, orderedIds, search]);

  const handleSaveProducts = async () => {
    setSavingProducts(true);
    setError(null);
    try {
      const updated = await adminApi.setCollectionProducts(collectionId, orderedIds);
      setDetail(updated);
      setOrderedIds([...updated.product_ids]);
      showFlash('Product list saved.');
      onSaved?.(updated);
    } catch (err) {
      setError(err?.message || 'Could not save the product list.');
    } finally {
      setSavingProducts(false);
    }
  };

  const refreshAfterImage = async (msg) => {
    try {
      const c = await adminApi.getCollection(collectionId);
      setDetail(c);
      onSaved?.(c);
      if (msg) showFlash(msg);
    } catch {
      /* the mutation succeeded; a stale image list corrects on next open */
    }
  };

  const handleImageUploaded = async (image_url) => {
    setImageBusy(true);
    setError(null);
    try {
      const first = (detail?.images || []).length === 0;
      await adminApi.addCollectionImage(collectionId, { image_url, is_primary: first });
      await refreshAfterImage('Image added.');
    } catch (err) {
      setError(err?.message || 'Could not attach the image.');
    } finally {
      setImageBusy(false);
    }
  };

  const handleMakePrimary = async (imageId) => {
    setImageBusy(true);
    setError(null);
    try {
      await adminApi.updateCollectionImage(collectionId, imageId, { is_primary: true });
      await refreshAfterImage('Primary image updated.');
    } catch (err) {
      setError(err?.message || 'Could not update the image.');
    } finally {
      setImageBusy(false);
    }
  };

  const handleRemoveImage = async (imageId) => {
    setImageBusy(true);
    setError(null);
    try {
      await adminApi.deleteCollectionImage(collectionId, imageId);
      await refreshAfterImage('Image removed.');
    } catch (err) {
      setError(err?.message || 'Could not remove the image.');
    } finally {
      setImageBusy(false);
    }
  };

  const productLabel = (id) => {
    const p = productById.get(id);
    if (!p) return `Product #${id} (not in catalogue)`;
    const price = p.variants?.[0]?.price ?? p.base_price;
    return `${p.product_name}${price != null ? ` · ₹${Number(price).toLocaleString('en-IN')}` : ''}`;
  };

  return (
    <Modal
      open={open}
      onClose={savingProducts || imageBusy ? () => {} : onClose}
      title={detail ? `Manage · ${detail.collection_name}` : 'Manage Collection'}
      subtitle={detail ? `${SEASON_LABELS[detail.season] || detail.season} · /${detail.slug}` : undefined}
      wide
    >
      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-[#3A1F1F] border border-[#5E2A2A] text-[#E0716A] text-sm flex items-center justify-between gap-4">
          <span className="break-words">{error}</span>
          <button onClick={loadDetail} className="underline text-xs shrink-0">Reload</button>
        </div>
      )}
      {flash && (
        <div className="mb-4 px-4 py-3 rounded-md bg-[#1F3A34] border border-[#2A5A4E] text-[#4FC3A1] text-sm">{flash}</div>
      )}

      {loading && <div className="py-10 text-center text-[#8A8375] text-sm">Loading collection…</div>}

      {!loading && detail && (
        <div className="space-y-8">
          {/* ---------------- Products ---------------- */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg text-[#EDE7DD]">Products <span className="text-[#8A8375] text-sm">({orderedIds.length})</span></h3>
              <button
                onClick={handleSaveProducts}
                disabled={!dirty || savingProducts}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#C9A24B] text-[#1A1712] hover:bg-[#DAB65E] disabled:bg-[#2A2620] disabled:text-[#6E6858] disabled:cursor-not-allowed"
              >
                {savingProducts ? 'Saving…' : dirty ? 'Save Product Order' : 'Saved'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* curated list */}
              <div className="border border-[#2A2620] rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-[0.12em] text-[#8A8375] mb-2">In this collection · storefront order</div>
                {orderedIds.length === 0 && (
                  <p className="text-sm text-[#6E6858] py-4 text-center">No products yet. Add some from the right →</p>
                )}
                <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {orderedIds.map((id, idx) => (
                    <li key={id} className="flex items-center gap-2 bg-[#141210] border border-[#221E17] rounded-md px-2.5 py-1.5">
                      <span className="text-[11px] text-[#8A8375] w-5 shrink-0">{idx + 1}</span>
                      <span className="text-sm text-[#EDE7DD] flex-1 truncate" title={productLabel(id)}>{productLabel(id)}</span>
                      <button onClick={() => move(idx, -1)} disabled={idx === 0} className="text-[#8A8375] hover:text-[#F7D788] disabled:opacity-30 px-1" aria-label="Move up">↑</button>
                      <button onClick={() => move(idx, 1)} disabled={idx === orderedIds.length - 1} className="text-[#8A8375] hover:text-[#F7D788] disabled:opacity-30 px-1" aria-label="Move down">↓</button>
                      <button onClick={() => removeId(id)} className="text-[#8A8375] hover:text-[#E0716A] px-1" aria-label="Remove">×</button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* catalogue picker */}
              <div className="border border-[#2A2620] rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-[0.12em] text-[#8A8375] mb-2">Add from catalogue</div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products…"
                  className="w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-1.5 text-xs text-[#EDE7DD] placeholder:text-[#6E6858] focus:outline-none focus:border-[#C9A24B] mb-2"
                />
                <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {addable.length === 0 && (
                    <li className="text-sm text-[#6E6858] py-4 text-center">Nothing to add.</li>
                  )}
                  {addable.slice(0, 100).map((p) => (
                    <li key={p.vstitch_product_id} className="flex items-center gap-2 bg-[#141210] border border-[#221E17] rounded-md px-2.5 py-1.5">
                      <span className="text-sm text-[#EDE7DD] flex-1 truncate" title={p.product_name}>{p.product_name}</span>
                      <button onClick={() => addId(p.vstitch_product_id)} className="text-xs font-medium text-[#C9A24B] hover:text-[#DAB65E] shrink-0">Add</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {dirty && <p className="text-xs text-[#D9A441] mt-2">Unsaved order changes — click “Save Product Order”.</p>}
          </section>

          {/* ---------------- Images ---------------- */}
          <section>
            <h3 className="font-serif text-lg text-[#EDE7DD] mb-3">Banner Images</h3>
            <div className="border border-[#2A2620] rounded-lg p-3">
              {(detail.images || []).length === 0 && (
                <p className="text-sm text-[#6E6858] py-3 text-center">No images yet. Upload one below — the first becomes the primary banner.</p>
              )}
              <ul className="space-y-2">
                {(detail.images || []).map((img) => (
                  <li key={img.vstitch_collection_image_id} className="flex items-center gap-3 bg-[#141210] border border-[#221E17] rounded-md px-2.5 py-2">
                    <img src={img.image_url} alt="" className="w-14 h-14 rounded-md object-cover border border-[#2A2620]" />
                    <div className="flex-1 min-w-0">
                      {img.is_primary
                        ? <span className="inline-block px-2 py-0.5 rounded-full text-[11px] bg-[#1F3A24] text-[#6FCF7A] border border-[#2A5E36]">Primary</span>
                        : <button onClick={() => handleMakePrimary(img.vstitch_collection_image_id)} disabled={imageBusy} className="text-xs font-medium text-[#C9A24B] hover:text-[#DAB65E] disabled:opacity-50">Make primary</button>}
                      <div className="text-[11px] text-[#6E6858] truncate mt-1">{img.image_url}</div>
                    </div>
                    <button onClick={() => handleRemoveImage(img.vstitch_collection_image_id)} disabled={imageBusy} className="text-xs font-medium text-[#8A8375] hover:text-[#E0716A] disabled:opacity-50 shrink-0">Remove</button>
                  </li>
                ))}
              </ul>
              <div className="mt-3">
                <ImageUploadField
                  imageType="collection"
                  value={null}
                  onUploaded={handleImageUploaded}
                  disabled={imageBusy}
                />
              </div>
            </div>
          </section>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#2A2620]">
        <button
          type="button"
          onClick={onClose}
          disabled={savingProducts || imageBusy}
          className="px-4 py-2 rounded-md text-xs font-medium text-[#B8B2A3] hover:text-[#EDE7DD] disabled:opacity-50"
        >
          Done
        </button>
      </div>
    </Modal>
  );
}
