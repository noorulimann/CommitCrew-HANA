import { NextRequest, NextResponse } from 'next/server';
import { StateCommitmentService } from '@/services/integrity';

/**
 * POST /api/integrity/verify-rumor
 * Verify a specific rumor against a committed state
 * Body:
 * - rumorId: The rumor ID to verify
 * - commitmentId: The commitment ID to verify against
 */
export async function POST(request: NextRequest) {
  try {
    const { rumorId, commitmentId } = await request.json();

    if (!rumorId || !commitmentId) {
      return NextResponse.json(
        {
          error: 'Missing required fields: rumorId, commitmentId',
        },
        { status: 400 }
      );
    }

    const result = await StateCommitmentService.verifyRumorIntegrity(
      rumorId,
      commitmentId
    );

    return NextResponse.json(
      {
        isValid: result.isValid,
        commitmentHash: result.commitmentHash,
        rumorScore: result.rumorScore,
        currentScore: result.currentScore,
        status: result.isValid ? 'integrity_verified' : 'integrity_violation',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error verifying rumor:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify rumor integrity',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
