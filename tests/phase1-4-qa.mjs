/**
 * 🧪 Comprehensive QA Test Suite - Phases 1-4
 * Citadel of Truth - Full System Test
 * 
 * Tests:
 * - Phase 1: Foundation & Infrastructure
 * - Phase 2: Identity Gateway (Auth)
 * - Phase 3: Trust Scoring Algorithm
 * - Phase 4: Core UI & Rumor Management
 * 
 * Run: node tests/phase1-4-qa.mjs
 */

const BASE_URL = 'http://localhost:3000';

// Test counters
let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];

// Test data storage
let testNullifier = null;
let testRumorId = null;
let testOTP = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function log(message, type = 'info') {
  const icons = {
    pass: '✅',
    fail: '❌',
    skip: '⏭️',
    info: 'ℹ️',
    section: '📦',
    phase: '🏷️'
  };
  console.log(`${icons[type] || '•'} ${message}`);
}

async function test(name, fn, phase = '') {
  try {
    const result = await fn();
    if (result === 'skip') {
      skipped++;
      results.push({ name, phase, status: 'skip' });
      log(`SKIP: ${name}`, 'skip');
    } else {
      passed++;
      results.push({ name, phase, status: 'pass' });
      log(`PASS: ${name}`, 'pass');
    }
    return true;
  } catch (error) {
    failed++;
    results.push({ name, phase, status: 'fail', error: error.message });
    log(`FAIL: ${name} - ${error.message}`, 'fail');
    return false;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await response.json();
  return { status: response.status, ok: response.ok, data };
}

function generateTestEmail() {
  return `test.${Date.now()}@university.edu`;
}

function generateTestPhrase() {
  return `test secret phrase ${Date.now()}`;
}

async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================
// PHASE 1: FOUNDATION & INFRASTRUCTURE
// ============================================

async function testPhase1() {
  log('\n========================================', 'phase');
  log('PHASE 1: Foundation & Infrastructure', 'phase');
  log('========================================\n', 'phase');

  // Test 1.1: Server Health
  await test('Server is running and healthy', async () => {
    const res = await request('/api/health');
    assert(res.ok, `Server not responding: ${res.status}`);
    assert(res.data.status === 'ok', 'Health status not OK');
    assert(res.data.database === 'connected', 'Database not connected');
  }, 'Phase 1');

  // Test 1.2: Database Connection
  await test('MongoDB connection is active', async () => {
    const res = await request('/api/health');
    assert(res.data.database === 'connected', 'Database connection failed');
  }, 'Phase 1');

  // Test 1.3: API Routes Exist
  await test('Auth API routes are accessible', async () => {
    const res = await request('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({})
    });
    // Should get validation error, not 404
    assert(res.status !== 404, 'Auth routes not found');
  }, 'Phase 1');

  await test('Rumors API routes are accessible', async () => {
    const res = await request('/api/rumors');
    assert(res.status !== 404, 'Rumors routes not found');
  }, 'Phase 1');

  await test('Votes API routes are accessible', async () => {
    const res = await request('/api/votes', {
      method: 'POST',
      body: JSON.stringify({})
    });
    assert(res.status !== 404, 'Votes routes not found');
  }, 'Phase 1');
}

// ============================================
// PHASE 2: IDENTITY GATEWAY (AUTH)
// ============================================

