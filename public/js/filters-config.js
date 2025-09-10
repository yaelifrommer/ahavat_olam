// /public/js/filters-config.js — סיווג קנוני מדויק לכיסוי/זקן

import { normCmp } from './shared-normalize.js';

/**
 * מסווג טקסט (גם טקסט העמודה וגם תווית בחירה) לטוקנים קנוניים:
 * cover:dokah:peah | cover:dokah:mitpachat | cover:adif:peah | cover:adif:mitpachat | cover:flex
 * beard:dokah:full | beard:adif:full | beard:shaven_small
 *
 * אם הטקסט לא מזוהה → מחזיר סט ריק (נחשב "לא מוכר" → לא נפסל).
 */

// ----- תבניות זיהוי -----
const DOKAH_PAT = /(דווקא|דוקא)/;
const ADIF_PAT  = /עדיף/;
const FLEX_PAT  = /גמיש/;

const PEAH_PAT        = /פאה(?:\s*נכרית)?/;
const MITP_PAT        = /מטפחת/;
const KISUI_GENERIC   = /כיסוי(?:\s*ראש)?|כיסוי/;

const FULL_BEARD_PAT  = /זקן\s*מלא/;
const SHAVEN_PAT      = /מגולח/;
const SMALL_NEAT_PAT  = /זקן\s*קטן|מסודר/;

function q(s){ return normCmp(s || ''); }

export function classifyCanonicalTokens(text, role) {
  const t = q(text);
  const out = new Set();
  if (!t) return out;

  if (role === 'cover') {
    const isDokah = DOKAH_PAT.test(t);
    const isAdif  = ADIF_PAT.test(t);
    const isFlex  = FLEX_PAT.test(t);

    const hasPeah = PEAH_PAT.test(t);
    const hasMitp = MITP_PAT.test(t);
    const hasKisui= KISUI_GENERIC.test(t);

    if (isFlex) out.add('cover:flex');

    if (isDokah) {
      if (hasPeah) out.add('cover:dokah:peah');
      if (hasMitp) out.add('cover:dokah:mitpachat');
      // "דווקא כיסוי" כללי → לא מוסיף טוקן ספציפי
    } else if (isAdif) {
      if (hasPeah) out.add('cover:adif:peah');
      if (hasMitp) out.add('cover:adif:mitpachat');
    } else if (isFlex && (hasPeah || hasMitp || hasKisui)) {
      out.add('cover:flex');
    }

    return out;
  }

  if (role === 'beard') {
    const isDokah = DOKAH_PAT.test(t);
    const isAdif  = ADIF_PAT.test(t);
    const isFull  = FULL_BEARD_PAT.test(t);
    const isShave = SHAVEN_PAT.test(t);
    const isSmall = SMALL_NEAT_PAT.test(t);

    if (isDokah && isFull)  out.add('beard:dokah:full');
    if (isAdif  && isFull)  out.add('beard:adif:full');
    if (isShave || isSmall) out.add('beard:shaven_small');

    return out;
  }

  return out;
}

/**
 * canonicalAnyOf:
 *  - ממפה בחירות משתמש לטוקנים קנוניים לפי role,
 *  - ממפה טקסט שדה לטוקנים,
 *  - אם טקסט השדה לא מסווג (סט ריק) → "לא מוכר" → לא לפסול (true),
 *  - אחרת: צריך חיתוך מדויק בין הטוקנים שנבחרו לבין טוקני הרשומה.
 */
export function canonicalAnyOf(fieldText, selectedLabels, role) {
  const chosenTokens = (selectedLabels || [])
    .map(lbl => Array.from(classifyCanonicalTokens(lbl, role)))
    .flat()
    .filter(Boolean);

  if (!chosenTokens.length) return true; // אין בחירות → לא מסננים

  const rowTokens = classifyCanonicalTokens(fieldText, role);
  if (!rowTokens.size) return true; // “בטטה” → לא מפיל

  for (const tok of chosenTokens) {
    if (rowTokens.has(tok)) return true; // חיתוך מדויק
  }
  return false;
}

/** זיהוי role לפי מגדר וסקשן (actual/expected) */
export function roleForSection(gender, section /* 'actual' | 'expected' */) {
  const g = q(gender);
  if (section === 'actual') {
    return g === 'זכר' ? 'beard' : g === 'נקבה' ? 'cover' : null;
  }
  // expected (הפוך)
  return g === 'זכר' ? 'cover' : g === 'נקבה' ? 'beard' : null;
}
