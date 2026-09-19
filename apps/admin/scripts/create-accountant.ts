/**
 * Create an ERP accountant login.
 *
 * There is no UI for creating ERP users — admin/hr rows have always been
 * inserted into Supabase by hand, and db/init-supabase.ts only ever seeds the
 * single default admin. This script exists so an accountant can be added
 * without hand-hashing a bcrypt password.
 *
 * Run the migration FIRST, or the insert fails the role CHECK constraint:
 *   apps/admin/db/migration-accountant-role.sql
 *
 * Usage:
 *   npm run create-accountant -w @xlu/admin -- <email> <password>
 *
 * Password must be 8+ chars with upper, lower, and a number or symbol.
 */
import dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

// Env must load before lib/supabase is evaluated — it reads
// NEXT_PUBLIC_SUPABASE_URL/ANON_KEY at module scope and throws if either is
// missing. Static imports hoist above statements, so supabase is imported
// dynamically inside main() after config() has run.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error(
      'Usage: npm run create-accountant -w @xlu/admin -- <email> <password>',
    );
    process.exit(1);
  }

  // Password policy.
  //
  // Aligned with the employee-portal rule in actions/erp/employee-auth.ts
  // (min 8, mixed case) with one deliberate difference: that rule demands a
  // DIGIT specifically, which rejects otherwise-strong passphrases whose only
  // non-letter is a symbol. Here a digit OR a symbol satisfies the same intent.
  //
  // This replaces a flat 12-character minimum. Composition is checked instead
  // of length alone, so the bar on raw length is lower than it was — for an
  // account that can read every invoice, prefer something longer than the
  // minimum and rotate it after handover.
  const rules: { ok: boolean; message: string }[] = [
    { ok: password.length >= 8, message: 'be at least 8 characters' },
    { ok: /[a-z]/.test(password), message: 'contain a lowercase letter' },
    { ok: /[A-Z]/.test(password), message: 'contain an uppercase letter' },
    {
      ok: /[\d\W_]/.test(password),
      message: 'contain a number or a symbol',
    },
  ];

  const failed = rules.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error('❌ Password must:');
    for (const rule of failed) console.error(`   • ${rule.message}`);
    process.exit(1);
  }

  const { supabase } = await import('@/lib/supabase');

  const { data: existing } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', email)
    .single();

  if (existing) {
    console.error(
      `❌ A user with ${email} already exists (role: ${existing.role}).`,
    );
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 10);

  const { error } = await supabase.from('users').insert({
    email,
    password_hash,
    role: 'accountant',
  });

  if (error) {
    // A CHECK violation here almost always means the migration has not run.
    console.error('❌ Failed to create accountant:', error.message);
    if (error.message.includes('users_role_check')) {
      console.error(
        '   Run apps/admin/db/migration-accountant-role.sql first — the live\n' +
          "   CHECK constraint does not yet allow 'accountant'.",
      );
    }
    process.exit(1);
  }

  console.log(`✅ Accountant created: ${email}`);
  console.log('   Access: ERP → Billing → Invoice History (view + download).');
}

main();
