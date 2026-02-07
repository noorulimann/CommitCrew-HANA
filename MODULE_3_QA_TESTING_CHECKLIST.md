# Module 3 QA Testing Checklist - Step by Step

**QA Engineer:** Testing Module 3 - Integrity Features  
**Testing Date:** February 7, 2026  
**Environment:** Development (localhost:3000)

---

## Pre-Test Requirements

- [ ] Development server running: `npm run dev`
- [ ] Browser ready: http://localhost:3000/test-integrity
- [ ] MongoDB connected and accessible
- [ ] At least 1 existing rumor in database
- [ ] Testing guide open: [MODULE_3_TESTING_GUIDE.md](MODULE_3_TESTING_GUIDE.md)

---

## TEST SUITE 1: Feature 1 - Trigger State Commitment

### Objective
Verify that new hourly state commitments can be created via API and UI.

### Test 1.1: Basic Commitment Creation
**Expected:** New commitment created with valid rootHash

```
□ Step 1: Open http://localhost:3000/test-integrity
  └─ Observe: "🔬 Module 3 Testing Dashboard" header visible
  └─ Observe: Step 1 card with "Trigger State Commitment" button
  
□ Step 2: Click "🔐 Trigger Commitment" button
  └─ Observe: Button becomes disabled while loading
  └─ Observe: "Creating commitment..." text appears
  
□ Step 3: Wait for response (2-5 seconds)
  └─ Expected Result: Green success box appears with:
     ✅ Commitment created!
     ✅ Root Hash: abc123def456... (truncated)
  
□ Step 4: Verify success message contains:
  □ "Commitment created!" text
  □ "Root Hash: " followed by hash
  □ Progress bar advances to Step 2
  
□ SUCCESS CRITERIA:
  ✅ Message appears in green box
  ✅ No red error appears
  ✅ Root Hash displays (40+ character hex string)
  ✅ Step indicator advances to 2
```

**API Verification:**
```bash
# Test API directly in terminal or Postman:
curl -X POST http://localhost:3000/api/integrity/trigger-commitment \
  -H "Content-Type: application/json"

# Expected Response:
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "timestamp": "2026-02-07T14:30:00.000Z",
    "hourKey": "2026-02-07-14",
    "rootHash": "a1b2c3d4e5f6...",
    "rumorCount": 5,
    "verified": true
  },
  "message": "State commitment triggered successfully"
}

# Status Code: 200 ✅
```

---

## TEST SUITE 2: Feature 2 - View Recent Commitments

### Objective
Verify that commitment history can be retrieved and displayed.

### Test 2.1: View Commitments from Dashboard
**Expected:** List of recent commitments appears

```
□ Step 1: You should now be on Step 2 (auto-advanced from Test 1.1)
  └─ Observe: "View Recent Commitments" card visible
  
□ Step 2: Click "📊 View Commitments" button
  └─ Observe: Button disables during loading
  └─ Observe: "Loading..." text appears
  
□ Step 3: Wait for response (1-3 seconds)
  └─ Expected Result: Green box shows:
     ✅ Found X recent commitments (last 24 hours)
  
□ Step 4: Verify commitment list displays
  □ List appears with scrollable entries
  □ Each entry shows:
     • "Hour: 2026-02-07-14" format
     • "Root: abc123def456..." (truncated hash)
     • "Rumors: 5 | Verified: ✅"
  
□ Step 5: Verify data correctness
  □ Hour key format is YYYY-MM-DD-HH
  □ Root hash is 32+ characters
  □ Rumors count is number
  □ Verified shows ✅ or ❌
  
□ SUCCESS CRITERIA:
  ✅ Green success message appears
  ✅ Commitment list displays
  ✅ Multiple entries visible (at least from Test 1.1)
  ✅ All fields populated correctly
  ✅ Scrolling works if list is long
```

**API Verification:**
```bash
# Test API directly:
curl http://localhost:3000/api/integrity/commitments?limit=5

# Expected Response:
{
  "count": 2,
  "commitments": [
    {
      "id": "507f1f77bcf86cd799439011",
      "timestamp": "2026-02-07T14:30:00.000Z",
      "hourKey": "2026-02-07-14",
      "rootHash": "a1b2c3d4e5f6...",
      "rumorCount": 5,
      "verified": true
    }
  ]
}

# Status Code: 200 ✅
```

