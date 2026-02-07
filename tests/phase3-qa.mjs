/**
 * Phase 3 QA Test Script - Trust Scoring Algorithm
 * 
 * Run with: node tests/phase3-qa.mjs
 * 
 * Tests:
 * 1. Health check
 * 2. Quadratic weight calculation (vote preview)
 * 3. User registration
 * 4. Vote creation with trust score
 * 5. Anti-double-voting
 * 6. Check vote endpoint
 * 7. Validation errors
 * 8. Rumor score updates
 */

const BASE_URL = 'http://localhost:3000';

// Test utilities
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function pass(testName) {
  log('green', `✓ PASS: ${testName}`);
}

function fail(testName, reason) {
  log('red', `✗ FAIL: ${testName}`);
  log('red', `  Reason: ${reason}`);
}

function info(message) {
  log('blue', `ℹ ${message}`);
}

async function fetchJson(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, data: null, error: error.message };
  }
}

// Generate unique test identifiers
const testId = Date.now().toString(16);
const testNullifier1 = `${testId}${'a'.repeat(64 - testId.length)}`;
const testNullifier2 = `${testId}${'b'.repeat(64 - testId.length)}`;

let createdRumorId = null;
let testResults = { passed: 0, failed: 0, skipped: 0 };

// ============================================
// TEST CASES
// ============================================

async function test1_HealthCheck() {
  const testName = 'Health Check';
  const { status, data } = await fetchJson(`${BASE_URL}/api/health`);
  
  if (status === 200 && data?.status === 'ok' && data?.database === 'connected') {
    pass(testName);
    testResults.passed++;
    return true;
  } else {
    fail(testName, `Expected status ok, got: ${JSON.stringify(data)}`);
    testResults.failed++;
    return false;
  }
}

async function test2_QuadraticWeightCalculation() {
  const testName = 'Quadratic Weight Calculation';
  
  const testCases = [
    { credits: 1, expectedWeight: 1 },
    { credits: 4, expectedWeight: 2 },
    { credits: 25, expectedWeight: 5 },
    { credits: 64, expectedWeight: 8 },
    { credits: 100, expectedWeight: 10 },
  ];
  
  let allPassed = true;
  
  for (const { credits, expectedWeight } of testCases) {
    const { status, data } = await fetchJson(
      `${BASE_URL}/api/votes?preview=true&rumorId=000000000000000000000001&credits=${credits}`
    );
    
    const actualWeight = data?.data?.preview?.quadraticWeight;
    
    if (status === 200 && Math.abs(actualWeight - expectedWeight) < 0.001) {
      info(`  √${credits} = ${actualWeight} ✓`);
    } else {
      info(`  √${credits} expected ${expectedWeight}, got ${actualWeight} ✗`);
      allPassed = false;
    }
  }
  
  if (allPassed) {
    pass(testName);
    testResults.passed++;
  } else {
    fail(testName, 'Some quadratic calculations failed');
    testResults.failed++;
  }
  
  return allPassed;
}

async function test3_UserRegistration() {
  const testName = 'User Registration';
  
  const { status, data } = await fetchJson(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ nullifierHash: testNullifier1 }),
  });
  
  // Registration is successful if status is 200/201 and user is registered
  // Status 200 = already registered, 201 = newly created
  if ((status === 200 || status === 201) && data?.success === true && data?.data?.registered === true) {
    pass(testName);
    info(`  Registered user: ${testNullifier1.substring(0, 16)}...`);
    info(`  Is new user: ${data.data.isNewUser}`);
    testResults.passed++;
    return true;
  } else {
    fail(testName, `Status: ${status}, success: ${data?.success}, registered: ${data?.data?.registered}`);
    testResults.failed++;
    return false;
  }
}

async function test4_CreateTestRumor() {
  const testName = 'Create Test Rumor (via direct DB or API)';
  
  // First check if rumors API exists
  const { status, data } = await fetchJson(`${BASE_URL}/api/rumors`, {
    method: 'POST',
    body: JSON.stringify({
      content: `QA Test Rumor ${testId} - Testing Trust Scoring Algorithm`,
      submitterNullifier: testNullifier1,
    }),
  });
  
  if (status === 200 && data?.data?._id) {
    createdRumorId = data.data._id;
    pass(testName);
    info(`  Created rumor: ${createdRumorId}`);
    testResults.passed++;
    return true;
  } else if (status === 404) {
    // Rumors API might not exist yet - try to get an existing rumor
    const listResult = await fetchJson(`${BASE_URL}/api/rumors`);
    if (listResult.data?.data?.length > 0) {
      createdRumorId = listResult.data.data[0]._id;
      info(`  Using existing rumor: ${createdRumorId}`);
      testResults.skipped++;
      return true;
    }
    fail(testName, 'Rumors API not available and no existing rumors');
    testResults.failed++;
    return false;
  } else {
    fail(testName, `Failed to create rumor: ${JSON.stringify(data)}`);
    testResults.failed++;
    return false;
  }
}

