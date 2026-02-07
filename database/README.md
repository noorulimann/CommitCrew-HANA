# MongoDB Database Documentation

## Overview

This project uses **MongoDB** with **Mongoose ODM** for data persistence. The database structure implements all four modules of the Citadel of Truth protocol.

## Collections

### 1. Users
Stores anonymous user identifiers and reputation scores.

```typescript
{
  _id: ObjectId,
  nullifierHash: string (unique, indexed),
  reputationScore: number (default: 1.0),
  createdAt: Date,
  lastActive: Date
}
```

### 2. OTPs
Temporary one-time passwords for email verification.

```typescript
{
  _id: ObjectId,
  emailHash: string (indexed),
  otpCode: string,
  expiresAt: Date (TTL indexed),
  verified: boolean,
  createdAt: Date
}
```

**TTL Index**: Documents automatically delete after `expiresAt` time.

### 3. Rumors
The core content being verified.

```typescript
{
  _id: ObjectId,
  content: string,
  submitterNullifier: string (indexed),
  truthScore: number (default: 0),
  totalVotes: number (default: 0),
  status: 'active' | 'deleted' | 'archived' (indexed),
  createdAt: Date (indexed),
  updatedAt: Date
}
```

### 4. Votes
Individual votes with trust score calculations.

```typescript
{
  _id: ObjectId,
  rumorId: ObjectId (indexed, ref: Rumor),
  voterNullifier: string (indexed),
  voteValue: boolean,
  creditsSpent: number (1-100),
  predictedConsensus: boolean | undefined,
  quadraticWeight: number,
  bayesianBonus: number,
  finalTrustScore: number,
  createdAt: Date
}
```

**Compound Unique Index**: `{ rumorId, voterNullifier }` prevents double voting.

### 5. MerkleCommitments
Immutable state snapshots for integrity verification.

```typescript
{
  _id: ObjectId,
  rootHash: string,
  blockHeight: number (indexed),
  rumorSnapshot: Object,
  committedAt: Date (indexed)
}
```

### 6. RumorDependencies
Graph relationships between rumors.

```typescript
{
  _id: ObjectId,
  parentRumorId: ObjectId (indexed, ref: Rumor),
  childRumorId: ObjectId (indexed, ref: Rumor),
  influenceWeight: number,
  createdAt: Date
}
```

## Mongoose Middleware (Replaces SQL Triggers)

### Vote Model - Pre-save Hook
**Implements Module 2: Trust Scoring Algorithm**

```typescript
// Calculates before saving:
- quadraticWeight = sqrt(creditsSpent)
- bayesianBonus (if ≥10 votes exist)
- finalTrustScore = (quadraticWeight × reputation) + bayesianBonus
```

### Vote Model - Post-save Hook
**Updates Rumor Aggregate Scores**

```typescript
// After vote is saved:
- Aggregates all vote scores for the rumor
- Updates rumor.truthScore
- Updates rumor.totalVotes
```

### Rumor Model - Post-save Hook
**Implements Module 4: Graph Isolation**

```typescript
// When rumor.status changes to 'deleted':
- Sets influenceWeight = 0 for all dependencies
- Prevents "ghost rumor bug"
```

## Utility Functions

Located in `/database/functions/index.ts`:

| Function | Purpose |
|----------|---------|
| `getActiveRumors(limit)` | Fetch ranked active rumors (excludes deleted) |
| `updateUserReputation(nullifier?)` | Recalculate user reputation based on accuracy |
| `getRumorStats(rumorId)` | Get vote statistics for a rumor |
| `hasUserVoted(rumorId, nullifier)` | Check if user already voted |
| `cleanupExpiredOTPs()` | Remove expired OTP codes |

## Indexes

All critical indexes are created automatically by Mongoose:

- `users.nullifierHash` (unique)
- `otps.emailHash`
- `otps.expiresAt` (TTL)
- `rumors.status`
- `rumors.createdAt`
- `votes.rumorId`
- `votes.voterNullifier`
- `votes.{rumorId, voterNullifier}` (compound unique)
- `merkleCommitments.blockHeight`
- `merkleCommitments.committedAt`

## Setup Instructions

### 1. Local MongoDB

```bash
# Install MongoDB (Windows)
winget install MongoDB.Server

# Start MongoDB service
net start MongoDB

# Connection string
mongodb://localhost:27017/citadel-of-truth
```

### 2. MongoDB Atlas (Cloud - Recommended)

1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Whitelist your IP address
4. Create database user
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/citadel-of-truth
   ```

### 3. Environment Setup

Copy `.env.example` to `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/citadel-of-truth
```

### 4. First Run

The application will automatically:
- Connect to MongoDB
- Create collections on first document insert
- Build indexes automatically

No manual migrations needed!

## Advantages of MongoDB for This Project

✅ **Easy Configuration**: No SQL schema migrations  
✅ **Flexible Schema**: Can add fields without altering tables  
✅ **Built-in Middleware**: Replace SQL triggers with TypeScript  
✅ **JSON Native**: Perfect for merkle snapshots  
✅ **Mongoose ODM**: Type-safe database operations  
✅ **Auto-indexing**: Indexes created automatically  
✅ **TTL Indexes**: Auto-delete expired OTPs  
✅ **Cloud-ready**: MongoDB Atlas free tier  

## Mongoose vs SQL Triggers Comparison

| SQL Trigger | Mongoose Equivalent |
|-------------|-------------------|
| BEFORE INSERT | `.pre('save')` hook |
| AFTER INSERT | `.post('save')` hook |
| BEFORE UPDATE | `.pre('findOneAndUpdate')` |
| AFTER DELETE | `.post('findOneAndDelete')` |

All business logic is now in **TypeScript** instead of SQL!