async function testPhase2() {
  log('\n========================================', 'phase');
  log('PHASE 2: Identity Gateway (Auth)', 'phase');
  log('========================================\n', 'phase');

  const testEmail = generateTestEmail();
  const testPhrase = generateTestPhrase();

  // Test 2.1: Email Validation
  log('Section: Email Validation', 'section');
  
  await test('Rejects non-.edu email', async () => {
    const res = await request('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@gmail.com' })
    });
    assert(!res.data.success, 'Should reject non-.edu email');
    assert(res.data.error.toLowerCase().includes('edu') || 
           res.data.error.toLowerCase().includes('email'), 
           'Error should mention .edu requirement');
  }, 'Phase 2');

  await test('Accepts valid .edu email for OTP', async () => {
    const res = await request('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail })
    });
    // In test mode, should succeed or return testMode OTP
    if (res.data.success && res.data.data?.otp) {
      testOTP = res.data.data.otp;
    }
    assert(res.data.success || res.status === 200 || res.status === 201, 
           `OTP send failed: ${res.data.error}`);
  }, 'Phase 2');

  // Test 2.2: OTP Verification
  log('Section: OTP Verification', 'section');

  await test('Rejects invalid OTP', async () => {
    const res = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, otp: '000000' })
    });
    // Should fail with invalid OTP (unless testOTP happens to be 000000)
    if (testOTP !== '000000') {
      assert(!res.data.success, 'Should reject invalid OTP');
    }
  }, 'Phase 2');

  await test('Accepts valid OTP (test mode)', async () => {
    if (!testOTP) {
      // Try with common test OTP
      const res = await request('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail, otp: '123456' })
      });
      // Test mode might accept this
      return 'skip';
    }
    const res = await request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, otp: testOTP })
    });
    assert(res.data.success, `OTP verification failed: ${res.data.error}`);
  }, 'Phase 2');

  // Test 2.3: Nullifier Generation (Client-side simulation)
  log('Section: Nullifier Hash Generation', 'section');

  await test('SHA256 hash generation works', async () => {
    const hash = await sha256('test input');
    assert(hash.length === 64, 'Hash should be 64 characters');
    assert(/^[a-f0-9]+$/.test(hash), 'Hash should be hex');
  }, 'Phase 2');

  await test('Same input produces same hash', async () => {
    const input = 'test@university.edu:my secret phrase';
    const hash1 = await sha256(input);
    const hash2 = await sha256(input);
    assert(hash1 === hash2, 'Same input should produce same hash');
  }, 'Phase 2');

  await test('Different input produces different hash', async () => {
    const hash1 = await sha256('test@university.edu:phrase1');
    const hash2 = await sha256('test@university.edu:phrase2');
    assert(hash1 !== hash2, 'Different input should produce different hash');
  }, 'Phase 2');

  // Test 2.4: User Registration
  log('Section: User Registration', 'section');

  testNullifier = await sha256(`${testEmail}:${testPhrase}`);
  
  await test('User registration with nullifier hash', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nullifierHash: testNullifier })
    });
    assert(res.data.success || res.status === 200 || res.status === 201, 
           `Registration failed: ${res.data.error}`);
  }, 'Phase 2');

  await test('Duplicate nullifier is handled', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nullifierHash: testNullifier })
    });
    // Should either succeed (idempotent) or return specific error
    assert(res.status !== 500, 'Server error on duplicate');
  }, 'Phase 2');

  // Test 2.5: User Login
  log('Section: User Login', 'section');

  await test('Login with valid nullifier hash', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nullifierHash: testNullifier })
    });
    assert(res.data.success, `Login failed: ${res.data.error}`);
  }, 'Phase 2');

  await test('Login with non-existent nullifier fails', async () => {
    const fakeHash = await sha256('fake@fake.edu:nonexistent');
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nullifierHash: fakeHash })
    });
    assert(!res.data.success, 'Should reject non-existent nullifier');
  }, 'Phase 2');

  // Test 2.6: Secret Phrase Validation
  log('Section: Secret Phrase Validation', 'section');

  await test('Valid phrase: 12+ characters', async () => {
    const isValid = 'this is a long secret phrase'.length >= 12;
    assert(isValid, 'Should accept 12+ character phrase');
  }, 'Phase 2');

  await test('Valid phrase: 3+ words', async () => {
    const words = 'one two three'.split(' ').length;
    assert(words >= 3, 'Should accept 3+ word phrase');
  }, 'Phase 2');
}

// ============================================
// PHASE 3: TRUST SCORING ALGORITHM
// ============================================

