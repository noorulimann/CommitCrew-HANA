# 🏰 Citadel of Truth - Complete Implementation Phases

Based on the README requirements, here's a detailed breakdown into **6 phases** that ensures full implementation.

---

## Phase 1: Foundation & Infrastructure (Hours 0-2)
**Goal:** Set up the core infrastructure and database layer

### 1.1 Project Setup
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Set up path aliases in tsconfig
- [ ] Create folder structure

### 1.2 Database Configuration
- [ ] MongoDB connection handler (`src/lib/mongodb.ts`)
- [ ] Environment variables setup (`.env.local`)

### 1.3 Database Schemas (Mongoose Models)
| Model | Purpose |
|-------|---------|
| `User` | Stores nullifier hashes + reputation scores |
| `OTP` | Temporary email verification codes (TTL indexed) |
| `Rumor` | Campus rumors with truth scores |
| `Vote` | Individual votes with trust calculations |
| `MerkleCommitment` | Hourly state snapshots |
| `RumorDependency` | Graph relationships between rumors |

### 1.4 Core Types
- [ ] TypeScript interfaces for all entities
- [ ] API request/response types
- [ ] Validation schemas (Zod)

**Deliverables:** Working database connection, all models created, type definitions complete

---

## Phase 2: Module 1 - Identity Gateway (Hours 2-4)
**Goal:** Implement the complete Anti-Sybil authentication system

### 2.1 Client-Side Cryptography
```
src/utils/crypto/
├── hash.ts          → SHA256 hashing (Web Crypto API)
├── nullifier.ts     → Generate User_Nullifier = SHA256(email + phrase)
└── pow.ts           → Proof of Work challenge (optional bot protection)
```

### 2.2 Email Validation
```
src/utils/validation/
├── email.ts         → Validate .edu domain requirement
└── secretPhrase.ts  → Min 3 words OR 12 characters
```

### 2.3 OTP Service
```
src/services/identity/
├── otp.ts           → Generate 6-digit OTP, 5-min expiry
├── email.ts         → Send OTP via Nodemailer/SMTP
└── brain-wallet.ts  → Secret phrase management
```

### 2.4 Auth API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/send-otp` | POST | Send OTP to .edu email |
| `/api/auth/verify-otp` | POST | Verify OTP code |
| `/api/auth/register` | POST | Store nullifier hash (first time) |
| `/api/auth/login` | POST | Verify hash exists (returning user) |

### 2.5 Auth UI Components
```
src/components/auth/
├── EmailInput.tsx           → Email entry with .edu validation
├── OTPVerification.tsx      → 6-digit OTP input
├── SecretPhraseCreator.tsx  → Create phrase (first time)
├── SecretPhraseInput.tsx    → Enter phrase (login)
└── NullifierDisplay.tsx     → Show generated hash (optional)
```

### 2.6 Auth Pages
- [ ] `/login` page with full authentication flow
- [ ] localStorage management for nullifier hash
- [ ] Session state management

**Key Implementation Details:**
- Email is NEVER stored in database
- Secret phrase NEVER leaves browser
- Only irreversible SHA256 hash is sent to server
- Same email + phrase = same hash (cross-device login)

**Deliverables:** Complete authentication system with OTP verification, client-side hashing, and brain wallet login

---

## Phase 3: Module 2 - Trust Scoring Algorithm (Hours 4-6)
**Goal:** Implement Quadratic Bayesian Scoring (QBS)

### 3.1 Quadratic Voting Logic
```
src/services/scoring/
├── quadratic.ts     → Vote weight = √(credits spent)
├── bayesian.ts      → Prediction accuracy bonus
└── reputation.ts    → User reputation tracking
```

**Quadratic Formula:**
```typescript
quadraticWeight = Math.sqrt(creditsSpent);
// To double influence → must quadruple credits (2² = 4)
```

### 3.2 Bayesian Truth Serum
```typescript
// Rewards "surprising truth" predictions
if (prediction === consensus && vote !== prediction) {
  bonus = reputation * 0.5;  // Predicted majority, voted minority
} else if (prediction !== consensus && vote === prediction) {
  bonus = reputation * 0.3;  // Predicted minority correctly
}
```

### 3.3 Trust Score Calculation
```typescript
Trust_Score = (Vote_Weight × Reputation) + Prediction_Accuracy_Bonus
```

