'use client';

/**
 * Module 3 Testing Dashboard
 * Test State Commitment, Merkle Trees, and Integrity Verification
 */

import { useState } from 'react';

interface StateViolation {
  violation: boolean;
  rumorId: string;
  currentScore: number;
  committedScore: number;
  variance: number;
  commitment: {
    id: string;
    hourKey: string;
    rootHash: string;
    timestamp: string;
  };
}

interface Commitment {
  id: string;
  hourKey: string;
  rootHash: string;
  timestamp: string;
  rumorCount: number;
  verified: boolean;
}

export default function TestIntegrityPage() {
  const [step, setStep] = useState<number>(1);
  const [rumorId, setRumorId] = useState('');
  const [violations, setViolations] = useState<StateViolation[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const clearMessages = () => {
    setMessage('');
    setError('');
  };

  // Step 1: Trigger Manual Commitment
  const triggerCommitment = async () => {
    clearMessages();
    setLoading(true);
    try {
      const response = await fetch('/api/integrity/trigger-commitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        setMessage(
          `✅ Commitment created! Root Hash: ${data.data.rootHash.substring(0, 16)}...`
        );
        setStep(2);
      } else {
        setError(data.error || 'Failed to create commitment');
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: View Recent Commitments
  const viewCommitments = async () => {
    clearMessages();
    setLoading(true);
    try {
      const response = await fetch('/api/integrity/commitments');
      const data = await response.json();

      if (data.commitments) {
        setCommitments(data.commitments);
        setMessage(
          `✅ Found ${data.commitments.length} recent commitments (last 24 hours)`
        );
      } else {
        setError(data.error || 'Failed to fetch commitments');
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Check for Violations
  const checkViolations = async () => {
    clearMessages();
    if (!rumorId.trim()) {
      setError('Please enter a Rumor ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/integrity/check-violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rumorId: rumorId.trim(), hoursBack: 24 }),
      });

      const data = await response.json();

      if (data.violations && data.violations.length > 0) {
        setViolations(data.violations);
        setMessage(
          `⚠️ Found ${data.violations.length} violation(s)! Tampering detected!`
        );
        setStep(4);
      } else {
        setMessage('✅ No violations detected! Rumor score is intact.');
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Revert to Committed State
  const revertState = async (violation: StateViolation) => {
    clearMessages();
    setLoading(true);
    try {
      const response = await fetch('/api/integrity/revert-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rumorId: violation.rumorId,
          commitmentId: violation.commitment.id,
        }),
      });

      const data = await response.json();

      if (data.status === 'reverted') {
        setMessage(
          `✅ State reverted! Score restored to: ${violation.committedScore}`
        );
      } else {
        setError(data.message || 'Failed to revert state');
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            🔬 Module 3 Testing Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            State Commitment, Merkle Verification & Integrity Testing
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    step >= s
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-colors ${
                      step > s
                        ? 'bg-blue-600'
                        : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Trigger</span>
            <span>View</span>
            <span>Check</span>
            <span>Revert</span>
          </div>
        </div>

        {/* Status Messages */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-300">{message}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Step 1: Trigger Commitment */}
        <div className="card mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
              1
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Trigger State Commitment
            </h2>
          </div>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            Creates an hourly Merkle root hash of all active rumors and their
            scores. This "pins" the current truth state.
          </p>
          <button
            onClick={triggerCommitment}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Creating commitment...' : '🔐 Trigger Commitment'}
          </button>
        </div>

        {/* Step 2: View Commitments */}
        <div className="card mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
              2
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              View Recent Commitments
            </h2>
          </div>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            See all state commitments from the last 24 hours. Each one represents
            a pinned version of the truth.
          </p>
          <button
            onClick={viewCommitments}
            disabled={loading}
            className="btn-secondary mb-4"
          >
            {loading ? 'Loading...' : '📊 View Commitments'}
          </button>

          {commitments.length > 0 && (
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
              {commitments.map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-sm text-slate-600 dark:text-slate-300">
                        <strong>Hour:</strong> {c.hourKey}
                      </p>
                      <p className="font-mono text-xs text-slate-500 dark:text-slate-400 break-all">
                        <strong>Root:</strong> {c.rootHash.substring(0, 32)}...
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        <strong>Rumors:</strong> {c.rumorCount} |{' '}
                        <strong>Verified:</strong> {c.verified ? '✅' : '❌'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 3: Check Violations */}
        <div className="card mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
              3
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Detect State Violations
            </h2>
          </div>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            Compare current rumor scores with committed ones. If they differ, a
            violation is detected!
          </p>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={rumorId}
              onChange={(e) => setRumorId(e.target.value)}
              placeholder="Enter Rumor ID (leave empty to check all)"
              className="flex-1 input"
            />
            <button
              onClick={checkViolations}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Checking...' : '🔍 Check'}
            </button>
          </div>

          {violations.length > 0 && (
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
              {violations.map((v, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800"
                >
                  <p className="text-red-800 dark:text-red-300 font-semibold mb-2">
                    ⚠️ Violation Detected!
                  </p>
                  <div className="text-sm text-red-700 dark:text-red-400 space-y-1 mb-3">
                    <p>
                      <strong>Rumor ID:</strong>{' '}
                      <span className="font-mono">{v.rumorId}</span>
                    </p>
                    <p>
                      <strong>Current Score:</strong> {v.currentScore.toFixed(2)}
                    </p>
                    <p>
                      <strong>Committed Score:</strong>{' '}
                      {v.committedScore.toFixed(2)}
                    </p>
                    <p>
                      <strong>Variance:</strong> {v.variance.toFixed(2)}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-500">
                      <strong>Committed at:</strong>{' '}
                      {new Date(v.commitment.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => revertState(v)}
                    disabled={loading}
                    className="btn-danger text-sm w-full"
                  >
                    🔄 Revert to Committed State
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 4: Revert State */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
              4
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Revert to Historical Truth
            </h2>
          </div>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            If a violation is found, restore the rumor score to its last
            committed state. This undoes any tampering!
          </p>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-blue-800 dark:text-blue-300 text-sm">
              💡 <strong>Tip:</strong> First find a violation in Step 3, then
              click "Revert to Committed State" to restore it.
            </p>
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="card bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 mt-8">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-3">
            📝 Testing Instructions
          </h3>
          <ol className="text-sm text-purple-800 dark:text-purple-300 space-y-2">
            <li>
              <strong>1. Click "Trigger Commitment"</strong> - Creates a state
              snapshot
            </li>
            <li>
              <strong>2. View Commitments</strong> - See the hourly snapshots
            </li>
            <li>
              <strong>3. Go to /feed → Vote on a rumor</strong> - Changes the
              score
            </li>
            <li>
              <strong>4. Return here and Check Violations</strong> - Should show
              no violations (score changed legitimately)
            </li>
            <li>
              <strong>5. (Advanced)</strong> - Manually edit the database to
              simulate tampering, then detect it
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
