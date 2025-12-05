# Connection Request System - Setup Guide

## What You're Seeing
The errors you're seeing are because the `connection_requests` table doesn't exist yet in your Supabase database. This is completely normal and easy to fix.

## Setup Steps

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/
2. Sign in to your account
3. Select your project
4. Click on "SQL Editor" in the left sidebar

### Step 2: Create the Table
1. Click "New Query" button
2. Copy and paste the entire contents of: `supabase/connection_requests_schema.sql`
3. Click "Run" button
4. Wait for the query to complete (you should see a success message)

### Step 3: Test It Out
1. Refresh your browser (http://localhost:3000)
2. Log in to your account
3. Create or update your roommate profile
4. Go to "Find a Roommate"
5. Try sending a connection request to another profile
6. Check your profile page to see received requests

## What the SQL Does
The SQL file creates:
- ✅ `connection_requests` table to store all requests
- ✅ Proper indexes for fast queries
- ✅ Foreign key constraints for data integrity
- ✅ Row Level Security policies for privacy
- ✅ Adds `roommate_status` column to `profiles` table

## After Running the SQL
- The "Send Connection Request" button will become fully functional
- Users can accept or decline requests
- Both users get "roomies" status when accepted
- All data is secure with Row Level Security

## Troubleshooting

### If you see the same errors after running the SQL:
1. **Hard refresh your browser**: Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. **Check the Supabase SQL Editor**: Make sure the SQL ran without errors
3. **Verify table exists**: In Supabase, go to "Table Editor" and check if `connection_requests` appears in the list

### If the table doesn't appear:
1. Go back to SQL Editor
2. Copy the SQL again and run it
3. Check for any error messages in red

### For other issues:
- Check browser console (F12 → Console tab) for detailed error messages
- These will help diagnose the exact issue

## Current State
✅ Code is ready and properly handles missing table gracefully
✅ No compilation errors
✅ Error messages are user-friendly
✅ Just need to run the SQL to activate the feature

## Files Modified for Error Handling
- `services/dbService.ts` - Added try-catch and graceful fallbacks
- `components/RoommateMatchPage.tsx` - Added user-friendly error messages
- `components/ConnectionRequests.tsx` - Silently handles table not found

The application will continue to work smoothly - the connection request features will just be temporarily unavailable until the table is created.