### 3.4 Vote Model Middleware (Mongoose Hooks)
- [ ] `pre('save')` - Calculate quadratic weight, Bayesian bonus, final score
- [ ] `post('save')` - Update rumor's aggregate truth score

### 3.5 Voting API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/votes` | POST | Cast vote with credits + prediction |
| `/api/votes/check` | GET | Check if user already voted |

### 3.6 Reputation Update System
- [ ] Calculate user accuracy (votes matching consensus)
- [ ] Moving average: `newRep = (oldRep × 0.9) + (accuracy × 0.1)`
- [ ] Scheduled job or trigger-based updates

**Deliverables:** Complete voting engine with quadratic weighting, Bayesian bonuses, and reputation tracking

---

## Phase 4: Core UI & Rumor Management (Hours 6-8)
**Goal:** Build the main user interface and rumor CRUD operations

### 4.1 Rumor API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/rumors` | GET | List active rumors (ranked) |
| `/api/rumors` | POST | Submit new rumor |
| `/api/rumors/[id]` | GET | Get single rumor with stats |
| `/api/rumors/[id]` | DELETE | Soft-delete (set status='deleted') |

### 4.2 Ranking Algorithm
```typescript
// Rumors ranked by: Truth score / age decay
rankScore = truthScore / (1 + Math.pow(ageHours, 1.5));
```

### 4.3 Rumor UI Components
```
src/components/rumors/
├── RumorCard.tsx         → Display single rumor with score
├── RumorFeed.tsx         → Scrollable list of rumors
├── RumorSubmitForm.tsx   → Create new rumor
├── TruthMeter.tsx        → Visual score indicator
└── RumorStats.tsx        → Vote breakdown display
```

### 4.4 Voting UI Components
```
src/components/voting/
├── VoteButtons.tsx       → True/False vote selection
├── CreditSlider.tsx      → Quadratic credit allocation (1-100)
├── PredictionInput.tsx   → "What will others vote?"
├── VoteSummary.tsx       → Show vote weight calculation
└── TrustScoreDisplay.tsx → Show earned trust score
```

### 4.5 Main Pages
| Page | Purpose |
|------|---------|
| `/` | Landing page with intro |
| `/feed` | Main rumor feed (authenticated) |
| `/submit` | Create new rumor |
| `/rumor/[id]` | Single rumor detail view |

### 4.6 UI/UX Features
- [ ] Real-time vote count updates
- [ ] "Already voted" indicator
- [ ] Credit cost preview (show √credits)
- [ ] Responsive mobile design

**Deliverables:** Fully functional UI with rumor feed, submission, and voting interface

---

## Phase 5: Module 3 & 4 - Integrity & Graph Isolation (Hours 8-10)
**Goal:** Implement Merkle anchoring and ghost rumor fix

### 5.1 Merkle Tree Implementation
```
src/services/merkle/
├── tree.ts          → Build Merkle tree from rumor scores
├── anchor.ts        → Create hourly state commitments
├── verify.ts        → Verify historical state integrity
└── scheduler.ts     → Cron job for hourly commits
```

### 5.2 Merkle Tree Logic
```typescript
// Every hour:
1. Get all active rumors with scores
2. Create leaf nodes: hash(rumorId + truthScore)
3. Build tree by hashing pairs
4. Store root hash + full snapshot
5. Compare against previous to detect tampering
```

