import serverless from 'serverless-http';
import app from '../server.js';

// ❌ היה: nodejs18.x
export const config = {
  runtime: 'nodejs'   // ✅ זה התקין
};

export default serverless(app);