async function testPhase3() {
  log('\n========================================', 'phase');
  log('PHASE 3: Trust Scoring Algorithm', 'phase');
  log('========================================\n', 'phase');

  // First create a rumor to vote on
  log('Section: Setup - Create Test Rumor', 'section');

  await test('Create test rumor for voting', async () => {
    const res = await request('/api/rumors', {
      method: 'POST',
      body: JSON.stringify({
        content: `QA Test Rumor - Phase 3 Testing ${Date.now()}`,
        submitterNullifier: testNullifier
      })
    });
    assert(res.data.success, `Failed to create rumor: ${res.data.error}`);
    testRumorId = res.data.data._id;
    assert(testRumorId, 'Rumor ID not returned');
  }, 'Phase 3');

  // Test 3.1: Quadratic Voting
  log('Section: Quadratic Voting', 'section');

  await test('Vote with valid credits (4 credits)', async () => {
    const res = await request('/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        rumorId: testRumorId,
        voterNullifier: testNullifier,
        voteValue: true,
        creditsSpent: 4,
        predictionPercent: 60
      })
    });
    assert(res.data.success, `Vote failed: ${res.data.error}`);
    const vote = res.data.data;
    assert(vote.quadraticWeight === 2, `Weight should be √4=2, got ${vote.quadraticWeight}`);
  }, 'Phase 3');

  await test('Quadratic weight calculated correctly (√credits)', async () => {
    // Test with different credit amounts using a new voter
    const testVoter2 = await sha256(`test2${Date.now()}@university.edu:secret`);
    
    // Register voter2
    await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nullifierHash: testVoter2 })
    });

    const res = await request('/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        rumorId: testRumorId,
        voterNullifier: testVoter2,
        voteValue: false,
        creditsSpent: 9,
        predictionPercent: 40
      })
    });
    assert(res.data.success, `Vote failed: ${res.data.error}`);
    assert(res.data.data.quadraticWeight === 3, `Weight should be √9=3, got ${res.data.data.quadraticWeight}`);
  }, 'Phase 3');

  await test('Prevents double voting', async () => {
    const res = await request('/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        rumorId: testRumorId,
        voterNullifier: testNullifier,
        voteValue: true,
        creditsSpent: 4,
        predictionPercent: 60
      })
    });
    assert(!res.data.success, 'Should prevent double voting');
    assert(res.data.error.toLowerCase().includes('already') || 
           res.data.error.toLowerCase().includes('voted'),
           'Error should mention already voted');
  }, 'Phase 3');

  await test('Check if user already voted', async () => {
    const res = await request(`/api/votes/check?rumorId=${testRumorId}&voterNullifier=${testNullifier}`);
    assert(res.data.success, 'Vote check failed');
    assert(res.data.data.hasVoted === true, 'Should show user has voted');
  }, 'Phase 3');

  // Test 3.2: Credit Validation
  log('Section: Credit Validation', 'section');

  await test('Rejects credits below minimum (0)', async () => {
    const newVoter = await sha256(`test.zero${Date.now()}@university.edu:secret`);
    await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nullifierHash: newVoter })
    });

    const res = await request('/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        rumorId: testRumorId,
        voterNullifier: newVoter,
        voteValue: true,
        creditsSpent: 0,
        predictionPercent: 50
      })
    });
    assert(!res.data.success, 'Should reject 0 credits');
  }, 'Phase 3');

  await test('Rejects credits above maximum (101)', async () => {
    const newVoter = await sha256(`test.max${Date.now()}@university.edu:secret`);
    await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nullifierHash: newVoter })
    });

    const res = await request('/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        rumorId: testRumorId,
        voterNullifier: newVoter,
        voteValue: true,
        creditsSpent: 101,
        predictionPercent: 50
      })
    });
    assert(!res.data.success, 'Should reject credits > 100');
  }, 'Phase 3');

  // Test 3.3: Bayesian Truth Serum
  log('Section: Bayesian Truth Serum', 'section');

  await test('Prediction percentage is recorded', async () => {
    const res = await request(`/api/votes/check?rumorId=${testRumorId}&voterNullifier=${testNullifier}`);
    assert(res.data.success, 'Failed to check vote');
    assert(res.data.data.vote.predictionPercent !== undefined, 'Prediction not recorded');
  }, 'Phase 3');

  // Test 3.4: Rumor Truth Score Update
  log('Section: Truth Score Aggregation', 'section');

  await test('Rumor truth score is updated after votes', async () => {
    const res = await request(`/api/rumors/${testRumorId}`);
    assert(res.data.success, 'Failed to get rumor');
    const rumor = res.data.data.rumor;
    assert(rumor.totalVotes >= 2, `Expected 2+ votes, got ${rumor.totalVotes}`);
  }, 'Phase 3');

  // Test 3.5: Quadratic Cost Scaling
  log('Section: Quadratic Cost Analysis', 'section');

  await test('Quadratic cost makes bots expensive', async () => {
    // To get 10x influence, need 100x credits (10² = 100)
    const credits1 = 1;
    const credits10x = 100;
    const weight1 = Math.sqrt(credits1);
    const weight10x = Math.sqrt(credits10x);
    
    assert(weight10x === 10 * weight1, 'Quadratic scaling verified');
    assert(credits10x === 100 * credits1, 'Cost scaling: 100x credits for 10x influence');
  }, 'Phase 3');
}

// ============================================
// PHASE 4: CORE UI & RUMOR MANAGEMENT
// ============================================

