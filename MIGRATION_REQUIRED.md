# Critical: Supabase Database Migration Required

## Problem
The confessions table in Supabase is missing the `is_approved` column and other moderation fields required for the admin approval system. This is why new confessions appear in the UI without admin approval.

## Solution
You need to run a database migration in Supabase to add these columns.

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Migration
Copy and paste the following SQL into the query editor:

```sql
-- Add moderation columns to confessions table
ALTER TABLE public.confessions
ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by text,
ADD COLUMN IF NOT EXISTS approved_at timestamptz,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Create an index on is_approved for faster filtering
CREATE INDEX IF NOT EXISTS idx_confessions_is_approved ON public.confessions(is_approved);
```

### Step 3: Execute
Click the **Run** button (or press Ctrl+Enter) to execute the migration.

### Step 4: Verify Success
You should see a success message. If you want to verify the columns were created, run:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'confessions'
ORDER BY ordinal_position;
```

You should see these columns in the results:
- `is_approved` (boolean)
- `approved_by` (text)
- `approved_at` (timestamp with time zone)
- `rejection_reason` (text)

## What Happens Next

After running this migration:

1. **New confessions will have `is_approved = false`** by default
2. **Admin dashboard will show pending confessions** that need approval
3. **Only approved confessions will display publicly** in the CommunityHub
4. **Admin users can approve/reject confessions** from the admin dashboard

## Notes

- This migration uses `IF NOT EXISTS` clauses, so it's safe to run multiple times
- Existing confessions will have `is_approved = NULL` initially, which is treated as `false`
- If you want to auto-approve all existing confessions, run this additional query:
  ```sql
  UPDATE public.confessions 
  SET is_approved = true 
  WHERE is_approved IS NULL;
  ```

## Troubleshooting

If you get an error:
- **"Column already exists"**: The migration has already been run. This is fine.
- **"Permission denied"**: Make sure you're logged in with admin privileges for the Supabase project
- **"Table doesn't exist"**: Your confessions table may have a different schema. Check your database settings.

## Files Modified
- Updated `/supabase/confessions_schema.sql` with the new column definitions
- Created `/supabase/add_moderation_columns.sql` with the migration script
- Updated `/App.tsx` realtime subscription to properly handle the is_approved field
