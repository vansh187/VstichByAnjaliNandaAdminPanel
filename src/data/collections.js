// Mirrors the Collections Admin API contract (see COLLECTIONS_API_CONTRACT.md).

export const SEASONS = ['SUMMER', 'WINTER', 'SPRING', 'AUTUMN'];

export const SEASON_LABELS = {
  SUMMER: 'Summer',
  WINTER: 'Winter',
  SPRING: 'Spring',
  AUTUMN: 'Autumn',
};

export const SEASON_STYLES = {
  SUMMER: 'bg-[#3A2E1F] text-[#D9A441] border-[#5A4726]',
  WINTER: 'bg-[#1F2E3A] text-[#5FA8D3] border-[#2A4A5E]',
  SPRING: 'bg-[#1F3A24] text-[#6FCF7A] border-[#2A5E36]',
  AUTUMN: 'bg-[#3A2A1F] text-[#D19A6A] border-[#5E3E2A]',
};

// The backend enforces this exact pattern on `slug` (1–120 chars).
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Best-effort slug suggestion from a collection name. The admin can still edit
// the field; the API is the final authority on validity/uniqueness.
export function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}