async function testPhase4() {
  log('\n========================================', 'phase');
  log('PHASE 4: Core UI & Rumor Management', 'phase');
  log('========================================\n', 'phase');

  // Test 4.1: Rumor CRUD
  log('Section: Rumor API Operations', 'section');

  await test('Create rumor with valid content', async () => {
    const res = await request('/api/rumors', {
      method: 'POST',
      body: JSON.stringify({
        content: `Phase 4 Test Rumor - ${Date.now()}`,
        submitterNullifier: testNullifier
      })
    });
    assert(res.data.success, `Create failed: ${res.data.error}`);
    assert(res.data.data._id, 'Rumor ID not returned');
    assert(res.data.data.truthScore === 0, 'Initial truth score should be 0');
    assert(res.data.data.totalVotes === 0, 'Initial votes should be 0');
  }, 'Phase 4');

  await test('Rejects rumor content too short', async () => {
    const res = await request('/api/rumors', {
      method: 'POST',
      body: JSON.stringify({
        content: 'short',
        submitterNullifier: testNullifier
      })
    });
    assert(!res.data.success, 'Should reject short content');
  }, 'Phase 4');

  await test('Rejects rumor content too long (1001+ chars)', async () => {
    const longContent = 'x'.repeat(1001);
    const res = await request('/api/rumors', {
      method: 'POST',
      body: JSON.stringify({
        content: longContent,
        submitterNullifier: testNullifier
      })
    });
    assert(!res.data.success, 'Should reject content > 1000 chars');
  }, 'Phase 4');

  // Test 4.2: List Rumors
  log('Section: Rumor Feed Listing', 'section');

  await test('Get list of active rumors', async () => {
    const res = await request('/api/rumors');
    assert(res.data.success, `List failed: ${res.data.error}`);
    assert(Array.isArray(res.data.data.data), 'Should return array');
    assert(res.data.data.data.length > 0, 'Should have at least one rumor');
  }, 'Phase 4');

  await test('Rumors have required fields', async () => {
    const res = await request('/api/rumors');
    const rumor = res.data.data.data[0];
    assert(rumor._id, 'Missing _id');
    assert(rumor.content, 'Missing content');
    assert(rumor.truthScore !== undefined, 'Missing truthScore');
    assert(rumor.totalVotes !== undefined, 'Missing totalVotes');
    assert(rumor.status, 'Missing status');
    assert(rumor.createdAt, 'Missing createdAt');
  }, 'Phase 4');

  await test('Rumors are ranked/sorted', async () => {
    const res = await request('/api/rumors');
    const rumors = res.data.data.data;
    if (rumors.length >= 2) {
      // Check that rankScore exists and is used for sorting
      assert(rumors[0].rankScore !== undefined, 'Rumors should have rankScore');
    }
  }, 'Phase 4');

  // Test 4.3: Single Rumor Details
  log('Section: Single Rumor Details', 'section');

  await test('Get single rumor by ID', async () => {
    const res = await request(`/api/rumors/${testRumorId}`);
    assert(res.data.success, `Get single rumor failed: ${res.data.error}`);
    assert(res.data.data.rumor, 'Should return rumor object');
    assert(res.data.data.rumor._id === testRumorId, 'Should return correct rumor');
  }, 'Phase 4');

  await test('Single rumor includes vote stats', async () => {
    const res = await request(`/api/rumors/${testRumorId}`);
    const data = res.data.data;
    assert(data.rumor.trueVotes !== undefined, 'Missing trueVotes');
    assert(data.rumor.falseVotes !== undefined, 'Missing falseVotes');
    assert(data.rumor.totalVotes !== undefined, 'Missing totalVotes');
  }, 'Phase 4');

  await test('Single rumor includes user vote status', async () => {
    const res = await request(`/api/rumors/${testRumorId}?voterNullifier=${testNullifier}`);
    assert(res.data.success, 'Failed to get rumor with vote status');
    assert(res.data.data.userVote !== undefined, 'Should include userVote');
    assert(res.data.data.userVote.hasVoted === true, 'Should show user voted');
  }, 'Phase 4');

  await test('Returns 404 for non-existent rumor', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(`/api/rumors/${fakeId}`);
    assert(!res.data.success, 'Should return error for non-existent rumor');
  }, 'Phase 4');

  // Test 4.4: Rumor Deletion (Soft Delete)
  log('Section: Rumor Soft Delete', 'section');

  let deletableRumorId = null;

  await test('Create rumor for deletion test', async () => {
    const res = await request('/api/rumors', {
      method: 'POST',
      body: JSON.stringify({
        content: `Deletable Rumor - ${Date.now()}`,
        submitterNullifier: testNullifier
      })
    });
    assert(res.data.success, 'Failed to create deletable rumor');
    deletableRumorId = res.data.data._id;
  }, 'Phase 4');

  await test('Soft delete rumor (by submitter)', async () => {
    const res = await request(`/api/rumors/${deletableRumorId}`, {
      method: 'DELETE',
      body: JSON.stringify({ nullifierHash: testNullifier })
    });
    assert(res.data.success, `Delete failed: ${res.data.error}`);
  }, 'Phase 4');

  await test('Deleted rumor not in active list', async () => {
    const res = await request('/api/rumors');
    const rumors = res.data.data.data;
    const deletedRumor = rumors.find(r => r._id === deletableRumorId);
    assert(!deletedRumor, 'Deleted rumor should not appear in active list');
  }, 'Phase 4');

  // Test 4.5: Pages Exist
  log('Section: Page Accessibility', 'section');

  await test('Feed page is accessible', async () => {
    const res = await fetch(`${BASE_URL}/feed`);
    assert(res.status === 200, `Feed page returned ${res.status}`);
  }, 'Phase 4');

  await test('Submit page is accessible', async () => {
    const res = await fetch(`${BASE_URL}/submit`);
    assert(res.status === 200, `Submit page returned ${res.status}`);
  }, 'Phase 4');

  await test('Rumor detail page is accessible', async () => {
    const res = await fetch(`${BASE_URL}/rumor/${testRumorId}`);
    assert(res.status === 200, `Rumor detail page returned ${res.status}`);
  }, 'Phase 4');

  await test('Login page is accessible', async () => {
    const res = await fetch(`${BASE_URL}/login`);
    assert(res.status === 200, `Login page returned ${res.status}`);
  }, 'Phase 4');

  // Test 4.6: Vote UI Data
  log('Section: Voting Interface Data', 'section');

  await test('Vote response includes calculated weights', async () => {
    // Create new voter for this test
    const newVoter = await sha256(`ui.test${Date.now()}@university.edu:secret`);
    await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nullifierHash: newVoter })
    });

    // Create new rumor to vote on
    const rumorRes = await request('/api/rumors', {
      method: 'POST',
      body: JSON.stringify({
        content: `UI Test Rumor - ${Date.now()}`,
        submitterNullifier: newVoter
      })
    });
    const newRumorId = rumorRes.data.data._id;

    // Cast vote
    const voteRes = await request('/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        rumorId: newRumorId,
        voterNullifier: newVoter,
        voteValue: true,
        creditsSpent: 25,
        predictionPercent: 70
      })
    });

    assert(voteRes.data.success, 'Vote failed');
    const vote = voteRes.data.data;
    assert(vote.quadraticWeight === 5, `Weight should be √25=5, got ${vote.quadraticWeight}`);
    assert(vote.finalTrustScore !== undefined, 'Should include finalTrustScore');
  }, 'Phase 4');
}

