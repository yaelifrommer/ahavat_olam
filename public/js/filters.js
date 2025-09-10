// /public/js/filters.js  — קובץ מלא

import {
  normalizeText, normCmp, getField, COLS,
  classifyEthnicity, classifyGender, extractPhotoUrl,
  toNumberOrNull, normalizeHeight, anyOfIncludes
} from './shared-normalize.js';

import {
  canonicalAnyOf, roleForSection
 } from './filters-config.js';

import {
  updateCoverPanelsVisibility, clearAllMulti, getMultiSelected
} from './filters-ui.js';

/* ====== אלמנטים ====== */
const groupEl   = document.getElementById('groupSelect');
const ethEl     = document.getElementById('ethnicitySelect');
const genEl     = document.getElementById('genderSelect');
const statusEl  = document.getElementById('statusSelect');

const ageMinEl  = document.getElementById('ageMin');
const ageMaxEl  = document.getElementById('ageMax');

const hMinEl    = document.getElementById('heightMin');
const hMaxEl    = document.getElementById('heightMax');

const applyEl   = document.getElementById('applyBtn');
const resetEl   = document.getElementById('resetBtn');
const gateMsg   = document.getElementById('gateMsg');
const statsEl   = document.getElementById('stats');

const searchBox     = document.getElementById('searchFilteredInput');
const searchBtn     = document.getElementById('searchFilteredBtn');
const searchSection = document.querySelector('.search');
const cardsEl       = document.getElementById('cards');

/* סקשני רב־בחירה */
const multiSections = {
  actualCover:   document.querySelector('[data-multi-section="cover-actual"]'),
  expectedCover: document.querySelector('[data-multi-section="cover-expected"]'),
  kosherPhone:   document.querySelector('[data-multi-section="kosher-phone"]'),
  torah:         document.querySelector('[data-multi-section="torah"]'),
};

/* ====== נתונים ====== */
let ALL_ROWS = [];
let FILTERED = [];

/* ====== Gatekeeper ====== */
function matchGatekeeper() {
  const g = normalizeText(groupEl?.value);
  const e = normalizeText(ethEl?.value);
  const s = normalizeText(genEl?.value);
  if (g) return true;
  return !!(e && s);
}

/* ====== קלטים ====== */
function getAgeMin() { return toNumberOrNull(ageMinEl?.value); }
function getAgeMax() { return toNumberOrNull(ageMaxEl?.value); }
/** נרמל גם את קלט המשתמש: 170 → 1.70 */
function getHeightMin() { return normalizeHeight(hMinEl?.value); }
function getHeightMax() { return normalizeHeight(hMaxEl?.value); }

/* ========================= סינון שורות ========================= */
function rowPassesFilters(row) {
  if (!matchGatekeeper()) return false;

  // group
  const selectedGroup = normalizeText(groupEl?.value);
  if (selectedGroup) {
    const rowGroup = getField(row, COLS.GROUP);
    if (normCmp(rowGroup) !== normCmp(selectedGroup)) return false;
  }

  // ethnicity
  const selectedEth = normalizeText(ethEl?.value);
  if (selectedEth) {
    const rowEth = classifyEthnicity(getField(row, COLS.ETHNICITY));
    if (rowEth !== null && normCmp(rowEth) !== normCmp(selectedEth)) return false;
  }

  // gender
  const selectedGen = normalizeText(genEl?.value);
  if (selectedGen) {
    const rowGen = classifyGender(getField(row, COLS.GENDER));
    if (rowGen !== null && normCmp(rowGen) !== normCmp(selectedGen)) return false;
  }

  // marital/status
  const selectedStatus = normalizeText(statusEl?.value);
  if (selectedStatus) {
    const rowStatus = getField(row, COLS.MARITAL);
    if (normCmp(rowStatus) !== normCmp(selectedStatus)) return false;
  }

  // age range (null-safe)
  const minAge = getAgeMin(); const maxAge = getAgeMax();
  if (minAge !== null || maxAge !== null) {
    const ageRaw = getField(row, COLS.AGE) || getField(row, COLS.MANUAL_AGE);
    const age = toNumberOrNull(ageRaw);
    if (age !== null) {
      if (minAge !== null && age < minAge) return false;
      if (maxAge !== null && age > maxAge) return false;
    }
  }

  // height range (null-safe) – השווה במטרים
  const minH = getHeightMin(); const maxH = getHeightMax();
  if (minH !== null || maxH !== null) {
    const rowH = normalizeHeight(getField(row, COLS.HEIGHT));
    if (rowH !== null) {
      if (minH !== null && rowH < minH) return false;
      if (maxH !== null && rowH > maxH) return false;
    }
  }

  // ==== ANY-OF ====

  // כיסוי/זקן בפועל – תפקיד הרול נגזר מהמגדר; "לא מוכר" לא מפיל
  const actualPicks = getMultiSelected('actualCover');
  if (selectedGen && actualPicks.length) {
    const role = roleForSection(selectedGen, 'actual'); // beard | cover
    const fieldText = getField(row, COLS.COVERING);
    if (role && !canonicalAnyOf(fieldText, actualPicks, role)) return false;
  }

  // ציפיות – הפוך מהמגדר; "לא מוכר" לא מפיל
  const expectedPicks = getMultiSelected('expectedCover');
  if (selectedGen && expectedPicks.length) {
    const role = roleForSection(selectedGen, 'expected'); // beard | cover
    const expText = getField(row, COLS.EXPECT_PARTNER_COVERING);
    if (role && !canonicalAnyOf(expText, expectedPicks, role)) return false;
  }

  // כשרות טלפון
  const kosherPicks = getMultiSelected('kosherPhone');
  if (kosherPicks.length) {
    const phoneText = getField(row, COLS.KASHRUT_PHONE);
    if (!anyOfIncludes(phoneText, kosherPicks)) return false;
  }

  // תורה
  const torahPicks = getMultiSelected('torah');
  if (torahPicks.length) {
    const torahText = getField(row, COLS.TORAH_DAY);
    if (!anyOfIncludes(torahText, torahPicks)) return false;
  }

  return true;
}

