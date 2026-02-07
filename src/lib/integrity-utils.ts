/**
 * Integrity Utilities
 * Helper functions for integrity checks and violations
 */

import { StateCommitmentService, MerkleService } from '@/services/integrity';

/**
 * Comprehensive integrity audit
 * Check all rumors from all commitments in a time range
 */
export async function auditAllRumors(hoursBack: number = 24): Promise<{
  totalRumors: number;
  violations: number;
  auditTime: string;
  violatedRumors: string[];
}> {
  const violations = await StateCommitmentService.checkStateViolations(
    undefined,
    hoursBack
  );

  return {
    totalRumors: violations.length,
    violations: violations.filter((v) => v.violation).length,
    auditTime: new Date().toISOString(),
    violatedRumors: violations
      .filter((v) => v.violation)
      .map((v) => v.rumorId),
  };
}

/**
 * Get the next scheduled commitment time
 */
export function getNextCommitmentTime(): Date {
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const milliseconds = now.getMilliseconds();

  // Create next hour
  const next = new Date(now);
  next.setHours(next.getHours() + 1);
  next.setMinutes(0);
  next.setSeconds(0);
  next.setMilliseconds(0);

  return next;
}

/**
 * Get remaining time until next commitment
 */
export function getTimeUntilNextCommitment(): {
  minutes: number;
  seconds: number;
  totalSeconds: number;
} {
  const now = new Date();
  const next = getNextCommitmentTime();
  const diff = next.getTime() - now.getTime();

  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    minutes,
    seconds,
    totalSeconds,
  };
}

/**
 * Create a human-readable commitment summary
 */
export function formatCommitment(commitment: any): string {
  return `
═════════════════════════════════════════
📦 State Commitment Summary
═════════════════════════════════════════
Time:        ${new Date(commitment.timestamp).toLocaleString()}
Hour Key:    ${commitment.hourKey}
Root Hash:   ${commitment.rootHash.slice(0, 16)}...
Rumors:      ${commitment.rumorCount} active
Verified:    ${commitment.verified ? '✅ Yes' : '❌ No'}
═════════════════════════════════════════
  `.trim();
}

/**
 * Format violation for display
 */
export function formatViolation(violation: any): string {
  const variance = Math.round(violation.variance * 100) / 100;
  return `
[⚠️  VIOLATION] Rumor ${violation.rumorId}
  Committed Score:  ${violation.committedScore}
  Current Score:    ${violation.currentScore}
  Variance:         ${variance} points
  Found in:         ${violation.commitment.hourKey}
  Committed:        ${new Date(violation.commitment.timestamp).toLocaleString()}
  `.trim();
}

/**
 * Bulk revert violations
 */
export async function revertAllViolations(
  hoursBack: number = 24
): Promise<{
  reverted: number;
  failed: number;
  results: any[];
}> {
  const violations = await StateCommitmentService.checkStateViolations(
    undefined,
    hoursBack
  );

  const results = [];
  let reverted = 0;
  let failed = 0;

  for (const violation of violations) {
    if (violation.violation) {
      try {
        const result = await StateCommitmentService.revertToCommittedState(
          violation.rumorId,
          violation.commitment._id || violation.commitment.hourKey
        );

        if (result.success) {
          reverted++;
          results.push({
            rumorId: violation.rumorId,
            success: true,
            message: result.message,
          });
        } else {
          failed++;
          results.push({
            rumorId: violation.rumorId,
            success: false,
            message: result.message,
          });
        }
      } catch (error) {
        failed++;
        results.push({
          rumorId: violation.rumorId,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  return {
    reverted,
    failed,
    results,
  };
}

/**
 * Integrity report for dashboard/logging
 */
export async function generateIntegrityReport(
  hoursBack: number = 24
): Promise<{
  timestamp: string;
  commitments: number;
  rumors: number;
  violations: number;
  health: 'good' | 'warning' | 'critical';
  nextCommitment: string;
  violatedRumors?: string[];
}> {
  const violations = await StateCommitmentService.checkStateViolations(
    undefined,
    hoursBack
  );

  const commitments = await StateCommitmentService.getCommitmentHistory(
    hoursBack
  );

  const totalRumors = commitments.reduce((sum, c) => sum + c.rumorCount, 0);
  const violationCount = violations.filter((v) => v.violation).length;

  let health: 'good' | 'warning' | 'critical' = 'good';
  if (violationCount > 0 && violationCount < 5) {
    health = 'warning';
  } else if (violationCount >= 5) {
    health = 'critical';
  }

  return {
    timestamp: new Date().toISOString(),
    commitments: commitments.length,
    rumors: totalRumors,
    violations: violationCount,
    health,
    nextCommitment: getNextCommitmentTime().toISOString(),
    violatedRumors:
      violationCount > 0
        ? violations
            .filter((v) => v.violation)
            .map((v) => v.rumorId)
            .slice(0, 10)
        : undefined, // Show first 10
  };
}

/**
 * Verify multiple rumors at once
 */
export async function batchVerifyRumors(
  rumorIds: string[],
  commitmentId: string
): Promise<{
  verified: number;
  violated: number;
  results: any[];
}> {
  const results = [];
  let verified = 0;
  let violated = 0;

  for (const rumorId of rumorIds) {
    try {
      const result = await StateCommitmentService.verifyRumorIntegrity(
        rumorId,
        commitmentId
      );
      results.push({
        rumorId,
        ...result,
      });

      if (result.isValid) {
        verified++;
      } else {
        violated++;
      }
    } catch (error) {
      violated++;
      results.push({
        rumorId,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    verified,
    violated,
    results,
  };
}
