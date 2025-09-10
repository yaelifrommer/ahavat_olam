import express from 'express';
import { getCandidatesSheet } from '../services/sheets.js';
import { authRequired } from '../middleware/authRequired.js';

const router = express.Router();
const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 600);

// קאש + נעילת טעינה
let cache = {
  rows: null,
  ts: 0,
  inflight: null,
};

async function loadWithCache() {
  const now = Date.now();
  const fresh = cache.rows && (now - cache.ts) < CACHE_TTL_SECONDS * 1000;
  if (fresh) return { rows: cache.rows, stale: false };

  if (cache.inflight) {
    try {
      const rows = await cache.inflight;
      return { rows, stale: false };
    } catch {
      // ניפול הלאה
    }
  }

  cache.inflight = (async () => {
    const rows = await getCandidatesSheet();
    cache.rows = rows;
    cache.ts = Date.now();
    return rows;
  })();

  try {
    const rows = await cache.inflight;
    return { rows, stale: false };
  } catch (err) {
    console.error('GET /api/candidates error', err);
    if (cache.rows) return { rows: cache.rows, stale: true };
    throw err;
  } finally {
    cache.inflight = null;
  }
}

// עמוד HTML מאובטח (לא נשמר בקאש הדפדפן)
router.get('/candidates', authRequired, (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile('views/candidates.html', { root: process.cwd() });
});

// JSON מאובטח
router.get('/api/candidates', authRequired, async (req, res) => {
  try {
    const { rows, stale } = await loadWithCache();
    res.json({
      ok: true,
      stale,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'failed_to_load_candidates' });
  }
});

export default router;