async function test5_CastVoteWithTrustScore() {
  const testName = 'Cast Vote with Trust Score Calculation';
  
  if (!createdRumorId) {
    info(`  Skipping: No rumor ID available`);
    testResults.skipped++;
    return false;
  }
  
  const { status, data } = await fetchJson(`${BASE_URL}/api/votes`, {
    method: 'POST',
    body: JSON.stringify({
      rumorId: createdRumorId,
      voterNullifier: testNullifier1,
      voteValue: true,
      creditsSpent: 25,
      predictedConsensus: true,
    }),
  });
  
  if (status === 200 && data?.success) {
    const vote = data.data?.vote;
    const expectedWeight = 5; // √25
    
    if (Math.abs(vote?.quadraticWeight - expectedWeight) < 0.001) {
      pass(testName);
      info(`  quadraticWeight: ${vote.quadraticWeight}`);
      info(`  bayesianBonus: ${vote.bayesianBonus}`);
      info(`  finalTrustScore: ${vote.finalTrustScore}`);
      info(`  Rumor new score: ${data.data?.rumor?.newTruthScore}`);
      testResults.passed++;
      return true;
    } else {
      fail(testName, `Expected weight 5, got ${vote?.quadraticWeight}`);
      testResults.failed++;
      return false;
    }
  } else {
    fail(testName, `Vote failed: ${JSON.stringify(data)}`);
    testResults.failed++;
    return false;
  }
}

async function test6_AntiDoubleVoting() {
  const testName = 'Anti-Double-Voting Protection';
  
  if (!createdRumorId) {
    info(`  Skipping: No rumor ID available`);
    testResults.skipped++;
    return false;
  }
  
  const { status, data } = await fetchJson(`${BASE_URL}/api/votes`, {
    method: 'POST',
    body: JSON.stringify({
      rumorId: createdRumorId,
      voterNullifier: testNullifier1,
      voteValue: false,
      creditsSpent: 10,
    }),
  });
  
  if (status === 409 && data?.code === 'ALREADY_VOTED') {
    pass(testName);
    info(`  Correctly blocked duplicate vote`);
    testResults.passed++;
    return true;
  } else {
    fail(testName, `Expected 409 ALREADY_VOTED, got ${status}: ${JSON.stringify(data)}`);
    testResults.failed++;
    return false;
  }
}

async function test7_CheckVoteEndpoint() {
  const testName = 'Check Vote Endpoint';
  
  if (!createdRumorId) {
    info(`  Skipping: No rumor ID available`);
    testResults.skipped++;
    return false;
  }
  
  // Test voted user
  const { status: s1, data: d1 } = await fetchJson(
    `${BASE_URL}/api/votes/check?rumorId=${createdRumorId}&voterNullifier=${testNullifier1}`
  );
  
  // Test non-voted user
  const { status: s2, data: d2 } = await fetchJson(
    `${BASE_URL}/api/votes/check?rumorId=${createdRumorId}&voterNullifier=${testNullifier2}`
  );
  
  const votedCorrect = s1 === 200 && d1?.data?.hasVoted === true;
  const notVotedCorrect = s2 === 200 && d2?.data?.hasVoted === false;
  
  if (votedCorrect && notVotedCorrect) {
    pass(testName);
    info(`  User1 hasVoted: ${d1.data.hasVoted} (expected: true)`);
    info(`  User2 hasVoted: ${d2.data.hasVoted} (expected: false)`);
    testResults.passed++;
    return true;
  } else {
    fail(testName, `votedCorrect: ${votedCorrect}, notVotedCorrect: ${notVotedCorrect}`);
    testResults.failed++;
    return false;
  }
}

async function test8_ValidationErrors() {
  const testName = 'Validation Errors';
  
  // Test invalid credits (> 100)
  const { status: s1, data: d1 } = await fetchJson(`${BASE_URL}/api/votes`, {
    method: 'POST',
    body: JSON.stringify({
      rumorId: '000000000000000000000001',
      voterNullifier: testNullifier2,
      voteValue: true,
      creditsSpent: 150,
    }),
  });
  
  // Test invalid nullifier format
  const { status: s2, data: d2 } = await fetchJson(`${BASE_URL}/api/votes`, {
    method: 'POST',
    body: JSON.stringify({
      rumorId: '000000000000000000000001',
      voterNullifier: 'invalid-hash',
      voteValue: true,
      creditsSpent: 10,
    }),
  });
  
  const creditsValidated = s1 === 400;
  const nullifierValidated = s2 === 400;
  
  if (creditsValidated && nullifierValidated) {
    pass(testName);
    info(`  Invalid credits rejected: ${creditsValidated}`);
    info(`  Invalid nullifier rejected: ${nullifierValidated}`);
    testResults.passed++;
    return true;
  } else {
    fail(testName, `Credits: ${s1}, Nullifier: ${s2}`);
    testResults.failed++;
    return false;
  }
}

