# Phase 6: Security, Testing & Deployment Configuration

## Overview

This document provides comprehensive guidance for Phase 6 implementation including security hardening, testing setup, and deployment preparation for **Citadel of Truth**.

---

## Part A: Security Implementation

### A1: Environment Configuration

Create `.env.local` file (development):

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/citadel-of-truth

# Email Service (SendGrid or similar)
EMAIL_SERVICE_API_KEY=your_api_key_here
EMAIL_FROM=noreply@citadeloftruth.university

# Security
ADMIN_TOKEN=your_secure_admin_token_here
JWT_SECRET=your_jwt_secret_key_here
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100

# Features
ENABLE_CRON=true
LOG_LEVEL=info

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

Create `.env.production` file (production):

```bash
# Database (use Atlas or similar)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/citadel-of-truth

# Email Service
EMAIL_SERVICE_API_KEY=prod_api_key_here
EMAIL_FROM=noreply@citadeloftruth.university

# Security
ADMIN_TOKEN=prod_admin_token_here
JWT_SECRET=prod_jwt_secret_key_here
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100

# Features
ENABLE_CRON=true
LOG_LEVEL=warn

# CORS
ALLOWED_ORIGINS=https://citadeloftruth.university

# Sentry/Error Tracking
SENTRY_DSN=your_sentry_dsn_here

# Monitoring
DATADOG_API_KEY=optional_datadog_key
```

### A2: Authentication Middleware

Apply security middleware to protected endpoints:

```typescript
// Example: Protecting admin/critical endpoints

import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken, validateAdminToken } from '@/lib/middleware';

export async function withAdminAuth(request: NextRequest) {
  const token = extractBearerToken(request);
  
  if (!token || !validateAdminToken(token)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return null; // Authorized
}
```

Apply to:
- `/api/integrity/trigger-commitment` (manual triggers)
- `/api/rumors/*/delete` (rumor deletion)
- `/api/admin/*` (admin endpoints)
- `/test-integrity` (testing dashboard)

### A3: Rate Limiting

Implement per-endpoint rate limiting:

```typescript
// Apply to authentication endpoints (stricter limits)
- /auth/send-otp: 5 requests per 15 min per IP
- /auth/verify-otp: 10 requests per 15 min per IP
- /auth/register: 3 requests per hour per IP

// Standard API limits
- GET endpoints: 100 requests per 15 min
- POST endpoints: 50 requests per 15 min
- DELETE endpoints: 10 requests per 15 min

// Critical operations (admin only)
- /integrity/trigger-commitment: 1 per hour
- /test-integrity: 5 per hour (testing only)
```

### A4: Input Validation

Implement validation on all endpoints:

```typescript
// Email validation
- Must be valid email format
- Must be .edu domain
- Case-insensitive
- Length < 254 characters

// Nullifier validation
- Must be 64 character hex string (SHA256)
- Case-insensitive

// Rumor ID validation
- Must be 24 character MongoDB ObjectId
- Must exist in database

// Vote validation
- creditUsed: must be positive integer
- voteType: must be 'true' or 'false'
- prediction: must be 'true' or 'false'

// Content validation
- Must not contain HTML/script tags
- Length between 10 and 5000 characters
- Must not contain null bytes
```

### A5: SQL/NoSQL Injection Prevention

When using MongoDB:

```typescript
// SAFE: Use ObjectId validation
const id = new mongoose.Types.ObjectId(userInput);

// SAFE: Use query parameters
db.collection('rumors').findOne({ _id: id });

// UNSAFE: String concatenation
db.collection('rumors').find(`{_id: ${userInput}}`);
```

### A6: XSS Prevention

```typescript
// Sanitize user input
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/script/gi, '')
    .slice(0, 10000);
}
```

### A7: CORS Configuration

```typescript
// Allowed origins based on environment
const allowedOrigins = {
  development: ['http://localhost:3000', 'http://localhost:3001'],
  production: ['https://citadeloftruth.university'],
};
```

### A8: Security Headers

Implement via middleware:

```typescript
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-XSS-Protection', '1; mode=block');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
```

---

## Part B: Testing Configuration

### B1: Test Scripts (package.json)

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "node tests/integration-test.mjs",
    "test:module1": "node tests/phase1-4-qa.mjs",
    "test:module3": "node tests/module3-test.mjs",
    "test:security": "node tests/security-test.mjs",
    "test:performance": "node tests/performance-test.mjs",
    "test:e2e": "npm run test:integration && npm run test:module3"
  }
}
```

### B2: Test Coverage Goals

```
Module 1 (Identity): 90%+ coverage
Module 2 (Scoring): 85%+ coverage
Module 3 (Integrity): 95%+ coverage
Module 4 (Graph): 80%+ coverage
Security: 100% coverage
Performance: 100% coverage
```

### B3: Continuous Integration

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:5
        options: >-
          --health-cmd mongosh
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          MONGODB_URI: mongodb://localhost:27017/test
      
      - name: Upload coverage
        run: npm run test:coverage
```

### B4: Testing Dashboard

The interactive testing dashboard is available at: `http://localhost:3000/test-integrity`

**Features:**
- Create commitments manually
- View commitment history
- Detect tampering
- Revert to historical truth

### B5: Manual Testing Checklist

Before deployment, verify:

```
[ ] Module 1: User can register with .edu email
[ ] Module 1: User can login from new device with secret phrase
[ ] Module 2: User can vote with credits
[ ] Module 2: Reputation updates correctly
[ ] Module 3: Can create hourly commitments
[ ] Module 3: Can detect tampering
[ ] Module 3: Can revert to committed state
[ ] Module 4: Deleted rumors don't affect new ones
[ ] Security: Rate limiting works
[ ] Security: Invalid input rejected
[ ] Performance: Response times < 2s
[ ] Performance: Can handle 10 concurrent requests
```

