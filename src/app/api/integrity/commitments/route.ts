import { NextRequest, NextResponse } from 'next/server';
import { StateCommitmentService } from '@/services/integrity';

/**
 * GET /api/integrity/commitments
 * Get state commitment history
 * Query params:
 * - limit: Number of commitments to return (default: 24)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit') || '24')
      : 24;

    const commitments =
      await StateCommitmentService.getCommitmentHistory(limit);

    return NextResponse.json(
      {
        count: commitments.length,
        commitments: commitments.map((c: any) => ({
          id: c._id?.toString() || c.id,
          timestamp: c.timestamp,
          hourKey: c.hourKey,
          rootHash: c.rootHash,
          rumorCount: c.rumorCount,
          verified: c.verified,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching commitments:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch commitments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