### 5.3 State Verification API
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/merkle/commit` | POST | Create state commitment (scheduled) |
| `/api/merkle/verify` | GET | Verify rumor score against history |
| `/api/merkle/history` | GET | Get commitment history |

### 5.4 Graph Isolation (Ghost Fix)
```
src/services/graph/
├── dependency.ts    → Manage rumor relationships
├── tombstone.ts     → Zero influence on deletion
└── influence.ts     → Calculate dependency weights
```

### 5.5 Tombstone Logic (Mongoose Hook)
```typescript
// In Rumor model post('save'):
if (doc.status === 'deleted') {
  await RumorDependency.updateMany(
    { $or: [{ parentRumorId: doc._id }, { childRumorId: doc._id }] },
    { $set: { influenceWeight: 0 } }
  );
}
```

### 5.6 Active-Only Queries
```typescript
// All rumor queries MUST filter:
{ status: 'active' }
// Ensures deleted rumors have zero influence
```

### 5.7 Integrity UI Components
```
src/components/integrity/
├── MerkleProofDisplay.tsx    → Show verification status
├── StateViolationAlert.tsx   → Warning if tampering detected
└── HistoryTimeline.tsx       → Visual commitment history
```

**Deliverables:** Hourly Merkle anchoring, state verification, and ghost rumor prevention

---

## Phase 6: Testing, Security & Deployment (Hours 10-12)
**Goal:** Harden security, test against attacks, deploy to production

### 6.1 Security Hardening
- [ ] Rate limiting on all API endpoints
- [ ] Input sanitization (XSS prevention)
- [ ] CSRF protection
- [ ] Secure headers (helmet)
- [ ] Environment variable validation

### 6.2 Bot Simulation Testing
```
tests/
├── sybil-attack.test.ts      → Multi-account creation attempts
├── vote-manipulation.test.ts → Coordinate vote bombing
├── quadratic-cost.test.ts    → Verify cost scaling
└── merkle-tamper.test.ts     → State modification detection
```

### 6.3 Edge Case Handling
- [ ] Forgotten secret phrase (graceful messaging)
- [ ] Expired OTP retry flow
- [ ] Concurrent voting race conditions
- [ ] Network failure recovery
- [ ] Database connection resilience

### 6.4 Performance Optimization
- [ ] Database indexes verification
- [ ] API response caching (where safe)
- [ ] Image/asset optimization
- [ ] Lazy loading for feed

### 6.5 Deployment Checklist
| Task | Platform |
|------|----------|
| Database | MongoDB Atlas (production cluster) |
| Application | Vercel (Next.js optimized) |
| Environment | Vercel environment variables |
| Domain | Custom domain setup |
| Monitoring | Vercel Analytics |

### 6.6 Production Configuration
```env
# Production .env
MONGODB_URI=mongodb+srv://...  # Atlas connection
NEXTAUTH_URL=https://citadel.example.com
NEXTAUTH_SECRET=<generated-secret>
SMTP_HOST=smtp.sendgrid.net  # Production email
NODE_ENV=production
```

### 6.7 Final Verification
- [ ] All 4 modules functional
- [ ] Authentication flow complete
- [ ] Voting with quadratic cost works
- [ ] Merkle commits running hourly
- [ ] Deleted rumors don't affect new ones
- [ ] Mobile responsive
- [ ] Error handling graceful

**Deliverables:** Production-ready, security-tested, deployed application

---

## 📊 Complete Feature Checklist

### Module 1: Identity Gateway
- [ ] .edu email validation
- [ ] OTP generation & verification (5-min expiry)
- [ ] Client-side SHA256 hashing
- [ ] Nullifier hash storage (email never stored)
- [ ] Brain wallet login (same email + phrase = same hash)
- [ ] localStorage session management

### Module 2: Trust Scoring
- [ ] Quadratic voting (weight = √credits)
- [ ] Bayesian Truth Serum (prediction bonus)
- [ ] Reputation tracking (accuracy-based)
- [ ] Anti-double-voting (nullifier + rumorId unique)
- [ ] Aggregate truth score calculation

### Module 3: Integrity
- [ ] Merkle tree construction
- [ ] Hourly state commitments
- [ ] Historical verification
- [ ] Tampering detection & alerts

### Module 4: Graph Isolation
- [ ] Rumor dependency tracking
- [ ] Tombstone vector zeroing
- [ ] Active-only filtering
- [ ] Ghost rumor prevention

### UI/UX
- [ ] Landing page
- [ ] Authentication pages
- [ ] Rumor feed (ranked)
- [ ] Rumor submission form
- [ ] Voting interface with sliders
- [ ] Prediction input
- [ ] Trust score display
- [ ] Mobile responsive

### Infrastructure
- [ ] MongoDB database
- [ ] API routes
- [ ] Email service
- [ ] Error handling
- [ ] Rate limiting
- [ ] Production deployment

---

## ⏱️ Time Allocation Summary

| Phase | Hours | Focus |
|-------|-------|-------|
| **Phase 1** | 0-2 | Foundation & Database |
| **Phase 2** | 2-4 | Identity Gateway (Auth) |
| **Phase 3** | 4-6 | Trust Scoring Algorithm |
| **Phase 4** | 6-8 | UI & Rumor Management |
| **Phase 5** | 8-10 | Merkle & Graph Isolation |
| **Phase 6** | 10-12 | Testing & Deployment |

---

## 🎯 Success Criteria

By the end of Phase 6, you will have:

1. **Anonymous Authentication** - Users login with email + secret phrase, only hash stored
2. **Quadratic Voting** - Costly for bots, fair for individuals
3. **Bayesian Truth Serum** - Rewards surprising truths
4. **Immutable History** - Merkle roots prevent score tampering
5. **Ghost-Free Graph** - Deleted rumors have zero influence
6. **Mathematical Sybil Resistance** - Cost to attack > possible gain
7. **Production Deployment** - Live on Vercel with MongoDB Atlas

**The Citadel of Truth will be fully operational!** 🏰

---

## 📁 Files to Create Per Phase

### Phase 1 Files
```
src/lib/mongodb.ts
src/lib/config.ts
src/lib/constants.ts
database/schemas/User.ts
database/schemas/OTP.ts
database/schemas/Rumor.ts
database/schemas/Vote.ts
database/schemas/MerkleCommitment.ts
database/schemas/RumorDependency.ts
database/schemas/index.ts
src/types/index.ts
src/types/user.ts
src/types/rumor.ts
src/types/vote.ts
```

### Phase 2 Files
```
src/utils/crypto/hash.ts
src/utils/crypto/nullifier.ts
src/utils/validation/email.ts
src/utils/validation/secretPhrase.ts
src/services/identity/otp.ts
src/services/identity/email.ts
src/services/identity/brain-wallet.ts
src/app/api/auth/send-otp/route.ts
src/app/api/auth/verify-otp/route.ts
src/app/api/auth/register/route.ts
src/app/api/auth/login/route.ts
src/components/auth/EmailInput.tsx
src/components/auth/OTPVerification.tsx
src/components/auth/SecretPhraseCreator.tsx
src/components/auth/SecretPhraseInput.tsx
src/app/login/page.tsx
```

### Phase 3 Files
```
src/services/scoring/quadratic.ts
src/services/scoring/bayesian.ts
src/services/scoring/reputation.ts
src/app/api/votes/route.ts
src/app/api/votes/check/route.ts
database/functions/index.ts (update)
```

### Phase 4 Files
```
src/app/api/rumors/route.ts
src/app/api/rumors/[id]/route.ts
src/components/rumors/RumorCard.tsx
src/components/rumors/RumorFeed.tsx
src/components/rumors/RumorSubmitForm.tsx
src/components/rumors/TruthMeter.tsx
src/components/voting/VoteButtons.tsx
src/components/voting/CreditSlider.tsx
src/components/voting/PredictionInput.tsx
src/components/ui/Button.tsx
src/components/ui/Input.tsx
src/components/ui/Card.tsx
src/app/page.tsx
src/app/layout.tsx
src/app/feed/page.tsx
src/app/submit/page.tsx
src/app/rumor/[id]/page.tsx
src/app/globals.css
```

### Phase 5 Files
```
src/services/merkle/tree.ts
src/services/merkle/anchor.ts
src/services/merkle/verify.ts
src/services/graph/dependency.ts
src/services/graph/tombstone.ts
src/services/graph/influence.ts
src/app/api/merkle/commit/route.ts
src/app/api/merkle/verify/route.ts
src/components/integrity/MerkleProofDisplay.tsx
src/components/integrity/StateViolationAlert.tsx
```

### Phase 6 Files
```
tests/sybil-attack.test.ts
tests/vote-manipulation.test.ts
tests/quadratic-cost.test.ts
tests/merkle-tamper.test.ts
middleware.ts (rate limiting)
vercel.json
```

---

## 🔗 Dependencies Between Phases

```
Phase 1 ──────────────────────────────────────────┐
   │                                              │
   ▼                                              │
Phase 2 (needs DB models from Phase 1)            │
   │                                              │
   ▼                                              │
Phase 3 (needs auth from Phase 2)                 │
   │                                              │
   ▼                                              │
Phase 4 (needs scoring from Phase 3)              │
   │                                              │
   ▼                                              │
Phase 5 (needs rumors/votes from Phase 4)         │
   │                                              │
   ▼                                              │
Phase 6 (needs all modules complete) ◄────────────┘
```

Each phase builds on the previous one. Complete them in order for best results.
