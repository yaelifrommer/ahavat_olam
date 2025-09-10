import 'dotenv/config';
import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import candidatesRoutes from './routes/candidates.js';
import { authRequired } from './middleware/authRequired.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);

const {
  ORIGIN = 'http://localhost:3000',
  SESSION_SECRET = 'change-me-please',
  NODE_ENV = 'development',
} = process.env;

// ✅ CSP ללא inline scripts (דאגנו להוציא אינליינס ל־/public/js)
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],                 // אין inline
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:"],
      "connect-src": ["'self'", "https:"],      // אם הפרונט מדבר החוצה
    }
  },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cookie חתום
app.use(cookieParser(SESSION_SECRET));
app.use(morgan('dev'));

// Rate limits גלובלי
const globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// ===== בריאות — לפני שאר הראוטים כדי לאבחן 504 =====
app.get('/api/healthz', (req, res) => {
  res.json({ ok: true, ts: Date.now(), env: process.env.VERCEL ? 'vercel' : 'local' });
});
app.get('/api/ping', (req, res) => res.send('pong'));

// ===== סטטי ציבורי =====
app.use('/public', express.static(path.join(__dirname, 'public'), { maxAge: '7d', immutable: true }));

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/', (req, res) => res.redirect('/login.html'));

// API אימות ציבורי
app.use('/api/auth', authRoutes);

// ===== מכאן והלאה — הכל מוגן =====
app.use((req, res, next) => authRequired(req, res, next));

// כל ראוטים מוגנים (כולל /candidates ו-/api/candidates)
app.use('/', candidatesRoutes);

// 404
app.use((req, res) => {
  if (req.path.endsWith('.js') || req.path.endsWith('.css')) {
    return res.status(404).send('Not found');
  }
  res.status(404).send('<h1>404</h1>');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('💥 Error:', err);
  res.status(err.status || 500).json({ ok: false, error: err.message || 'שגיאה לא צפויה' });
});

// ✅ בענן (Vercel) לא מאזינים לפורט — רק מקומית
const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server listening on http://localhost:${PORT}`);
  });
}

export default app;
