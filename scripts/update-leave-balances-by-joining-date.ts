/**
 * Update Existing Leave Balances Based on Joining Date
 *
 * This script recalculates and updates leave balances for all active employees
 * to reflect prorated allocation based on their joining date.
 *
 * Run this after updating the leave policy to prorate leaves by joining date.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local file explicitly
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error(
    'Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local',
  );
  console.error('Checked path:', resolve(process.cwd(), '.env.local'));
  process.exit(1);
}

console.log(
  '🔑 Using',
  process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role Key' : 'Anon Key',
);

const supabase = createClient(supabaseUrl, supabaseKey);

interface Employee {
  id: number;
  employee_id: string;
  name: string;
  joining_date: string;
  department: string;
}

interface LeaveBalance {
  id: number;
  leave_type: string;
  total_allocated: number;
  used_days: number;
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
      sick: 5,
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
  const sick = Math.round((monthsRemaining / monthsInYear) * 5); // Prorated sick leave
  const earned = 0; // Always starts at 0

  return {
    casual,
    floater,
    sick,
    earned,
  };
}

async function updateLeaveBalances() {
  try {
    console.log('🚀 Starting leave balance update...\n');

    const currentYear = new Date().getFullYear();
    console.log(`📅 Current Year: ${currentYear}\n`);

    // Step 1: Get all active employees with their joining dates
    console.log('📊 Fetching all active employees...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, employee_id, name, joining_date, department')
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

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let warningCount = 0;

    for (const employee of employees as Employee[]) {
      console.log(
        `\n👤 Processing: ${employee.name} (${employee.employee_id})`,
      );
      console.log(`   Department: ${employee.department}`);
      console.log(`   Joining Date: ${employee.joining_date}`);

      // Calculate prorated leave allocation based on joining date and department
      const joiningDate = new Date(employee.joining_date);
      const allocation = calculateProratedLeaves(
        joiningDate,
        currentYear,
        employee.department,
      );

      const isInternship = employee.department?.toLowerCase() === 'internship';
      console.log(
        `   Calculated Allocation: Casual=${allocation.casual}${isInternship ? ' (Internship - Casual only)' : `, Floater=${allocation.floater}, Sick=${allocation.sick}`}`,
      );

      // Get existing leave balances
      const { data: existingBalances, error: fetchError } = await supabase
        .from('leave_balances')
        .select('id, leave_type, total_allocated, used_days')
        .eq('employee_id', employee.id)
        .eq('year', currentYear);

      if (fetchError) {
        console.error(`   ❌ Failed to fetch balances: ${fetchError.message}`);
        errorCount++;
        continue;
      }

      if (!existingBalances || existingBalances.length === 0) {
        console.log('   ⏭️  No existing balances found, skipping...');
        skippedCount++;
        continue;
      }

      // For internship employees, delete non-casual leave types
      if (isInternship) {
        for (const balance of existingBalances) {
          if (
            ['floater', 'sick'].includes(balance.leave_type) &&
            balance.used_days === 0
          ) {
            const { error: deleteError } = await supabase
              .from('leave_balances')
              .delete()
              .eq('id', balance.id);

            if (deleteError) {
              console.error(
                `   ❌ ${balance.leave_type}: Failed to delete - ${deleteError.message}`,
              );
              errorCount++;
            } else {
              console.log(
                `   🗑️  ${balance.leave_type}: Deleted (Internship - not applicable)`,
              );
              updatedCount++;
            }
          } else if (['floater', 'sick'].includes(balance.leave_type)) {
            console.log(
              `   ⚠️  ${balance.leave_type}: Has used days (${balance.used_days}), keeping but setting to 0 allocation`,
            );
            warningCount++;
          }
        }
      }

      // Update each leave type
      const leaveTypes: Array<keyof typeof allocation> = [
        'casual',
        'floater',
        'sick',
      ];

      for (const leaveType of leaveTypes) {
        // Skip non-casual leave for internship employees
        if (isInternship && leaveType !== 'casual') {
          continue;
        }

        const existing = existingBalances.find(
          (b) => b.leave_type === leaveType,
        ) as LeaveBalance | undefined;

        if (!existing) {
          console.log(`   ⏭️  ${leaveType}: Not found, skipping...`);
          continue;
        }

        const newAllocation = allocation[leaveType];

        // Check if used days exceed new allocation
        if (existing.used_days > newAllocation) {
          console.log(
            `   ⚠️  ${leaveType}: Used days (${existing.used_days}) > New allocation (${newAllocation}), keeping current allocation (${existing.total_allocated})`,
          );
          warningCount++;
          continue;
        }

        // Skip if allocation is the same
        if (existing.total_allocated === newAllocation) {
          console.log(
            `   ⏭️  ${leaveType}: Already correct (${newAllocation} days)`,
          );
          skippedCount++;
          continue;
        }

        // Update the allocation
        const { error: updateError } = await supabase
          .from('leave_balances')
          .update({ total_allocated: newAllocation })
          .eq('id', existing.id);

        if (updateError) {
          console.error(
            `   ❌ ${leaveType}: Failed to update - ${updateError.message}`,
          );
          errorCount++;
        } else {
          console.log(
            `   ✅ ${leaveType}: Updated ${existing.total_allocated} → ${newAllocation} days`,
          );
          updatedCount++;
        }
      }
    }

    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Employees Processed: ${employees.length}`);
    console.log(`Leave Records Updated: ${updatedCount}`);
    console.log(`Leave Records Skipped: ${skippedCount} (no change needed)`);
    console.log(`Warnings: ${warningCount} (used days exceed new allocation)`);
    console.log(`Errors: ${errorCount}`);
    console.log('='.repeat(60));

    // Verification Query
    console.log('\n🔍 Verification: Updated Leave Balance Distribution');
    const { data: distribution, error: distError } = await supabase
      .from('leave_balances')
      .select('leave_type, total_allocated, used_days')
      .eq('year', currentYear)
      .in('leave_type', ['casual', 'floater', 'sick']);

    if (!distError && distribution) {
      const stats: Record<
        string,
        { count: number; min: number; max: number; avg: number }
      > = {};

      distribution.forEach((record: any) => {
        if (!stats[record.leave_type]) {
          stats[record.leave_type] = {
            count: 0,
            min: Infinity,
            max: -Infinity,
            avg: 0,
          };
        }
        stats[record.leave_type].count++;
        stats[record.leave_type].min = Math.min(
          stats[record.leave_type].min,
          record.total_allocated,
        );
        stats[record.leave_type].max = Math.max(
          stats[record.leave_type].max,
          record.total_allocated,
        );
        stats[record.leave_type].avg += record.total_allocated;
      });

      console.log('\nLeave Type Distribution:');
      Object.entries(stats).forEach(([type, data]) => {
        const avg = (data.avg / data.count).toFixed(1);
        console.log(
          `  ${type.padEnd(10)} | ${data.count} employees | Min: ${data.min} | Max: ${data.max} | Avg: ${avg} days`,
        );
      });
    }

    console.log('\n✅ Leave balance update completed!\n');
  } catch (error: any) {
    console.error('\n❌ Update failed:', error.message);
    process.exit(1);
  }
}

// Run the script
updateLeaveBalances();
