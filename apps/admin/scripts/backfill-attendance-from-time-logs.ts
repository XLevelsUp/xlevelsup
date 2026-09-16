/**
 * Backfill script: create missing 'present' attendance records for every
 * (employee, date) that has a time_logs entry but no attendance row.
 *
 * Root cause this fixes: clock-in/clock-out only ever wrote to time_logs;
 * nothing created the corresponding attendance record, so days with a
 * completed clock-in/out session showed no status on the employee
 * attendance calendar. lib/erp/time-logs.ts now creates this record going
 * forward — this script backfills the gap for days that already happened.
 *
 * Safe to run multiple times: only inserts where no attendance row exists
 * yet for that employee/date, never overwrites an existing status.
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

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
  console.log('🚀 Starting attendance backfill from time_logs...');

  const { data: timeLogs, error: timeLogsError } = await supabase
    .from('time_logs')
    .select('employee_id, date');

  if (timeLogsError) {
    console.error('❌ Failed to fetch time_logs:', timeLogsError);
    process.exit(1);
  }

  const { data: attendanceRows, error: attendanceError } = await supabase
    .from('attendance')
    .select('employee_id, date');

  if (attendanceError) {
    console.error('❌ Failed to fetch attendance:', attendanceError);
    process.exit(1);
  }

  const existingKeys = new Set(
    (attendanceRows || []).map((row) => `${row.employee_id}_${row.date}`),
  );

  const missingKeys = new Set<string>();
  const toInsert: { employee_id: number; date: string; status: string; notes: string }[] = [];

  for (const log of timeLogs || []) {
    const key = `${log.employee_id}_${log.date}`;
    if (existingKeys.has(key) || missingKeys.has(key)) continue;
    missingKeys.add(key);
    toInsert.push({
      employee_id: log.employee_id,
      date: log.date,
      status: 'present',
      notes: 'Backfilled from time_logs (auto-attendance fix)',
    });
  }

  console.log(`📊 time_logs (employee, date) pairs: ${new Set((timeLogs || []).map((l) => `${l.employee_id}_${l.date}`)).size}`);
  console.log(`📊 Existing attendance records: ${existingKeys.size}`);
  console.log(`📝 Missing attendance records to create: ${toInsert.length}`);

  if (toInsert.length === 0) {
    console.log('✅ Nothing to backfill.');
    return;
  }

  // Insert in batches to stay well within request size limits
  const BATCH_SIZE = 500;
  let created = 0;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await supabase.from('attendance').insert(batch);
    if (insertError) {
      console.error(`❌ Failed to insert batch starting at index ${i}:`, insertError);
    } else {
      created += batch.length;
      console.log(`   Inserted ${created}/${toInsert.length}...`);
    }
  }

  console.log(`✅ Finished. Created ${created} attendance record(s).`);
}

main();
