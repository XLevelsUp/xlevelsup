# Error Handling Implementation

## Overview

This document describes the comprehensive error handling mechanism implemented across the ERP system to gracefully handle database errors and provide user-friendly feedback.

## Key Components

### 1. Centralized Error Handler (`lib/erp/error-handler.ts`)

The error handler provides:

- **User-friendly error messages** - Database errors are translated to clear messages
- **Error logging** - All errors are logged for debugging without exposing sensitive details
- **Error classification** - Helper functions to identify specific error types

### 2. Error Types Handled

| Error Code          | Type              | User Message                               |
| ------------------- | ----------------- | ------------------------------------------ |
| 08000, 08003, 08006 | Connection errors | Database connection issues                 |
| 28000, 28P01        | Authentication    | Database auth failures                     |
| 23505               | Duplicate key     | "This record already exists"               |
| 23503               | Foreign key       | "Cannot delete - referenced by other data" |
| 23502               | Not null          | "Required field is missing"                |
| 23514               | Check constraint  | "Data validation failed"                   |
| 42501               | Permission        | "No permission to perform action"          |
| PGRST116            | Not found         | "Record not found"                         |

### 3. Updated Files

The following files now include comprehensive error handling:

- `lib/erp/employee-auth.ts` - Authentication operations
- `lib/erp/employees.ts` - Employee management
- `lib/erp/login-logs.ts` - Login tracking
- `app/employee/login/page.tsx` - Login page (syntax error fixed)

## Implementation Pattern

### Before (Unsafe)

```typescript
export async function getEmployee(id: number): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error; // Exposes database errors
  return data;
}
```

### After (Safe)

```typescript
import { handleDatabaseError, isNotFoundError } from './error-handler';

export async function getEmployee(id: number): Promise<Employee | null> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (isNotFoundError(error)) {
        return null; // Expected case
      }
      throw handleDatabaseError(error, 'fetch employee');
    }
    return data;
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return null;
    }
    throw handleDatabaseError(error, 'fetch employee');
  }
}
```

## Benefits

1. **Security** - Database internals are never exposed to users
2. **User Experience** - Clear, actionable error messages
3. **Debugging** - All errors are logged with context
4. **Consistency** - Uniform error handling across the application
5. **Reliability** - Graceful degradation when non-critical operations fail

## Error Handling Strategies

### Critical Operations

Operations that must succeed (login, data updates):

```typescript
try {
  const result = await criticalOperation();
  return result;
} catch (error) {
  throw handleDatabaseError(error, 'operation name');
}
```

### Optional Operations

Operations that can fail without blocking (logging, analytics):

```typescript
try {
  await optionalOperation();
} catch (error) {
  console.error('Optional operation failed:', error);
  // Don't throw - continue execution
}
```

### Not Found Cases

Operations where "not found" is expected:

```typescript
if (error) {
  if (isNotFoundError(error)) {
    return null; // Expected
  }
  throw handleDatabaseError(error, 'fetch data');
}
```

## Best Practices

1. **Always wrap database operations** in try-catch blocks
2. **Log errors** before handling them
3. **Use descriptive operation names** in `handleDatabaseError()`
4. **Never expose** raw database errors to users
5. **Distinguish** between expected and unexpected errors
6. **Test error paths** to ensure proper handling

## Helper Functions

### `handleDatabaseError(error, operation)`

Converts database errors to user-friendly messages.

### `isNotFoundError(error)`

Checks if error is a "record not found" error.

### `isDuplicateError(error)`

Checks if error is a duplicate key violation.

### `isForeignKeyError(error)`

Checks if error is a foreign key constraint violation.

## Example: Complete Function

```typescript
export async function createEmployee(
  data: EmployeeFormData,
): Promise<Employee> {
  try {
    const { data: employee, error } = await supabase
      .from('employees')
      .insert(data)
      .select()
      .single();

    if (error) {
      // Check for specific errors
      if (isDuplicateError(error)) {
        throw new Error('An employee with this email already exists.');
      }
      // Handle all other errors
      throw handleDatabaseError(error, 'create employee');
    }

    // Optional: Initialize related data
    try {
      await initializeLeaveBalance(employee.id);
    } catch (leaveError) {
      console.error('Failed to initialize leave balance:', leaveError);
      // Don't throw - employee was created successfully
    }

    return employee;
  } catch (error) {
    // Re-throw if already a user-friendly error
    if (error instanceof Error) {
      throw error;
    }
    // Handle unexpected errors
    throw handleDatabaseError(error, 'create employee');
  }
}
```

## Testing Error Handling

To test error handling:

1. **Database connection errors** - Stop database temporarily
2. **Duplicate key errors** - Try to create duplicate records
3. **Foreign key errors** - Try to delete records with dependencies
4. **Not found errors** - Query non-existent records
5. **Permission errors** - Use insufficient permissions

## Future Enhancements

- [ ] Add error monitoring/alerting integration
- [ ] Implement retry logic for transient failures
- [ ] Add circuit breaker pattern for connection issues
- [ ] Create error dashboards for ops team
- [ ] Add rate limiting for repeated failures

## Related Documentation

- [Leave System Architecture](./LEAVE_SYSTEM_ARCHITECTURE.md)
- [ERP System Overview](../ERP_README.md)
- [Database Schema](../db/schema.sql)
