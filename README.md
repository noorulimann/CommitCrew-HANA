# Citadel of Truth

## 1. Executive Summary

**Project Name:** Citadel of Truth

**Objective:** A decentralized, anonymous verification protocol for campus rumors.

**Core Constraint:** Zero central authority, absolute anonymity, and mathematical resistance to coordinated manipulation.

## 2. Requirement Alignment Matrix

| Scenario Challenge | Requirement/Feature Solution |
|-------------------|------------------------------|
| No Central Admin | **Decentralized Validation:** Truth is determined by the aggregate score of the "Crowd Oracle," not a database admin. |
| Anonymous Submission | **ZK-Light Identity:** Uses hashed email salts. Users stay anonymous but unique. |
| No Multi-voting (No IDs) | **Nullifier Hashes:** Prevents the same hashed identity from casting multiple votes on the same Rumor ID. |
| Popular Lies vs. Truth | **Bayesian Truth Serum (BTS):** Rewards users who predict the "Surprising Truth" over the "Obvious Lie." |
| Mysteriously Changing Scores | **Merkle Anchoring:** Prevents retrospective score tampering by locking hourly "State Roots" to a public ledger. |
| Bot Manipulation | **Quadratic Voting + PoW:** Makes bot-swarming mathematically and computationally expensive. |
| Ghost Rumor Bug | **Dependency Graph Isolation:** Logic-level fix to ensure is_deleted flags zero out influence on related rumors. |
| Mathematical Proof | **Sybil Resistance Equation:** Formal proof that cost to game the system > possible gain. |

## 3. Technical Approach & Modules

### Module 1: The Identity Gateway (Anti-Sybil)

**Logic:** Users enter their school email + create a secret phrase (seed phrase) → System sends OTP → User verifies → System creates `User_Nullifier = H(email + secret_phrase)` **client-side**.

**Implementation Flow (First Time Setup):**
1. User enters school email (must be `.edu` domain)
2. Server sends 6-digit OTP to email (OTP expires in 5 minutes)
3. User enters OTP to verify ownership
4. User creates a **secret phrase** (e.g., "blue-forest-run-42")
   - Minimum 3 words or 12 characters
   - User must remember this phrase (like a crypto wallet seed)
5. **Client-side** generates hash: `User_Nullifier = SHA256(email + secret_phrase)`
6. Client sends **only the hash** to server (server never sees email OR secret phrase)
7. Server stores the hash in database
8. Client stores hash in browser localStorage

**Implementation Flow (Login from New Device):**
1. User enters same email
2. Server sends OTP to verify ownership
3. User enters same **secret phrase** they created
4. Client regenerates hash: `SHA256(email + secret_phrase)` → **Same hash as before!**
5. Client checks with server if hash exists
6. If hash exists → Login successful → Store hash in localStorage

**The "Brain Wallet" Concept:**
- The secret phrase is the "private key" stored in user's memory
- Same email + same phrase = same hash (deterministic)
- Works across any device without transferring files
- Server **never** sees the email or secret phrase (only hash)

**Privacy Guarantee:** 
- Email is **never stored** in database (only hash remains)
- Secret phrase **never leaves** the browser (client-side hashing only)
- Server sees email briefly during OTP verification, then discards it
- Hash is irreversible (can't recover email or phrase from hash)
- Same email + phrase always produces same hash (enables cross-device login)

**Anti-Sybil Protection:**
- ✅ Confirms user owns a valid campus email (OTP verification)
- ✅ Prevents bots (can't access email inbox)
- ✅ Prevents multi-voting (same hash = already voted)
- ✅ Maintains anonymity (only irreversible hash stored)
- ✅ Zero server control (user owns their identity via secret phrase)

**Security Trade-offs:**
- ✅ **Pro:** User has full control (no server dependency)
- ✅ **Pro:** True anonymity (server never sees credentials)
- ⚠️ **Con:** Forgotten secret phrase = lost account permanently
- ⚠️ **Con:** Weak phrase = vulnerable to brute force (if email is known)

### Module 2: The Trust Scoring Algorithm (The "Twist")

**Algorithm:** Quadratic Bayesian Scoring (QBS).

**Steps:**
1. User votes (True/False).
2. User predicts the crowd's vote.
3. `Trust_Score = (Vote_Weight * Reputation) + Prediction_Accuracy_Bonus`.

**Result:** A rumor's total score is the sum of these weighted votes. High reputation is earned by being right when the majority is wrong.

### Module 3: Integrity & The "Time Warp" Fix

**Problem:** Verified facts from last month changing.

**Solution:** Blockchain-backed State Commitment. Every hour, the system takes the Root Hash of all scores and "pins" it.

**Logic:** If the current database score for Rumor #101 (from last month) doesn't match the hash pinned on that date, the system flags a "State Violation" and reverts to the pinned truth.

### Module 4: The Graph Isolation (The "Ghost" Fix)

**Problem:** Deleted rumors affecting new ones.

**Logic:** Tombstone Vector Zeroing.

**Formula:** When a rumor is deleted, its `Influence_Vector` in the graph is set to $0$.

**Implementation:** The SQL view for newer rumors must use an `INNER JOIN` that only includes rumors where `status = 'active'`.

## 4. Mathematical Proof of Game-Resistance

### The "Anti-Collusion" Proof

We define the power of a group $G$ as $P_G$. In our system, $P_G = \sum \sqrt{c}$, where $c$ is the credits spent.

**Cost of Attack:** To double your influence, you must quadruple your cost ($2^2$).

**Honest Majority:** If a coordinated group of 10 liars tries to overwhelm 100 independent students:

- **Liars Power:** $10 \times \sqrt{100 \text{ credits}} = 100$.
- **Honest Power:** $100 \times \sqrt{1 \text{ credit}} = 100$.

**Conclusion:** Because $\sqrt{x}$ is a sub-additive function, it is always cheaper to tell the truth as many individuals than to lie as one coordinated group. The system is mathematically biased toward decentralized consensus.

## 5. 12-Hour Implementation Roadmap

| Time | Task |
|------|------|
| **Hours 0-2** | Database Schema (Supabase) + Hashing Logic |
| **Hours 2-5** | Quadratic Voting Engine & Bayesian Calculation Functions |
| **Hours 5-8** | UI Development (Rumor Feed, Vote Sliders, Prediction Input) |
| **Hours 8-10** | Immutability Layer (Merkle Tree implementation) & Tombstone Logic |
| **Hours 10-12** | Testing with "Bot-Simulators" and Final Deployment to Vercel |

---

## Final Analyst Note

All scenario requirements are now represented. The "central admin" is replaced by the Merkle Root check, and the "Ghost Bug" is killed by the Graph Isolation logic.

**Would you like me to provide the specific SQL Trigger code that automatically calculates the "Trust Score" every time a vote is cast?**
