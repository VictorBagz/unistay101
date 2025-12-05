# Connection Request System - Visual Guide

## User Journey

### Step 1: Send Connection Request
```
User Profile Page
        ↓
    [Find a Roommate Button]
        ↓
    Find a Roommate Page (with filters)
        ↓
    View Roommate Cards
        ↓
    [Send Connection Request] ← Clicked
        ↓
    Request Sent ✓
    Button Changes to "⏳ Request Pending"
```

### Step 2: Receive Connection Request
```
Recipient's Profile Page
        ↓
"Roommate Connection Requests" Section
        ↓
Shows Card with Sender Information:
- Profile photo
- Name & Age
- University & Course
- Budget & Lease Duration
- Study Schedule & Cleanliness
- Smoking/Drinking/Guest Badges
- Request Date
        ↓
[Accept] [Decline] Buttons
```

### Step 3: Accept Request
```
Recipient Clicks [Accept]
        ↓
Status: Loading...
        ↓
Request Status Updated to 'accepted'
Both Users' roommate_status → 'roomies'
        ↓
Request Removed from List
Notification: "You are now roomies!"
        ↓
Sender Sees: "✓ Roomies!" (disabled)
Recipient Can View: Both marked as "roomies"
```

### Step 4: Decline Request
```
Recipient Clicks [Decline]
        ↓
Status: Loading...
        ↓
Request Status Updated to 'rejected'
        ↓
Request Removed from List
Notification: "Request declined"
        ↓
Sender Can Send New Request Later
```

---

## Button State Machine

```
                   ┌─────────────────┐
                   │     INITIAL     │
                   │  (No Request)   │
                   └────────┬────────┘
                            │
                  [Send Request clicked]
                            │
                            ↓
                   ┌─────────────────┐
                   │    LOADING      │
                   │  (Button Disabled)
                   └────────┬────────┘
                            │
                  [Request Sent Successfully]
                            │
                            ↓
                   ┌──────────────────┐
                   │     PENDING      │
                   │ "⏳ Request Pending"
                   │  (Button Disabled)
                   └────────┬─────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
      [Recipient Accepts]   [Recipient Declines]
                │                       │
                ↓                       ↓
         ┌────────────┐        ┌──────────────┐
         │  ACCEPTED  │        │   REJECTED   │
         │ "✓ Roomies!"         │  Can Re-send │
         │(Button Disabled)     │              │
         └────────────┘        └──────────────┘
                                      │
                                      └─→ Back to INITIAL
```

---

## Component Architecture

```
App.tsx
├── ProfilePage
│   ├── ConnectionRequests (NEW)
│   │   ├── Request Card
│   │   │   ├── Sender Photo
│   │   │   ├── Sender Info
│   │   │   ├── [Accept] Button
│   │   │   └── [Decline] Button
│   │   └── Empty State
│   └── Other Profile Sections
│
└── RoommateMatchPage
    ├── FilterPanel
    └── RoommateCard (UPDATED)
        ├── Profile Photo
        ├── Match Score
        ├── User Info
        └── [Send Connection Request] Button (UPDATED)
```

---

## Database Flow

```
┌─────────────────────────────────────────────────┐
│         Supabase Database                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  connection_requests Table                      │
│  ┌─────────┬─────────────┬──────────────┐      │
│  │sender_id│recipient_id │    status    │      │
│  ├─────────┼─────────────┼──────────────┤      │
│  │  user_1 │   user_2    │  'pending'   │      │
│  │  user_1 │   user_2    │ 'accepted'   │      │
│  │  user_3 │   user_4    │ 'rejected'   │      │
│  └─────────┴─────────────┴──────────────┘      │
│                                                 │
│  RLS Policies Applied:
│  ✓ Users see only their requests
│  ✓ Recipients only can update
│  ✓ Senders only can delete
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## API Call Sequence Diagram

### Sending Request
```
User Clicks [Send Connection Request]
        ↓
RoommateCard Component
        ↓
handleSendConnectionRequest()
        ↓
connectionRequestService.sendRequest(
    senderId,
    recipientId,
    senderName,
    senderImage
)
        ↓
Supabase.from('connection_requests').insert()
        ↓
✓ Success
    ├─ setRequestStatus('pending')
    ├─ Show Success Notification
    └─ Update Button State
        ↓
✗ Error
    └─ Show Error Notification
```

### Accepting Request
```
User Clicks [Accept]
        ↓
ConnectionRequests Component
        ↓
