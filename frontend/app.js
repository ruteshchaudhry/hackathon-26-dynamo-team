import { config } from './config.js';
await import(config.mode === 'live' ? './live-app.js' : './demo-app.js');