### Test 2.2: Custom Limit Parameter
**Expected:** API respects limit parameter

```
□ Step 1: Run API with different limits:
  curl http://localhost:3000/api/integrity/commitments?limit=1
  
□ Step 2: Verify:
  □ Response returns exactly 1 commitment (or 0 if not available)
  □ Default limit is 24 when not specified
  
□ SUCCESS CRITERIA:
  ✅ Limit parameter works correctly
  ✅ Returns appropriate number of results
```

---

## TEST SUITE 3: Feature 3 - Detect State Violations

### Objective
Verify that tampering with scores is detected.

### Test 3.1: Detect No Violations (Clean State)
**Expected:** No violations found for legitimate state

```
□ Step 1: Find a rumor ID from the database
  
  MongoDB Query:
  db.rumors.findOne({status: "active"}, {_id: 1})
  
  Copy the _id value (e.g., "507f1f77bcf86cd799439012")
  
□ Step 2: On dashboard, enter Rumor ID in text input
  □ Click on the text input field under Step 3
  □ Paste the rumor ID
  □ Click "🔍 Check Violations" button
  
□ Step 3: Wait for response (2-5 seconds)
  □ Expected Result: Green box shows:
     ✅ No violations detected! Rumor score is intact.
  
□ Step 4: Verify no violations list
  □ Violations array is empty
  □ No error messages appear
  
□ SUCCESS CRITERIA:
  ✅ Green success message
  ✅ "No violations detected" message appears
  ✅ Violations list empty
  ✅ No red error box
```

**API Verification:**
```bash
# Test API directly:
curl -X POST http://localhost:3000/api/integrity/check-violations \
  -H "Content-Type: application/json" \
  -d '{
    "rumorId": "507f1f77bcf86cd799439012",
    "hoursBack": 24
  }'

# Expected Response (No Violations):
{
  "status": "ok",
  "message": "No state violations detected",
  "violations": []
}

# Status Code: 200 ✅
```

### Test 3.2: Simulate Tampering
**Expected:** Violation detected after modifying rumor score

```
□ Step 1: Modify rumor score directly in database
  
  MongoDB Commands:
  db.rumors.updateOne(
    {_id: ObjectId("507f1f77bcf86cd799439012")},
    {$set: {truthScore: 999}}
  )
  
  Note: Change the truthScore to an obviously different value
  
□ Step 2: Run violation check again
  □ Enter same rumor ID in dashboard
  □ Click "🔍 Check Violations" button
  
□ Step 3: Wait for response (2-5 seconds)
  □ Expected Result: Yellow/orange box shows:
     ⚠️ Found 1 violation(s)! Tampering detected!
  
□ Step 4: Verify violation details
  □ Violation item appears showing:
     • "Rumor ID: 507f1f77bcf86cd799439012"
     • "Current Score: 999"
     • "Committed Score: [original value]"
     • "Variance: [difference]"
     • "Hour: 2026-02-07-14"
  
□ Step 5: Verify revert button appears
  □ "↩️ Revert State" button visible for violation
  □ Button is clickable
  
□ SUCCESS CRITERIA:
  ✅ Tampering detected correctly
  ✅ Violation details displayed
  ✅ Current score shows tampered value (999)
  ✅ Committed score shows original value
  ✅ Variance calculated correctly
  ✅ Progress advances to Step 4
  ✅ Revert button visible and enabled
```

**API Verification:**
```bash
# After tampering, test API:
curl -X POST http://localhost:3000/api/integrity/check-violations \
  -H "Content-Type: application/json" \
  -d '{
    "rumorId": "507f1f77bcf86cd799439012",
    "hoursBack": 24
  }'

# Expected Response (Violations Found):
{
  "status": "violations_detected",
  "count": 1,
  "violations": [
    {
      "violation": true,
      "rumorId": "507f1f77bcf86cd799439012",
      "currentScore": 999,
      "committedScore": 75,
      "commitment": {
        "id": "507f1f77bcf86cd799439011",
        "hourKey": "2026-02-07-14",
        "rootHash": "a1b2c3d4e5f6...",
        "timestamp": "2026-02-07T14:30:00.000Z"
      },
      "variance": 924
    }
  ]
}

# Status Code: 200 ✅
```

