/**
 * Initialize Supabase database tables and seed data
 * Run this once to set up your database
 */

import { supabase } from '@/lib/supabase';
import * as bcrypt from 'bcryptjs';

export async function initializeDatabase() {
  try {
    console.log('Checking database connection...');

    // Test connection
    const { error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    if (connectionError && connectionError.code !== 'PGRST116') {
      // PGRST116 = table doesn't exist
      console.error('Connection error:', connectionError);
      throw new Error('Failed to connect to Supabase');
    }

    // Check if admin user already exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'admin@xlevelsup.com')
      .single();

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const { error: insertError } = await supabase.from('users').insert({
      email: 'admin@xlevelsup.com',
      password_hash: hashedPassword,
      role: 'admin',
    });

    if (insertError) {
      console.error('Failed to create admin user:', insertError);
      throw insertError;
    }

    console.log(
      '✅ Default admin user created: admin@xlevelsup.com / admin123',
    );
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
