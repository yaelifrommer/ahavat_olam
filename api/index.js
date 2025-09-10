import serverless from 'serverless-http';
import app from '../server.js';

export const config = { runtime: 'nodejs' }; // או פשוט למחוק את ה-config

export default serverless(app);
