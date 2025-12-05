# Connection Request System - Implementation Guide

## Overview
The connection request system allows users to send roommate matching requests and manage incoming requests. When two users accept each other's requests, they are marked as "roomies" in their profiles.

## Database Schema

### Tables Created

#### `connection_requests`
Stores all connection requests between users with the following fields:

```sql
- id: UUID (Primary Key)
- sender_id: VARCHAR(255) - User who sent the request (Foreign Key to auth.users)
- recipient_id: VARCHAR(255) - User who receives the request (Foreign Key to auth.users)
- sender_name: VARCHAR(255) - Name of the sender (denormalized for UI)
- sender_image: TEXT - Avatar URL of the sender (denormalized for UI)
- status: VARCHAR(20) - 'pending', 'accepted', or 'rejected'
- created_at: TIMESTAMP - When the request was sent
- responded_at: TIMESTAMP - When the request was responded to
```

Unique constraint: `(sender_id, recipient_id)` - Prevents duplicate requests

#### Indexes
- `idx_connection_requests_recipient_id` - Fast lookup of received requests
- `idx_connection_requests_sender_id` - Fast lookup of sent requests
- `idx_connection_requests_status` - Fast filtering by status

#### `profiles` Table Updates
Added column: `roommate_status` (VARCHAR(50))
- Values: 'no-roommate' | 'roomies' | 'pending-request'
- Default: 'no-roommate'

### Row Level Security (RLS)

The following RLS policies are applied to `connection_requests`:

1. **View Sent Requests**: Users can only see requests they sent
2. **View Received Requests**: Users can only see requests sent to them
3. **Send Requests**: Users can only send requests as themselves
4. **Update Requests**: Only recipients can accept/reject requests
5. **Delete Requests**: Only senders can cancel their requests

## API Methods

### connectionRequestService

Located in `services/dbService.ts`

```typescript
// Send a connection request
sendRequest(
  senderId: string,
  recipientId: string,
  senderName?: string,
  senderImage?: string
): Promise<ConnectionRequest>

// Get all received requests for a user
getReceivedRequests(userId: string): Promise<ConnectionRequest[]>

// Get all sent requests from a user
getSentRequests(userId: string): Promise<ConnectionRequest[]>

// Accept a connection request (marks both users as roomies)
acceptRequest(
  requestId: string,
  senderId: string,
  recipientId: string
): Promise<void>

// Reject a connection request
rejectRequest(requestId: string): Promise<void>

// Check if a request exists between two users
checkRequestExists(senderId: string, recipientId: string): Promise<ConnectionRequest | null>

// Cancel a sent request
cancelRequest(requestId: string): Promise<void>
```

## Components

### RoommateMatchPage
**File**: `components/RoommateMatchPage.tsx`

Enhanced RoommateCard component with connection request functionality:

```typescript
interface RoommateCardProps {
  profile: RoommateProfile;
  matchPercentage: number;
  university: string;
  currentUser: RoommateProfile;
  onRequestSent?: () => void;
}
```

**Features**:
- Displays button states:
  - "Send Connection Request" - Default state
  - "⏳ Request Pending" - Request has been sent
  - "✓ Roomies!" - Request accepted (disabled)
- Shows loading state while sending request
- Checks existing requests on mount
- Disables button appropriately based on status

### ConnectionRequests Component
**File**: `components/ConnectionRequests.tsx`

Displays received connection requests on user's profile page:

```typescript
interface ConnectionRequestsProps {
  userId: string;
  allProfiles: RoommateProfile[];
  universities: University[];
  onRequestHandled?: () => void;
}
```

**Features**:
- Lists all pending connection requests
- Shows sender's profile information (name, age, university, course, budget, study schedule, cleanliness, lease duration)
- Displays sender's profile badges (smoker status, drinking habits, guest frequency)
- Provides Accept and Decline buttons
- Shows request date
- Empty state messaging when no requests exist

### ProfilePage
**File**: `components/ProfilePage.tsx`

Updated to include:
- ConnectionRequests component
- Displays under user's profile in a dedicated section
- Shows only when user has a complete roommate profile

## User Flow

### Sending a Connection Request

1. User navigates to Find a Roommate page
2. Sees list of potential roommates with match scores
3. Clicks "Send Connection Request" button on a profile
4. Request is sent to recipient
5. Button state changes to "⏳ Request Pending"
6. Sender receives success notification

### Receiving a Connection Request

1. Recipient receives request notification
2. Connection request appears in their profile page under "Roommate Connection Requests" section
3. Shows sender's profile information
4. Recipient can Accept or Decline
5. Upon Accept:
   - Request status changes to "accepted"
   - Both users' `roommate_status` is updated to "roomies"
   - Both users can see each other as connected
   - Original sender's button shows "✓ Roomies!"

### Declining a Request

1. Recipient clicks "Decline" button
2. Request status changes to "rejected"
3. Request is removed from the list
4. Sender can send another request later

## Type Definitions

### ConnectionRequest
```typescript
export interface ConnectionRequest {
    id: string;
    senderId: string;
    senderName?: string;
    senderImage?: string;
    recipientId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
    respondedAt?: string;
}
```

### RoommateProfile (Updated)
```typescript
export interface RoommateProfile {
    // ... existing fields ...
    roommateStatus?: 'no-roommate' | 'roomies' | 'pending-request';
}
```

## Setup Instructions

### 1. Run SQL Migration

Execute the SQL schema in Supabase:

```sql
-- From supabase/connection_requests_schema.sql
CREATE TABLE IF NOT EXISTS public.connection_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id VARCHAR(255) NOT NULL,
  recipient_id VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255),
  sender_image TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(sender_id, recipient_id),
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_connection_requests_recipient_id ON public.connection_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_sender_id ON public.connection_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON public.connection_requests(status);

-- Add roommate_status column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS roommate_status VARCHAR(50) DEFAULT 'no-roommate' CHECK (roommate_status IN ('no-roommate', 'roomies', 'pending-request'));

CREATE INDEX IF NOT EXISTS idx_profiles_roommate_status ON public.profiles(roommate_status);

-- Enable and configure RLS policies
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
-- (RLS policies listed below)
```

### 2. Components are Already Imported
- RoommateMatchPage is already integrated in App.tsx
- ConnectionRequests component is integrated in ProfilePage
- No additional imports needed

### 3. Start Using

Users can now:
1. Send connection requests from Find a Roommate page
2. View/manage requests in their profile page
3. Become "roomies" by accepting requests

## Error Handling

The system includes comprehensive error handling:

- **Duplicate Requests**: UNIQUE constraint prevents duplicate requests
- **Invalid Status Transitions**: Only recipients can accept/reject
- **User Validation**: RLS policies enforce authentication
- **Network Errors**: Try-catch blocks with user notifications via `useNotifier`

## Testing Checklist

- [ ] Send a connection request as User A to User B
- [ ] Verify button changes to "⏳ Request Pending"
- [ ] Log in as User B and see the connection request
- [ ] Accept the request as User B
- [ ] Verify both users' status changes to "Roomies"
- [ ] Verify button shows "✓ Roomies!" for User A
- [ ] Test declining a request
- [ ] Test sending request again after decline
- [ ] Verify RLS prevents unauthorized access

## Future Enhancements

1. **Real-time Notifications**: Add Supabase realtime subscriptions for instant updates
2. **Connection Matching**: Auto-match users with high compatibility scores
3. **Chat Feature**: Allow matched roomies to message
4. **Verification**: Email/phone verification before accepting
5. **Roommate Preferences**: Store preferred characteristics for better matching
6. **Connection History**: View past connections and notes
7. **Block Feature**: Block users from sending requests
