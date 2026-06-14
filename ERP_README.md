# XLEVELSUP ERP System

## Overview

A comprehensive internal ERP (Enterprise Resource Planning) system built for XLEVELSUP to manage employees, attendance, payroll, and expenses. The system is integrated into the existing Next.js website and uses SQLite for data storage.

## Features

### 1. Employee Management

- **CRUD Operations**: Create, read, update, and delete employee records
- **Employee Information**: ID, name, email, phone, role, department, joining date, salary, status
- **Filters**: Filter by status (active/inactive), department, and search by name/email/ID
- **Status Management**: Active/Inactive employee status tracking

### 2. Attendance Management

- **Daily Attendance**: Track attendance for all employees
- **Status Types**: Present, Absent, Half-Day, Paid Leave, Unpaid Leave, Holiday
- **Duplicate Prevention**: Prevents duplicate attendance entries for the same employee on the same date
- **Monthly Summary**: View monthly attendance summaries per employee
- **Filters**: Filter by month, employee, and date

### 3. Payroll Management

- **Automatic Generation**: Generate payroll for all active employees for a specific month
- **Working Days Calculation**: Automatically calculates working days (Monday-Friday) excluding weekends
- **Salary Calculation Formula**:
  - `per_day_salary = monthly_salary / total_working_days`
  - `payable_days = present_days + paid_leave_days + (half_days * 0.5)`
  - `gross_salary = per_day_salary * payable_days`
  - Unpaid leaves and absences reduce salary
- **Manual Adjustments**: Add bonus, deductions, and notes
- **Status Workflow**: Draft → Approved → Paid
- **Historical Records**: Past payroll records are preserved even if attendance is edited later

### 4. Expense Tracking

- **Expense Records**: Date, category, amount, paid by, payment mode, description
- **Status Management**: Pending → Approved/Rejected → Paid
- **Filters**: Filter by date range, category, status
- **Monthly Totals**: View monthly expense summaries
- **Categories**: Travel, Office Supplies, Equipment, Software, Utilities, Marketing, etc.

### 5. Dashboard

- **Key Metrics**:
  - Total active employees
  - Today's attendance count and percentage
  - Current month salary payable
  - Current month expenses
  - Pending expenses count and amount
  - Unpaid payroll count
- **Quick Actions**: Direct links to add employees, mark attendance, generate payroll, add expenses

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Database**: SQLite with better-sqlite3
- **Authentication**: JWT-based session management with HTTP-only cookies
- **UI**: Tailwind CSS, Framer Motion
- **Validation**: Zod
- **Password Hashing**: bcryptjs

## Installation

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Initialize Database**:

   ```bash
   npm run init-erp
   ```

   This creates the database and default admin user.

3. **Environment Variables**:
   Create a `.env.local` file with:

   ```
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   ```

4. **Run Development Server**:

   ```bash
   npm run dev
   ```

5. **Access ERP System**:
   - Navigate to: `http://localhost:3000/erp/login`
   - Default credentials:
     - Email: `admin@xlevelsup.com`
     - Password: `admin123`

## Project Structure

```
xlevelsup/
├── app/
│   └── erp/
│       ├── login/page.tsx          # Login page
│       ├── dashboard/page.tsx      # Dashboard
│       ├── employees/page.tsx      # Employee management
│       ├── attendance/page.tsx     # Attendance management
│       ├── payroll/page.tsx        # Payroll management
│       └── expenses/page.tsx       # Expense tracking
├── actions/
│   └── erp/                        # Server actions
│       ├── auth.ts
│       ├── employees.ts
│       ├── attendance.ts
│       ├── payroll.ts
│       └── expenses.ts
├── components/
│   ├── erp/                        # ERP UI components
│   │   ├── ERPNavbar.tsx
│   │   ├── Table.tsx
│   │   ├── EmployeeList.tsx
│   │   ├── EmployeeForm.tsx
│   │   ├── AttendanceManager.tsx
│   │   ├── AttendanceForm.tsx
│   │   ├── PayrollManager.tsx
│   │   ├── ExpenseManager.tsx
│   │   └── ExpenseForm.tsx
│   └── ui/                         # Reusable UI components
├── db/
│   ├── schema.sql                  # Database schema
│   └── init.ts                     # Database initialization
├── lib/
│   ├── auth.ts                     # Authentication utilities
│   └── erp/                        # ERP business logic
│       ├── employees.ts
│       ├── attendance.ts
│       ├── payroll.ts
│       ├── expenses.ts
│       ├── dashboard.ts
│       └── utils.ts                # Helper functions
├── types/
│   └── erp.ts                      # TypeScript type definitions
├── data/
│   └── erp.db                      # SQLite database (created automatically)
└── scripts/
    └── init-erp.ts                 # Database initialization script
```

