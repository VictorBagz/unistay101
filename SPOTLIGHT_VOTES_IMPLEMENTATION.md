# Student Spotlight Votes - Database Implementation

## Overview
Implemented a database-backed voting system for student spotlight cards that ensures users can only vote once and persists votes in the database.

## Changes Made

### 1. Database Schema (`supabase/spotlight_votes_schema.sql`)
- Created `spotlight_votes` table to track individual votes per user
- **Columns:**
  - `id` (uuid): Primary key
  - `student_spotlight_id` (uuid): References the student spotlight
  - `user_id` (text): User who voted
  - `timestamp` (timestamptz): When the vote was cast
- Unique constraint on `(student_spotlight_id, user_id)` to prevent duplicate votes
- Helper functions for vote counting and duplicate vote checking
- Row-level security (RLS) policies for data access control
- Indexes for optimal query performance

### 2. Types (`types.ts`)
- Added `StudentSpotlightVote` interface to represent vote records
- Added `interests` field to `StudentSpotlight` interface for additional student information

### 3. Database Service (`services/dbService.ts`)
Created `spotlightVoteService` with the following methods:

```typescript
spotlightVoteService.checkUserHasVoted(spotlightId, userId): Promise<boolean>
  // Check if a user has already voted for a student

spotlightVoteService.addVote(spotlightId, userId): Promise<SpotlightVoteRow>
  // Add a vote and prevent duplicates
  // Throws error if user already voted

spotlightVoteService.getUserVotes(userId): Promise<string[]>
  // Get all students that a user has voted for

spotlightVoteService.getVoteCount(spotlightId): Promise<number>
  // Get total vote count for a student

spotlightVoteService.removeVote(spotlightId, userId): Promise<void>
  // Remove a user's vote (future feature)
```

### 4. Component Updates (`components/CommunityHub.tsx`)

#### StudentSpotlightPanel
- Added state management for:
  - `isLoading`: Loading state while fetching votes
  - `votingInProgress`: Tracks which student is currently being voted on
- Added `useEffect` hook to load vote data on component mount
  - Fetches user's previous votes from database
  - Loads current vote counts for all students
- Updated `handleVote` function to:
  - Call `spotlightVoteService.addVote()` to persist votes
  - Handle errors gracefully
  - Re-check vote status in case of race conditions

#### NomineeCard
- Updated vote button to show loading state while voting
- Added spinner animation during vote submission
- Disabled button while voting is in progress

#### Modal
- Updated modal's vote button to:
  - Handle async voting operation
  - Show loading state with spinner
  - Remain open while voting (better UX)
  - Update vote count in real-time

## Features

✅ **Prevent Duplicate Votes**
- Database constraint ensures only one vote per user per student
- Frontend validation prevents accidental duplicate attempts
- Backend validation provides security

✅ **Vote Persistence**
- All votes saved to Supabase database
- Votes survive page refreshes and app restarts

✅ **Load User's Vote History**
- When user logs in, component loads their previous votes
- Shows "Voted" state for students they've already voted for

✅ **Real-time Vote Counts**
- Vote count updated immediately after voting
- Reflects in both card and modal views

✅ **Loading States**
- Visual feedback (spinner) during vote submission
- Disabled buttons prevent accidental double-submissions
- Error handling for network failures

✅ **Security**
- Row-level security (RLS) policies in database
- Only authenticated users can vote
- Users can only access their own vote records

## How It Works

1. **Component Initialization**: When StudentSpotlightPanel mounts, it:
   - Checks if user is logged in
   - Fetches all vote counts from database
   - Fetches user's previous votes

2. **User Votes**: When user clicks vote button:
   - Frontend checks if they've already voted (instant)
   - Calls `spotlightVoteService.addVote()`
   - Database checks unique constraint
   - If successful, increments vote count and updates UI
   - If duplicate, error is caught and handled

3. **Vote Display**: 
   - Vote count shown in real-time
   - Button state changes to "Voted" after successful vote
   - Button disabled for students already voted for

## Testing the Implementation

To test locally:

1. Run the SQL migration to create the `spotlight_votes` table
2. Log in with your account
3. Click "Vote" on a student card
4. Vote count should increment immediately
5. Refresh the page - vote should still be counted
6. Try voting again - button should remain disabled
7. Log out and log back in - vote history should be preserved

## Database Migration

Run the SQL script in `supabase/spotlight_votes_schema.sql`:
1. Go to your Supabase project
2. Open the SQL Editor
3. Paste the contents of the file
4. Execute all statements

## Notes

- Votes are stored by user ID, so they persist across sessions
- Vote counts are denormalized in the `student_spotlights.votes` column for performance
- The database constraint prevents any duplicate votes at the database level
- RLS policies ensure users can only view their own votes
