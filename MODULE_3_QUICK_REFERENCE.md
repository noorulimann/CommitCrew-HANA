# Module 3: Quick Reference Guide

## 🚀 5-Minute Setup

```bash
# 1. Ensure dependencies installed
npm install

# 2. Start server
npm run dev

# 3. First request initializes cron
curl http://localhost:3000/api/health

# 4. Done! System now commits state hourly
```

## 📍 Core Endpoints

```bash
# Trigger commitment (testing)
POST /api/integrity/trigger-commitment

# Check for violations
POST /api/integrity/check-violations
Body: { "hoursBack": 24 }

# Get commitment history
GET /api/integrity/commitments?limit=24

# Verify rumor against commitment
POST /api/integrity/verify-rumor
Body: { "rumorId": "...", "commitmentId": "..." }

# Revert tampered score
POST /api/integrity/revert-state
Body: { "rumorId": "...", "commitmentId": "..." }
```

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `src/services/integrity/merkle.ts` | Merkle tree calculations |
| `src/services/integrity/state-commitment.ts` | Core logic |
| `src/services/integrity/cron.ts` | Hourly scheduling |
| `database/schemas/StateCommitment.ts` | Data model |
| `src/lib/integrity-utils.ts` | Helper functions |
| `src/lib/server-init.ts` | Initialization |

## 🧪 Test Command

```bash
node tests/module3-test.mjs
```

## 🔍 Monitor Commits

Watch Development Console:
```
// Every hour at :00 UTC, you'll see:
⏰ Running state commitment job at 2024-02-07T15:00:00.000Z
✅ State commitment successful: 0x1a2b3c4d...ef5g6h7i
```

## 📊 Database Query

```javascript
// View recent commitments
db.statecommitments.find().sort({ timestamp: -1 }).limit(5)

// Check violations
const violations = db.statecommitments.aggregate([
  { $match: { verified: true } },
  { $sort: { timestamp: -1 } },
  { $limit: 10 }
])

// Count total
db.statecommitments.countDocuments()
```

## ⚙️ Configuration

```bash
# .env.local
ENABLE_CRON=true                  # Enable in dev
MONGODB_URI=your_connection_url   # DB connection
STATE_VIOLATION_THRESHOLD=5       # Variance %
```

## 🚨 Emergency Procedures

### Disable Cron
```bash
ENABLE_CRON=false npm run dev
```

### Clear Old Commitments
```javascript
// MongoDB - delete commitments > 90 days old
db.statecommitments.deleteMany({
  timestamp: { $lt: new Date(Date.now() - 90*24*60*60*1000) }
})
```

### Force Revert Score
```bash
curl -X POST http://localhost:3000/api/integrity/revert-state \
  -H "Content-Type: application/json" \
  -d '{
    "rumorId": "YOUR_ID",
    "commitmentId": "COMMIT_ID"
  }'
```

## 📈 Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Commit Creation | < 1s | Per 1000 rumors |
| Violation Check | < 5s | 24-hour review |
| Revert Score | < 100ms | Single rumor |
| API Response | < 200ms | Normal case |

## 🔗 Integration Points

```
Module 1 (Identity)
├─ Doesn't conflict
└─ Nullifiers stay independent

Module 2 (Scoring)
├─ Commits calculated scores
└─ Violations trigger reversion

Module 4 (Graph)
├─ Tombstones preserved
└─ Dependencies unaffected
```

## 📚 Full Documentation

- **Technical**: [IMPLEMENTATION_MODULE_3.md](IMPLEMENTATION_MODULE_3.md)
- **Setup**: [MODULE_3_SETUP_GUIDE.md](MODULE_3_SETUP_GUIDE.md)
- **Deploy**: [MODULE_3_DEPLOYMENT_CHECKLIST.md](MODULE_3_DEPLOYMENT_CHECKLIST.md)

## 🎯 Success Indicators

✅ Server logs show cron initialization
✅ First commitment created at :00 UTC
✅ No violations detected (unless intentional)
✅ Commitment history growing hourly
✅ API responses < 200ms

## 🆘 Troubleshooting Quick Links

| Problem | Solution |
|---------|----------|
| Cron not running | Check ENABLE_CRON, check logs |
| No rumors committed | DB empty? Check countDocuments |
| API slow | Too many rumors? Add index |
| Violations detected | Check threshold - may be normal |
| Revert failed | Check commitment ID and rumor ID |

## 📞 Common Questions

**Q: When does it run?**  
A: Every hour at :00 UTC (e.g., 14:00, 15:00, etc.)

**Q: Can it be turned off?**  
A: Yes, set `ENABLE_CRON=false`

**Q: How far back can I check?**  
A: Any committed hour. Default check is 24 hours.

**Q: What if I lose a commitment?**  
A: MongoDB has your backups. No data loss.

**Q: Can I manually trigger?**  
A: Yes! POST to `/api/integrity/trigger-commitment`

---

## 🎊 Status: Ready for Production

All systems initialized. Your rumors are now protected from the Time Warp attack!
