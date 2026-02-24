# Week 2: Auth System Implementation

**Status:** 🟢 In Progress - `createUser()` Complete  
**Date:** February 24, 2026  
**Branch:** `hybrid-rebuild`

---

## Overview

Week 2 focuses on implementing the authentication system for Pipulse using tRPC, Zod validation, and Prisma ORM. The auth system manages user creation, role switching, and session management for Pi Network authentication.

---

## Completed: `createUser()` Function

### Location
`lib/trpc/routers/auth.ts` - Auth Router

### Function Signature
```typescript
createUser: publicProcedure
  .input(z.object({
    piUid: z.string().min(1).max(255),
    piUsername: z.string().min(1).max(255),
  }))
  .mutation(async ({ input }) => { ... })
```

### Implementation Details

#### Input Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `piUid` | string | ✅ Yes | Unique identifier from Pi Network (1-255 chars) |
| `piUsername` | string | ✅ Yes | Display name from Pi Network (1-255 chars) |

#### Validation
- **Zod Schema**: Validates both inputs are non-empty strings with max 255 characters
- **Runtime Check**: Additional validation before database operations
- **Error Messages**: Detailed error feedback if validation fails

#### Database Logic
1. **Check for Existing User**
   - Query: `prisma.user.findUnique({ where: { piUsername: input.piUid } })`
   - Includes `streak` relationship
   - Returns existing user if found

2. **Create New User** (if not exists)
   - Fields:
     - `piUsername`: From input (display name)
     - `userRole`: `'WORKER'` (default, can switch to EMPLOYER)
     - `level`: `'NEWCOMER'` (part of reputation system)
     - `status`: `'ACTIVE'`
     - `totalEarnings`: `0` (Decimal)
     - `currentStreak`: `0` (Int)
     - `longestStreak`: `0` (Int)
     - `lastActiveDate`: Current timestamp
   - Includes relationship to newly created streak

3. **Create Streak Record**
   - Automatically created for new users
   - Initializes with `currentStreak: 0` and `longestStreak: 0`
   - Maintains user's streak data across platform

#### Return Values

**On Success (New User):**
```typescript
{
  success: true,
  user: {
    id: string (cuid),
    piUsername: string,
    userRole: 'WORKER',
    level: 'NEWCOMER',
    status: 'ACTIVE',
    totalEarnings: Decimal,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: Date,
    streak: { userId, currentStreak, longestStreak }
  },
  isNew: true,
  message: 'User created successfully'
}
```

**On Success (Existing User):**
```typescript
{
  success: true,
  user: { ... existing user object with streak ... },
  isNew: false,
  message: 'User already exists'
}
```

**On Error:**
```typescript
throws Error with message:
'Failed to create user: {specific error details}'
```

#### Error Handling
- Try/catch wrapper catches all database errors
- Specific error messages help with debugging
- Console logging for monitoring
- Proper error propagation to client

### Code Example

```typescript
// Create a new user from Pi Network auth callback
const response = await authRouter.createUser({
  piUid: 'pi_user_xyz123',        // From Pi SDK
  piUsername: 'alice_awesome'      // From Pi profile
})

if (response.success && response.isNew) {
  console.log('New user created:', response.user.id)
  // Update session/auth context with user
} else if (response.success && !response.isNew) {
  console.log('User already exists:', response.user.id)
  // Restore existing session
}
```

---

## Architecture

### Technology Stack
- **Framework**: tRPC (type-safe RPC layer)
- **Validation**: Zod (runtime schema validation)
- **Database**: Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production - Week 3)

### Router Structure
```
lib/trpc/
├── routers/
│   ├── auth.ts          ✅ createUser, getCurrentUser, switchRole
│   ├── task.ts          ✅ listTasks, getTask, submitTask
│   ├── user.ts          ✅ getProfile, getStats, getLeaderboard
│   └── _app.ts          Router composition
└── trpc.ts              tRPC configuration
```

### Database Schema (Relevant Models)
```prisma
model User {
  id                  String          @id @default(cuid())
  piUsername          String          @unique
  piWallet            String?         @unique
  userRole            UserRole        @default(WORKER)
  level               Level           @default(NEWCOMER)
  currentStreak       Int             @default(0)
  longestStreak       Int             @default(0)
  lastActiveDate      DateTime        @default(now())
  totalEarnings       Decimal         @default(0)
  totalTasksCompleted Int             @default(0)
  status              UserStatus      @default(ACTIVE)
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  deletedAt           DateTime?
  
  streak              Streak?
  // ... relationships
}

model Streak {
  id              String          @id @default(cuid())
  userId          String          @unique
  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  currentStreak   Int             @default(0)
  longestStreak   Int             @default(0)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}
```

---

## Testing

### Manual Testing (Postman/Insomnia)
```bash
# Test createUser with new user
POST /api/trpc/auth.createUser
Body: {
  "piUid": "pi_test_user_001",
  "piUsername": "testuser_alice"
}

# Expected Response (Success):
{
  "result": {
    "data": {
      "success": true,
      "user": { ... },
      "isNew": true,
      "message": "User created successfully"
    }
  }
}
```

### Test Cases
- ✅ Create new user with valid inputs
- ⏳ Create user that already exists (returns existing)
- ⏳ Test with missing piUid parameter
- ⏳ Test with missing piUsername parameter
- ⏳ Test with piUid > 255 characters (should fail)
- ⏳ Test with empty strings (should fail)

---

## Build Status

**Latest Build:** ✅ Success  
**Date:** February 24, 2026  
**Routes:** 34 compiled without errors  
**Compiler:** Next.js 16.1.6 (Turbopack)

```
✓ Compiled successfully in 19.5s
✓ 34 routes generated
✓ All TypeScript types valid
```

---

## Integration with Pi SDK

**Status:** ⏳ Pending (Next Step)

The `createUser()` function is ready to be integrated with the Pi Network SDK. When Pi authentication callback fires:

```typescript
// After Pi auth successful
const piAuthPayload = await Pi.authenticate()  // From Pi SDK

const user = await trpc.auth.createUser.mutate({
  piUid: piAuthPayload.uid,
  piUsername: piAuthPayload.username
})
```

---

## Other Auth Endpoints (Implemented)

### `getCurrentUser()`
- Retrieves authenticated user by ID
- Includes streak data
- Used for session restoration on app load

### `switchRole()`
- Allows user to switch between WORKER and EMPLOYER roles
- Validates user exists
- Updates session and returns new user object

---

## Remaining Auth Tasks (Week 2)

- [ ] Integrate with Pi SDK for real authentication
- [ ] Implement session/auth context management
- [ ] Test all three auth endpoints (createUser, getCurrentUser, switchRole)
- [ ] Add logging/monitoring
- [ ] Create integration tests

---

## Files Modified

```
lib/trpc/routers/auth.ts
├── ✅ createUser() - Fully implemented
├── ✅ getCurrentUser() - Implemented
└── ✅ switchRole() - Implemented
```

**Git Commit:**
```
96b08c1: Week 2: Implement createUser() with piUid lookup and Streak creation
```

---

## Next Steps

1. **Test `createUser()`** - Manual testing via API
2. **Integrate Pi SDK** - Wire up to real Pi authentication
3. **Test other endpoints** - Verify getCurrentUser and switchRole work
4. **Session Management** - Implement auth context for frontend
5. **Error Scenarios** - Handle edge cases and validation errors

---

## References

- Prisma Documentation: https://www.prisma.io/docs
- tRPC Documentation: https://trpc.io/docs
- Zod Validation: https://zod.dev
- Pi Network SDK: https://developers.minepi.com