---

## TEST SUITE 4: Feature 4 - Revert to Historical Truth

### Objective
Verify that tampered scores can be reverted to committed state.

### Test 4.1: Revert Tampered Score
**Expected:** Score restored to original committed value

```
□ Step 1: You should still see the violation from Test 3.2
  └─ Violation with tampering details visible
  └─ "↩️ Revert State" button ready
  
□ Step 2: Click "↩️ Revert State" button
  □ Button disables during processing
  □ "Loading..." indication appears
  
□ Step 3: Wait for response (2-5 seconds)
  □ Expected Result: Green box shows:
     ✅ State reverted! Score restored to: [original value]
  
□ Step 4: Verify revert success
  □ Green success message displays
  □ Shows original committed score (e.g., "75")
  □ No error messages
  
□ SUCCESS CRITERIA:
  ✅ Green success message appears
  ✅ Reversion message shows original score
  ✅ No red error box
  ✅ Friendly message confirms operation
```

**API Verification:**
```bash
# Test API directly:
curl -X POST http://localhost:3000/api/integrity/revert-state \
  -H "Content-Type: application/json" \
  -d '{
    "rumorId": "507f1f77bcf86cd799439012",
    "commitmentId": "507f1f77bcf86cd799439011"
  }'

# Expected Response:
{
  "status": "reverted",
  "message": "Rumor 507f1f77bcf86cd799439012 reverted to score 75 from commitment 2026-02-07-14",
  "revertedScore": 75
}

# Status Code: 200 ✅
```

### Test 4.2: Verify Database Update
**Expected:** Rumor score in database matches committed value

```
□ Step 1: Check database directly
  
  MongoDB Query:
  db.rumors.findOne(
    {_id: ObjectId("507f1f77bcf86cd799439012")},
    {truthScore: 1}
  )
  
□ Step 2: Verify result
  □ truthScore shows original value (NOT 999)
  □ truthScore matches "Committed Score" from violation
  □ Operation completed successfully
  
□ SUCCESS CRITERIA:
  ✅ Database shows reverted score
  ✅ Score matches committed value
  ✅ Tampering removed
```

---

## TEST SUITE 5: Error Scenarios

### Objective
Verify proper error handling for edge cases.

### Test 5.1: Invalid Rumor ID
**Expected:** Appropriate error handling

```
□ Step 1: Enter bogus rumor ID (e.g., "invalid123")
  □ Go back to Step 3
  □ Enter: invalid123
  □ Click "🔍 Check Violations"
  
□ Step 2: Verify response
  □ Should return: "No state violations detected"
  □ OR show empty violations array
  □ No red error box
  □ Graceful handling confirmed
  
□ SUCCESS CRITERIA:
  ✅ Invalid ID handled gracefully
  ✅ No server error
  ✅ Appropriate response (empty or no violations)
```

### Test 5.2: Missing Required Parameters
**Expected:** API returns 400 error

```
□ Step 1: Test API with missing parameters:
  
  curl -X POST http://localhost:3000/api/integrity/revert-state \
    -H "Content-Type: application/json" \
    -d '{}'
  
□ Step 2: Verify response
  □ Status Code: 400
  □ Error message: Missing required fields
  
□ SUCCESS CRITERIA:
  ✅ Returns 400 error
  ✅ Clear error message
  ✅ API properly validates input
```

---

## TEST SUITE 6: Integration Tests

### Objective
Verify all features work together in sequence.

### Test 6.1: Complete Workflow
**Expected:** Full cycle from commitment to revert

```
□ Step 1: Run Test 1.1 (Create Commitment)
  ✅ Commitment created successfully
  
□ Step 2: Run Test 2.1 (View Commitments)
  ✅ New commitment visible in list
  
□ Step 3: Run Test 3.1 (Check Clean State)
  ✅ No violations for valid state
  
□ Step 4: Run Test 3.2 (Simulate Tampering)
  ✅ Tampering detected correctly
  
□ Step 5: Run Test 4.1 (Revert to Truth)
  ✅ Score restored to original
  
□ Step 6: Run Test 3.1 Again (Verify Clean)
  ✅ No violations after revert
  
□ SUCCESS CRITERIA:
  ✅ All 4 features work in sequence
  ✅ State persists correctly
  ✅ No conflicts between operations
  ✅ Database consistent throughout
```

