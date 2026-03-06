/**
 * Startup validation - validates configuration when the app starts.
 * This file should be imported at the top of the application entry point.
 * 
 * Import this in instrumentation.ts or at the top of layout.tsx
 */

import { config } from './config';

// Log startup info (remove in production if desired)
if (process.env.NODE_ENV !== 'test') {
  console.log('[Startup] Validating configuration...');
  
  const requiredVars = ['JWT_SECRET', 'OPENAI_API_KEY', 'DATABASE_URL'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error(`[Startup] ❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('[Startup] Application cannot start. Please set these variables and restart.');
    // In development, we might want to continue for debugging
    // In production, we should fail fast
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } else {
    console.log('[Startup] ✅ All required environment variables are set');
  }
}

export { config };
