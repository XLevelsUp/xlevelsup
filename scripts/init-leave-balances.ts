/**
 * Initialize Leave Balances for All Employees
 *
 * This script initializes leave balances for all active employees
 * based on the new leave policy:
 * - Casual Leave: 18 days/year
 * - Floater Leave: 2 days/year
 * - Sick Leave: 10 days/year
 * - Earned Leave: 0 days initially (earned from OT)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error(
    'Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local',
  );
  process.exit(1);
}

// Use service role key to bypass RLS for initialization
console.log(
  '🔑 Using',
  process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role Key' : 'Anon Key',
);

const supabase = createClient(supabaseUrl, supabaseKey);

interface Employee {
  id: number;
  employee_id: string;
  name: string;
  employment_type: string;
  joining_date: string;
  department: string;
  status: string;
}

/**
 * Calculate prorated leave allocation based on joining date and department
 */
function calculateProratedLeaves(
  joiningDate: Date,
  year: number,
  department?: string,
) {
  const joiningYear = joiningDate.getFullYear();
  const joiningMonth = joiningDate.getMonth(); // 0-11

  // Internship employees only get casual leave (1.5 days/month)
  const isInternship = department?.toLowerCase() === 'internship';

  // If joined before current year, give full allocation
  if (joiningYear < year) {
    if (isInternship) {
      return {
        casual: 18,
        floater: 0,
        sick: 0,
        earned: 0,
      };
    }
    return {
      casual: 18,
      floater: 2,
      sick: 10,
      earned: 0,
    };
  }

  // If joined in current year, calculate months remaining (including joining month)
  const monthsInYear = 12;
  const monthsRemaining = monthsInYear - joiningMonth; // e.g., joined in June (5) = 12-5 = 7 months

  // Calculate prorated leaves
  const casual = monthsRemaining * 1.5; // 1.5 days per month

  if (isInternship) {
    return {
      casual,
      floater: 0,
      sick: 0,
      earned: 0,
    };
  }

  const floater = Math.round((monthsRemaining / monthsInYear) * 2); // Prorated floater
  const sick = Math.round((monthsRemaining / monthsInYear) * 10); // Prorated sick leave
  const earned = 0; // Always starts at 0

  return {
    casual,
    floater,
    sick,
    earned,
  };
}