/* ========================= תצוגה + רזומה ========================= */
// תוויות עבריות יפות
const LABELS = {
  [COLS.NAME[0]]: "שם",
  [COLS.CODE[0]]: "קוד",
  [COLS.GROUP[0]]: "מס' קבוצה בארגון",
  [COLS.GENDER[0]]: "מגדר",
  [COLS.ETHNICITY[0]]: "עדה",
  [COLS.ETH_DETAIL[0]]: "פירוט העדה",
  [COLS.AGE[0]]: "גיל",
  [COLS.MANUAL_AGE[0]]: "גיל ידני",
  [COLS.ID[0]]: "ת\"ז",
  [COLS.PHONE[0]]: "טלפון",
  [COLS.EMAIL[0]]: "מייל",
  [COLS.ADDRESS[0]]: "כתובת",
  [COLS.LOOKS[0]]: "מראה",
  [COLS.HEIGHT[0]]: "גובה",
  [COLS.COVERING[0]]: "כיסוי ראש/זקן",
  [COLS.TRAITS[0]]: "תכונות",
  [COLS.JOB_STUDY[0]]: "תעסוקה/לימודים",
  [COLS.YESHIVA_BIG[0]]: "ישיבה גדולה/סמינר",
  [COLS.YESHIVA_SMALL[0]]: "ישיבה קטנה/קודמים",
  [COLS.EXPECT_AGE[0]]: "ציפיות לגיל",
  [COLS.EXPECT_PARTNER_COVERING[0]]: "ציפיות כיסוי/זקן",
  [COLS.EXPECT_QUALITIES[0]]: "ציפיות לתכונות",
  [COLS.HELP_APT[0]]: "עזרה לדירה",
  [COLS.KASHRUT_PHONE[0]]: "כשרות טלפון",
  [COLS.SMOKER[0]]: "מעשן",
  [COLS.NOTES[0]]: "הערות",
  [COLS.SUGGESTIONS[0]]: "הצעות מהתוכנה",
  [COLS.DROPPED[0]]: "הצעות שירדו",
  [COLS.TORAH_DAY[0]]: "הרצון ללמוד יום שלם",
  [COLS.EXPECT_APT[0]]: "ציפיות לעזרה בקניית דירה",
  [COLS.FATHER[0]]: "פרטים על האב",
  [COLS.MOTHER[0]]: "פרטים על האם",
  [COLS.SIBLINGS_SINGLE[0]]: "אחים לא נשואים",
  [COLS.SIBLINGS_MARRIED[0]]: "אחים נשואים",
  [COLS.INLAWS[0]]: "מחותנים",
  [COLS.INQUIRIES[0]]: "בירורים",
  [COLS.MARITAL[0]]: "מצב משפחתי",
  [COLS.DIV_MARRIAGE_DURATION[0]]: "זמן הנישואין",
  [COLS.DIV_SINCE[0]]: "הזמן שחלף מאז הגירושין",
  [COLS.DIV_REASON[0]]: "הסיבה לגירושין",
  [COLS.DIV_AT[0]]: "ילדים",
  [COLS.DIV_CHILDREN_MARRIED[0]]: "ילדים נשואים",
  [COLS.DIV_CHILDREN_DETAILS[0]]: "פירוט הילדים ומגוריהם",
  [COLS.DIV_ALIMONY[0]]: "מזונות",
};

