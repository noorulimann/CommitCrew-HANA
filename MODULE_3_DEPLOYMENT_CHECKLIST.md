# Module 3 Deployment Checklist

## ✅ Installation Status

### Dependencies
- [x] **ethers** (v6.16.0) - Installed ✓
- [x] **merkletreejs** (v0.6.0) - Installed ✓
- [x] **node-cron** (v4.2.1) - Installed ✓

### Database
- [x] StateCommitment schema created
- [ ] StateCommitment indexes created (run in MongoDB):
  ```javascript
  db.statecommitments.createIndex({ timestamp: 1 });
  db.statecommitments.createIndex({ hourKey: 1 }, { unique: true });
  db.statecommitments.createIndex({ rootHash: 1 });
  ```

### Code Implementation
- [x] Merkle service (`src/services/integrity/merkle.ts`)
- [x] State commitment service (`src/services/integrity/state-commitment.ts`)
- [x] Cron job scheduler (`src/services/integrity/cron.ts`)
- [x] API endpoints created (5 routes)
- [x] Server initialization module (`src/lib/server-init.ts`)
- [x] Utility functions (`src/lib/integrity-utils.ts`)
- [x] Health check integration

---

## 🚀 Pre-Deployment Testing

### Step 1: Environment Setup
```bash
# Ensure dependencies are installed
npm install

# Clear cache and reinstall if needed
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Step 2: Local Testing
```bash
# Start development server
npm run dev

# In another terminal, run test suite
node tests/module3-test.mjs
```

**Expected Output:**
```
✅ All tests completed!
✓ Dependencies installed
✓ State commitment service running
✓ Cron job initialized
✓ API endpoints accessible
✓ Violation detection ready
```

### Step 3: Manual API Testing
```bash
# 1. Verify health check
curl http://localhost:3000/api/health

# 2. Trigger commitment
curl -X POST http://localhost:3000/api/integrity/trigger-commitment

# 3. Check violations
curl -X POST http://localhost:3000/api/integrity/check-violations \
  -H "Content-Type: application/json" \
  -d '{"hoursBack": 24}'

# 4. View history
curl http://localhost:3000/api/integrity/commitments?limit=10
```

### Step 4: Cron Job Verification
```bash
# Monitor logs
npm run dev
# Watch for: "⏰ Running state commitment job" messages
# Should appear every hour at :00
```

### Step 5: Violation Detection Test
```bash
# 1. View a rumor ID from commitments
# 2. Modify its score directly in MongoDB
# 3. Run violation check - should detect change
# 4. Revert using the revert API
```

---

## 🌐 Production Deployment

### Pre-Deployment Checklist

#### Environment Variables
- [ ] Verify `ENABLE_CRON=true` (production should enable)
- [ ] Verify `STATE_VIOLATION_THRESHOLD=5` (or your desired threshold)
- [ ] Verify MongoDB connection string is correct
- [ ] Add to `.env.production`:
  ```bash
  ENABLE_CRON=true
  STATE_VIOLATION_THRESHOLD=5
  ```

#### Database
- [ ] StateCommitment collection created
- [ ] Indexes created:
  ```javascript
  // Run in MongoDB Atlas Data Explorer or Compass
  db.statecommitments.createIndex({ timestamp: 1 });
  db.statecommitments.createIndex({ hourKey: 1 }, { unique: true });
  db.statecommitments.createIndex({ rootHash: 1 });
  ```
- [ ] Backup existing Rumor collection
- [ ] Test restore procedure

#### Code Quality
- [ ] TypeScript compilation passes: `npm run type-check`
- [ ] No linting errors: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] All imports resolve correctly

#### Security
- [ ] API endpoints have appropriate auth (if required)
- [ ] StateCommitment routes protected from unauthorized access
- [ ] Cron job runs securely (no credentials exposed)
- [ ] MongoDB user has correct permissions

### Deployment Steps

1. **Build & Test**
   ```bash
   npm run type-check
   npm run lint
   npm run build
   ```

2. **Deploy to Production Platform**
   - Push to main branch (if using CI/CD)
   - Or deploy to Vercel/hosting manually
   - Set environment variables in hosting platform

3. **Verify Deployment**
   ```bash
   # Test health endpoint on production URL
   curl https://your-domain.com/api/health
   
   # Should return serverInitialized: true
   ```

4. **Monitor First Commits**
   - Watch production logs for cron execution
   - Check StateCommitment creation in MongoDB
   - Verify hourly schedule (should run at :00 UTC each hour)

5. **Document in Status Page**
   - Add timestamp of deployment
   - Note any configuration changes
   - Record initial commit root hash

---

## 📊 Post-Deployment Monitoring

### Daily Checks
```bash
# Check for violations
curl -X POST https://your-domain.com/api/integrity/check-violations

# Verify recent commitments
curl https://your-domain.com/api/integrity/commitments?limit=24

