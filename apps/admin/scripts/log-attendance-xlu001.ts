import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

// Load environment variables
require('dotenv').config({
  path: path.resolve(process.cwd(), '.env.local'),
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    console.log('🚀 Starting attendance logging script...');

    // 1. Fetch employee details for XLU001
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', 'XLU001')
      .single();

    if (empError || !employee) {
      console.error('❌ Error: Employee XLU001 not found', empError);
      process.exit(1);
    }

    console.log(`👤 Found Employee: ${employee.name} (ID: ${employee.id})`);
    console.log(`📅 Joining Date: ${employee.joining_date}`);

    // 2. Fetch holidays from database
    const { data: holidays, error: holError } = await supabase
      .from('company_holidays')
      .select('date')
      .eq('is_active', true)
      .eq('holiday_type', 'public');

    if (holError) {
      console.error('❌ Error fetching holidays:', holError);
      process.exit(1);
    }

    const holidayDates = new Set(holidays?.map((h) => h.date) || []);
    console.log(`🏖️ Loaded ${holidayDates.size} active public holiday(s).`);

    // 3. Define date range: from joining_date to today (2026-07-14)
    const startDate = new Date(employee.joining_date + 'T00:00:00Z');
    const endDate = new Date('2026-07-14T00:00:00Z');

    console.log(`📅 Date range: ${employee.joining_date} to 2026-07-14`);

    let currentDate = new Date(startDate);
    let workingDaysCount = 0;
    let attendanceCount = 0;
    let timeLogsCount = 0;

    // Loop through all dates
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getUTCDay(); // 0 = Sunday, 6 = Saturday

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        continue;
      }

      // Skip public holidays
      if (holidayDates.has(dateStr)) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        continue;
      }

      workingDaysCount++;
      console.log(`📝 Processing working day: ${dateStr}`);

      // Delete existing change requests, attendance, and time logs for this date to avoid duplicates
      await supabase
        .from('attendance_change_requests')
        .delete()
        .eq('employee_id', employee.id)
        .eq('request_date', dateStr);

      await supabase
        .from('attendance')
        .delete()
        .eq('employee_id', employee.id)
        .eq('date', dateStr);

      await supabase
        .from('time_logs')
        .delete()
        .eq('employee_id', employee.id)
        .eq('date', dateStr);

      // Generate random duration approx 11 hours (between 10.8 and 11.2 hours)
      const totalHours = parseFloat((11 + (Math.random() - 0.5) * 0.4).toFixed(2));
      
      // Calculate clock in and clock out
      // Target clock in: 09:00 AM IST (which is 03:30 AM UTC)
      // We vary it randomly between 03:15 AM UTC and 03:45 AM UTC (08:45 AM IST and 09:15 AM IST)
      const inHour = 3;
      const inMinute = Math.floor(Math.random() * 30) + 15; // 15 to 44
      const inSecond = Math.floor(Math.random() * 60);
      
      const clockIn = new Date(Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate(),
        inHour,
        inMinute,
        inSecond
      ));

      const clockOut = new Date(clockIn.getTime() + totalHours * 60 * 60 * 1000);

      // Insert Attendance Record
      const overtime = parseFloat(Math.max(0, totalHours - 8).toFixed(2));
      const { error: attInsertError } = await supabase
        .from('attendance')
        .insert({
          employee_id: employee.id,
          date: dateStr,
          status: 'present',
          overtime_hours: overtime,
          notes: null,
          created_by: 1, // Default admin user ID
        });

      if (attInsertError) {
        console.error(`❌ Failed to insert attendance for ${dateStr}:`, attInsertError);
      } else {
        attendanceCount++;
      }

      // Insert Time Log Record
      const { error: tlInsertError } = await supabase
        .from('time_logs')
        .insert({
          employee_id: employee.id,
          date: dateStr,
          clock_in_time: clockIn.toISOString(),
          clock_out_time: clockOut.toISOString(),
          total_hours: totalHours,
          status: 'completed',
          notes: null,
        });

      if (tlInsertError) {
        console.error(`❌ Failed to insert time log for ${dateStr}:`, tlInsertError);
      } else {
        timeLogsCount++;
      }

      // Move to next day (using UTC methods)
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    console.log('\n📊 SCRIPT SUMMARY:');
    console.log(`   Total Working Days Found: ${workingDaysCount}`);
    console.log(`   Attendance Records Created: ${attendanceCount}`);
    console.log(`   Time Log Records Created: ${timeLogsCount}`);
    console.log('✅ Finished successfully.');

  } catch (error) {
    console.error('❌ Fatal error running script:', error);
  }
}

main();
