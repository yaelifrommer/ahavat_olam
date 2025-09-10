# Ahavat Olam — Candidates POC (OTP + Google Sheets)

POC מינימלי לפי המפרט: OTP עם אימות אימיילים מגיליונות Google (XLSX export), cookie session, ונתיב מאובטח שבודק את חיבור לשונית המועמדים.

## התקנה

1. ודאו שמותקנים Node 18+ ו-npm.
2. פרסו קובץ `.env` על בסיס `.env.example` ועדכנו את כל ה-IDs/GIDs והקרדנצ'לים של SMTP.
3. התקינו תלויות והפעילו:
   ```bash
   npm i
   npm run dev
   ```
4. גלשו ל- http://localhost:3000/login.html

## זרימה

- `/api/auth/request-code` — מבקש קוד OTP (שולח במייל). ב-POC ניתן לעקוף בדיקה עם `ALLOW_ALL_EMAILS=true`.
- `/api/auth/verify-code` — מאמת קוד ושומר cookie `session_token`.
- `/api/auth/protected-check` — בודק האם יש session פעיל.
- `/candidates` — עמוד מוגן.
- `/api/candidates/ping` — מושך XLSX מהלשונית של המועמדים ומחזיר סיכום.

> חשוב: Google Sheet חייב להיות נגיש להורדה (למשל "Anyone with the link" או דרך שרת עם הרשאות).

## המשך

לאחר שה-POC עובד אצלך end-to-end, ניתן להרחיב לפי המפרט המלא: כרטיסים, סינון עשיר, מחברת, קאש מתקדם ועוד.