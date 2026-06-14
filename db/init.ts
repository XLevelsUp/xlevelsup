/**
 * Database initialization and connection
 * Uses better-sqlite3 for SQLite database
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { hash } from 'bcryptjs';

const DB_PATH = join(process.cwd(), 'data', 'erp.db');

let db: Database.Database | null = null;

/**
 * Get or create database instance (singleton pattern)
 */
export function getDb(): Database.Database {
  if (!db) {
    // Create data directory if it doesn't exist
    const fs = require('fs');
    const dataDir = join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    db.pragma('foreign_keys = ON'); // Enable foreign key constraints
  }
  return db;
}

/**
 * Initialize database schema
 */
export async function initializeDatabase(): Promise<void> {
  const db = getDb();
  const schemaPath = join(process.cwd(), 'db', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Execute schema
  db.exec(schema);

  // Check if admin user exists, if not create one
  const adminExists = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get('admin@xlevelsup.com');

  if (!adminExists) {
    const passwordHash = await hash('admin123', 10);
    db.prepare(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
    ).run('admin@xlevelsup.com', passwordHash, 'admin');

    console.log(
      '✅ Default admin user created: admin@xlevelsup.com / admin123',
    );
  }

  console.log('✅ Database initialized successfully');
}

/**
 * Close database connection
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
