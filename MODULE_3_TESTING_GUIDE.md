# 🧪 Module 3 Testing Guide

## Quick Start Testing (5 minutes)

### Step 1: Start Development Server
```bash
npm run dev
```
**Expected Output:**
```
> citadel-of-truth@1.0.0 dev
> next dev

ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Step 2: Verify Server Initialization
Open a new terminal and run:
```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "serverInitialized": true,
  "timestamp": "2026-02-07T..."
}
```

**✅ PASS**: If `serverInitialized` is `true`, Module 3 cron initialized successfully

---

## Automated Test Suite (2 minutes)

### Run All Tests
```bash
node tests/module3-test.mjs
```

**Expected Output:**
```
🧪 Module 3: Integrity & The "Time Warp" Fix - Test Suite
============================================================

✓ Test 1: Health Check & Server Initialization
  Status: 200
  Database: connected
  Server Initialized: true

✓ Test 2: Trigger Manual State Commitment
  Status: 200
  Hour Key: 2026-02-07-14
  Root Hash: 0x1a2b3c4d...
  Rumors Committed: 42

✓ Test 3: Retrieve Commitment History
  Status: 200
  Commitments Found: 1
  Latest: 2026-02-07-14 - 42 rumors

✓ Test 4: Check State Violations (should be clean)
  Status: 200
  Status: ok
  Violations Found: 0

✓ Test 5: Cron Job Status
  Status: 200
  Next Hour Key: 2026-02-07-15

============================================================

✅ All tests completed!

Module 3 Implementation Summary:
  ✓ Dependencies installed
  ✓ State commitment service running
  ✓ Cron job initialized
  ✓ API endpoints accessible
  ✓ Violation detection ready

Next steps:
  1. Monitor logs for hourly commitments
  2. Test violation detection
  3. Deploy to production
```

**✅ PASS**: If all 5 tests complete successfully

---

## Manual API Testing

### Test 1: Trigger Manual State Commitment

**Command:**
```bash
curl -X POST http://localhost:3000/api/integrity/trigger-commitment \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "State commitment triggered successfully",
  "commitment": {
    "id": "507f1f77bcf86cd799439011",
    "timestamp": "2026-02-07T15:00:00.000Z",
    "hourKey": "2026-02-07-15",
    "rootHash": "0x1a2b3c4d5e6f7g8h9i0j...",
    "rumorCount": 42,
    "verified": true
  }
}
```

**✅ PASS**: If status is `"success"` and commitment is created

---

### Test 2: Check Commitment History

**Command:**
```bash
curl http://localhost:3000/api/integrity/commitments?limit=5
```

**Expected Response:**
```json
{
  "count": 1,
  "commitments": [
    {
      "id": "507f1f77bcf86cd799439011",
      "timestamp": "2026-02-07T15:00:00.000Z",
      "hourKey": "2026-02-07-15",
      "rootHash": "0x1a2b3c4d5e6f7g8h...",
      "rumorCount": 42,
      "verified": true
    }
  ]
}
```

**✅ PASS**: If you see at least 1 commitment in the array

---

### Test 3: Check for Violations (Should Be Clean)

**Command:**
```bash
curl -X POST http://localhost:3000/api/integrity/check-violations \
  -H "Content-Type: application/json" \
  -d '{"hoursBack": 24}'
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "No state violations detected",
  "violations": []
}
```

**✅ PASS**: If status is `"ok"` and violations array is empty

---

### Test 4: Verify a Rumor Against Commitment

**Command:**
```bash
curl -X POST http://localhost:3000/api/integrity/verify-rumor \
  -H "Content-Type: application/json" \
  -d '{
    "rumorId": "RUMOR_ID_HERE",
    "commitmentId": "COMMITMENT_ID_HERE"
  }'
```

**Expected Response (No Tampering):**
```json
{
  "isValid": true,
  "commitmentHash": "0x1a2b3c4d...",
  "rumorScore": 85,
  "currentScore": 85,
  "status": "integrity_verified"
}
```

**✅ PASS**: If `isValid` is `true` and scores match

---

## Test Violation Detection Scenario

### Prerequisites
- Have a commitment already created
- Know a rumor ID and commitment ID

### Step-by-Step

#### 1. Get a Rumor ID and Commitment ID
```bash
# Get commitment
curl http://localhost:3000/api/integrity/commitments?limit=1