---

## TEST SUITE 7: Performance Tests

### Objective
Verify system performance under normal load.

### Test 7.1: Response Time
**Expected:** Responses within acceptable timeframe

```
□ Measure response times:

  Operation                    Target      Actual
  ─────────────────────────────────────────────────
  Trigger Commitment           < 2s        _____ ms
  View Commitments (24)        < 1s        _____ ms
  Check Violations             < 2s        _____ ms
  Revert State                 < 1s        _____ ms
  
□ SUCCESS CRITERIA:
  ✅ All operations under 5 seconds
  ✅ No timeout errors
  ✅ Consistent response times
```

---

## FINAL VERIFICATION CHECKLIST

### Feature 1: Trigger State Commitment
- [ ] Can create new commitment via API
- [ ] Can create via dashboard button
- [ ] Returns valid Merkle root hash
- [ ] Stores in StateCommitment collection
- [ ] Prevents duplicate per hour
- [ ] Response includes all metadata

### Feature 2: View Recent Commitments
- [ ] Can retrieve via API with limit
- [ ] Can view via dashboard button
- [ ] Returns array of commitments
- [ ] Sorted by newest first
- [ ] Includes timestamp, hourKey, rootHash
- [ ] Handles empty results gracefully

### Feature 3: Detect State Violations
- [ ] Detects tampering correctly
- [ ] Returns violation details
- [ ] Includes commitment information
- [ ] Shows score variance
- [ ] Handles clean state (no violations)
- [ ] Supports optional parameters

### Feature 4: Revert to Historical Truth
- [ ] Can revert tampered scores
- [ ] Restores original committed value
- [ ] Updates database correctly
- [ ] Returns success message
- [ ] Shows reverted score
- [ ] Handles errors properly

### Overall Quality
- [ ] No JavaScript errors in console
- [ ] No TypeScript compilation errors
- [ ] Proper error handling on all paths
- [ ] Clear user feedback for all operations
- [ ] Database operations successful
- [ ] API endpoints secure and functional

---

## SIGN-OFF

**Test Date:** _______________  
**Tester Name:** _______________  
**All Tests Passed:** [ ] Yes [ ] No  

**Issues Found:**
```
[List any issues discovered]
1. ___________________________________
2. ___________________________________
3. ___________________________________
```

**Comments:**
```
[Additional notes or observations]
_________________________________
_________________________________
_________________________________
```

**QA Engineer Approval:** _______________  
**Date:** _______________  

---

## Quick Command Reference

```bash
# Start dev server
npm run dev

# View test dashboard
http://localhost:3000/test-integrity

# Trigger commitment (API)
curl -X POST http://localhost:3000/api/integrity/trigger-commitment \
  -H "Content-Type: application/json"

# View commitments (API)
curl http://localhost:3000/api/integrity/commitments?limit=24

# Check violations (API)
curl -X POST http://localhost:3000/api/integrity/check-violations \
  -H "Content-Type: application/json" \
  -d '{"rumorId":"YOUR_RUMOR_ID","hoursBack":24}'

# Revert state (API)
curl -X POST http://localhost:3000/api/integrity/revert-state \
  -H "Content-Type: application/json" \
  -d '{"rumorId":"YOUR_RUMOR_ID","commitmentId":"YOUR_COMMITMENT_ID"}'

# Find rumor ID in MongoDB
mongosh
> db.rumors.findOne({status: "active"}, {_id: 1})

# Update rumor score (simulate tampering)
db.rumors.updateOne(
  {_id: ObjectId("YOUR_RUMOR_ID")},
  {$set: {truthScore: 999}}
)

# Verify revert (check reverted score)
db.rumors.findOne(
  {_id: ObjectId("YOUR_RUMOR_ID")},
  {truthScore: 1}
)
```

---

**Testing Guide Reference:** [MODULE_3_TESTING_GUIDE.md](MODULE_3_TESTING_GUIDE.md)  
**QA Summary Report:** [MODULE_3_QA_SUMMARY.md](MODULE_3_QA_SUMMARY.md)  
**Full QA Verification:** [MODULE_3_QA_VERIFICATION.md](MODULE_3_QA_VERIFICATION.md)
