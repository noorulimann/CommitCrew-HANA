# Citadel of Truth - Architecture Documentation

## Project Structure Overview

```
CommitCrew/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes (Serverless Functions)
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   ├── rumors/          # Rumor CRUD operations
│   │   │   ├── votes/           # Voting & prediction endpoints
│   │   │   └── merkle/          # Merkle tree state commitments
│   │   ├── feed/                # Main rumor feed page
│   │   ├── login/               # Authentication page
│   │   ├── submit/              # Rumor submission page
│   │   ├── layout.tsx           # Root layout component
│   │   └── page.tsx             # Homepage
│   │
│   ├── components/              # React Components
│   │   ├── rumors/              # Rumor display components
│   │   ├── voting/              # Voting UI components
│   │   ├── auth/                # Authentication forms
│   │   └── ui/                  # Reusable UI elements
│   │
│   ├── services/                # Business Logic Layer
│   │   ├── identity/            # Module 1: Identity Gateway
│   │   ├── scoring/             # Module 2: Trust Scoring Algorithm
│   │   ├── merkle/              # Module 3: Integrity & Time Warp Fix
│   │   └── graph/               # Module 4: Graph Isolation
│   │
│   ├── lib/                     # Core Libraries & Configurations
│   │   ├── mongodb.ts           # MongoDB connection handler
│   │   ├── constants.ts         # Global constants
│   │   └── config.ts            # App configuration
│   │
│   ├── utils/                   # Utility Functions
│   │   ├── crypto/              # Cryptographic helpers
│   │   ├── validation/          # Input validation
│   │   └── math/                # Mathematical utilities
│   │
│   └── types/                   # TypeScript type definitions
│       ├── index.ts             # Global types
│       ├── rumor.ts             # Rumor-related types
│       ├── user.ts              # User-related types
│       └── vote.ts              # Vote-related types
│
├── database/                    # Database Layer
│   ├── schemas/                 # Mongoose models & schemas
│   │   ├── User.ts             # User model with reputation
│   │   ├── OTP.ts              # OTP verification model
│   │   ├── Rumor.ts            # Rumor model with status
│   │   ├── Vote.ts             # Vote model with trust calculation
│   │   ├── MerkleCommitment.ts # Immutability layer
│   │   ├── RumorDependency.ts  # Graph relationships
│   │   └── index.ts            # Export all models
│   ├── functions/               # Database utility functions
│   │   └── index.ts            # Helper functions (replaces SQL)
│   └── README.md                # MongoDB setup guide
│
├── public/                      # Static assets
│   ├── images/
│   └── icons/
│
├── .env.local                   # Environment variables (not in git)
├── .env.example                 # Example environment file
├── .gitignore                   # Git ignore rules
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── README.md                    # Project overview
└── ARCHITECTURE.md              # This file

```

## Module Mapping

### Module 1: Identity Gateway (Anti-Sybil)
- **Location:** `src/services/identity/`
- **Files:**
  - `nullifier.ts` - User nullifier hash generation
  - `otp.ts` - Email OTP verification
  - `brain-wallet.ts` - Secret phrase management
- **API Endpoints:** `src/app/api/auth/`
  - `send-otp/route.ts` - Send OTP to email
  - `verify-otp/route.ts` - Verify OTP code
  - `generate-nullifier/route.ts` - Create user hash
  - `login/route.ts` - Login with secret phrase

### Module 2: Trust Scoring Algorithm (QBS)
- **Location:** `src/services/scoring/`
- **Files:**
  - `quadratic.ts` - Quadratic voting calculations
  - `bayesian.ts` - Bayesian Truth Serum logic
  - `reputation.ts` - User reputation tracking
- **Database:** `database/schemas/`
  - `User.ts` - User model with reputation tracking
  - `OTP.ts` - Email verification codes (TTL indexed)
  - `Vote.ts` - Voting logic with Mongoose middleware
  - `Rumor.ts` - Rumor model with status management

### Module 3: Integrity & Time Warp Fix
- **Location:** `src/services/merkle/`
- **Files:**
  - `tree.ts` - Merkle tree construction
  - `anchor.ts` - State commitment anchoring
  - `verify.ts` - State verification
- **API Endpoints:** `src/app/api/merkle/`
  - `commit/route.ts` - Hourly state commitment
  - `verify/route.ts` - Verify historical state

### Module 4: Graph Isolation (Ghost Fix)
- **Location:** `src/services/graph/`
- **Files:**schemas/`
  - `MerkleCommitment.ts` - State snapshot storage
  - `Rumor.ts` - Post-save hook for verification
  - `dependency.ts` - Rumor dependency graph
  - `tombstone.ts` - Deleted rumor handling
  - `influence.ts` - Influence vector calculations
- **Database:** `database/triggers/zero_deleted_influence.sql`

## Data Flow

### 1. User Registration Flow
```
User Input (Email + Secret Phrase) 
  → Client-side Hash Generation 
  → OTP Request API 
  → Email Service 
  → OTP Verification API 
  → Store Nullifier Hash in DB 
  → Store Hash in localStorage
```

### 2. Voting Flow
```
User Vote (True/False + Prediction + Credits)
  → Vote API
  → Quadratic Weight Calculation
  → Reputation Lookup
  → Bayesian Score Calculation
  → Database Update
  → Trigger: Recalculate Rumor Score
  → Update Merkle Tree
```

### 3. Integrity Check Flow
```
User Views Old Rumor
  → Fetch Current Score
  → Fetch Merkle Root (Historical)
  → Recalculate Hash
  → Compare Hashes
  → Flag Discrepancy or Display Score
```

## Security Principles

1. **Zero Knowledge:** Server never sees email or secret phrase
2. **Client-Side Cryptography:** All hashing happens in browser
3. **Immutable History:** Merkle roots prevent retroactive tampering
4. **Sybil Resistance:** Email verification + computational cost
5. **Anonymity:** Only irreversible hashes stored

## Technology Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Next.js API Routes (Serverless)
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** NextAuth.js
- **Cryptography:** Web Crypto API, SHA-256, bcryptjs
- **Deployment:** Vercel
- **Email:** Nodemailer (SMTP)

## Development Phases

### Phase 1: Foundation (Hours 0-2)
- Database schema setup (MongoDB + Mongoose)
- MongoDB connection configuration
- Basic Next.js structure

### Phase 2: Core Logic (Hours 2-5)
- Identity Gateway implementation
- Quadratic voting engine
- Bayesian calculations

### Phase 3: UI Development (Hours 5-8)
- Rumor feed interface
- Voting components
- Authentication forms

### Phase 4: Integrity Layer (Hours 8-10)
- Merkle tree implementation
- Tombstone logic
- State verification

### Phase 5: Testing & Deployment (Hours 10-12)
- Bot simulation testing
- Performance optimization
- Vercel deployment

## Key Algorithms

### Quadratic Voting Cost
```
Cost = Credits²
Influence = √Credits
```

### Bayesian Truth Serum Score
```
Trust_Score = (Vote_Weight × Reputation) + Prediction_Accuracy_Bonus
```

### Sybil Resistance
```
P_Group = Σ √c (where c = credits spent)
To double influence → quadruple cost (2² = 4)
```

## Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/citadel-of-truth
# For production: mongodb+srv://user:pass@cluster.mongodb.net/citadel-of-truth

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
MERKLE_COMMIT_INTERVAL=3600000  # 1 hour in ms
```
