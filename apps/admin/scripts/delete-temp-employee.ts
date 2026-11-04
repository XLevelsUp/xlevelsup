/**
 * One-off: delete a temporary/freelancer employee who was added by mistake.
 *
 * Deletes exactly one employee, picked by employee_id. Dry run by default:
 * nothing changes until --confirm is passed. Refuses anyone with recorded
 * activity, because the delete cascades into their attendance, time logs and
 * payroll and unlinks their ledger entries. Mark those people inactive instead.
 *
 * Usage (from apps/admin):
 *   npx tsx scripts/delete-temp-employee.ts TEMP002
 *   npx tsx scripts/delete-temp-employee.ts TEMP002 --confirm
 */
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

/** Rows here mean the account was really used, so any of them blocks the delete. */
const ACTIVITY_TABLES = [
  'attendance',
  'attendance_change_requests',
  'employee_career_history',
  'employee_salary_structure',
  'financial_ledger',
  'leave_requests',
  'login_logs',
  'payroll',
  'push_subscriptions',
  'time_logs',
];

/** Created by createEmployee when an employee is added, so these go with the row. */
const SETUP_TABLES = ['leave_balances'];

async function countRows(table: string, employeeId: number): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('employee_id', employeeId);
  if (error) throw error;
  // A HEAD request on a missing table returns a null count and no error. Stop
  // here rather than read that as zero rows.
  if (count === null) throw new Error(`Could not count rows in ${table}`);
  return count;
}

async function main() {
  const args = process.argv.slice(2);
  const confirmed = args.includes('--confirm');
  const employeeCode = args.find((arg) => !arg.startsWith('--'));

  if (!employeeCode || !/^TEMP/.test(employeeCode)) {
    console.error('Usage: npx tsx scripts/delete-temp-employee.ts TEMP### [--confirm]');
    process.exitCode = 1;
    return;
  }

  const { data: employee, error: fetchError } = await supabase
    .from('employees')
    .select('id, employee_id, name, email, employment_type, created_at')
    .eq('employee_id', employeeCode)
    .maybeSingle();
  if (fetchError) throw fetchError;

  if (!employee) {
    console.error(`❌ No employee found with ID ${employeeCode}.`);
    process.exitCode = 1;
    return;
  }

  console.log(`${employee.employee_id} ${employee.name} <${employee.email}>`);
  console.log(`  type=${employee.employment_type} | added=${employee.created_at}\n`);

  if (employee.employment_type !== 'temporary' && employee.employment_type !== 'freelancer') {
    console.error(`❌ Aborting: employment type is '${employee.employment_type}', not temporary or freelancer.`);
    process.exitCode = 1;
    return;
  }

  let activityRows = 0;
  for (const table of ACTIVITY_TABLES) {
    const count = await countRows(table, employee.id);
    activityRows += count;
    console.log(`  ${table}: ${count}`);
  }
  for (const table of SETUP_TABLES) {
    console.log(`  ${table}: ${await countRows(table, employee.id)} (deleted with the employee)`);
  }

  if (activityRows > 0) {
    console.error(`\n❌ Aborting: ${activityRows} activity row(s) would be lost or unlinked. Mark this employee inactive instead.`);
    process.exitCode = 1;
    return;
  }

  if (!confirmed) {
    console.log(`\nDry run, nothing deleted. Re-run with --confirm to delete ${employee.employee_id}.`);
    return;
  }

  const { data: deleted, error: deleteError } = await supabase
    .from('employees')
    .delete()
    .eq('id', employee.id)
    .select('id');
  if (deleteError) throw deleteError;

  if (deleted?.length !== 1) {
    console.error(`❌ Expected to delete 1 employee but deleted ${deleted?.length ?? 0}.`);
    process.exitCode = 1;
    return;
  }

  console.log(`\n✅ Deleted ${employee.employee_id} ${employee.name}.`);
}

main().catch((error) => {
  console.error('❌ Failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
