import { NextRequest, NextResponse } from 'next/server';
import { StateCommitmentService } from '@/services/integrity';

/**
 * POST /api/integrity/check-violations
 * Check for state violations in rumors
 * Optional query params:
 * - rumorId: Check specific rumor
 * - hoursBack: How many hours to check (default: 24)
 */
export async function POST(request: NextRequest) {
  try {
    const { rumorId, hoursBack = 24 } = await request.json();

    const violations = await StateCommitmentService.checkStateViolations(
      rumorId,
      hoursBack
    );

    if (violations.length > 0) {
      return NextResponse.json(
        {
          status: 'violations_detected',
          count: violations.length,
          violations,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: 'ok',
        message: 'No state violations detected',
        violations: [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking violations:', error);
    return NextResponse.json(
      {
        error: 'Failed to check state violations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