async function test9_NonExistentRumor() {
  const testName = 'Non-Existent Rumor Returns 404';
  
  // Register user2 first
  await fetchJson(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ nullifierHash: testNullifier2 }),
  });
  
  const { status, data } = await fetchJson(`${BASE_URL}/api/votes`, {
    method: 'POST',
    body: JSON.stringify({
      rumorId: 'aaaaaaaaaaaaaaaaaaaaaaaa', // Non-existent
      voterNullifier: testNullifier2,
      voteValue: true,
      creditsSpent: 10,
    }),
  });
  
  if (status === 404 && data?.code === 'RUMOR_NOT_FOUND') {
    pass(testName);
    testResults.passed++;
    return true;
  } else {
    fail(testName, `Expected 404, got ${status}: ${data?.code}`);
    testResults.failed++;
    return false;
  }
}

async function test10_NonExistentUser() {
  const testName = 'Non-Existent User Returns 404';
  
  if (!createdRumorId) {
    info(`  Skipping: No rumor ID available`);
    testResults.skipped++;
    return false;
  }
  
  const fakeNullifier = 'f'.repeat(64);
  
  const { status, data } = await fetchJson(`${BASE_URL}/api/votes`, {
    method: 'POST',
    body: JSON.stringify({
      rumorId: createdRumorId,
      voterNullifier: fakeNullifier,
      voteValue: true,
      creditsSpent: 10,
    }),
  });
  
  if (status === 404 && data?.code === 'USER_NOT_FOUND') {
    pass(testName);
    testResults.passed++;
    return true;
  } else {
    fail(testName, `Expected 404 USER_NOT_FOUND, got ${status}: ${data?.code}`);
    testResults.failed++;
    return false;
  }
}

async function test11_TruthScoreFormula() {
  const testName = 'Trust Score Formula: (weight × reputation) + bonus';
  
  if (!createdRumorId) {
    info(`  Skipping: No rumor ID available`);
    testResults.skipped++;
    return false;
  }
  
  // Create a new user and vote with different credits
  const testNullifier3 = `${testId}${'c'.repeat(64 - testId.length)}`;
  
  await fetchJson(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ nullifierHash: testNullifier3 }),
  });
  
  const { status, data } = await fetchJson(`${BASE_URL}/api/votes`, {
    method: 'POST',
    body: JSON.stringify({
      rumorId: createdRumorId,
      voterNullifier: testNullifier3,
      voteValue: false,
      creditsSpent: 64,
    }),
  });
  
  if (status === 200) {
    const vote = data.data?.vote;
    const expectedWeight = 8; // √64
    const expectedScore = 8 * 1.0; // weight × default reputation (no bonus yet)
    
    const weightCorrect = Math.abs(vote.quadraticWeight - expectedWeight) < 0.001;
    const scoreCorrect = Math.abs(vote.finalTrustScore - expectedScore) < 0.1;
    
    if (weightCorrect && scoreCorrect) {
      pass(testName);
      info(`  Credits: 64, Weight: ${vote.quadraticWeight}, Score: ${vote.finalTrustScore}`);
      info(`  Formula verified: ${vote.quadraticWeight} × 1.0 + ${vote.bayesianBonus} = ${vote.finalTrustScore}`);
      testResults.passed++;
      return true;
    }
  }
  
  fail(testName, `Formula verification failed`);
  testResults.failed++;
  return false;
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  log('yellow', '🧪 PHASE 3 QA TESTS - Trust Scoring Algorithm');
  console.log('='.repeat(60) + '\n');
  
  info(`Test ID: ${testId}`);
  info(`Base URL: ${BASE_URL}`);
  console.log('');
  
  // Run tests in sequence
  const healthOk = await test1_HealthCheck();
  if (!healthOk) {
    log('red', '\n❌ Server not healthy. Aborting tests.');
    return;
  }
  
  console.log('');
  await test2_QuadraticWeightCalculation();
  console.log('');
  await test3_UserRegistration();
  console.log('');
  await test4_CreateTestRumor();
  console.log('');
  await test5_CastVoteWithTrustScore();
  console.log('');
  await test6_AntiDoubleVoting();
  console.log('');
  await test7_CheckVoteEndpoint();
  console.log('');
  await test8_ValidationErrors();
  console.log('');
  await test9_NonExistentRumor();
  console.log('');
  await test10_NonExistentUser();
  console.log('');
  await test11_TruthScoreFormula();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  log('yellow', '📊 TEST SUMMARY');
  console.log('='.repeat(60));
  log('green', `  Passed:  ${testResults.passed}`);
  log('red', `  Failed:  ${testResults.failed}`);
  log('blue', `  Skipped: ${testResults.skipped}`);
  console.log('');
  
  const total = testResults.passed + testResults.failed;
  const percentage = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
  
  if (testResults.failed === 0) {
    log('green', `✅ ALL TESTS PASSED (${percentage}%)`);
  } else {
    log('red', `❌ SOME TESTS FAILED (${percentage}% passed)`);
  }
  console.log('');
}

// Run tests
runAllTests().catch(console.error);