// canonicalKey -> וריאנטים
const FIELD_MAP = {
  name: COLS.NAME,
  code: COLS.CODE,
  group: COLS.GROUP,
  gender: COLS.GENDER,
  ethnicity: COLS.ETHNICITY,
  ethDetail: COLS.ETH_DETAIL,
  age: COLS.AGE,
  id: COLS.ID,
  phone: COLS.PHONE,
  email: COLS.EMAIL,
  address: COLS.ADDRESS,
  looks: COLS.LOOKS,
  height: COLS.HEIGHT,
  covering: COLS.COVERING,
  traits: COLS.TRAITS,
  jobStudy: COLS.JOB_STUDY,
  yBig: COLS.YESHIVA_BIG,
  ySmall: COLS.YESHIVA_SMALL,
  expectAge: COLS.EXPECT_AGE,
  expectCovering: COLS.EXPECT_PARTNER_COVERING,
  expectQualities: COLS.EXPECT_QUALITIES,
  helpApt: COLS.HELP_APT,
  kashrutPhone: COLS.KASHRUT_PHONE,
  smoker: COLS.SMOKER,
  notes: COLS.NOTES,

  torahDay: COLS.TORAH_DAY,
  expectApt: COLS.EXPECT_APT,
  father: COLS.FATHER,
  mother: COLS.MOTHER,
  siblingsSingle: COLS.SIBLINGS_SINGLE,
  siblingsMarried: COLS.SIBLINGS_MARRIED,
  inlaws: COLS.INLAWS,
  inquiries: COLS.INQUIRIES,
  marital: COLS.MARITAL,
  divMarriageDuration: COLS.DIV_MARRIAGE_DURATION,
  divSince: COLS.DIV_SINCE,
  divReason: COLS.DIV_REASON,
  divAt: COLS.DIV_AT,
  divChildrenMarried: COLS.DIV_CHILDREN_MARRIED,
  divChildrenDetails: COLS.DIV_CHILDREN_DETAILS,
  divAlimony: COLS.DIV_ALIMONY,

  suggestions: COLS.SUGGESTIONS,
  dropped: COLS.DROPPED,
};

// לרזומה: כל השדות חוץ מהמוחרגים
const RESUME_INCLUDE = Object.keys(FIELD_MAP).filter(k =>
  !["phone","email","id","code","group","suggestions","dropped","manualAge","marital"].includes(k)
);


