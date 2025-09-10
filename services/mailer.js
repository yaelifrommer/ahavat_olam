import nodemailer from 'nodemailer';

/**
 * Send OTP code by email
 */
export async function sendLoginCode(toEmail, code, expiresAt) {
  const {
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL = 'no-reply@example.com'
  } = process.env;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  const html = `
    <div style="font-family:Arial,sans-serif;direction:rtl;text-align:right">
      <h2>קוד התחברות חד-פעמי</h2>
      <p>קוד האימות שלך הוא: <strong style="font-size:20px">${code}</strong></p>
      <p>תוקף הקוד עד: <strong>${new Date(expiresAt).toLocaleString('he-IL')}</strong></p>
      <p>אם לא ביקשת קוד זה, ניתן להתעלם מהמייל.</p>
    </div>`;

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: toEmail,
    subject: 'קוד אימות חד-פעמי',
    html
  });
}