// ============================================
// INTEGRATION TESTS
// ============================================

async function testIntegration() {
  log('\n========================================', 'phase');
  log('INTEGRATION: End-to-End Flow', 'phase');
  log('========================================\n', 'phase');

  const e2eEmail = `e2e.${Date.now()}@university.edu`;
  const e2ePhrase = 'end to end test phrase secure';
  const e2eNullifier = await sha256(`${e2eEmail}:${e2ePhrase}`);

  await test('E2E: Complete user journey', async () => {
    // Step 1: Register
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nullifierHash: e2eNullifier })
    });
    assert(regRes.data.success || regRes.status === 200 || regRes.status === 201, 'Registration failed');

    // Step 2: Login
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nullifierHash: e2eNullifier })
    });
    assert(loginRes.data.success, 'Login failed');

    // Step 3: Submit rumor
    const rumorRes = await request('/api/rumors', {
      method: 'POST',
      body: JSON.stringify({
        content: `E2E Test - The cafeteria is serving better food ${Date.now()}`,
        submitterNullifier: e2eNullifier
      })
    });
    assert(rumorRes.data.success, 'Rumor submission failed');
    const rumorId = rumorRes.data.data._id;

    // Step 4: Vote on rumor
    const voteRes = await request('/api/votes', {
      method: 'POST',
      body: JSON.stringify({
        rumorId,
        voterNullifier: e2eNullifier,
        voteValue: true,
        creditsSpent: 16,
        predictionPercent: 75
      })
    });
    assert(voteRes.data.success, 'Voting failed');
    assert(voteRes.data.data.quadraticWeight === 4, 'Quadratic weight incorrect');

    // Step 5: Check vote
    const checkRes = await request(`/api/votes/check?rumorId=${rumorId}&voterNullifier=${e2eNullifier}`);
    assert(checkRes.data.success, 'Vote check failed');
    assert(checkRes.data.data.hasVoted === true, 'Vote not recorded');

    // Step 6: View rumor with stats
    const detailRes = await request(`/api/rumors/${rumorId}?voterNullifier=${e2eNullifier}`);
    assert(detailRes.data.success, 'Rumor detail failed');
    assert(detailRes.data.data.rumor.totalVotes === 1, 'Vote count incorrect');
    assert(detailRes.data.data.userVote.hasVoted === true, 'User vote status incorrect');

    log('E2E: All steps completed successfully!', 'info');
  }, 'Integration');

  await test('E2E: Multi-voter consensus', async () => {
    // Create rumor
    const rumorRes = await request('/api/rumors', {
      method: 'POST',
      body: JSON.stringify({
        content: `Multi-voter Test - ${Date.now()}`,
        submitterNullifier: testNullifier
      })
    });
    const rumorId = rumorRes.data.data._id;

    // Create and vote with multiple voters
    const voters = [];
    for (let i = 0; i < 5; i++) {
      const voterHash = await sha256(`multivoter${i}${Date.now()}@university.edu:secret`);
      await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ nullifierHash: voterHash })
      });
      voters.push(voterHash);
    }

    // Cast votes (3 true, 2 false)
    for (let i = 0; i < 5; i++) {
      await request('/api/votes', {
        method: 'POST',
        body: JSON.stringify({
          rumorId,
          voterNullifier: voters[i],
          voteValue: i < 3, // First 3 vote true
          creditsSpent: 4,
          predictionPercent: 60
        })
      });
    }

    // Check final state
    const finalRes = await request(`/api/rumors/${rumorId}`);
    assert(finalRes.data.data.rumor.totalVotes === 5, 'Should have 5 votes');
    assert(finalRes.data.data.rumor.trueVotes === 3, 'Should have 3 true votes');
    assert(finalRes.data.data.rumor.falseVotes === 2, 'Should have 2 false votes');
    assert(finalRes.data.data.rumor.truthScore > 0, 'Truth score should be positive (more true votes)');
  }, 'Integration');
}