## Authentication & Authorization

### Roles

- **Admin**: Full access to all modules
- **HR**: Full access to all modules
- **Employee**: View-only access to their own attendance and payroll (not fully implemented in current version)

### Middleware

- Protected routes: All `/erp/*` routes except `/erp/login`
- Automatic redirect to login if not authenticated
- Session management using JWT tokens in HTTP-only cookies
- 7-day session expiration

## Database Schema

### Tables

1. **users**: Authentication and user management
2. **employees**: Employee records
3. **attendance**: Daily attendance records
4. **payroll**: Monthly payroll records
5. **expenses**: Expense tracking

### Key Features

- Foreign key constraints enabled
- Unique constraints to prevent duplicates
- Indexes for performance optimization
- Automatic timestamp tracking (created_at, updated_at)

## API Patterns

### Server Actions

All data mutations use Next.js server actions:

- Type-safe with Zod validation
- Automatic revalidation of affected pages
- Error handling with user-friendly messages

### Data Flow

1. Client component calls server action
2. Server action validates input with Zod
3. Server action checks authentication/authorization
4. Database operation performed
5. Page revalidated
6. Success/error returned to client
7. Toast notification shown to user

## Key Calculations

### Working Days

- Calculates Monday-Friday in a month
- Excludes weekends automatically
- Used as base for payroll calculation

### Payroll Calculation

```typescript
per_day_salary = monthly_salary / total_working_days_in_month;
payable_days = present_days + paid_leave_days + half_days * 0.5;
gross_salary = per_day_salary * payable_days;
net_salary = gross_salary + bonus - deduction;
```

## Security Considerations

### Current Implementation

- JWT-based authentication
- HTTP-only cookies (not accessible via JavaScript)
- Password hashing with bcrypt
- Role-based access control
- SQL injection prevention (parameterized queries)

### Production Recommendations

1. Change default admin password immediately
2. Use strong JWT_SECRET (generate random 32+ character string)
3. Enable HTTPS in production
4. Implement rate limiting on login endpoint
5. Add password strength requirements
6. Implement password reset functionality
7. Add audit logging for sensitive operations
8. Consider adding 2FA for admin accounts

## Future Enhancements

### Potential Features

1. **Payslip Generation**: PDF generation for payslips
2. **Email Notifications**: Automated emails for payroll, leaves, etc.
3. **Leave Management**: Dedicated leave application and approval system
4. **Tax Calculations**: PF, ESI, TDS calculations
5. **Reports**: Detailed reports and analytics
6. **Bulk Operations**: Bulk attendance marking, bulk employee import
7. **Approval Workflows**: Multi-level approval for expenses and leaves
8. **Mobile App**: React Native mobile app
9. **Biometric Integration**: Fingerprint/face recognition for attendance
10. **Performance Reviews**: Employee performance tracking

## Troubleshooting

### Database Issues

- **Reset Database**: Delete `data/erp.db` and run `npm run init-erp`
- **Migration**: Currently no migration system - manual SQL updates required

### Authentication Issues

- **Clear Session**: Delete `erp-session` cookie in browser dev tools
- **Reset Password**: Update user table directly in database

### Build Issues

- **TypeScript Errors**: Run `npm run lint` to check
- **Missing Dependencies**: Run `npm install`

## Support

For issues or questions:

- Email: admin@xlevelsup.com
- Internal: Contact your system administrator

## License

Proprietary - Internal use only for XLEVELSUP

---

**Version**: 1.0.0  
**Last Updated**: June 2026  
**Developed by**: XLEVELSUP Engineering Team
