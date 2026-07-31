import { useRef, useState } from 'react';
import { adminApi } from '../api/index.js';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB, matches the limit documented for backend team
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Mock mode returns blob: object URLs (see mockAdapter.uploadImage) which
// stay pinned in memory until explicitly revoked — real https:// URLs from
// the backend need no cleanup, so this is a no-op against them.
function revokeIfBlob(url) {
  if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
}

// Shared upload control for both category images (imageType="category") and
// product images (imageType="product") — uploads immediately on file select
// and hands the resulting image_url back to the parent via onUploaded, so
// the parent never has to know this is a file input instead of a URL field.
export function ImageUploadField({ imageType, value, onUploaded, onRemove, disabled }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [justUploaded, setJustUploaded] = useState(false);

  const pickFile = () => inputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, or WEBP images are allowed.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    setError(null);
    setJustUploaded(false);
    setUploading(true);
    try {
      const { image_url } = await adminApi.uploadImage(file, imageType);
      revokeIfBlob(value);
      onUploaded(image_url);
      setJustUploaded(true);
      setTimeout(() => setJustUploaded(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    revokeIfBlob(value);
    onRemove();
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploading}
      />
      {value ? (
        <div className="flex items-center gap-2">
          <img src={value} alt="Uploaded preview" className="w-12 h-12 rounded-md object-cover border border-[#2A2620]" />
          <button
            type="button"
            onClick={pickFile}
            disabled={disabled || uploading}
            className="text-xs font-medium text-[#C9A24B] hover:text-[#DAB65E] disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Change'}
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || uploading}
              className="text-xs font-medium text-[#8A8375] hover:text-[#E0716A] disabled:opacity-50"
            >
              Remove photo
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={pickFile}
          disabled={disabled || uploading}
          className="px-3 py-2 rounded-md text-xs font-medium border border-[#2A2620] text-[#B8B2A3] hover:border-[#C9A24B] hover:text-[#EDE7DD] disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : '+ Upload Image'}
        </button>
      )}
      {justUploaded && <p className="text-[#6FCF7A] text-xs mt-1">Image uploaded successfully.</p>}
      {error && <p className="text-[#E0716A] text-xs mt-1">{error}</p>}
    </div>
  );
}
