// api/index.js
import serverless from 'serverless-http';
import app from '../server.js';
export const config = { runtime: 'nodejs18.x' };
export default serverless(app);