/* =========== Parsers להצעות/שירדו =========== */
function parseSuggestionsByTemplate(raw) {
  const text = normalizeText(raw);
  if (!text) return [];

  const parts = text
    .split(/הצעה נוספת למועמד\/ת/)
    .map(normalizeText)
    .filter(Boolean);

  const out = [];

  for (const part of parts) {
    const both = part.match(/[-–—]*\s*([\u0590-\u05FF][\u0590-\u05FF\s"׳״\-.]+?)\s+קוד\s*[:\-]?\s*([A-Za-z]\d{3,5})/);
    if (both) {
      const name = normalizeText(both[1]);
      const code = normalizeText(both[2]).toUpperCase();
      if (name && code) out.push({ name, code });
      continue;
    }

    const lines = part.split(/\n/).map(normalizeText).filter(Boolean);
    if (!lines.length) continue;

    let name = lines[0].replace(/^[-–—]+\s*/, '');
    name = name.split(/\s+קוד\s*[:\-]?/)[0].trim();

    const codeMatch = part.match(/קוד\s*[:\-]?\s*([A-Za-z]\d{3,5})/i);
    const code = codeMatch ? codeMatch[1].toUpperCase() : '';

    if (name && code) out.push({ name, code });
  }

  const uniq = [];
  const seen = new Set();
  for (const e of out) {
    const key = `${e.name}|${e.code}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniq.push(e);
    }
  }
  return uniq;
}

function parseSuggestionsFallback(raw) {
  const text = normalizeText(raw);
  if (!text) return [];

  const lines = text.split(/\n/);

  const isLikelyName = (s) => {
    const t = normalizeText(s);
    if (!t) return false;
    if (/https?:\/\//i.test(t)) return false;
    if (/[:]/.test(t)) return false;
    if (/הצעה נוספת/.test(t)) return false;
    if (/\d{7,}/.test(t)) return false;
    return /[\u0590-\u05FF]{2,}/.test(t);
  };

  const results = [];
  let lastName = '';
  let distanceFromName = 999;
  const NAME_CODE_WINDOW = 80;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] ?? '';
    const t = normalizeText(rawLine);

    if (/הצעה נוספת/.test(t)) {
      lastName = '';
      distanceFromName = 999;
      continue;
    }

    if (isLikelyName(t)) {
      lastName = t.split(/\s+קוד\s*[:\-]?/)[0].replace(/^[-–—]+\s*/, '').trim();
      distanceFromName = 0;
    } else {
      distanceFromName++;
    }

    const codes = t.match(/\b([A-Za-z]\d{3,5})\b/g) || [];
    for (const rawCode of codes) {
      const code = normalizeText(rawCode).toUpperCase();
      if (/@/.test(code)) continue;
      const nameForThis = distanceFromName <= NAME_CODE_WINDOW ? lastName : '';
      if (code) results.push({ name: nameForThis, code });
    }
  }

  const uniq = [];
  const seen = new Set();
  for (const e of results) {
    const key = `${e.name}|${e.code}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniq.push(e);
    }
  }
  return uniq;
}

/* Parser ל"הצעות שירדו" (רק קודים) */
function parseDropped(raw) {
  const text = normalizeText(raw);
  if (!text) return [];

  const codes = text.match(/\b([A-Za-z]\d{3,5})\b/g) || [];

  const uniq = [];
  const seen = new Set();
  for (const c of codes.map(c => c.toUpperCase())) {
    if (!seen.has(c)) {
      seen.add(c);
      uniq.push(c);
    }
  }
  return uniq;
}

/* מחזיר זוגות [label, value] לכל השדות להצגה בכרטיס */
function collectDisplayPairs(row) {
  const pairs = [];

  for (const [ckey, variants] of Object.entries(FIELD_MAP)) {
    // לא להציג "מצב משפחתי" שוב בגוף הכרטיס (מופיע בכותרת)
    if (ckey === "marital") continue;

    let val = getField(row, variants);
    if (!normalizeText(val)) continue;

    const label = LABELS[variants[0]] || variants[0];

    if (ckey === "suggestions") {
      let parsed = parseSuggestionsByTemplate(val);
      if (!parsed.length) parsed = parseSuggestionsFallback(val);
      const pretty = parsed.length
        ? parsed.map(p => {
            const nm = normalizeText(p.name);
            const cd = normalizeText(p.code);
            return `${nm ? `${nm}\n` : ''}${cd ? `קוד: ${cd}` : ''}`;
          }).join('\n\n')
        : '';
      if (pretty) {
        pairs.push([label, { type: 'pre', text: pretty }]);
      }
      continue;
    }

    if (ckey === "dropped") {
      const codes = parseDropped(val);
      const pretty = codes.length ? codes.map(c => `קוד: ${c}`).join('\n\n') : '';
      if (pretty) {
        pairs.push([label, { type: 'pre', text: pretty }]);
      }
      continue;
    }

    // שדות רגילים
    pairs.push([label, normalizeText(val)]);
  }

  return pairs;
}


/* רזומה להעתקה — HTML + טקסט (מצב משפחתי בראש) */
function buildResumeFormats(row) {
  const name = normalizeText(getField(row, COLS.NAME));
  const marital = normalizeText(getField(row, COLS.MARITAL)); // מצב משפחתי

  const items = [];
  for (const key of RESUME_INCLUDE) {
    const variants = FIELD_MAP[key];
    let val = normalizeText(getField(row, variants));
    if (!val) continue;
    const label = LABELS[variants[0]] || variants[0];
    items.push({ label, value: val });
  }

  const html = `
    <div style="border:1px solid #d9d9d9;border-radius:10px;padding:12px;line-height:1.6;direction:rtl;">
      ${name ? `<div style="font-weight:800;font-size:1.15rem;margin-bottom:.25rem">${escapeHtml(name)}</div>` : ``}
      ${marital ? `<div style="margin-bottom:.5rem"><b>${escapeHtml(LABELS[COLS.MARITAL[0]])}:</b> ${escapeHtml(marital)}</div>` : ``}
      <div>
        ${items.map(it => `<div><b>${escapeHtml(it.label)}:</b> ${escapeHtml(it.value)}</div>`).join('')}
      </div>
    </div>
  `;

  const textLines = [];
  if (name) textLines.push(name);
  if (marital) textLines.push(`• ${LABELS[COLS.MARITAL[0]]}: ${marital}`);
  for (const it of items) {
    textLines.push(`• ${it.label}: ${it.value}`);
  }
  const content = textLines.join('\n');
  const borderLine = '────────────────────────────────────────';
  const text = `${borderLine}\n${content}\n${borderLine}`;

  return { html, text };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}

/* ====== UI ====== */
function renderPairsHtml(pairs) {
  return pairs.map(([k, v]) => {
    if (v && typeof v === 'object' && v.type === 'pre') {
      const safe = v.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      return `
        <div class="kv-row">
          <div class="kv-key">${k}</div>
          <div class="kv-val"><pre style="white-space:pre-wrap;margin:0">${safe}</pre></div>
        </div>
      `;
    }

    return `
      <div class="kv-row">
        <div class="kv-key">${k}</div>
        <div class="kv-val">${v}</div>
      </div>
    `;
  }).join('');
}

function renderCards(rows) {
  cardsEl.innerHTML = '';
  if (!rows.length) return;

  // סוגר כל הפאנלים הפתוחים (בשימוש לפני פתיחה של חדש)
  const closeAllPanels = () => {
    cardsEl.querySelectorAll('.resume-panel:not([hidden])').forEach(p => {
      p.setAttribute('hidden', '');
    });
    cardsEl.querySelectorAll('.toggle-resume').forEach(b => b.hidden = false);
    cardsEl.querySelectorAll('.close-resume').forEach(b => b.hidden = true);
    cardsEl.querySelectorAll('.toggle-resume').forEach(b => b.setAttribute('aria-expanded','false'));
  };

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];

    const pairs = collectDisplayPairs(r);
    const { html: resumeHtml, text: resumeText } = buildResumeFormats(r);

    const name     = normalizeText(getField(r, COLS.NAME));
    const code     = normalizeText(getField(r, COLS.CODE));
    const marital  = normalizeText(getField(r, COLS.MARITAL)); // מצב משפחתי בכותרת
    const photoUrl = extractPhotoUrl(r);

    const el = document.createElement('div');
    el.className = 'card';

    el.innerHTML = `
      <div class="card-header">
        <span class="badge">${i + 1}</span>
        <strong>${name || '(ללא שם)'}</strong>
        ${code ? `— <span class="muted">${code}</span>` : ''}
        ${marital ? `— <span class="muted">${LABELS[COLS.MARITAL[0]]}: ${marital}</span>` : ''}
      </div>

      <div class="kv">
        ${renderPairsHtml(pairs)}
      </div>

      <div class="resume" style="margin-top:.5rem;">
        <div class="resume-toolbar">
          <button class="btn btn-ghost toggle-resume" type="button" aria-expanded="false">רזומה להעתקה</button>
          <button class="btn btn-ghost close-resume" type="button" hidden>סגור רזומה להעתקה</button>
          ${photoUrl ? `<button class="btn btn-ghost open-photo" type="button" data-url="${photoUrl}">תמונה</button>` : ''}
        </div>

        <div class="resume-panel" hidden>
          ${resumeHtml}
          <div class="resume-actions">
            <span class="warn-small">
              לפני שליחה: ודאו שהרזומה לא מכיל שדות רגישים (מייל, ת"ז וכו'). כעת ניתן להדביקו במייל.
            </span>
            <button class="btn btn-primary copy-btn" type="button">העתק רזומה</button>
          </div>
        </div>
      </div>
    `;

    const panel     = el.querySelector('.resume-panel');
    const openBtn   = el.querySelector('.toggle-resume');
    const closeBtn  = el.querySelector('.close-resume');
    const photoBtn  = el.querySelector('.open-photo');
    const copyBtn   = el.querySelector('.copy-btn');

    const openPanel = () => {
      if (!panel) return;
      // סגור אחרים קודם
      closeAllPanels();
      panel.removeAttribute('hidden');
      openBtn.hidden  = true;
      closeBtn.hidden = false;
      openBtn.setAttribute('aria-expanded', 'true');
    };

    const closePanel = () => {
      if (!panel) return;
      panel.setAttribute('hidden', '');
      closeBtn.hidden = true;
      openBtn.hidden  = false;
      openBtn.setAttribute('aria-expanded', 'false');
    };

    // פתיחה/סגירה בכפתורים
    openBtn?.addEventListener('click', openPanel);
    closeBtn?.addEventListener('click', closePanel);

    // ESC סוגר
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && panel && !panel.hasAttribute('hidden')) {
        closePanel();
      }
    });

    // כפתור תמונה (פתיחה בלשונית חדשה)
    photoBtn?.addEventListener('click', (ev) => {
      const url = ev.currentTarget.getAttribute('data-url');
      if (url) window.open(url, '_blank', 'noopener');
    });

    // העתקת רזומה (HTML + טקסט)
    copyBtn?.addEventListener('click', async () => {
      try {
        if (window.ClipboardItem) {
          const data = new ClipboardItem({
            'text/html': new Blob([resumeHtml], { type: 'text/html' }),
            'text/plain': new Blob([resumeText], { type: 'text/plain' }),
          });
          await navigator.clipboard.write([data]);
        } else {
          await navigator.clipboard.writeText(resumeText);
        }
        const old = copyBtn.textContent;
        copyBtn.textContent = 'הועתק ✔';
        setTimeout(() => (copyBtn.textContent = old), 1200);
      } catch {
        // Fallback: סימון ידני
        const range = document.createRange();
        range.selectNodeContents(panel);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });

    cardsEl.appendChild(el);
  }
}





