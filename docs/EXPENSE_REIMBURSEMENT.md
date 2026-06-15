# Expense Reimbursement Feature

## Overview

This feature allows HR/Admin to track and mark expenses as reimbursed for expenses paid by employees out-of-pocket.

## Database Changes

### New Columns Added to `expenses` table:

- `reimbursed` (BOOLEAN) - Whether the expense has been reimbursed
- `reimbursed_by` (INTEGER) - User ID who marked it as reimbursed
- `reimbursed_at` (TIMESTAMP) - When it was marked as reimbursed

### Migration File

Run: `db/migrations/add-expense-reimbursement.sql`

## Features Implemented

### 1. Reimbursement Status Display

- **Reimbursed**: Shows green badge "Reimbursed"
- **Company Paid**: Shows "N/A" (no reimbursement needed)
- **Pending Approval**: Shows "Pending" until expense is approved
- **Ready to Reimburse**: Shows orange "Mark Reimbursed" button

### 2. Mark as Reimbursed Button

- Only visible for approved/paid expenses paid by employees
- Requires admin/HR role
- Records who marked it and when
- Shows confirmation dialog before marking

### 3. Reimbursement Stats

New stat card added to dashboard:

- **To Reimburse**: Shows total amount of approved/paid expenses that need reimbursement
- Only counts expenses paid by employees (not company)
- Excludes already reimbursed expenses

### 4. Reimbursement Column

New column in expenses table showing:

- Reimbursement status
- Action button for pending reimbursements
- Visual indicators (green for completed, orange for pending)

## Usage

### For HR/Admin:

1. View expenses list at `/erp/expenses`
2. Check "To Reimburse" stat to see pending reimbursements
3. Approve expense if not already approved
4. Click "Mark Reimbursed" button on approved expenses paid by employees
5. Confirm the action
6. Status updates to "Reimbursed" with timestamp

### Business Logic:

- Only shows reimbursement button when:
  - Expense status is "approved" or "paid"
  - Paid by is NOT "Company"
  - Not already marked as reimbursed
- Tracks who marked it reimbursed and when
- Updates are logged for audit purposes

## API Actions

### `markExpenseReimbursedAction(id: number)`

- **Role Required**: admin or hr
- **Parameters**: Expense ID
- **Returns**: Updated expense with reimbursement data
- **Side Effects**:
  - Sets `reimbursed = true`
  - Records `reimbursed_by` and `reimbursed_at`
  - Revalidates expenses page

## UI Components Updated

1. **ExpenseManager.tsx**
   - Added reimbursement column
   - Added "To Reimburse" stat
   - Added handler for marking reimbursed
   - Visual indicators for reimbursement status

2. **Type Definitions**
   - Updated `Expense` interface with reimbursement fields

## Future Enhancements

- [ ] Add reimbursement report/export
- [ ] Filter by reimbursement status
- [ ] Bulk reimbursement marking
- [ ] Email notifications when marked as reimbursed
- [ ] Integration with payment systems
- [ ] Reimbursement history/audit log view
