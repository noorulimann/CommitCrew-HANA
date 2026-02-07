import { NextRequest, NextResponse } from 'next/server';
import { StateCommitmentService, triggerStateCommitmentNow } from '@/services/integrity';

/**
 * POST /api/integrity/trigger-commitment
 * Manually trigger a state commitment (for testing/admin)
 * This creates a commitment immediately instead of waiting for the hourly cron
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check here
    // const token = request.headers.get('authorization');
    // if (!isValidAdmin(token)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const commitment = await StateCommitmentService.createHourlyCommitment();

    if (commitment) {
      return NextResponse.json(
        {
          success: true,
          data: {
            id: commitment._id,
            timestamp: commitment.timestamp,
            hourKey: commitment.hourKey,
            rootHash: commitment.rootHash,
            rumorCount: commitment.rumorCount,
            verified: commitment.verified,
          },
          message: 'State commitment triggered successfully',
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create state commitment',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error triggering commitment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to trigger state commitment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrity/trigger-commitment
 * Get the status of state commitment cron job
 */
export async function GET(request: NextRequest) {
  try {
    // Check query parameter for force trigger
    const { searchParams } = new URL(request.url);
    const forceTrigger = searchParams.get('force') === 'true';

    if (forceTrigger) {
      const commitment = await triggerStateCommitmentNow();
      if (commitment) {
        return NextResponse.json(
          {
            status: 'force_triggered',
            commitment: {
              id: commitment._id,
              rootHash: commitment.rootHash,
              hourKey: commitment.hourKey,
            },
          },
          { status: 200 }
        );
      }
    }

    // Return status info
    return NextResponse.json(
      {
        message: 'State commitment service is running',
        nextHourKey: getNextHourKey(),
        usage:
          'POST to manually trigger, or add ?force=true to query param to force trigger',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in commitment status:', error);
    return NextResponse.json(
      {
        error: 'Failed to get commitment status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper: Get next hour key
 */
function getNextHourKey(): string {
  const now = new Date();
  const nextHour = new Date(now.getTime() + 3600000);
  const year = nextHour.getUTCFullYear();
  const month = String(nextHour.getUTCMonth() + 1).padStart(2, '0');
  const day = String(nextHour.getUTCDate()).padStart(2, '0');
  const hour = String(nextHour.getUTCHours()).padStart(2, '0');
  return `${year}-${month}-${day}-${hour}`;
}