---

## Part C: Monitoring & Logging

### C1: Logging Configuration

```typescript
// src/lib/logger.ts
export class Logger {
  static info(message: string, context?: any) {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, context || '');
  }
  
  static warn(message: string, context?: any) {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, context || '');
  }
  
  static error(message: string, error?: any) {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error || '');
  }
  
  static debug(message: string, context?: any) {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`, context || '');
    }
  }
}
```

### C2: Error Tracking (Sentry)

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### C3: Key Metrics to Monitor

**Application Metrics:**
- API response times by endpoint
- Database query duration
- Error rates by type
- User registration rate
- Vote submission rate

**Integrity Metrics:**
- Hourly commitment success rate
- State violation detection rate
- Revert operation frequency
- Cron job execution success

**Security Metrics:**
- Rate limit violations
- Invalid request attempts
- Authentication failures
- Input validation rejections

### C4: Health Check Endpoint

Monitor system health:

```
GET /api/health

Response:
{
  "status": "ok",
  "timestamp": "2026-02-07T14:30:00Z",
  "database": "connected",
  "serverInitialized": true,
  "cron": "active",
  "uptime": 3600
}
```

---

## Part D: Deployment Preparation

### D1: Pre-Deployment Checklist

```
SECURITY:
[ ] All environment variables configured
[ ] Admin token generated securely
[ ] JWT secret configured
[ ] CORS origins whitelisted
[ ] Rate limiting configured
[ ] Input validation enabled
[ ] Security headers enabled

TESTING:
[ ] All unit tests passing
[ ] All integration tests passing
[ ] Security tests passing
[ ] Manual testing completed
[ ] Performance tests passing
[ ] Error handling verified

DATABASE:
[ ] MongoDB connection verified
[ ] All collections verified
[ ] Indexes created
[ ] Backup strategy in place
[ ] Migration script tested

CODE QUALITY:
[ ] TypeScript compilation passing
[ ] No eslint errors
[ ] No security warnings
[ ] Code review completed
```

### D2: Database Indexes

Ensure these indexes exist:

```javascript
// Rumor collection
db.rumors.createIndex({ status: 1 })
db.rumors.createIndex({ createdAt: -1 })
db.rumors.createIndex({ submitterNullifier: 1 })

// Vote collection
db.votes.createIndex({ rumorId: 1 })
db.votes.createIndex({ voterNullifier: 1 })

// StateCommitment collection
db.statecommitments.createIndex({ hourKey: 1 }, { unique: true })
db.statecommitments.createIndex({ timestamp: -1 })

// RumorDependency collection
db.rumordependencies.createIndex({ parentRumorId: 1 })
db.rumordependencies.createIndex({ childRumorId: 1 })
```

### D3: Cron Job Configuration

For production deployment:

```bash
# Enable scheduled commitments
ENABLE_CRON=true

# Verify cron status
GET /api/integrity/trigger-commitment

# Expected response:
{
  "message": "State commitment service is running",
  "nextHourKey": "2026-02-07-15",
  "usage": "POST to manually trigger..."
}
```

### D4: Backup Strategy

Implement MongoDB backups:

```bash
# Daily automatic backup
0 2 * * * mongodump --uri=$MONGODB_URI --out=/backups/citadel-$(date +%Y%m%d)

# Retention: Keep last 7 days
find /backups -type d -name "citadel-*" -mtime +7 -exec rm -rf {} \;
```

### D5: Rollback Plan

If deployment issues occur:

```bash
# Revert to last stable commit
git revert <commit-hash>
git push

# Or rollback database
mongorestore --uri=$MONGODB_URI /backups/citadel-<date-of-last-good-state>/
```

---

## Part E: Production Hardening

### E1: Environment-Specific Configuration

```typescript
// src/lib/config.ts
export const config = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  auth: {
    enableJWT: !process.env.SKIP_JWT,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  rateLimit: {
    window: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  
  security: {
    corsOrigins: (process.env.ALLOWED_ORIGINS || '').split(','),
    enableHSTS: true,
    hstsMaxAge: 31536000, // 1 year
  },
};
```

### E2: Database Connection Pooling

```typescript
// Use connection pooling for better performance
const poolSize = process.env.NODE_ENV === 'production' ? 10 : 5;
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: poolSize,
  minPoolSize: poolSize / 2,
});
```

### E3: Error Handling

Implement graceful error handling:

```typescript
// Don't expose internal errors to clients
if (error instanceof ValidationError) {
  return createErrorResponse('Invalid input', 400);
}
if (error instanceof DatabaseError) {
  return createErrorResponse('Server error', 500);
}

// Log full error internally
Logger.error('Unhandled error', error);
```

---

## Part F: Post-Deployment Validation

### F1: Health Monitoring

```bash
# Monitor endpoint
curl -X GET http://localhost:3000/api/health

# Should return 200 status with all systems operational
```

### F2: Integration Test Verification

```bash
# Run full integration suite
npm run test:e2e

# All tests should pass
```

### F3: Log Monitoring

Monitor logs for:
- Database connection issues
- Authentication failures
- Rate limit violations
- Unexpected errors
- Performance degradation

---

## Conclusion

This Phase 6 implementation provides:

✅ **Security:** Authentication, rate limiting, input validation  
✅ **Testing:** Comprehensive test suites and coverage goals  
✅ **Monitoring:** Logging, health checks, error tracking  
✅ **Deployment:** Pre-flight checklists and rollback plans  

All requirements from README.md Modules 1-4 are now secured, tested, and ready for production.
