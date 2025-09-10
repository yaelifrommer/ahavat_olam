// services/sheets.js
import axios from 'axios';
import * as XLSX from 'xlsx';

// בונה URL נכון להורדת לשונית אחת כ-XLSX לפי sheetId + gid
function googleXlsxUrl(sheetId, gid) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx&gid=${gid}`;
}

// מוריד XLSX של לשונית אחת ומחזיר מערך רשומות JSON
export async function downloadSheet(sheetId, gid) {
  const url = googleXlsxUrl(sheetId, gid);
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    maxRedirects: 5,
    headers: { 'User-Agent': 'axios' }
  });
  const wb = XLSX.read(res.data, { type: 'buffer' });
  // export עם gid יחזיר חוברת עם לשונית אחת – ניקח את הראשונה
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });
  return rows;
}

/* ====== מחזיר את לשונית המועמדים ====== */
export async function getCandidatesSheet() {
  const { SHEET_ID, CANDIDATES_GID } = process.env;
  if (!SHEET_ID || !CANDIDATES_GID) {
    throw new Error('Missing SHEET_ID or CANDIDATES_GID in .env');
  }
  return await downloadSheet(SHEET_ID, CANDIDATES_GID);
}

/* ====== (נשאיר גם כלים ל־allowlist אם את משתמשת בהם באימות) ====== */
async function getVolunteersEmails() {
  const { SHEET_ID, VOLUNTEERS_GID } = process.env;
  if (!SHEET_ID || !VOLUNTEERS_GID) return new Set();
  const rows = await downloadSheet(SHEET_ID, VOLUNTEERS_GID);
  // בעמודה "מייל"
  const emails = rows
    .map(r => (r['מייל'] || '').toString().trim())
    .filter(Boolean);
  return new Set(emails.map(e => e.toLowerCase()));
}

async function getMatchmakersEmails() {
  const {
    SHEET_ID,
    MATCHMAKERS_GID,
    MATCHMAKERS_EMAIL_COLUMN = 'מייל לתוכנית המועמדים',
  } = process.env;
  if (!SHEET_ID || !MATCHMAKERS_GID) return new Set();
  const rows = await downloadSheet(SHEET_ID, MATCHMAKERS_GID);
  const emails = rows
    .map(r => (r[MATCHMAKERS_EMAIL_COLUMN] || '').toString().trim())
    .filter(Boolean);
  return new Set(emails.map(e => e.toLowerCase()));
}

export async function getAllowedEmailSet() {
  const [v, m] = await Promise.all([getVolunteersEmails(), getMatchmakersEmails()]);
  const out = new Set();
  for (const e of v) out.add(e);
  for (const e of m) out.add(e);
  return out;
}

export async function isEmailAllowed(email) {
  const { ALLOW_ALL_EMAILS } = process.env;
  if (String(ALLOW_ALL_EMAILS).toLowerCase() === 'true') return true;
  const allow = await getAllowedEmailSet();
  return allow.has((email || '').toLowerCase().trim());
}
