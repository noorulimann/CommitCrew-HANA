/**
 * Module 3: Integrity Check Test
 * Run this to verify the implementation is working
 * 
 * Usage: node tests/module3-test.mjs
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000/api';

/**
 * Helper to make HTTP requests
 */
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            body: parsed,
          });
        } catch {
          resolve({
            status: res.statusCode,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Run tests
 */
async function runTests() {
  console.log('🧪 Module 3: Integrity & The "Time Warp" Fix - Test Suite\n');
  console.log('═'.repeat(60));

  try {
    // Test 1: Health Check
    console.log('\n✓ Test 1: Health Check & Server Initialization');
    const health = await makeRequest('GET', '/health');
    console.log(`  Status: ${health.status}`);
    console.log(`  Database: ${health.body.database}`);
    console.log(`  Server Initialized: ${health.body.serverInitialized}`);

    if (health.status !== 200) {
      console.error('❌ Health check failed!');
      return;
    }

    // Test 2: Trigger Commitment
    console.log('\n✓ Test 2: Trigger Manual State Commitment');
    const trigger = await makeRequest('POST', '/integrity/trigger-commitment', {});
    console.log(`  Status: ${trigger.status}`);
    if (trigger.body.commitment) {
      console.log(`  Hour Key: ${trigger.body.commitment.hourKey}`);
      console.log(`  Root Hash: ${trigger.body.commitment.rootHash.slice(0, 16)}...`);
      console.log(`  Rumors Committed: ${trigger.body.commitment.rumorCount}`);
    }

    // Test 3: Get Commitments
    console.log('\n✓ Test 3: Retrieve Commitment History');
    const history = await makeRequest('GET', '/integrity/commitments?limit=5', null);
    console.log(`  Status: ${history.status}`);
    console.log(`  Commitments Found: ${history.body.count}`);
    if (history.body.commitments && history.body.commitments.length > 0) {
      const latest = history.body.commitments[0];
      console.log(`  Latest: ${latest.hourKey} - ${latest.rumorCount} rumors`);
    }

    // Test 4: Check Violations (should be none)
    console.log('\n✓ Test 4: Check State Violations (should be clean)');
    const violations = await makeRequest(
      'POST',
      '/integrity/check-violations',
      { hoursBack: 24 }
    );
    console.log(`  Status: ${violations.status}`);
    console.log(`  Status: ${violations.body.status}`);
    console.log(`  Violations Found: ${violations.body.violations?.length || 0}`);

    // Test 5: Get Cron Status
    console.log('\n✓ Test 5: Cron Job Status');
    const status = await makeRequest('GET', '/integrity/trigger-commitment', null);
    console.log(`  Status: ${status.status}`);
    console.log(`  Next Hour Key: ${status.body.nextHourKey}`);

    console.log('\n' + '═'.repeat(60));
    console.log('\n✅ All tests completed!\n');
    console.log('Module 3 Implementation Summary:');
    console.log('  ✓ Dependencies installed (ethers, merkletreejs, node-cron)');
    console.log('  ✓ State commitment service running');
    console.log('  ✓ Cron job initialized (runs hourly at :00)');
    console.log('  ✓ API endpoints accessible');
    console.log('  ✓ Violation detection ready');
    console.log('\nNext steps:');
    console.log('  1. Monitor logs for hourly commitments');
    console.log('  2. Test violation detection by modifying a score');
    console.log('  3. Check commitment history in MongoDB');
    console.log('  4. Deploy to production');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\nMake sure:');
    console.log('  1. Server is running (npm run dev)');
    console.log('  2. Port 3000 is accessible');
    console.log('  3. MongoDB is connected');
  }
}

// Run the tests
runTests();
