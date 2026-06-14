# Leave Management System - Technical Documentation

## System Overview

The leave management system tracks employee leave balances and requests using a relational database structure in PostgreSQL (Supabase).

---

## Database Architecture

### 1. **Employees Table** (`employees`)

- **Purpose**: Stores all employee information
- **Key Fields**:
  - `id` (Primary Key)
  - `employee_id` (Unique, e.g., XLU001, TEMP-XLU-001)
  - `name`, `email`, `department`
  - `employment_type` (full-time, part-time, contract, etc.)
  - `status` (active/inactive)

### 2. **Leave Balances Table** (`leave_balances`)

- **Purpose**: Tracks available leave days for each employee
- **Structure**:

```sql
CREATE TABLE leave_balances (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    leave_type VARCHAR(50) NOT NULL,
    total_allocated NUMERIC(4,1) DEFAULT 0,
    used_days NUMERIC(4,1) DEFAULT 0,
    remaining_days NUMERIC(4,1) GENERATED ALWAYS AS (total_allocated - used_days) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, year, leave_type)
);
```

- **Key Features**:
  - **Foreign Key**: Links to `employees(id)` with CASCADE delete
  - **Unique Constraint**: One record per employee, per year, per leave type
  - **Auto-calculated Field**: `remaining_days` automatically computed as `total_allocated - used_days`
  - **Year-based**: Separate records for each calendar year

### 3. **Leave Requests Table** (`leave_requests`)

- **Purpose**: Stores all leave requests submitted by employees
- **Structure**:

```sql
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('sick', 'casual', 'floater', 'earned', 'unpaid', 'maternity', 'paternity', 'other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC(4,1) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reviewed_by INTEGER REFERENCES employees(id),
    reviewed_at TIMESTAMP,
    review_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Leave Policy Configuration

### Current Policy (2026)

| Leave Type          | Annual Allocation   | Eligibility      | Notes                             |
| ------------------- | ------------------- | ---------------- | --------------------------------- |
| **Casual Leave**    | 18 days (1.5/month) | All employees    | For planned personal needs        |
| **Floater Leave**   | 2 days              | All employees    | Festival/personal choice holidays |
| **Sick Leave**      | 10 days             | All employees    | Medical emergencies               |
| **Earned Leave**    | 0 days initially    | All employees    | Earned: 8 OT hours = 1 day        |
| **Unpaid Leave**    | Unlimited           | All employees    | Subject to approval               |
| **Maternity Leave** | As per policy       | Female employees | Subject to local labor laws       |
| **Paternity Leave** | As per policy       | Male employees   | Subject to local labor laws       |

---

## Data Flow

### 1. **Initialization Flow**

```
New Employee Created
        ↓
initializeLeaveBalance() called
        ↓
4 records inserted in leave_balances:
  - casual: 18 days
  - floater: 2 days
  - sick: 10 days
  - earned: 0 days
        ↓
Employee has leave balance available
```

### 2. **Leave Request Flow**

```
Employee submits leave request
        ↓
Record inserted in leave_requests (status: pending)
        ↓
Admin/Manager reviews request
        ↓
If APPROVED:
  - update leave_requests.status = 'approved'
  - update leave_balances.used_days += total_days
  - remaining_days auto-recalculated
        ↓
If REJECTED:
  - update leave_requests.status = 'rejected'
  - No change to leave_balances
```

### 3. **Earned Leave Calculation Flow**

```
Admin marks attendance with OT hours
        ↓
overtime_hours stored in attendance table
        ↓
Run updateEarnedLeaveBalance()
        ↓
Query: SUM all overtime_hours for employee for year
        ↓
Calculate: earned_days = total_OT_hours ÷ 8
        ↓
Update leave_balances.total_allocated for earned leave type
        ↓