function updateStats() {
  statsEl.textContent = `נמצאו ${FILTERED.length} מתוך ${ALL_ROWS.length}`;
}

/* ====== הפעלה ====== */
function updateMultiVisibility() {
  // מוסתר עד בחירת מגדר + מציג רק אופציות רלוונטיות
  updateCoverPanelsVisibility(genEl, multiSections);
}

function applyFilters() {
  if (!matchGatekeeper()) {
    FILTERED = [];
    renderCards(FILTERED);
    updateStats();
    searchSection.hidden = true;
    gateMsg.textContent = 'יש לבחור עדה ומגדר או מספר קבוצה בארגון כדי להציג כרטיסים.';
    return;
  }
  gateMsg.textContent = '';
  FILTERED = ALL_ROWS.filter(rowPassesFilters);
  renderCards(FILTERED);
  updateStats();
  searchSection.hidden = false;
}

function resetAll() {
  groupEl && (groupEl.value = '');
  ethEl && (ethEl.value = '');
  genEl && (genEl.value = '');
  statusEl && (statusEl.value = '');
  ageMinEl && (ageMinEl.value = '');
  ageMaxEl && (ageMaxEl.value = '');
  hMinEl && (hMinEl.value = '');
  hMaxEl && (hMaxEl.value = '');
  searchBox && (searchBox.value = '');
  clearAllMulti();
  updateMultiVisibility();
  applyFilters();
}

