/**
 * Check Vote API Endpoint
 * GET /api/votes/check - Check if a user has already voted on a rumor
 * 
 * Part of Module 2: Trust Scoring Algorithm
 * Used to prevent double voting and show vote status in UI
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Vote } from '@/database/schemas';
import { 
  errorResponse, 
  successResponse, 
  handleError,
  getSearchParams 
} from '@/lib/api-helpers';
import { rumorIdSchema, nullifierHashSchema } from '@/lib/validations';
import { ERROR_CODES } from '@/types/api';

/**
 * GET /api/votes/check?rumorId=xxx&voterNullifier=xxx
 * Check if user has voted on a specific rumor
 * 
 * Query params:
 * - rumorId: The rumor to check (required)
 * - voterNullifier: The user's nullifier hash (required)
 * 
 * Returns:
 * - hasVoted: boolean
 * - vote: { voteValue, creditsSpent, finalTrustScore, createdAt } if voted
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = getSearchParams(request);
    const rumorId = searchParams.get('rumorId');
    const voterNullifier = searchParams.get('voterNullifier');
    
    // Validate required parameters
    if (!rumorId) {
      return errorResponse(
        'rumorId is required',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }
    
    if (!voterNullifier) {
      return errorResponse(
        'voterNullifier is required',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }
    
    // Validate formats
    let validatedRumorId: string;
    let validatedNullifier: string;
    
    try {
      validatedRumorId = rumorIdSchema.parse(rumorId);
      validatedNullifier = nullifierHashSchema.parse(voterNullifier);
    } catch {
      return errorResponse(
        'Invalid rumorId or voterNullifier format',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }
    
    // Check for existing vote
    const existingVote = await Vote.findOne({
      rumorId: validatedRumorId,
      voterNullifier: validatedNullifier,
    }).lean();
    
    if (existingVote) {
      return successResponse({
        hasVoted: true,
        vote: {
          _id: existingVote._id.toString(),
          voteValue: existingVote.voteValue,
          creditsSpent: existingVote.creditsSpent,
          quadraticWeight: existingVote.quadraticWeight,
          bayesianBonus: existingVote.bayesianBonus,
          finalTrustScore: existingVote.finalTrustScore,
          predictedConsensus: existingVote.predictedConsensus,
          createdAt: existingVote.createdAt.toISOString(),
        },
      });
    }
    
    return successResponse({
      hasVoted: false,
      vote: null,
    });
    
  } catch (error) {
    return handleError(error);
  }
}
