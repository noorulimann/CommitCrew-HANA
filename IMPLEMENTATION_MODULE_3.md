# Module 3: Integrity & The "Time Warp" Fix

## Overview

Module 3 implements **Blockchain-backed State Commitment** to prevent historical score tampering. Every hour, the system creates a cryptographic commitment of all rumor scores, ensuring that past "verified facts" cannot be retroactively changed.

## Problem Statement

**Scenario:** A rumor about a campus event is marked as "verified true" with a score of +85. A month later, someone manipulates the database directly, changing the score to -50. Without integrity protection, there's no way to prove the score was different.

## Solution Architecture

### 1. Merkle Tree State Commitment

Every hour, the system:
1. Collects all active rumor scores
2. Builds a Merkle tree from these scores
3. Commits the root hash to the database (immutable ledger)

### 2. State Violation Detection

To detect tampering:
1. Compare current database score with committed score
2. If variance exceeds threshold (default 5%), flag as "State Violation"
3. Optionally revert to committed score

### 3. Forensic Trail

Every commitment stores:
- Timestamp (exact UTC hour)
- Merkle root hash
- All included rumors with their scores
- Individual hashes for proof verification

## Technical Components

### A. Database Schema

#### StateCommitment
```typescript
{
  timestamp: Date,           // When commitment was made
  hourKey: string,          // "YYYY-MM-DD-HH" for uniqueness
  rootHash: string,         // Merkle root of all scores
  rumorCount: number,       // How many rumors included
  rumors: [
    {
      id: string,           // Rumor ID
      score: number,        // Score at commitment time
      hash: string,         // Individual keccak256 hash
    }
  ],
  verified: boolean,        // Cryptographically verified
}
```

### B. Services

#### MerkleService
- `calculateMerkleRoot()` - Build Merkle tree from scores
- `createLeaf()` - Hash individual rumor scores
- `verifyScore()` - Prove score was in a commitment
- `detectViolation()` - Compare scores with threshold
- `getHourKey()` - Generate unique hour identifier

#### StateCommitmentService
- `createHourlyCommitment()` - Hourly cron job execution
- `checkStateViolations()` - Audit for tampering
- `revertToCommittedState()` - Restore score if violation found
- `getCommitmentHistory()` - Retrieve past commitments
- `verifyRumorIntegrity()` - Single-rumor verification

### C. Cron Job

**Schedule:** Every hour at minute 0 (0 * * * *)

**Behavior:**
- Disabled in development (enable with `ENABLE_CRON=true`)
- Logs all failures and successes
- Graceful error handling

## API Endpoints

### 1. POST `/api/integrity/check-violations`
Check for state violations in the system.

**Request:**
```json
{
  "rumorId": "optional-rumor-id",
  "hoursBack": 24
}
```

**Response:**
```json
{
  "status": "violations_detected",
  "count": 2,
  "violations": [
    {
      "violation": true,
      "rumorId": "rumor-123",
      "currentScore": 50,
      "committedScore": 85,
      "variance": 35,
      "commitment": {
        "hourKey": "2024-02-07-14",
        "rootHash": "0x...",
        "timestamp": "2024-02-07T14:00:00Z"
      }
    }
  ]
}
```

### 2. POST `/api/integrity/verify-rumor`
Verify a specific rumor against a committed state.

**Request:**
```json
{
  "rumorId": "rumor-123",
  "commitmentId": "commitment-id"
}
```

**Response:**
```json
{
  "isValid": false,
  "commitmentHash": "0x...",
  "rumorScore": 85,
  "currentScore": 50,
  "status": "integrity_violation"
}
```

### 3. GET `/api/integrity/commitments?limit=24`
Retrieve commitment history.

**Response:**
```json
{
  "count": 24,
  "commitments": [
    {
      "id": "commitment-id",
      "timestamp": "2024-02-07T15:00:00Z",
      "hourKey": "2024-02-07-15",
      "rootHash": "0x...",
      "rumorCount": 42,
      "verified": true
    }
  ]
}
```

### 4. POST `/api/integrity/trigger-commitment`
Manually trigger a state commitment (for testing/admin).

**Response:**
```json
{
  "status": "success",
  "message": "State commitment triggered successfully",
  "commitment": {
    "id": "...",
    "timestamp": "...",
    "hourKey": "2024-02-07-16",
    "rootHash": "0x...",
    "rumorCount": 42
  }
}
```

### 5. POST `/api/integrity/revert-state`
Revert a rumor to its committed state.

**Request:**
```json
{
  "rumorId": "rumor-123",
  "commitmentId": "commitment-id"
}
```

**Response:**
```json
{
  "status": "reverted",
  "message": "Rumor rumor-123 reverted to score 85...",
  "revertedScore": 85
}
```

## Usage Examples

### Example 1: Setup & Initialization

```typescript
// Server starts, health check triggers initialization
GET /api/health
// → Cron job starts running hourly

// Manually trigger for testing
POST /api/integrity/trigger-commitment
// → Immediate commitment created
```

