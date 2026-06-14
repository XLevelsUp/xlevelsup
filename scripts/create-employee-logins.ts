/**
 * Create login credentials for existing employees
 * Run this after the employee-auth migration to set up logins for existing employees
 */

// Load environment variables FIRST before any imports
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: path.resolve(process.cwd(), '.env.local'),
});

// Verify environment variables are loaded
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('   Make sure .env.local file exists with:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Now import after env vars are loaded
const { supabase } = require('../lib/supabase');
const bcrypt = require('bcryptjs');

async function createEmployeeLogins() {
  try {
    console.log('🔐 Creating login credentials for existing employees...\n');

    // Get all employees without password_hash
    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('id, employee_id, name, email, status')
      .is('password_hash', null);

    if (fetchError) {
      console.error('❌ Error fetching employees:', fetchError);
      throw fetchError;
    }

    if (!employees || employees.length === 0) {
      console.log('✅ All employees already have login credentials!');
      return;
    }

    console.log(
      `📋 Found ${employees.length} employee(s) without login credentials:\n`,
    );

    let successCount = 0;
    let failCount = 0;

    for (const employee of employees) {
      try {
        // Generate default password: Welcome@[EmployeeID]
        const defaultPassword = `Welcome@${employee.employee_id}`;
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        // Update employee with password and auth fields
        const { error: updateError } = await supabase
          .from('employees')
          .update({
            password_hash: passwordHash,
            require_password_change: true,
            account_status: 'active',
          })
          .eq('id', employee.id);

        if (updateError) {
          console.error(
            `   ❌ Failed: ${employee.name} (${employee.employee_id})`,
          );
          console.error(`      Error:`, updateError.message);
          failCount++;
        } else {
          console.log(`   ✅ ${employee.name} (${employee.employee_id})`);
          console.log(`      Email: ${employee.email}`);
          console.log(`      Default Password: ${defaultPassword}`);
          console.log(`      Portal: http://localhost:3000/employee/login\n`);
          successCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error processing ${employee.name}:`, error);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   ✅ Success: ${successCount} employee(s)`);
    if (failCount > 0) {
      console.log(`   ❌ Failed: ${failCount} employee(s)`);
    }
    console.log('='.repeat(60));
    console.log('\n📌 Important:');
    console.log('   - All employees MUST change their password on first login');
    console.log('   - Default password format: Welcome@[EmployeeID]');
    console.log('   - Employee Portal: http://localhost:3000/employee/login\n');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
createEmployeeLogins();
