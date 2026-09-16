/**
 * Server initialization script
 * Initializes the database on server startup
 *
 * Usage: npm run init-erp -w @xlu/admin
 */
import dotenv from 'dotenv';
import * as path from 'path';

// Env must be loaded before ../db/init-supabase is evaluated: it pulls in
// lib/supabase, which reads NEXT_PUBLIC_SUPABASE_URL/ANON_KEY at module scope
// and throws if either is missing.
//
// A static `import` cannot express that ordering — imports are hoisted above
// every statement in the module body, so the previous top-level
// `require('dotenv')` here ran only AFTER init-supabase had been evaluated,
// despite the comment that said otherwise. The dynamic import inside
// initialize() is what actually defers that load until after config() has run.
dotenv.config({
  path: path.resolve(process.cwd(), '.env.local'),
});

async function initialize() {
  try {
    console.log('🚀 Initializing ERP system...');
    const { initializeDatabase } = await import('../db/init-supabase');
    await initializeDatabase();
    console.log('✅ ERP system initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize ERP system:', error);
    process.exit(1);
  }
}

// Run initialization
initialize();
