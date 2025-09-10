// /public/js/shared-normalize.js
export function normalizeText(v) {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/\r/g, '')
    .replace(/[\u200E\u200F\u202A-\u202E\u00A0]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
export function normCmp(v) { return normalizeText(v).toLowerCase(); }

// מציאת ערך לעמודה לפי וריאנטים
export function getField(row, variants) {
  if (!row || !variants) return '';
  const keys = Object.keys(row);
  for (const key of keys) {
    for (const cand of variants) {
      if (normCmp(key) === normCmp(cand)) {
        return normalizeText(row[key]);
      }
    }
  }
  return '';
}

// מספר/גובה
export function toNumberOrNull(v) {
  const t = normalizeText(v);
  if (!t) return null;
  const m = t.replace(/[^\d.\-]/g, '');
  if (!m) return null;
  const num = Number(m);
  return Number.isFinite(num) ? num : null;
}
/** >10 נחשב ס״מ → /100; החזרה במטרים עם 2 ספרות */
export function normalizeHeight(v) {
  const n = toNumberOrNull(v);
  if (n === null) return null;
  const meters = n > 10 ? n / 100 : n;
  return Math.round(meters * 100) / 100;
}

// ANY-OF כללי
export function anyOfIncludes(fieldText, selected) {
  const t = normCmp(fieldText);
  if (!t) return selected.length === 0 ? true : false;
  if (!selected || selected.length === 0) return true;
  const picks = selected.map(normCmp).filter(Boolean);
  return picks.some(p => t.includes(p));
}

// ==== COLS וכו' (כפי שהיה אצלך, ללא שינוי לוגי) ====
export const COLS = {
  ETHNICITY: ["עדה", "פירוט עדה", "פירוט העדה"],
  GENDER: ["זכר/נקבה", "מידע- זכר/נקבה ", "מגדר"],
  GROUP: ["מס' קבוצה בארגון", "מס’ קבוצה בארגון", "מס׳ קבוצה בארגון"],
  NAME: ["שם", "שם מלא", "שם פרטי"],
  CODE: ["קוד"],
  ID: ['ת"ז', 'ת״ז', 'תז'],
  ETH_DETAIL: ["פירוט עדה", "פירוט העדה"],
  PHONE: ["טלפון", "טלפון נייד", "נייד"],
  EMAIL: ["כתובת מייל", "אימייל", "דוא\"ל", "דואל"],
  ADDRESS: ["כתובת","כתובת מגורים","עיר","יישוב","__EMPTY","__EMPTY_1","__EMPTY_2","__EMPTY_21","__EMPTY_22"],
  SMOKER: ["מעשן"],
  KASHRUT_PHONE: ["כשרות טלפון"],
  HELP_APT: ["עזרה לדירה", "ציפיות לעזרה בקניית דירה"],
  NOTES: ["הערות"],
  LOOKS: ["מראה"],
  HEIGHT: ["גובה"],
  COVERING: ["כיסוי ראש/ הזקן", "כיסוי ראש / הזקן", "זקן/כיסוי ראש"],
  TRAITS: ["תכונות"],
  JOB_STUDY: ["תעסוקה/לימודים כיום"],
  YESHIVA_BIG: ["ישיבה גדולה/ סמינרים", "סמינרים"],
  YESHIVA_SMALL: ["ישיבה קטנה/ קודמים"],
  AGE: ["גיל", "2.0"],
  MANUAL_AGE: ["גיל ידני"],
  EXPECT_PARTNER_COVERING: [
    "למועמדת הציפיות ממראה הזקן של הבן זוג/ למועמד הציפיות לכיסוי ראש של הבת זוג",
    "ציפיות מראה/כיסוי ראש",
    "ציפיות כיסוי/זקן"
  ],
  EXPECT_QUALITIES: ["ציפיות לתכונות", "תכונות מבוקשות"],
  EXPECT_AGE: ["ציפיות לגיל"],
  TORAH_DAY: ["הרצון ללמוד יום שלם", "הרצון ללמוד תורה"],
  EXPECT_APT: ["ציפיות לעזרה בקניית דירה"],
  FATHER: ["פרטים על האב"],
  MOTHER: ["פרטים על האם"],
  SIBLINGS_SINGLE: ["אחים לא נשואים", "אחים/אחיות לא נשואים"],
  SIBLINGS_MARRIED: ["אחים נשואים", "אחים/אחיות נשואים"],
  INLAWS: ["מחותנים"],
  INQUIRIES: ["בירורים"],
  MARITAL: ["מצב שלך", "מצב משפחתי"],
  DIV_MARRIAGE_DURATION: ["זמן הנישואין"],
  DIV_SINCE: ["הזמן שחלף מאז הגירושין"],
  DIV_REASON: ["הסיבה לגירושין"],
  DIV_AT: ["@"],
  DIV_CHILDREN_MARRIED: ["ילדים נשואים"],
  DIV_CHILDREN_DETAILS: ["פירוט הילדים ומגוריהם", "פירוט הילדים ומגוריהם:"],
  DIV_ALIMONY: ["מזונות"],
  SUGGESTIONS: ["הצעות מהתוכנה"],
  DROPPED: ["הצעות שירדו"],
  PHOTO: ["תמונה", "קישור תמונה", "תמונת המועמד", "תמונת מועמד", "תמונת המועמד/ת"],
};

// סיווג (כפי שהיה)
const ETH_CANON = ["אשכנז", "ספרד", "חסידי", "תימן"];
const ETH_SYNONYMS = {
  "אשכנז": ["אשכנז", "אשכנזי", "אשכנזים", "ליטאי", "ליטאים", "ליטאיים"],
  "ספרד": ["ספרד", "ספרדי", "ספרדים", "מזרחי", "מזרחיים", "מרוקאי", "מרוקאים", "תוניסאי", "תוניסאים", "ספרדים-מרוקאים"],
  "חסידי": ["חסידי", "חסיד", "חסידים", "חסידות"],
  "תימן": ["תימן", "תימני", "תימנים", "תימנית"],
};
const GENDER_SYNONYMS = {
  "זכר": ["זכר", "בן", "בחור", "גבר", "male"],
  "נקבה": ["נקבה", "בת", "בחורה", "אשה", "אישה", "female"],
};
export function classifyEthnicity(v) {
  const t = normCmp(v); if (!t) return null;
  for (const canon of ETH_CANON) {
    const needles = ETH_SYNONYMS[canon] || [canon];
    if (needles.some(n => t.includes(normCmp(n)))) return canon;
  }
  return null;
}
export function classifyGender(v) {
  const t = normCmp(v); if (!t) return null;
  for (const canon of Object.keys(GENDER_SYNONYMS)) {
    const needles = GENDER_SYNONYMS[canon];
    if (needles.some(n => t.includes(normCmp(n)))) return canon;
  }
  return null;
}

// תמונה – רק מהשדה, אם אין קישור → ריק
export function extractPhotoUrl(row){
  const raw = getField(row, COLS.PHOTO);
  const t = normalizeText(raw);
  if (!t) return '';
  const m = t.match(/https?:\/\/[^\s"'<>)]*/i);
  return m ? m[0] : '';
}
