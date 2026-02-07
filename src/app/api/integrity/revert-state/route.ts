import { NextRequest, NextResponse } from 'next/server';
import { StateCommitmentService } from '@/services/integrity';

/**
 * POST /api/integrity/revert-state
 * Revert a rumor to its committed state
 * Used when a state violation is detected
 * Body:
 * - rumorId: The rumor ID to revert
 * - commitmentId: The commitment to revert to
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

    const result = await StateCommitmentService.revertToCommittedState(
      rumorId,
      commitmentId
    );

    if (result.success) {
      return NextResponse.json(
        {
          status: 'reverted',
          message: result.message,
          revertedScore: result.revertedScore,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          status: 'error',
          message: result.message,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error reverting state:', error);
    return NextResponse.json(
      {
        error: 'Failed to revert state',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