async function initializeLeaveBalances() {
  try {
    console.log('🚀 Starting leave balance initialization...\n');

    const currentYear = new Date().getFullYear();
    console.log(`📅 Current Year: ${currentYear}\n`);

    // Step 1: Get all active employees
    console.log('📊 Fetching all active employees...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select(
        'id, employee_id, name, employment_type, joining_date, department, status',
      )
      .eq('status', 'active')
      .order('employee_id');

    if (employeesError) {
      throw new Error(`Failed to fetch employees: ${employeesError.message}`);
    }

    if (!employees || employees.length === 0) {
      console.log('⚠️  No active employees found.');
      return;
    }

    console.log(`✅ Found ${employees.length} active employees\n`);

    console.log('📋 Leave Policy:');
    console.log('   - Regular Employees:');
    console.log(
      '     • Casual Leave: 1.5 days/month (18 days/year if joined Jan)',
    );
    console.log('     • Floater Leave: 2 days/year (prorated by month)');
    console.log('     • Sick Leave: 10 days/year (prorated by month)');
    console.log('     • Earned Leave: 0 initially (earned from OT)');
    console.log('   - Internship Employees:');
    console.log('     • Casual Leave: 1.5 days/month only');
    console.log('     • No floater, sick, or earned leave\n');
    console.log('   - Allocation prorated based on joining date\n');

    // Step 3: Initialize leave balances for each employee
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const employee of employees as Employee[]) {
      console.log(
        `\n👤 Processing: ${employee.name} (${employee.employee_id})`,
      );
      console.log(`   Department: ${employee.department}`);
      console.log(`   Employment Type: ${employee.employment_type}`);
      console.log(`   Joining Date: ${employee.joining_date}`);

      // Calculate prorated leave allocation based on joining date and department
      const joiningDate = new Date(employee.joining_date);
      const allocation = calculateProratedLeaves(
        joiningDate,
        currentYear,
        employee.department,
      );

      const isInternship = employee.department?.toLowerCase() === 'internship';
      if (isInternship) {
        console.log('   🎓 Internship: Only casual leave allocated');
      }

      const leaveAllocations = [
        {
          leave_type: 'casual',
          total_allocated: allocation.casual,
          description: 'Casual Leave',
        },
        {
          leave_type: 'floater',
          total_allocated: allocation.floater,
          description: 'Floater Leave',
        },
        {
          leave_type: 'sick',
          total_allocated: allocation.sick,
          description: 'Sick Leave',
        },
        {
          leave_type: 'earned',
          total_allocated: allocation.earned,
          description: 'Earned Leave (OT-based)',
        },
      ].filter(
        (leave) => leave.total_allocated > 0 || leave.leave_type === 'earned',
      );

      for (const leave of leaveAllocations) {
        try {
          // Check if balance already exists
          const { data: existing, error: checkError } = await supabase
            .from('leave_balances')
            .select('id, total_allocated, used_days')
            .eq('employee_id', employee.id)
            .eq('year', currentYear)
            .eq('leave_type', leave.leave_type)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
          }

          if (existing) {
            console.log(
              `   ⏭️  ${leave.leave_type}: Already exists (${existing.total_allocated} allocated, ${existing.used_days} used)`,
            );
            skippedCount++;
            continue;
          }

          // Insert new leave balance
          const { error: insertError } = await supabase
            .from('leave_balances')
            .insert({
              employee_id: employee.id,
              year: currentYear,
              leave_type: leave.leave_type,
              total_allocated: leave.total_allocated,
              used_days: 0,
            });

          if (insertError) {
            throw insertError;
          }

          console.log(
            `   ✅ ${leave.leave_type}: Initialized (${leave.total_allocated} days)`,
          );
          successCount++;
        } catch (error: any) {
          console.error(`   ❌ ${leave.leave_type}: Failed - ${error.message}`);
          errorCount++;
        }
      }
    }

    // Step 4: Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 INITIALIZATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Employees Processed: ${employees.length}`);
    console.log(`Leave Records Created: ${successCount}`);
    console.log(`Leave Records Skipped: ${skippedCount} (already exists)`);
    console.log(`Errors: ${errorCount}`);
    console.log('='.repeat(60));

    // Step 5: Verification Query
    console.log('\n🔍 Verification: Leave Balance Distribution');
    const { data: distribution, error: distError } = await supabase
      .from('leave_balances')
      .select('leave_type, total_allocated, used_days')
      .eq('year', currentYear);

    if (!distError && distribution) {
      const stats: Record<
        string,
        { count: number; total_allocated: number; total_used: number }
      > = {};

      distribution.forEach((record: any) => {
        if (!stats[record.leave_type]) {
          stats[record.leave_type] = {
            count: 0,
            total_allocated: 0,
            total_used: 0,
          };
        }
        stats[record.leave_type].count++;
        stats[record.leave_type].total_allocated += record.total_allocated;
        stats[record.leave_type].total_used += record.used_days;
      });

      console.log('\nLeave Type Distribution:');
      Object.entries(stats).forEach(([type, data]) => {
        console.log(
          `  ${type.padEnd(10)} | ${data.count} employees | Avg Allocated: ${(data.total_allocated / data.count).toFixed(1)} days | Avg Used: ${(data.total_used / data.count).toFixed(1)} days`,
        );
      });
    }

    console.log('\n✅ Leave balance initialization completed!\n');
  } catch (error: any) {
    console.error('\n❌ Initialization failed:', error.message);
    process.exit(1);
  }
}

// Run the script
initializeLeaveBalances();
