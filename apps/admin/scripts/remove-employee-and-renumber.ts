/**
 * One-off: permanently delete an inactive XLU employee and close the gap they
 * leave in the series, moving everyone after them down by one.
 *
 * Only the employee_id display code changes for the people who move. Foreign
 * keys and sessions use employees.id and login uses email, so nothing else
 * needs updating. The one code the app looks up is the approver in
 * config/approvals.config.ts, so don't renumber past that employee.
 *
 * Dry run by default: nothing changes until --confirm is passed. Refuses if the
 * employee has payroll or ledger rows, and there is no undo once it runs.
 *
 * Usage (from apps/admin):
 *   npx tsx scripts/remove-employee-and-renumber.ts XLU008
 *   npx tsx scripts/remove-employee-and-renumber.ts XLU008 --confirm
 */
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import dotenv from 'dotenv';
import { APPROVER_EMPLOYEE_ID } from '../config/approvals.config';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

/** Pay records. Any row here blocks the delete. */
const PAY_TABLES = ['payroll', 'financial_ledger'];

/** Deleted along with the employee. */
const CASCADE_TABLES = [
  'attendance',
  'attendance_change_requests',
  'employee_career_history',
  'employee_salary_structure',
  'leave_balances',
  'leave_requests',
  'login_logs',
  'push_subscriptions',
  'time_logs',
];

const codeNumber = (code: string) => parseInt(code.slice(3), 10);
const toCode = (num: number) => `XLU${String(num).padStart(3, '0')}`;

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

  if (!employeeCode || !/^XLU\d{3}$/.test(employeeCode)) {
    console.error('Usage: npx tsx scripts/remove-employee-and-renumber.ts XLU### [--confirm]');
    process.exitCode = 1;
    return;
  }

  const { data: employees, error: fetchError } = await supabase
    .from('employees')
    .select('id, employee_id, name, status')
    .like('employee_id', 'XLU%')
    .order('employee_id');
  if (fetchError) throw fetchError;

  const target = employees?.find((e) => e.employee_id === employeeCode);
  if (!target) {
    console.error(`❌ No employee found with ID ${employeeCode}.`);
    process.exitCode = 1;
    return;
  }

  console.log(`${target.employee_id} ${target.name} | status=${target.status}\n`);

  if (target.status !== 'inactive') {
    console.error(`❌ Aborting: status is '${target.status}'. Only inactive employees can be removed here.`);
    process.exitCode = 1;
    return;
  }

  let payRows = 0;
  for (const table of PAY_TABLES) {
    const count = await countRows(table, target.id);
    payRows += count;
    console.log(`  ${table}: ${count}`);
  }
  for (const table of CASCADE_TABLES) {
    console.log(`  ${table}: ${await countRows(table, target.id)} (deleted permanently)`);
  }

  if (payRows > 0) {
    console.error(`\n❌ Aborting: ${payRows} payroll/ledger row(s) would be lost or unlinked.`);
    process.exitCode = 1;
    return;
  }

  // Ascending, so each new code is already free when it is assigned.
  const moves = employees!
    .filter((e) => codeNumber(e.employee_id) > codeNumber(employeeCode))
    .map((e, index) => ({ ...e, newCode: toCode(codeNumber(employeeCode) + index) }));

  if (moves.some((m) => m.employee_id === APPROVER_EMPLOYEE_ID)) {
    console.error(`\n❌ Aborting: this would renumber the approver (${APPROVER_EMPLOYEE_ID}).`);
    process.exitCode = 1;
    return;
  }

  console.log('\nRenumbering:');
  for (const move of moves) console.log(`  ${move.employee_id} → ${move.newCode} ${move.name}`);
  if (moves.length === 0) console.log('  (nobody after this ID)');

  if (!confirmed) {
    console.log(`\nDry run, nothing changed. Re-run with --confirm to delete ${target.employee_id} and renumber.`);
    return;
  }

  const { data: deleted, error: deleteError } = await supabase
    .from('employees')
    .delete()
    .eq('id', target.id)
    .select('id');
  if (deleteError) throw deleteError;

  if (deleted?.length !== 1) {
    console.error(`❌ Expected to delete 1 employee but deleted ${deleted?.length ?? 0}. Nothing was renumbered.`);
    process.exitCode = 1;
    return;
  }
  console.log(`\n✅ Deleted ${target.employee_id} ${target.name}.`);

  for (const move of moves) {
    const { data: updated, error: updateError } = await supabase
      .from('employees')
      .update({ employee_id: move.newCode })
      .eq('id', move.id)
      .select('id');

    if (updateError || updated?.length !== 1) {
      throw new Error(
        `${target.employee_id} is already deleted, but ${move.employee_id} could not move to ${move.newCode}: ` +
          `${updateError?.message ?? 'no row updated'}. Set the remaining codes by hand.`,
      );
    }
    console.log(`✅ ${move.employee_id} → ${move.newCode} ${move.name}`);
  }
}

main().catch((error) => {
  console.error('❌ Failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
