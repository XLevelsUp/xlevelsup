/**
 * Migration script to add leave_type column to attendance_change_requests
 * Run with: node scripts/migrate-add-leave-type.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log(
    '🔄 Running migration: Add leave_type to attendance_change_requests...',
  );

  try {
    // Add leave_type column
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE attendance_change_requests 
        ADD COLUMN IF NOT EXISTS leave_type VARCHAR(50);
      `,
    });

    if (addColumnError) {
      console.error('❌ Error adding column:', addColumnError);
      // Try direct query approach
      console.log('Attempting direct SQL execution...');

      const { error } = await supabase
        .from('attendance_change_requests')
        .select('leave_type')
        .limit(1);

      if (
        error &&
        error.message.includes('column "leave_type" does not exist')
      ) {
        console.log(
          '\n⚠️  Column does not exist yet. Please run this SQL in Supabase SQL Editor:',
        );
        console.log('\n' + '='.repeat(80));
        console.log(`
-- Add leave_type column to attendance_change_requests table
ALTER TABLE attendance_change_requests 
ADD COLUMN IF NOT EXISTS leave_type VARCHAR(50);

-- Add check constraint for valid leave types
ALTER TABLE attendance_change_requests
DROP CONSTRAINT IF EXISTS check_leave_type_for_paid_leave;

ALTER TABLE attendance_change_requests
ADD CONSTRAINT check_leave_type_for_paid_leave 
CHECK (
    (requested_status != 'paid-leave') OR 
    (requested_status = 'paid-leave' AND leave_type IS NOT NULL AND leave_type IN ('sick', 'casual', 'floater', 'earned', 'unpaid', 'maternity', 'paternity', 'other'))
);

-- Add comment for documentation
COMMENT ON COLUMN attendance_change_requests.leave_type IS 'Type of leave to deduct when paid-leave is approved. Required when requested_status is paid-leave.';
        `);
        console.log('='.repeat(80) + '\n');
        console.log(
          '📍 Go to: https://vwgsbstkbjygokydvnia.supabase.co/project/vwgsbstkbjygokydvnia/sql/new',
        );
        process.exit(1);
      } else {
        console.log('✅ Column already exists or was added successfully!');
      }
    } else {
      console.log('✅ Column added successfully!');
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
