/**
 * Votes API Endpoint
 * POST /api/votes - Cast a vote on a rumor
 * GET /api/votes - Get votes (optional: by rumor or user)
 * 
 * Part of Module 2: Trust Scoring Algorithm
 * 
 * Key features:
 * - Quadratic voting: vote_weight = √(credits)
 * - Bayesian Truth Serum: prediction bonuses
 * - Anti-double-voting: nullifier + rumorId unique constraint
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Vote, Rumor, User } from '@/database/schemas';
import { 
  errorResponse, 
  successResponse, 
  handleError,
  getSearchParams 
} from '@/lib/api-helpers';
import { createVoteSchema, rumorIdSchema, nullifierHashSchema } from '@/lib/validations';
import { ERROR_CODES } from '@/types/api';
import { getVoteWeightPreview, previewBayesianBonus, calculateConsensus } from '@/services/scoring';

/**
 * POST /api/votes
 * Cast a vote on a rumor
 * 
 * Body: {
 *   rumorId: string,
 *   voterNullifier: string,
 *   voteValue: boolean,
 *   creditsSpent: number (1-100),
 *   predictedConsensus?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createVoteSchema.parse(body);
    
    const { rumorId, voterNullifier, voteValue, creditsSpent, predictedConsensus } = validatedData;
    
    // Verify rumor exists and is active
    const rumor = await Rumor.findById(rumorId);
    if (!rumor) {
      return errorResponse(
        'Rumor not found',
        ERROR_CODES.RUMOR_NOT_FOUND,
        404
      );
    }
    
    if (rumor.status !== 'active') {
      return errorResponse(
        'Cannot vote on deleted or archived rumors',
        ERROR_CODES.RUMOR_DELETED,
        400
      );
    }
    
    // Verify user exists (must be registered)
    const user = await User.findOne({ nullifierHash: voterNullifier });
    if (!user) {
      return errorResponse(
        'User not found. Please register first.',
        ERROR_CODES.USER_NOT_FOUND,
        404
      );
    }
    
    // Check if user already voted on this rumor
    const existingVote = await Vote.findOne({ rumorId, voterNullifier });
    if (existingVote) {
      return errorResponse(
        'You have already voted on this rumor',
        ERROR_CODES.ALREADY_VOTED,
        409
      );
    }
    
    // Create the vote (trust score calculated in pre-save hook)
    const vote = new Vote({
      rumorId,
      voterNullifier,
      voteValue,
      creditsSpent,
      predictedConsensus,
    });
    
    await vote.save();
    
    // Get updated rumor data
    const updatedRumor = await Rumor.findById(rumorId);
    
    // Update user's last active timestamp
    user.lastActive = new Date();
    await user.save();
    
    return successResponse(
      {
        vote: {
          _id: vote._id.toString(),
          quadraticWeight: vote.quadraticWeight,
          bayesianBonus: vote.bayesianBonus,
          finalTrustScore: vote.finalTrustScore,
          creditsSpent: vote.creditsSpent,
          voteValue: vote.voteValue,
        },
        rumor: {
          newTruthScore: updatedRumor?.truthScore || 0,
          newTotalVotes: updatedRumor?.totalVotes || 0,
          trueVotes: updatedRumor?.trueVotes || 0,
          falseVotes: updatedRumor?.falseVotes || 0,
        },
      },
      'Vote cast successfully'
    );
    
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/votes
 * Get votes with optional filtering
 * 
 * Query params:
 * - rumorId: Get all votes for a specific rumor
 * - voterNullifier: Get all votes by a specific user
 * - preview: If true with rumorId, returns vote preview info
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = getSearchParams(request);
    const rumorId = searchParams.get('rumorId');
    const voterNullifier = searchParams.get('voterNullifier');
    const preview = searchParams.get('preview') === 'true';
    const credits = parseInt(searchParams.get('credits') || '1');
    
    // If preview mode, return vote weight preview
    if (preview && rumorId) {
      // Validate rumorId
      const validatedRumorId = rumorIdSchema.parse(rumorId);
      
      // Get existing votes for consensus calculation
      const existingVotes = await Vote.find({ rumorId: validatedRumorId })
        .select('voteValue finalTrustScore')
        .lean();
      
      const consensus = calculateConsensus(existingVotes.map(v => ({
        voteValue: v.voteValue,
        finalTrustScore: v.finalTrustScore,
      })));
      
      // Get user reputation if nullifier provided
      let userReputation = 1.0;
      if (voterNullifier) {
        const validatedNullifier = nullifierHashSchema.parse(voterNullifier);
        const user = await User.findOne({ nullifierHash: validatedNullifier });
        userReputation = user?.reputationScore || 1.0;
      }
      
      const weightPreview = getVoteWeightPreview(credits);
      
      return successResponse({
        preview: {
          credits,
          quadraticWeight: weightPreview.weight,
          weightFormatted: weightPreview.weightFormatted,
          doubleWeightCost: weightPreview.doubleWeightCost,
          userReputation,
        },
        consensus: {
          totalVotes: consensus.totalVotes,
          trueVotes: consensus.trueVotes,
          falseVotes: consensus.falseVotes,
          currentConsensus: consensus.consensusValue ? 'truth' : 'lie',
          consensusStrength: consensus.consensusStrength,
          bayesianActive: consensus.isConsensusReached,
        },
      });
    }
    
    // Build query
    const query: Record<string, unknown> = {};
    
    if (rumorId) {
      const validatedRumorId = rumorIdSchema.parse(rumorId);
      query.rumorId = validatedRumorId;
    }
    
    if (voterNullifier) {
      const validatedNullifier = nullifierHashSchema.parse(voterNullifier);
      query.voterNullifier = validatedNullifier;
    }
    
    // Get votes
    const votes = await Vote.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    return successResponse({
      votes: votes.map(v => ({
        _id: v._id.toString(),
        rumorId: v.rumorId.toString(),
        voteValue: v.voteValue,
        creditsSpent: v.creditsSpent,
        quadraticWeight: v.quadraticWeight,
        bayesianBonus: v.bayesianBonus,
        finalTrustScore: v.finalTrustScore,
        createdAt: v.createdAt,
      })),
      total: votes.length,
    });
    
  } catch (error) {
    return handleError(error);
  }
}