remaining_days auto-recalculated
```

---

## Where Leave Data Comes From

### **For Employee Portal** (`/employee/leave`)

1. **Leave Balances Display** (Chart at top):

   ```typescript
   // In app/employee/leave/page.tsx
   const leaveBalances = await getEmployeeLeaveBalance(session.id);
   // Returns: LeaveBalance[] from leave_balances table
   ```

2. **Function Details**:

   ```typescript
   // In lib/erp/leave-requests.ts
   export async function getEmployeeLeaveBalance(
     employeeId: number,
     year?: number,
   ): Promise<LeaveBalance[]> {
     const currentYear = year || new Date().getFullYear();

     const { data, error } = await supabase
       .from('leave_balances')
       .select('*')
       .eq('employee_id', employeeId)
       .eq('year', currentYear);

     return data || [];
   }
   ```

3. **Data Structure Returned**:
   ```typescript
   [
     {
       id: 1,
       employee_id: 123,
       year: 2026,
       leave_type: 'casual',
       total_allocated: 18,
       used_days: 3,
       remaining_days: 15, // Auto-calculated
       created_at: '2026-01-01T00:00:00Z',
       updated_at: '2026-06-12T10:30:00Z',
     },
     // ... floater, sick, earned records
   ];
   ```

### **Why Leave Might Not Show**

**Possible Reasons:**

1. ✅ **Leave balances not initialized**
   - Check: Run verification query below
   - Fix: Run `npm run init-leave-balances`

2. ✅ **Year mismatch**
   - System queries current year (2026)
   - Old balances from 2025 won't show
   - Fix: Initialize for current year

3. ✅ **Employee not active**
   - Only `status = 'active'` employees get balances
   - Fix: Ensure employee status is active

4. ✅ **Database migration not run**
   - leave_balances table might not exist
   - Fix: Run schema migration

---

## Initialization Scripts

### **Option 1: TypeScript Script (Recommended)**

**Run:**

```bash
npm run init-leave-balances
```

**What it does:**

- Fetches all active employees
- Creates 4 leave balance records per employee
- Skips existing records (safe to re-run)
- Shows detailed progress and summary

**File:** `scripts/init-leave-balances.ts`

### **Option 2: SQL Script (Direct Database)**

**Run in Supabase SQL Editor:**

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Copy contents of `db/init-leave-balances.sql`
3. Click "Run"

**What it does:**

- Same as TypeScript script
- Direct SQL execution
- Shows NOTICE messages with progress

**File:** `db/init-leave-balances.sql`

---

## Verification Queries

### **Check Leave Balance Status**

```sql
-- 1. Count leave balances per employee
SELECT
    e.employee_id,
    e.name,
    COUNT(lb.id) as leave_balance_count
FROM employees e
LEFT JOIN leave_balances lb ON e.id = lb.employee_id
    AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE e.status = 'active'
GROUP BY e.id, e.employee_id, e.name
ORDER BY leave_balance_count, e.employee_id;

-- Expected: Each employee should have 4 records
```

```sql
-- 2. Leave type distribution
SELECT
    leave_type,
    COUNT(DISTINCT employee_id) as employee_count,
    ROUND(AVG(total_allocated), 1) as avg_allocated,
    ROUND(AVG(used_days), 1) as avg_used,
    ROUND(AVG(remaining_days), 1) as avg_remaining
FROM leave_balances
WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY leave_type
ORDER BY leave_type;

-- Expected output:
-- casual:  X employees, 18.0 allocated
-- floater: X employees, 2.0 allocated
-- sick:    X employees, 10.0 allocated
-- earned:  X employees, 0.0 allocated
```

```sql
-- 3. Find employees missing leave balances
SELECT
    e.employee_id,
    e.name,
    e.employment_type,
    COUNT(lb.id) as leave_count
FROM employees e
LEFT JOIN leave_balances lb ON e.id = lb.employee_id
WHERE e.status = 'active'
    AND (lb.year = EXTRACT(YEAR FROM CURRENT_DATE) OR lb.id IS NULL)
GROUP BY e.id, e.employee_id, e.name, e.employment_type
HAVING COUNT(lb.id) < 4;

-- If any rows returned: Those employees need initialization
```

---

## API Functions Reference

### **For Backend Use**

```typescript
// Initialize leave balance for one employee
import { initializeLeaveBalance } from '@/lib/erp/leave-requests';
await initializeLeaveBalance(employeeId, employmentType);

// Get leave balance for one employee
import { getEmployeeLeaveBalance } from '@/lib/erp/leave-requests';
const balances = await getEmployeeLeaveBalance(employeeId, 2026);