# Copy the first commitment ID and a rumor ID from the response
```

#### 2. Check Current State (Should Be Clean)
```bash
curl -X POST http://localhost:3000/api/integrity/check-violations \
  -H "Content-Type: application/json" \
  -d '{"hoursBack": 24}'

# Should show: status: "ok", violations: []
```

#### 3. Manually Tamper with a Score in Database

Using MongoDB Compass or CLI:
```javascript
// MongoDB Shell
db.rumors.updateOne(
  { _id: ObjectId("YOUR_RUMOR_ID") },
  { $set: { truthScore: 999 } }  // Change the score significantly
)
```

#### 4. Check for Violations Again
```bash
curl -X POST http://localhost:3000/api/integrity/check-violations \
  -H "Content-Type: application/json" \
  -d '{"hoursBack": 24}'
```

**Expected Response (With Tampering):**
```json
{
  "status": "violations_detected",
  "count": 1,
  "violations": [
    {
      "violation": true,
      "rumorId": "YOUR_RUMOR_ID",
      "currentScore": 999,
      "committedScore": 85,
      "variance": 914,
      "commitment": {
        "hourKey": "2026-02-07-15",
        "rootHash": "0x1a2b3c4d...",
        "timestamp": "2026-02-07T15:00:00.000Z"
      }
    }
  ]
}
```

**✅ PASS**: If violation is detected

#### 5. Revert the Tampered Score
```bash
curl -X POST http://localhost:3000/api/integrity/revert-state \
  -H "Content-Type: application/json" \
  -d '{
    "rumorId": "YOUR_RUMOR_ID",
    "commitmentId": "YOUR_COMMITMENT_ID"
  }'
```

**Expected Response:**
```json
{
  "status": "reverted",
  "message": "Rumor YOUR_RUMOR_ID reverted to score 85 from commitment 2026-02-07-15",
  "revertedScore": 85
}
```

**✅ PASS**: If score reverted successfully

#### 6. Verify Clean State Again
```bash
curl -X POST http://localhost:3000/api/integrity/check-violations \
  -H "Content-Type: application/json" \
  -d '{"hoursBack": 24}'

# Should show: status: "ok", violations: []
```

**✅ PASS**: If clean again

---

## Monitoring Cron Job Execution

### Watch Console Logs
While development server is running, watch for hourly output:

```bash
# Every hour at :00 UTC, you should see:

⏰ Running state commitment job at 2026-02-07T15:00:00.000Z
✅ State commitment successful: 0x1a2b3c4d5e6f7g8h...
```

### Manual Trigger for Testing
Don't want to wait an hour? Trigger manually:

```bash
curl -X POST http://localhost:3000/api/integrity/trigger-commitment
```

Repeat this command multiple times to create more commitments for testing.

---

## Database Verification

### Check StateCommitment Collection

Using MongoDB Compass or CLI:

```javascript
// MongoDB Shell - View commitments
db.statecommitments.find().sort({ timestamp: -1 }).limit(5)

// Should show:
// {
//   _id: ObjectId(...),
//   timestamp: ISODate(...),
//   hourKey: "2026-02-07-15",
//   rootHash: "0x...",
//   rumorCount: 42,
//   rumors: [
//     { id: "...", score: 85, hash: "..." },
//     ...
//   ],
//   verified: true,
//   createdAt: ISODate(...),
//   updatedAt: ISODate(...)
// }

// Count total commitments
db.statecommitments.countDocuments()

