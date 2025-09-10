import serverless from 'serverless-http';
import app from '../server.js';

export const config = { runtime: 'nodejs' }; // אפשר גם למחוק לגמרי את ה-config

export default serverless(app);