# Monitor for errors in logs
# Look for: "❌ State commitment job failed"
```

### Weekly Review
- [ ] Review violation history
- [ ] Check disk usage (StateCommitment documents)
- [ ] Verify cron job execution times (should be consistent)
- [ ] Review any reversion events

### Monthly Audit
- [ ] Generate integrity report
- [ ] Back up StateCommitment collection
- [ ] Review and document any violations
- [ ] Test disaster recovery procedures

---

## 🔧 Troubleshooting Guide

### Issue: Cron not running
```bash
# Check 1: Verify ENABLE_CRON in production
echo $ENABLE_CRON  # Should be "true"

# Check 2: View server logs
# Look for "✅ State commitment cron job initialized"

# Check 3: Manually trigger
curl -X POST https://your-domain.com/api/integrity/trigger-commitment
```

### Issue: No rumors being committed
```bash
# Check 1: Verify rumors exist
# In MongoDB: db.rumors.countDocuments({ is_deleted: false })

# Check 2: Verify database connection
curl https://your-domain.com/api/health
# Should show: "database": "connected"

# Check 3: Try manual trigger
curl -X POST https://your-domain.com/api/integrity/trigger-commitment
```

### Issue: High violation rate
```bash
# Likely causes:
# 1. Threshold too low (5% default)
# 2. Normal voting activity causing legitimate changes
# 3. Database corruption

# Solution 1: Adjust threshold
# env: STATE_VIOLATION_THRESHOLD=10

# Solution 2: Review violations in detail
curl -X POST https://your-domain.com/api/integrity/check-violations

# Solution 3: Check for tampering evidence
# Look at time correlation of changes
```

### Issue: Slow API responses
```bash
# Likely cause: Many rumors to process
# Check number of rumors:
# db.rumors.countDocuments()

# If > 10k rumors:
# 1. Consider pagination in API
# 2. Implement commitment batching
# 3. Add database indexes

# Verify indexes exist:
# db.statecommitments.getIndexes()
```

---

## 📈 Performance Metrics

### Expected Performance
- **Commitment creation time:** < 1 second (< 1000 rumors)
- **Violation check time:** < 5 seconds (24-hour lookback)
- **Storage per commitment:** ~5-10 KB per 100 rumors
- **Disk usage:** ~3-7 GB per year (for 50 rumors, hourly commits)

### Optimization Tips
1. Add indexes to Rumor collection:
   ```javascript
   db.rumors.createIndex({ is_deleted: 1, total_score: 1 });
   ```

2. Archive old commitments:
   ```javascript
   // Keep last 90 days, compress older ones
   db.statecommitments.deleteMany({
     timestamp: { $lt: new Date(Date.now() - 90*24*60*60*1000) }
   });
   ```

3. Use read replicas for monitoring queries:
   - Query replicas don't block operations

---

## 🔐 Security Considerations

### Access Control
- [ ] Verify API endpoints require authentication (if sensitive)
- [ ] Implement rate limiting on integrity endpoints
- [ ] Log all integrity operations for audit trail
- [ ] Prevent direct StateCommitment collection modification

### Data Protection
- [ ] Encrypt MongoDB connection in transit (TLS)
- [ ] Use database authentication (username/password)
- [ ] Back up StateCommitment collection separately
- [ ] Document recovery procedures

### Cron Security
- [ ] Cron runs within your application (no external calls)
- [ ] No credentials passed in cron logs
- [ ] Cron runs with same permissions as app
- [ ] Monitor for unauthorized cron status checks

---

## 📋 Rollback Plan

If issues arise, here's how to rollback:

### Step 1: Disable Cron
```bash
# Temporarily disable in environment
ENABLE_CRON=false
npm run dev  # or redeploy
```

### Step 2: Stop Commitments
```bash
# Existing commitments remain, just stops new ones
# No data loss
```

### Step 3: Restore Previous Code (if needed)
```bash
git revert <commit>
npm install
npm run build
# Redeploy
```

### Step 4: Re-enable When Ready
```bash
ENABLE_CRON=true
# Redeploy
```

---

## 📞 Support & Escalation

Before escalating, check:
1. [ ] Server logs show cron initialization
2. [ ] MongoDB connection is active
3. [ ] StateCommitment collection exists
4. [ ] Indexes are created
5. [ ] Rumors collection has data

---

## ✅ Sign-Off Checklist

Before declaring Module 3 complete:

- [ ] All dependencies installed successfully
- [ ] Local tests pass (`node tests/module3-test.mjs`)
- [ ] API endpoints respond correctly
- [ ] Cron job runs on schedule
- [ ] First commitment created successfully
- [ ] No violations detected (unless intentional)
- [ ] Deployed to production
- [ ] Production endpoints verified
- [ ] Monitoring configured
- [ ] Documentation reviewed
- [ ] Team trained on operations

---

## 🎉 Completion

Once all checkboxes are complete, Module 3 is live and protecting your system from the "Time Warp" attack!

**Status: ✅ READY FOR PRODUCTION**