// Update earned leave from OT
import { updateEarnedLeaveBalance } from '@/lib/erp/leave-requests';
await updateEarnedLeaveBalance(employeeId);

// Batch update all employees
import { batchUpdateEarnedLeaveBalances } from '@/lib/erp/leave-requests';
await batchUpdateEarnedLeaveBalances(2026);
```

### **For Admin Actions**

```typescript
// Server action to update earned leave
import { batchUpdateEarnedLeaveAction } from '@/actions/erp/earned-leave';
const result = await batchUpdateEarnedLeaveAction();
```

---

## Troubleshooting

### **Problem: Leave balance shows 0 for all types**

**Diagnosis:**

```sql
SELECT * FROM leave_balances
WHERE employee_id = YOUR_EMPLOYEE_ID
AND year = 2026;
```

**Solutions:**

1. If no rows: Run `npm run init-leave-balances`
2. If rows exist but total_allocated = 0: Data corruption, re-run init script
3. If year mismatch: Initialize for correct year

### **Problem: Earned leave not updating from OT**

**Diagnosis:**

```sql
SELECT employee_id, SUM(overtime_hours) as total_ot
FROM attendance
WHERE employee_id = YOUR_EMPLOYEE_ID
AND date >= '2026-01-01'
GROUP BY employee_id;
```

**Solutions:**

1. Ensure overtime_hours column exists in attendance table
2. Run: `await updateEarnedLeaveBalance(employeeId)`
3. Check calculation: 8 OT hours = 1 earned leave day

### **Problem: Leave request approved but balance didn't decrease**

**Check:**

```sql
SELECT * FROM leave_requests WHERE id = YOUR_REQUEST_ID;
SELECT * FROM leave_balances
WHERE employee_id = YOUR_EMPLOYEE_ID
AND leave_type = 'YOUR_TYPE';
```

**Possible causes:**

1. Request approval didn't trigger balance update
2. Trigger function missing or failed
3. Manual update needed

---

## Best Practices

### **For Administrators**

1. ✅ **Run initialization once per year**

   ```bash
   npm run init-leave-balances
   ```

2. ✅ **Update earned leave monthly**

   ```typescript
   await batchUpdateEarnedLeaveBalances();
   ```

3. ✅ **Verify balances quarterly**
   - Run verification queries
   - Check for anomalies
   - Audit leave usage patterns

### **For Developers**

1. ✅ **Always initialize leave on employee creation**

   ```typescript
   const employee = await createEmployee(data);
   await initializeLeaveBalance(employee.id, employee.employment_type);
   ```

2. ✅ **Update balances on leave approval**
   - Trigger handled in reviewLeaveRequest()
   - Updates used_days automatically

3. ✅ **Handle year transitions**
   - New year = new leave allocations
   - Don't carry forward used_days

---

## Related Files

- **Schema**: `db/schema.sql`
- **Migrations**: `db/migration-new-leave-policy.sql`
- **Init Scripts**:
  - `scripts/init-leave-balances.ts`
  - `db/init-leave-balances.sql`
- **Core Logic**: `lib/erp/leave-requests.ts`
- **Actions**: `actions/erp/leave-requests.ts`, `actions/erp/earned-leave.ts`
- **UI Components**:
  - `components/erp/employee/LeaveBalanceChart.tsx`
  - `components/erp/employee/LeaveRequestForm.tsx`
  - `components/erp/employee/LeaveRequestList.tsx`
- **Pages**: `app/employee/leave/page.tsx`

---

## Summary

**Key Points:**

1. Leave data stored in `leave_balances` table (PostgreSQL/Supabase)
2. Linked to employees via foreign key relationship
3. One record per employee, per year, per leave type
4. `remaining_days` auto-calculated (total_allocated - used_days)
5. Must initialize for each employee using provided scripts
6. Chart filters to show only: casual, floater, sick, earned (not unpaid/maternity/paternity)

**To Fix "No Availability" Issue:**

```bash
# Run this command:
npm run init-leave-balances

# Then verify in Supabase SQL Editor:
SELECT * FROM leave_balances WHERE year = 2026;
```
