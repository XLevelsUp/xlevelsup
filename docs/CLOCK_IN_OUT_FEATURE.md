# Clock In/Out Feature - Time Tracking System

## Overview

Comprehensive employee time tracking system with clock in/out functionality, live timer, and 9-hour validation.

## Features

### Core Functionality

- **Clock In/Out**: Employees can clock in and out through the employee portal
- **Live Timer**: Real-time display of elapsed time during active session
- **Multiple Sessions**: Support for multiple clock in/out sessions per day
- **9-Hour Validation**: Warning when attempting to clock out before completing 9 hours
- **Session History**: View all completed sessions for the day
- **Total Hours**: Automatic calculation of total hours worked

### User Experience

- Real-time timer updates every second
- Visual status indicator (Clocked In/Out)
- Color-coded time display (cyan for active, white for total)
- Progress tracking with pending hours warning
- Session breakdown with individual timestamps
- Informative tips and warnings

## Database Schema

### time_logs Table

```sql
CREATE TABLE time_logs (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    clock_in_time TIMESTAMP NOT NULL,
    clock_out_time TIMESTAMP,
    total_hours NUMERIC(5, 2),
    status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active', 'completed')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes

- `idx_time_logs_employee_date`: Fast employee+date lookups
- `idx_time_logs_status`: Filter by active/completed status
- `idx_time_logs_date`: Date-based queries

## Architecture

### Backend Functions (lib/erp/time-logs.ts)

- `getActiveTimeLog()`: Get current active session
- `getTimeLogsByDate()`: Get all sessions for a date
- `getTimeLogSummary()`: Get complete daily summary
- `clockIn()`: Create new time log entry
- `clockOut()`: Complete active session
- `getTimeLogsByRange()`: Get logs for date range
- `getAllTimeLogs()`: Admin view with filters
- `getMonthlyWorkingHours()`: Calculate monthly totals

### Server Actions (actions/erp/time-logs.ts)

- `clockInAction()`: Clock in with validation
- `clockOutAction()`: Clock out with 8-hour check
- `getTimeLogSummaryAction()`: Fetch current summary

### UI Component (components/erp/employee/ClockInOut.tsx)

- Live timer with second-by-second updates
- Status indicator (Clocked In/Out)
- Session breakdown display
- Clock In/Out buttons
- Warning modal for <9 hours

## Usage

### Employee Flow

1. **Clock In**: Click "🟢 Clock In" button
2. **Active Session**: Timer starts running automatically
3. **Clock Out**: Click "🔴 Clock Out" button
4. **Validation**:
   - If <9 hours: Warning modal appears
   - Shows pending hours remaining
   - Option to continue or clock out anyway
5. **Multiple Sessions**: Can clock in again same day to continue

### Time Calculations

- **Active Time**: Real-time calculation from clock_in_time to now
- **Completed Time**: Stored in total_hours field
- **Daily Total**: Sum of all completed sessions + current active session
- **Pending Hours**: 9 - total_hours (if less than 9)

## Integration

### Employee Dashboard

Location: `app/employee/dashboard/page.tsx`

```tsx
import { getTimeLogSummary } from '@/lib/erp/time-logs';
import ClockInOut from '@/components/erp/employee/ClockInOut';

const timeLogSummary = await getTimeLogSummary(employeeId);

<ClockInOut employeeId={session.id} initialSummary={timeLogSummary} />;
```

### Layout

- Takes 1 column in 3-column grid on large screens
- Full width on mobile devices
- Positioned prominently at top of dashboard

## Installation

### 1. Run Migration

```bash
psql -h vwgsbstkbjygokydvnia.supabase.co -U postgres -d postgres -f db/migrations/add-time-logs-table.sql
```

Or run in Supabase SQL Editor:

```sql
-- Copy contents from db/migrations/add-time-logs-table.sql
```

### 2. Verify Setup

- Check table created: `SELECT * FROM time_logs LIMIT 1;`
- Check indexes: `\d time_logs`
- Test RLS: Should allow authenticated operations

### 3. Test Functionality

1. Login to employee portal: http://localhost:3000/employee/login
2. Navigate to dashboard: http://localhost:3000/employee/dashboard
3. Click "Clock In" button
4. Verify timer starts running
5. Click "Clock Out" button (will show warning if <9 hours)
6. Confirm clock out

## Technical Details

### Timer Implementation

- Uses React `useEffect` hook with 1-second interval
- Calculates elapsed time from stored clock_in_time
- Updates every second when status is 'active'
- Cleans up interval on unmount or clock out

### Time Format

- **Display**: HH:MM:SS (e.g., "03:45:12")
- **Storage**: ISO 8601 timestamp (e.g., "2024-01-15T09:30:00.000Z")
- **Hours**: Decimal format (e.g., 3.75 hours)

### Validation Logic

```typescript
const totalHours = getTotalHours();
const isLessThan9Hours = totalHours < 9;

if (isLessThan9Hours) {
  // Show warning modal
  const pendingHours = 9 - totalHours;
  // Display: "Pending hours: X.XX hours"
}
```

### Multiple Session Handling

- Each clock in creates new `time_logs` record
- Only one session can be 'active' at a time
- Completed sessions have status='completed'
- Total hours = sum of all completed + current active

## Future Enhancements

### Potential Features

1. **Overtime Calculation**: Automatically calculate OT after 9 hours
2. **Break Tracking**: Add break in/out buttons
3. **Location Tracking**: Optional GPS location on clock in/out
4. **Notifications**: Remind employees to clock in/out
5. **Weekly/Monthly Reports**: Generate time tracking reports
6. **Admin Dashboard**: View all employee time logs in real-time
7. **Export**: Download time logs as CSV/Excel
8. **Mobile App**: Native mobile app for easier clock in/out

### Overtime Integration

Current system tracks total hours. Future update can:

- Calculate OT hours (total - 8)
- Add to attendance.overtime_hours
- Convert to earned leave (8 OT hrs = 1 leave day)

## Troubleshooting

### Timer Not Updating

- Check browser console for errors
- Verify clock_in_time is valid timestamp
- Ensure component is not unmounting

### Clock In Failed

- Check employee ID is valid
- Verify no active session exists
- Check database connection

### Clock Out Failed

- Verify active session exists
- Check employee_id matches
- Review server action logs

### Data Not Showing

- Clear cache and reload page
- Check server-side data fetch
- Verify RLS policies allow access

## Security

### Row Level Security (RLS)

- Enabled on time_logs table
- Policy: "Enable all operations for authenticated users"
- Service role key used for server operations

### Validation

- Employee must be authenticated
- Only one active session per employee
- Clock in time must be valid
- Clock out requires active session

## Performance

### Optimizations

- Real-time timer runs client-side only
- Database queries use indexed fields
- Single active session per employee (no duplicates)
- Efficient date filtering with indexes

### Scalability

- Partitioning by date for large datasets
- Archive old time logs (>1 year)
- Aggregate tables for reports
- Caching for dashboard statistics

## API Reference

### clockInAction(employeeId)

Creates new active time log entry.

**Returns**: `{ success, data: timeLog }`

### clockOutAction(employeeId, notes?)

Completes active session with optional notes.

**Returns**: `{ success, data: { timeLog, totalHoursToday } }`

### getTimeLogSummary(employeeId)

Gets complete daily summary with all sessions.

**Returns**: `TimeLogSummary` object
