// utils/normalize.js
export function normalizeText(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/\r/g, '')
    .replace(/[\u200E\u200F\u202A-\u202E\u00A0]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function toNumberSafe(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

// אם מישהו הזין ס"מ (מעל 10) נהפוך למטרים; עיגול ל-2 ספרות
export function normalizeHeight(v) {
  const n = toNumberSafe(v);
  if (n == null) return null;
  const meters = n > 10 ? n / 100 : n;
  return Math.round(meters * 100) / 100;
}
