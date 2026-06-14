/**
 * Server initialization script
 * Initializes the database on server startup
 */

// Load environment variables FIRST before any imports
require('dotenv').config({
  path: require('path').resolve(process.cwd(), '.env.local'),
});

// Now import after env vars are loaded
import { initializeDatabase } from '../db/init-supabase';

async function initialize() {
  try {
    console.log('🚀 Initializing ERP system...');
    await initializeDatabase();
    console.log('✅ ERP system initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize ERP system:', error);
    process.exit(1);
  }
}

// Run initialization
initialize();
