# Leave Balance Initialization - Quick Guide

## Problem: Leave Balances Not Showing

If employees see no leave availability or the leave balance chart is empty, run the initialization script.

---

## 🚀 Solution: Run Initialization Script

### **Option 1: Using npm (Recommended)**

```bash
npm run init-leave-balances
```

**What happens:**

- ✅ Finds all active employees
- ✅ Creates 4 leave balance records per employee:
  - Casual Leave: 18 days
  - Floater Leave: 2 days
  - Sick Leave: 10 days
  - Earned Leave: 0 days (will increase with OT)
- ✅ Skips employees who already have balances
- ✅ Shows detailed progress and summary

**Expected Output:**

```
🚀 Starting leave balance initialization...

📅 Current Year: 2026

📊 Fetching all active employees...
✅ Found 5 active employees

📋 Leave Policy:
   - Casual Leave (1.5/month): 18 days
   - Floater Leave: 2 days
   - Sick Leave: 10 days
   - Earned Leave (OT-based): 0 days

👤 Processing: John Doe (XLU001)
   Employment Type: full-time
   ✅ casual: Initialized (18 days)
   ✅ floater: Initialized (2 days)
   ✅ sick: Initialized (10 days)
   ✅ earned: Initialized (0 days)

... (more employees)

============================================================
📊 INITIALIZATION SUMMARY
============================================================
Total Employees Processed: 5
Leave Records Created: 20
Leave Records Skipped: 0 (already exists)
Errors: 0
============================================================

✅ Leave balance initialization completed!
```

---

### **Option 2: Using SQL (Direct in Supabase)**

1. Go to Supabase SQL Editor:

   ```
   https://supabase.com/dashboard/project/vwgsbstkbjygokydvnia/sql/new
   ```

2. Open file: `db/init-leave-balances.sql`

3. Copy all contents and paste into SQL Editor

4. Click **"Run"**

5. Check the output in the "Results" tab

---

## ✅ Verify Installation

### Check in Supabase Dashboard

**Query:**

```sql
SELECT
    e.employee_id,
    e.name,
    lb.leave_type,
    lb.total_allocated,
    lb.used_days,
    lb.remaining_days
FROM employees e
JOIN leave_balances lb ON e.id = lb.employee_id
WHERE lb.year = 2026
    AND e.status = 'active'
ORDER BY e.employee_id, lb.leave_type;
```

**Expected Result:**
Each employee should have 4 rows:
| employee_id | name | leave_type | total_allocated | used_days | remaining_days |
|------------|------|-----------|-----------------|-----------|----------------|
| XLU001 | John Doe | casual | 18 | 0 | 18 |
| XLU001 | John Doe | earned | 0 | 0 | 0 |
| XLU001 | John Doe | floater | 2 | 0 | 2 |
| XLU001 | John Doe | sick | 10 | 0 | 10 |

---

## 📊 Check Employee Portal

1. Login as employee: http://localhost:3000/employee/login
2. Go to: http://localhost:3000/employee/leave
3. You should see:
   - **Leave Balance Chart** at the top showing 4 leave types with progress bars
   - **Available days** for each type
   - **Form** showing balance when selecting leave type

---

## 🔧 Database Structure

### Leave Balances Table

```
leave_balances
├── id (primary key)
├── employee_id (foreign key → employees.id)
├── year (2026)
├── leave_type (casual, floater, sick, earned)
├── total_allocated (18, 2, 10, 0)
├── used_days (starts at 0)
└── remaining_days (auto-calculated: total_allocated - used_days)
```

**Unique Constraint:**
One record per `(employee_id, year, leave_type)` combination

---

## 🐛 Troubleshooting

### Issue: "No active employees found"

**Cause:** No employees with `status = 'active'`
**Fix:** Check employees table:

```sql
SELECT employee_id, name, status FROM employees;
```

### Issue: Script fails with "Missing environment variables"

**Cause:** `.env.local` not configured
**Fix:** Ensure these variables exist in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://vwgsbstkbjygokydvnia.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Issue: "Records Skipped: 20 (already exists)"

**Cause:** Leave balances already initialized
**Status:** ✅ This is GOOD - means employees already have balances
**Action:** No action needed, balances are ready

### Issue: Leave still not showing in UI

**Check:**

1. Year mismatch:

   ```sql
   SELECT DISTINCT year FROM leave_balances;
   ```

   Should return: `2026`

2. Employee ID mismatch:

   ```sql
   SELECT id, employee_id FROM employees WHERE email = 'employee@example.com';
   ```

   Verify the ID matches

3. Browser cache:
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear browser cache

---

## 📝 When to Run This Script

### ✅ Run When:

1. Setting up ERP system for the first time
2. Adding new employees (or use `initializeLeaveBalance()` in code)
3. Starting a new calendar year
4. Migrating from old leave policy
5. Leave balances missing or corrupted

### ❌ Don't Need to Run When:

1. Making changes to leave requests
2. Approving/rejecting leave
3. Updating earned leave from OT (use `batchUpdateEarnedLeaveBalances()` instead)
4. Employee taking leave (balance auto-updates)

---

## 📚 Related Documentation

- **Full Architecture**: `docs/LEAVE_SYSTEM_ARCHITECTURE.md`
- **Leave Policy**: `docs/LEAVE_POLICY.md`
- **Migration Scripts**: `db/migration-new-leave-policy.sql`
- **Quick Start**: `docs/LEAVE_POLICY_QUICKSTART.md`

---

## 💡 Quick Commands

```bash
# Initialize leave balances for all employees
npm run init-leave-balances

# Initialize ERP system (creates admin user)
npm run init-erp

# Create login credentials for existing employees
npm run create-employee-logins

# Start development server
npm run dev
```

---

## ✨ Success Indicators

After running the script, you should see:

- ✅ Leave balance chart displays with 4 leave types
- ✅ Each type shows available/total days
- ✅ Progress bars are visible and colored
- ✅ Form shows balance when selecting leave type
- ✅ No error messages in console

---

## 🆘 Still Having Issues?

1. Check console for errors:
   - Browser Console: F12 → Console tab
   - Server logs: Terminal running `npm run dev`

2. Verify Supabase connection:

   ```bash
   # Test connection in browser
   console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
   ```

3. Check employee exists in database:

   ```sql
   SELECT * FROM employees WHERE email = 'your-email@example.com';
   ```

4. Verify leave_balances table exists:
   ```sql
   SELECT * FROM leave_balances LIMIT 1;
   ```

If table doesn't exist, run schema migration first:

- Copy contents of `db/schema.sql`
- Run in Supabase SQL Editor