// Should increase by 1 each hour
```

---

## Complete Testing Workflow

### Day 1: Initial Setup
- [ ] Start dev server: `npm run dev`
- [ ] Run health check: Verify server initialized
- [ ] Run automated tests: `node tests/module3-test.mjs`
- [ ] Trigger manual commitment
- [ ] Verify commitment in database

### Day 2: API Testing
- [ ] Test all endpoints manually
- [ ] Check commitment history
- [ ] Verify rumor integrity
- [ ] Check clean violations state

### Day 3: Violation Detection
- [ ] Create test commitment
- [ ] Tamper with a score
- [ ] Detect violation
- [ ] Revert score
- [ ] Verify clean state

### Day 4: Cron Monitoring
- [ ] Monitor hourly execution
- [ ] Check logs for "Running state commitment job"
- [ ] Verify new commitments created
- [ ] Check that timeouts don't occur

### Ongoing: Production Checks
- [ ] Create rule: Run tests before deployment
- [ ] Monitor: Check for violations weekly
- [ ] Alert: Set up alerts for violations
- [ ] Backup: Regular backup of commitments

---

## Troubleshooting

### Issue: `serverInitialized` is `false`
**Solution:** 
- Check that MongoDB is connected
- Verify `ENABLE_CRON=true` in production
- Check logs for initialization errors

### Issue: No commitments created
**Solution:**
- Ensure rumors exist in database: `db.rumors.countDocuments()`
- Check that cron is enabled: `ENABLE_CRON=true`
- Manually trigger: `curl -X POST .../trigger-commitment`

### Issue: API returns 500 error
**Solution:**
- Check database connection: `curl /api/health`
- Look for errors in server logs
- Check MongoDB is running and accessible

### Issue: Violations detected constantly
**Solution:**
- Increase threshold: `STATE_VIOLATION_THRESHOLD=10` (allow more variance)
- Check if scores changing legitimately during voting
- Review violation details to understand changes

---

## Success Criteria

### ✅ Module 3 is Working If:

1. **Server Initialization**
   - [ ] Health endpoint returns `serverInitialized: true`
   - [ ] No errors in logs during startup

2. **State Commitments**
   - [ ] Can manually trigger commitment
   - [ ] Commitment appears in history
   - [ ] Commitment stored in MongoDB

3. **Violation Detection**
   - [ ] Clean state shows `status: "ok"`
   - [ ] After tampering, detects violation
   - [ ] Violation shows correct variance

4. **State Reversion**
   - [ ] Can revert tampered score
   - [ ] Score returns to committed value
   - [ ] Clean state restored

5. **Cron Job**
   - [ ] Cron logs appear hourly
   - [ ] New commitments created automatically
   - [ ] No errors in output

6. **API Endpoints**
   - [ ] All 5 routes respond correctly
   - [ ] Error handling works
   - [ ] Response formats correct

---

## Quick Test Commands (Copy & Paste)

```bash
# 1. Start server
npm run dev

# 2. In another terminal - Health check
curl http://localhost:3000/api/health

# 3. Run full test suite
node tests/module3-test.mjs

# 4. Trigger manual commitment
curl -X POST http://localhost:3000/api/integrity/trigger-commitment

# 5. Check history
curl http://localhost:3000/api/integrity/commitments?limit=10

# 6. Check for violations
curl -X POST http://localhost:3000/api/integrity/check-violations \
  -H "Content-Type: application/json" \
  -d '{"hoursBack": 24}'

# 7. Type check
npm run type-check

# 8. Build for production
npm run build
```

---

## Expected Timeline

- **Health Check**: 10 seconds
- **Run Tests**: 30 seconds
- **Manual Trigger**: 5 seconds per commit
- **Full Test Workflow**: 5-10 minutes
- **Violation Detection Scenario**: 15 minutes
- **Cron Job Verification**: 1 hour (wait for next :00)

---

## Next Steps After Testing

✅ If all tests pass:
1. Deploy to staging
2. Monitor for 24 hours
3. Deploy to production
4. Set up monitoring/alerts

❌ If tests fail:
1. Check DEBUG_REPORT_MODULE_3.md
2. Verify all 5 files were modified
3. Run `npm run type-check` again
4. Check MongoDB connection

---

## Documentation Reference

- **Quick Reference**: MODULE_3_QUICK_REFERENCE.md
- **Technical Details**: IMPLEMENTATION_MODULE_3.md
- **Setup Guide**: MODULE_3_SETUP_GUIDE.md
- **Deployment**: MODULE_3_DEPLOYMENT_CHECKLIST.md
- **Debug Report**: DEBUG_REPORT_MODULE_3.md
