// /public/js/filters-ui.js — UI: נראות פאנלים, בחירה/ניקוי, עזרי רב־בחירה
import { normalizeText } from './shared-normalize.js';
import { roleForSection } from './filters-config.js';

/** החזרת רשימת ערכים מסומנים עבור קומבינציית data-multi */
export function getMultiSelected(name) {
  return Array
    .from(document.querySelectorAll(`input[type="checkbox"][data-multi="${name}"]:checked`))
    .map(b => normalizeText(b.value))
    .filter(Boolean);
}

/** נקה את כל ה-checkbox-ים בכל הרב־בחירות */
export function clearAllMulti() {
  document.querySelectorAll('input[type="checkbox"][data-multi]').forEach(cb => cb.checked = false);
}

/**
 * מציג/מסתיר את סקשני הכיסוי בהתאם למגדר, וגם מסנן בתוך כל סקשן את האופציות לפי role:
 *  - actual: זכר→beard, נקבה→cover
 *  - expected: הפוך
 * הסתרת אופציה גם מנקה את ה-checkbox שלה כדי למנוע השפעה חבויה.
 */
export function updateCoverPanelsVisibility(genEl, sections) {
  const selectedGen = normalizeText(genEl?.value);
  const show = !!selectedGen;

  // הצג/הסתר פאנלים
  if (sections.actualCover)   sections.actualCover.hidden   = !show;
  if (sections.expectedCover) sections.expectedCover.hidden = !show;

  if (!show) {
    // אם אין מגדר—ניקוי בטוח של כל הבחירות בשני הפאנלים
    sections.actualCover?.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    sections.expectedCover?.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    return;
  }

  // קבע role לכל פאנל לפי המגדר
  const actualRole   = roleForSection(selectedGen, 'actual');   // 'beard' | 'cover'
  const expectedRole = roleForSection(selectedGen, 'expected'); // 'beard' | 'cover'

  toggleRoleOptions(sections.actualCover, actualRole);
  toggleRoleOptions(sections.expectedCover, expectedRole);
}

function toggleRoleOptions(panel, role /* 'beard'|'cover' */) {
  if (!panel) return;
  const labels = panel.querySelectorAll('label[data-role]');
  labels.forEach(lab => {
    const r = lab.getAttribute('data-role');
    const shouldShow = (r === role);
    const cb = lab.querySelector('input[type="checkbox"]');
    if (shouldShow) {
      lab.hidden = false;
      lab.style.display = '';
    } else {
      lab.hidden = true;
      lab.style.display = 'none';
      if (cb) cb.checked = false; // חשוב: ניקוי בחירה על אופציה חבויה
    }
  });
}

/** מאזין כללי ל"בחר הכל/נקה" — פועל רק על אופציות נראות לעין (לא חבויות); CSP-safe */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-select-all],[data-clear-all]');
  if (!btn) return;
  const key = btn.getAttribute('data-select-all') || btn.getAttribute('data-clear-all');
  const check = !!btn.getAttribute('data-select-all');
  document.querySelectorAll(`input[type="checkbox"][data-multi="${key}"]`).forEach(cb => {
    const lab = cb.closest('label');
    // משנים רק מה שנראה בפועל (offsetParent !== null)
    if (lab && lab.offsetParent !== null) {
      cb.checked = check;
    }
  });
});
