import { useState } from 'react';
import { adminApi } from '../api/index.js';
import { ImageUploadField } from './ImageUploadField.jsx';

const ADD_NEW = "__add_new__";

export function CategorySelect({ categories, value, onChange, onCategoryCreated }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newImageUrl, setNewImageUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSelect = (e) => {
    const val = e.target.value;
    if (val === ADD_NEW) {
      setCreating(true);
      setError(null);
      return;
    }
    onChange(val ? Number(val) : "");
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const category = await adminApi.createCategory({ category_name: newName.trim(), image_url: newImageUrl });
      onCategoryCreated(category);
      onChange(category.vstitch_category_id);
      setCreating(false);
      setNewName("");
      setNewImageUrl(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (creating) {
    return (
      <div className="flex flex-col gap-1.5 border border-[#C9A24B] rounded-md p-2">
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreate())}
            placeholder="New category name"
            className="bg-[#141210] border border-[#2A2620] rounded-md px-2.5 py-1.5 text-xs text-[#EDE7DD] focus:outline-none w-32"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving || !newName.trim()}
            className="px-2 py-1.5 rounded-md text-xs font-medium bg-[#C9A24B] text-[#1A1712] hover:bg-[#DAB65E] disabled:opacity-50"
          >
            {saving ? "…" : "Add"}
          </button>
          <button
            type="button"
            onClick={() => { setCreating(false); setError(null); setNewImageUrl(null); }}
            className="text-[#8A8375] hover:text-[#EDE7DD] text-xs px-1"
          >
            ×
          </button>
        </div>
        <ImageUploadField
          imageType="category"
          value={newImageUrl}
          onUploaded={setNewImageUrl}
          onRemove={() => setNewImageUrl(null)}
          disabled={saving}
        />
        {error && <span className="text-[#E0716A] text-[11px]">{error}</span>}
      </div>
    );
  }

  return (
    <select
      value={value || ""}
      onChange={handleSelect}
      className="appearance-none bg-[#141210] border border-[#2A2620] rounded-md px-2.5 py-1.5 text-xs text-[#EDE7DD] focus:outline-none focus:border-[#C9A24B] cursor-pointer w-full"
    >
      <option value="" disabled>Select category</option>
      {categories.map((c) => (
        <option key={c.vstitch_category_id} value={c.vstitch_category_id}>{c.category_name}</option>
      ))}
      <option value={ADD_NEW}>+ Add new category</option>
    </select>
  );
}