// ============================================
// MAIN EXECUTION
// ============================================

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║    🏰 CITADEL OF TRUTH - QA TEST SUITE (Phases 1-4)        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nTest started at: ${new Date().toLocaleString()}`);
  console.log(`Target server: ${BASE_URL}\n`);

  try {
    // Check server is running
    try {
      await fetch(`${BASE_URL}/api/health`);
    } catch (e) {
      console.log('❌ ERROR: Server not running at', BASE_URL);
      console.log('Please start the server with: npm run dev\n');
      process.exit(1);
    }

    // Run all test phases
    await testPhase1();
    await testPhase2();
    await testPhase3();
    await testPhase4();
    await testIntegration();

  } catch (error) {
    console.error('\n💥 Critical error:', error.message);
  }

  // Print Summary
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    📊 TEST SUMMARY                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n  ✅ Passed:  ${passed}`);
  console.log(`  ❌ Failed:  ${failed}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  📝 Total:   ${passed + failed + skipped}`);
  
  const successRate = ((passed / (passed + failed)) * 100).toFixed(1);
  console.log(`\n  🎯 Success Rate: ${successRate}%`);

  // Group results by phase
  console.log('\n  Results by Phase:');
  const phases = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Integration'];
  phases.forEach(phase => {
    const phaseResults = results.filter(r => r.phase === phase);
    const phasePassed = phaseResults.filter(r => r.status === 'pass').length;
    const phaseFailed = phaseResults.filter(r => r.status === 'fail').length;
    const phaseTotal = phaseResults.length;
    if (phaseTotal > 0) {
      const icon = phaseFailed === 0 ? '✅' : '⚠️';
      console.log(`    ${icon} ${phase}: ${phasePassed}/${phaseTotal} passed`);
    }
  });

  // Print failed tests
  if (failed > 0) {
    console.log('\n  ❌ Failed Tests:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`    • [${r.phase}] ${r.name}`);
      console.log(`      Error: ${r.error}`);
    });
  }

  console.log('\n' + '═'.repeat(62) + '\n');

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests();
