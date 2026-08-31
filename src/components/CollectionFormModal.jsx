import { useEffect, useState } from 'react';
import { Modal } from './Modal.jsx';
import { adminApi } from '../api/index.js';
import { SEASONS, SEASON_LABELS, SLUG_PATTERN, slugify } from '../data/collections.js';

const FIELD = 'w-full bg-[#141210] border border-[#2A2620] rounded-md px-3 py-2 text-sm text-[#EDE7DD] focus:outline-none focus:border-[#C9A24B]';
const LABEL = 'text-[10px] uppercase tracking-[0.1em] text-[#8A8375] block mb-1';

function blankForm() {
  return {
    collection_name: '',
    slug: '',
    season: 'SUMMER',
    subtitle: '',
    description: '',
    display_order: '0',
    is_active: true,
  };
}

// Create a new collection, or edit an existing one's metadata. `collection`
// null => create mode; otherwise the row being edited.
export function CollectionFormModal({ open, onClose, collection, onSaved }) {
  const isEdit = !!collection;
  const [form, setForm] = useState(blankForm());
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSaving(false);
    if (collection) {
      setForm({
        collection_name: collection.collection_name || '',
        slug: collection.slug || '',
        season: collection.season || 'SUMMER',
        subtitle: collection.subtitle || '',
        description: collection.description || '',
        display_order: String(collection.display_order ?? 0),
        is_active: collection.is_active !== false,
      });
      setSlugTouched(true); // never auto-rewrite an existing slug
    } else {
      setForm(blankForm());
      setSlugTouched(false);
    }
  }, [open, collection]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const onNameChange = (value) => {
    set({ collection_name: value, ...(slugTouched ? {} : { slug: slugify(value) }) });
  };

  const validate = () => {
    if (!form.collection_name.trim()) return 'Collection name is required.';
    if (form.collection_name.length > 250) return 'Collection name must be 250 characters or fewer.';
    if (!form.slug.trim()) return 'Slug is required.';
    if (!SLUG_PATTERN.test(form.slug)) return 'Slug may only contain lowercase letters, digits and single hyphens (e.g. summer-luxe).';
    if (form.slug.length > 120) return 'Slug must be 120 characters or fewer.';
    if (form.display_order !== '' && (!Number.isInteger(Number(form.display_order)) || Number(form.display_order) < 0)) {
      return 'Display order must be a whole number ≥ 0.';
    }
    return null;
  };

  const handleSubmit = async () => {
    const localError = validate();
    if (localError) {
      setError(localError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        const patch = {
          collection_name: form.collection_name.trim(),
          slug: form.slug.trim(),
          season: form.season,
          subtitle: form.subtitle.trim() ? form.subtitle.trim() : null,
          description: form.description.trim() ? form.description.trim() : null,
          display_order: Number(form.display_order) || 0,
          is_active: form.is_active,
        };
        const updated = await adminApi.updateCollection(collection.vstitch_collection_id, patch);
        onSaved(updated, 'updated');
      } else {
        const body = {
          collection_name: form.collection_name.trim(),
          slug: form.slug.trim(),
          season: form.season,
          is_active: form.is_active,
          display_order: Number(form.display_order) || 0,
        };
        if (form.subtitle.trim()) body.subtitle = form.subtitle.trim();
        if (form.description.trim()) body.description = form.description.trim();
        const created = await adminApi.createCollection(body);
        onSaved(created, 'created');
      }
      onClose();
    } catch (err) {
      setError(err?.message || 'Could not save the collection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={isEdit ? 'Edit Collection' : 'New Collection'}
      subtitle={isEdit ? collection?.collection_name : 'Create a seasonal collection, then add products to it'}
    >
      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-[#3A1F1F] border border-[#5E2A2A] text-[#E0716A] text-sm break-words">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={LABEL}>Collection Name</label>
          <input
            value={form.collection_name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Summer Luxe"
            className={FIELD}
          />
        </div>
        <div>
          <label className={LABEL}>Slug (storefront URL key)</label>
          <input
            value={form.slug}
            onChange={(e) => { setSlugTouched(true); set({ slug: e.target.value }); }}
            placeholder="summer-luxe"
            className={`${FIELD} font-mono`}
          />
        </div>
        <div>
          <label className={LABEL}>Season</label>
          <select value={form.season} onChange={(e) => set({ season: e.target.value })} className={`${FIELD} cursor-pointer`}>
            {SEASONS.map((s) => (
              <option key={s} value={s}>{SEASON_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Subtitle <span className="normal-case tracking-normal text-[#6E6858]">(optional)</span></label>
          <input
            value={form.subtitle}
            onChange={(e) => set({ subtitle: e.target.value })}
            placeholder="Lightweight luxury for the warm months"
            maxLength={300}
            className={FIELD}
          />
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Description <span className="normal-case tracking-normal text-[#6E6858]">(optional)</span></label>
          <textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={3}
            placeholder="A hand-picked edit of our airiest, most elegant pieces."
            className={`${FIELD} resize-y`}
          />
        </div>
        <div>
          <label className={LABEL}>Display Order</label>
          <input
            type="number"
            min="0"
            value={form.display_order}
            onChange={(e) => set({ display_order: e.target.value })}
            className={FIELD}
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-[#B8B2A3]">
            <input type="checkbox" checked={form.is_active} onChange={(e) => set({ is_active: e.target.checked })} />
            Active on storefront
          </label>
        </div>
      </div>

      <p className="text-xs text-[#6E6858] mt-4">
        {isEdit
          ? 'Products and banner images are managed from the "Manage" screen.'
          : 'A new collection starts empty — add products and a banner image after creating it.'}
      </p>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#2A2620]">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 rounded-md text-xs font-medium text-[#B8B2A3] hover:text-[#EDE7DD] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="px-4 py-2 rounded-md text-xs font-medium bg-[#C9A24B] text-[#1A1712] hover:bg-[#DAB65E] disabled:opacity-50"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Collection'}
        </button>
      </div>
    </Modal>
  );
}