/* ====== אירועים ====== */
applyEl?.addEventListener('click', applyFilters);
resetEl?.addEventListener('click', resetAll);

genEl?.addEventListener('change', () => {
  updateMultiVisibility();   // מציג את האופציות הרלוונטיות בלבד
  applyFilters();
});

searchBtn?.addEventListener('click', () => {
  const q = normCmp(searchBox?.value);
  if (!q) { renderCards(FILTERED); updateStats(); return; }
  const hit = FILTERED.filter(r => {
    const blob = normCmp(Object.entries(r).map(([k, v]) => `${k}:${normalizeText(v)}`).join(' • '));
    return blob.includes(q);
  });
  renderCards(hit);
  statsEl.textContent = `נמצאו ${hit.length} מתוך ${ALL_ROWS.length}`;
});

/* ====== קבלת נתונים ====== */
window.addEventListener('candidates:data', (ev) => {
  ALL_ROWS = ev.detail || [];

  // קבוצה – דינמי
  const uniq = new Set();
  for (const r of ALL_ROWS) {
    const g = getField(r, COLS.GROUP);
    if (g) uniq.add(normalizeText(g));
  }
  const before = groupEl?.value || '';
  if (groupEl) {
    groupEl.innerHTML = `<option value="">— בחרי —</option>` +
      Array.from(uniq).sort((a, b) => a.localeCompare(b, 'he')).map(v => `<option>${v}</option>`).join('');
    groupEl.value = before;
  }

  updateMultiVisibility();
  applyFilters();
});

// אתחול ראשוני של נראות מסנני רב־בחירה
updateMultiVisibility();
