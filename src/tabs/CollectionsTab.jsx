import { useEffect, useState } from 'react';
import { adminApi } from '../api/index.js';
import { SEASON_LABELS, SEASON_STYLES } from '../data/collections.js';
import { CollectionFormModal } from '../components/CollectionFormModal.jsx';
import { ManageCollectionModal } from '../components/ManageCollectionModal.jsx';

export function CollectionsTab() {
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // collection row or null (create)
  const [manageId, setManageId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([adminApi.getCollections(), adminApi.getProducts()])
      .then(([c, p]) => {
        setCollections(Array.isArray(c) ? c : []);
        setProducts(Array.isArray(p) ? p : []);
      })
      .catch((err) => setError(err?.message || 'Could not load collections.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!flash) return undefined;
    const t = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  // The list endpoint returns lightweight summaries; merge what we can from the
  // create/update/manage responses so the row updates without a full reload.
  const upsertRow = (full) => {
    setCollections((prev) => {
      const summary = {
        vstitch_collection_id: full.vstitch_collection_id,
        collection_name: full.collection_name,
        slug: full.slug,
        season: full.season,
        subtitle: full.subtitle ?? null,
        description: full.description ?? null,
        display_order: full.display_order ?? 0,
        is_active: full.is_active !== false,
        product_count: Array.isArray(full.product_ids) ? full.product_ids.length : full.product_count ?? 0,
        primary_image_url: Array.isArray(full.images)
          ? full.images.find((i) => i.is_primary && i.is_active !== false)?.image_url ?? null
          : full.primary_image_url ?? null,
      };
      const idx = prev.findIndex((c) => c.vstitch_collection_id === summary.vstitch_collection_id);
      const next = idx === -1 ? [...prev, summary] : prev.map((c, i) => (i === idx ? { ...c, ...summary } : c));
      return next.sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.vstitch_collection_id - b.vstitch_collection_id
      );
    });
  };

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (row) => { setEditing(row); setFormOpen(true); };

  const handleSaved = (full, action) => {
    upsertRow(full);
    setFlash(`Collection "${full.collection_name}" ${action}.`);
  };

  const toggleActive = async (row) => {
    setBusyId(row.vstitch_collection_id);
    setError(null);
    try {
      if (row.is_active) {
        await adminApi.deleteCollection(row.vstitch_collection_id);
        setCollections((prev) =>
          prev.map((c) => (c.vstitch_collection_id === row.vstitch_collection_id ? { ...c, is_active: false } : c))
        );
        setFlash(`"${row.collection_name}" deactivated — hidden from the storefront.`);
      } else {
        const updated = await adminApi.updateCollection(row.vstitch_collection_id, { is_active: true });
        upsertRow(updated);
        setFlash(`"${row.collection_name}" reactivated.`);
      }
    } catch (err) {
      setError(err?.message || 'Could not change the collection status.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-8">
      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-[#3A1F1F] border border-[#5E2A2A] text-[#E0716A] text-sm flex items-center justify-between gap-4">
          <span className="break-words">{error}</span>
          <button onClick={load} className="underline text-xs shrink-0">Retry</button>
        </div>
      )}
      {flash && (
        <div className="mb-4 px-4 py-3 rounded-md bg-[#1F3A24] border border-[#2A5E36] text-[#6FCF7A] text-sm break-words">{flash}</div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-[#8A8375]">
          {loading ? 'Loading…' : `${collections.length} collection${collections.length === 1 ? '' : 's'}`}
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-md text-xs font-medium bg-[#C9A24B] text-[#1A1712] hover:bg-[#DAB65E]"
        >
          + New Collection
        </button>
      </div>

      <div className="bg-[#1C1914] border border-[#2A2620] rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A2620] text-left text-[11px] uppercase tracking-[0.1em] text-[#8A8375]">
              <th className="px-5 py-3 font-medium">Collection</th>
              <th className="px-5 py-3 font-medium">Season</th>
              <th className="px-5 py-3 font-medium">Slug</th>
              <th className="px-5 py-3 font-medium">Products</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-[#8A8375]">Loading collections…</td></tr>
            )}
            {!loading && collections.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-[#8A8375]">No collections yet. Click “+ New Collection” to create Summer Luxe, Winter and more.</td></tr>
            )}
            {!loading && collections.map((c, i) => (
              <tr key={c.vstitch_collection_id} className={i !== collections.length - 1 ? 'border-b border-[#221E17]' : ''}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {c.primary_image_url
                      ? <img src={c.primary_image_url} alt="" className="w-10 h-10 rounded-md object-cover border border-[#2A2620]" />
                      : <div className="w-10 h-10 rounded-md bg-[#221E17] border border-[#2A2620]" />}
                    <div>
                      <div className="text-[#EDE7DD] font-medium">{c.collection_name}</div>
                      {c.subtitle && <div className="text-[#8A8375] text-xs">{c.subtitle}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs border ${SEASON_STYLES[c.season] || 'bg-[#2A2620] text-[#B8B2A3] border-[#3A362E]'}`}>
                    {SEASON_LABELS[c.season] || c.season}
                  </span>
                </td>
                <td className="px-5 py-4 text-[#B8B2A3] font-mono text-xs">/{c.slug}</td>
                <td className="px-5 py-4 text-[#EDE7DD]">{c.product_count ?? 0}</td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs border ${c.is_active ? 'bg-[#1F3A24] text-[#6FCF7A] border-[#2A5E36]' : 'bg-[#2A2620] text-[#B8B2A3] border-[#3A3428]'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <button onClick={() => setManageId(c.vstitch_collection_id)} className="text-xs font-medium text-[#C9A24B] hover:text-[#DAB65E]">Manage</button>
                    <button onClick={() => openEdit(c)} className="text-xs font-medium text-[#B8B2A3] hover:text-[#EDE7DD]">Edit</button>
                    <button
                      onClick={() => toggleActive(c)}
                      disabled={busyId === c.vstitch_collection_id}
                      className="text-xs font-medium text-[#8A8375] hover:text-[#E0716A] disabled:opacity-50"
                    >
                      {busyId === c.vstitch_collection_id ? '…' : c.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CollectionFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        collection={editing}
        onSaved={handleSaved}
      />

      <ManageCollectionModal
        open={manageId != null}
        onClose={() => setManageId(null)}
        collectionId={manageId}
        allProducts={products}
        onSaved={(full) => upsertRow(full)}
      />
    </div>
  );
}
