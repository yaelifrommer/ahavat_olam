// services/mailer.js
import nodemailer from 'nodemailer';

const {
  SMTP_HOST = 'smtp.gmail.com',
  SMTP_PORT = '587',
  SMTP_USER,
  SMTP_PASS,
  FROM_EMAIL = 'אהבת עולם <noreply@example.com>',
} = process.env;

// נשמור טרנספורטר יחיד בזיכרון הפונקציה כדי לקצר קולד-סטארט בריצות הבאות
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  // אם זה 465 → secure=true; אחרת (587/25/2525) → secure=false
  const portNum = Number(SMTP_PORT);
  const secure = portNum === 465;

  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: portNum || 587,
    secure,
    auth: (SMTP_USER && SMTP_PASS) ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,

    // Timeouts קצרים כדי לא לחרוג ממגבלת 10 שניות של Serverless
    connectionTimeout: 3000,  // זמן לפתיחת חיבור
    greetingTimeout: 3000,    // זמן עד ל-Greeting מהשרת
    socketTimeout: 5000,      // זמן כולל לשליחה

    // אל תפעילי pooling בפונקציות Serverless
    // tls: { rejectUnauthorized: true } // ברירת מחדל, אפשר להשאיר כך
  });

  return _transporter;
}

/**
 * שולח קוד OTP במייל
 * שימי לב: מומלץ לקרוא לפונקציה הזו ב-fire-and-forget (בלי await) מהראוטר,
 * כדי שהתגובה ללקוח תחזור מיד ולא תחכה לשליחת המייל בפועל.
 */
export async function sendLoginCode(toEmail, code, expiresAt) {
  const transporter = getTransporter();

  const subject = 'קוד אימות חד-פעמי';
  const html = `
    <div style="font-family:Arial,sans-serif;direction:rtl;text-align:right">
      <h2>קוד התחברות חד-פעמי</h2>
      <p>קוד האימות שלך הוא: <strong style="font-size:20px">${code}</strong></p>
      <p>תוקף הקוד עד: <strong>${new Date(expiresAt).toLocaleString('he-IL')}</strong></p>
      <p>אם לא ביקשת קוד זה, ניתן להתעלם מהמייל.</p>
    </div>
  `;
  const text = `קוד האימות שלך: ${code}. תקף עד ${new Date(expiresAt).toLocaleString('he-IL')}. אם לא ביקשת קוד זה, ניתן להתעלם מהמייל.`;

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: toEmail,
    subject,
    html,
    text,
  });
}