handleAcceptRequest()
        ↓
connectionRequestService.acceptRequest(
    requestId,
    senderId,
    recipientId
)
        ↓
Supabase:
├─ UPDATE connection_requests SET status='accepted'
└─ UPDATE profiles SET roommate_status='roomies' (both users)
        ↓
✓ Success
    ├─ Remove from Request List
    ├─ Show Success Notification
    └─ Call onRequestHandled()
        ↓
✗ Error
    └─ Show Error Notification
```

---

## Data Models

### ConnectionRequest Type
```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  senderId: "auth_user_123",
  senderName: "John Doe",
  senderImage: "https://example.com/photo.jpg",
  recipientId: "auth_user_456",
  status: "pending" | "accepted" | "rejected",
  createdAt: "2025-12-05T10:30:00Z",
  respondedAt: null
}
```

### RoommateProfile Type (Updated)
```typescript
{
  id: "user_123",
  name: "John Doe",
  age: 20,
  gender: "Male",
  course: "Computer Science",
  budget: 500000,
  // ... other fields ...
  roommateStatus: "no-roommate" | "roomies" | "pending-request"
}
```

---

## Notification Messages

| Action | Type | Message |
|--------|------|---------|
| Request Sent | ✓ Success | "Connection request sent to {name}!" |
| Send Failed | ✗ Error | "Failed to send connection request" |
| Request Accepted | ✓ Success | "Connection request accepted! You are now roomies!" |
| Request Declined | ✓ Success | "Connection request declined" |
| Accept Failed | ✗ Error | "Failed to accept connection request" |
| Decline Failed | ✗ Error | "Failed to decline connection request" |
| Not Logged In | ✗ Error | "Please sign in to send connection requests" |

---

## Security Measures

### Row Level Security (RLS)
```sql
-- View Own Sent Requests
WHERE sender_id = auth.uid()::text

-- View Own Received Requests
WHERE recipient_id = auth.uid()::text

-- Send Requests Only As Self
WITH CHECK (sender_id = auth.uid()::text)

-- Update Only If Recipient
FOR UPDATE USING (recipient_id = auth.uid()::text)

-- Delete Only If Sender
FOR DELETE USING (sender_id = auth.uid()::text)
```

### Data Constraints
```sql
-- Unique Sender-Recipient Pair
UNIQUE(sender_id, recipient_id)

-- Valid Status Values Only
CHECK (status IN ('pending', 'accepted', 'rejected'))

-- Foreign Key Integrity
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE
FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE
```

---

## Performance Optimizations

### Indexes
```
✓ idx_connection_requests_recipient_id
  - Fast lookup of received requests
  - Query: WHERE recipient_id = ?

✓ idx_connection_requests_sender_id
  - Fast lookup of sent requests
  - Query: WHERE sender_id = ?

✓ idx_connection_requests_status
  - Fast filtering by status
  - Query: WHERE status = ?

✓ idx_profiles_roommate_status
  - Fast lookup of roomies
  - Query: WHERE roommate_status = 'roomies'
```

### Denormalization
```
connection_requests table stores:
- sender_name (denormalized)
- sender_image (denormalized)

Benefits:
✓ No N+1 queries when listing requests
✓ Faster UI rendering
✓ Sender info available even if profile deleted
```

---

## Error Recovery

| Scenario | Recovery |
|----------|----------|
| Network Error | Retry with exponential backoff |
| Request Timeout | Show timeout error, allow retry |
| User Not Found | Graceful error message |
| Duplicate Request | Catch UNIQUE constraint, prevent submit |
| Invalid Status | Server-side validation via CHECK constraint |
| Unauthorized Access | RLS policies prevent data leak |

---

## Testing Scenarios

### Happy Path
```
1. User A completes profile
2. User B completes profile
3. User A finds User B and sends request
4. Request appears in User B's profile
5. User B accepts request
6. Both users see "Roomies" status
✓ Test Passed
```

### Alternative Path
```
1. User A sends request
2. User B declines request
3. User A can send new request
✓ Test Passed
```

### Error Path
```
1. User attempts to send without auth
2. System shows auth error
✓ Test Passed
```

---

## Deployment Checklist

- [ ] Run SQL migration in Supabase
- [ ] Deploy updated components
- [ ] Test sending requests
- [ ] Test accepting requests
- [ ] Test declining requests
- [ ] Verify roommate_status updates
- [ ] Test error scenarios
- [ ] Monitor for issues
- [ ] Gather user feedback
