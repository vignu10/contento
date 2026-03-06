// This file runs when the Next.js server starts
// Use it to validate configuration and perform startup tasks
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Validate configuration at startup
    await import('./src/lib/startup');
  }
}