### Example 2: Detect Tampering

```typescript
// After 24 hours, check for violations
POST /api/integrity/check-violations
{
  "hoursBack": 24
}
// → Returns any scores that changed > 5%
```

### Example 3: Verify Individual Rumor

```typescript
// Check if rumor score matches a commitment
POST /api/integrity/verify-rumor
{
  "rumorId": "abc123",
  "commitmentId": "commitment-xyz"
}
// → Returns whether score matches
```

### Example 4: Revert on Violation

```typescript
// Automatically revert a tampered score
POST /api/integrity/revert-state
{
  "rumorId": "abc123",
  "commitmentId": "commitment-xyz"
}
// → Score restored to committed value
```

## Security Properties

### ✅ Tampering Detection
- Cryptographic Merkle root makes score changes detectable
- Hash verification proves membership in commitment

### ✅ Forensic Trail
- Every hour creates an immutable record
- Timestamp proves when scores were "true"
- Full rumor history accessible via commitments

### ✅ Automated Reversion
- Violations automatically detected
- Violated scores can be reverted atomically
- Maintains historical integrity

### ⚠️ Limitations

1. **Detection vs Prevention:** System *detects* tampering, doesn't prevent it
   - Solution: Pair with database ACL/RBAC
2. **Time Window:** Database directly accessed before commitment
   - Solution: Reduce commitment interval (current: 1 hour)
3. **Threshold Variance:** 5% variance allowed by default
   - Rationale: Legitimate score changes within normal voting window
   - Configurable per deployment

## Configuration

### Environment Variables

```bash
# Enable cron job (default: false in development)
ENABLE_CRON=true

# Variance threshold for violation detection (default: 5%)
STATE_VIOLATION_THRESHOLD=5

# Commitment interval (future: allow hourly/daily/weekly)
COMMITMENT_INTERVAL=hourly
```

### Database Requirements

1. StateCommitment collection
2. Rumors collection with `total_score` field
3. Created indexes on `timestamp`, `hourKey`, `rootHash`

## Data Files Created

```
src/
├── services/
│   └── integrity/
│       ├── index.ts                 # Export all services
│       ├── merkle.ts                # Merkle tree operations
│       ├── state-commitment.ts       # Core service logic
│       └── cron.ts                  # Job scheduling
├── app/api/integrity/
│   ├── check-violations/route.ts     # Violation detection API
│   ├── verify-rumor/route.ts         # Single-rumor verification
│   ├── commitments/route.ts          # Get history
│   ├── trigger-commitment/route.ts   # Manual trigger
│   └── revert-state/route.ts         # State reversion
└── lib/
    └── server-init.ts               # Server initialization

database/schemas/
└── StateCommitment.ts               # Database schema
```

## Cryptography Details

### Hash Function
- **Algorithm:** Keccak256 (Ethereum standard)
- **Library:** ethers.js
- **Input:** JSON stringified rumor data
- **Output:** 32-byte hex-encoded hash

### Merkle Tree
- **Type:** Binary Merkle tree with sorted pair hashing
- **Leaf Count:** Equal to number of active rumors
- **Root:** Single 32-byte hash representing entire state

### Proof Verification
- **Method:** Merkle proof chain
- **Complexity:** O(log n) verification
- **Trustless:** No server authentication needed

## Integration Points

### With Module 1 (Identity)
- User nullifiers not affected
- Scores attributed to voting users remain immutable

### With Module 2 (Scoring)
- Scores calculated normally by Bayesian algorithm
- Committed at hourly intervals
- Violations trigger reversion

### With Module 4 (Graph Isolation)
- Deleted rumors' influence already zeroed
- Commitments preserve deleted state
- No circular dependencies

## Testing

### Manual Tests
```bash
# 1. Trigger commitment manually
curl -X POST http://localhost:3000/api/integrity/trigger-commitment

# 2. Check for violations (should be none)
curl -X POST http://localhost:3000/api/integrity/check-violations

# 3. Modify a score directly in database

# 4. Check again (should detect violation)
curl -X POST http://localhost:3000/api/integrity/check-violations

# 5. Revert the score
curl -X POST http://localhost:3000/api/integrity/revert-state \
  -H "Content-Type: application/json" \
  -d '{"rumorId": "...", "commitmentId": "..."}'
```

### Automated Tests
See `/tests/` folder for QA scripts.

## Future Enhancements

1. **Blockchain Anchoring:** Store Merkle roots on-chain (Ethereum/Polygon)
2. **Adjustable Intervals:** Per-deployment commitment schedules
3. **Compression:** Efficient Merkle proofs for large datasets
4. **Recovery:** Automated reversion without manual intervention
5. **Alerts:** WebSocket notifications of violations
6. **Analytics:** Dashboard showing integrity metrics

## References

- [Merkle Trees](https://brilliant.org/wiki/merkle-tree/) - Merkle tree concept
- [Keccak256](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-3.md) - Hash standard
- [merkletreejs](https://github.com/miguelmota/merkletreejs) - Library used
