# Supabase Setup Guide for XLEVELSUP ERP

## ✅ Migration Complete!

Your ERP system has been successfully migrated from SQLite to Supabase (PostgreSQL).

## 🚀 Next Steps to Get Running:

### 1. Get Your Supabase API Key

The key in your `.env.local` looks incomplete. Get the full key:

1. Go to: https://supabase.com/dashboard/project/vwgsbstkbjygokydvnia/settings/api
2. Copy the **anon/public** key (starts with `eyJ...`)
3. Update `.env.local` with the full key:
   ```env
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...full-key-here
   ```

### 2. Run the Database Schema

You need to create the tables in your Supabase database:

1. Go to: https://supabase.com/dashboard/project/vwgsbstkbjygokydvnia/editor
2. Click **"New Query"** or **"SQL Editor"**
3. Copy the entire contents of `db/schema.sql`
4. Paste into the SQL editor
5. Click **"Run"** to execute

This creates all 5 tables (users, employees, attendance, payroll, expenses) with indexes and RLS policies.

### 3. Seed the Admin User

After tables are created, run:

```bash
npm run init-erp
```

This will create the default admin user:

- **Email**: admin@xlevelsup.com
- **Password**: admin123

### 4. Start Development Server

```bash
npm run dev
```

Then navigate to: http://localhost:3000/erp/login

## 📋 What Changed:

### Database

- ✅ SQLite → PostgreSQL (Supabase)
- ✅ `AUTOINCREMENT` → `SERIAL`
- ✅ `TEXT` date fields → `DATE` and `TIMESTAMP`
- ✅ `REAL` → `NUMERIC(10, 2)`
- ✅ Row Level Security (RLS) enabled with policies

### Code

- ✅ `better-sqlite3` → `@supabase/supabase-js`
- ✅ All database functions now async
- ✅ Server actions updated with `await`
- ✅ Page components updated for async data fetching
- ✅ Date filtering updated for PostgreSQL

### Files Updated

- `lib/supabase.ts` - Supabase client (NEW)
- `db/init-supabase.ts` - Database initialization (NEW)
- `db/schema.sql` - PostgreSQL schema (UPDATED)
- `lib/erp/*.ts` - All database functions (CONVERTED)
- `actions/erp/*.ts` - All server actions (UPDATED)
- `app/erp/*/page.tsx` - All pages (UPDATED)
- `.env.local` - Environment variables (CREATED)
- `env.example` - Template updated (UPDATED)

## 🔒 Security Notes

1. **Change admin password** immediately after first login
2. **Update JWT_SECRET** in `.env.local` with a strong random string
3. **RLS policies** are currently permissive - review and restrict as needed:
   - Go to: https://supabase.com/dashboard/project/vwgsbstkbjygokydvnia/auth/policies
   - Customize policies for each table based on roles

## 🐛 Troubleshooting

### "Missing Supabase environment variables"

- Check `.env.local` has both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server after updating `.env.local`

### "Table doesn't exist" errors

- Run the schema.sql in Supabase SQL Editor first
- Check tables exist: https://supabase.com/dashboard/project/vwgsbstkbjygokydvnia/editor

### Login fails

- Make sure you ran `npm run init-erp` to create admin user
- Check the users table has data: `SELECT * FROM users;` in SQL Editor

### Build errors about async

- All fixed! But if you see any, make sure `await` is used when calling lib/erp functions

## 📚 Supabase Dashboard Links

- **SQL Editor**: https://supabase.com/dashboard/project/vwgsbstkbjygokydvnia/editor
- **Table Editor**: https://supabase.com/dashboard/project/vwgsbstkbjygokydvnia/editor
- **API Settings**: https://supabase.com/dashboard/project/vwgsbstkbjygokydvnia/settings/api
- **Auth Policies**: https://supabase.com/dashboard/project/vwgsbstkbjygokydvnia/auth/policies

## 🎉 Ready to Test!

Once you complete steps 1-4 above, your ERP system will be fully operational with Supabase!
