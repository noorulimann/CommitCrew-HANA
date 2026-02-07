/**
 * Maintenance Endpoint: Fix Vote Counts
 * POST /api/maintenance/fix-vote-counts
 * 
 * Recalculates and fixes trueVotes/falseVotes for all rumors
 * Should be called manually to fix any inconsistencies
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Rumor, Vote } from '@/database/schemas';
import { errorResponse, successResponse, handleError } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    // Security: Check admin token (optional, adjust as needed)
    const adminToken = request.headers.get('x-admin-token');
    if (adminToken !== process.env.ADMIN_TOKEN) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 403);
    }

    await connectDB();

    // Get all rumors
    const rumors = await Rumor.find({});
    let fixed = 0;
    let errors = 0;

    for (const rumor of rumors) {
      try {
        // Get all votes for this rumor
        const votes = await Vote.find({ rumorId: rumor._id }).select('voteValue').lean();

        // Count true and false votes
        const trueVotes = votes.filter(v => v.voteValue === true).length;
        const falseVotes = votes.filter(v => v.voteValue === false).length;

        // Update rumor
        const result = await Rumor.findByIdAndUpdate(
          rumor._id,
          {
            trueVotes,
            falseVotes,
            totalVotes: votes.length,
          },
          { new: true }
        );

        if (result) {
          fixed++;
          console.log(
            `[Fix Vote Counts] Rumor ${rumor._id}: ${trueVotes} true, ${falseVotes} false`
          );
        }
      } catch (err) {
        errors++;
        console.error(`[Fix Vote Counts] Error processing rumor ${rumor._id}:`, err);
      }
    }

    return successResponse(
      {
        fixed,
        errors,
        total: rumors.length,
      },
      `Fixed vote counts for ${fixed} rumors (${errors} errors)`
    );
  } catch (error) {
    return handleError(error);
  }
}
