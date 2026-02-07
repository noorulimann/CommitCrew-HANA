/**
 * Individual Rumor API Endpoint
 * GET /api/rumors/[id] - Get single rumor with stats
 * DELETE /api/rumors/[id] - Soft-delete (set status='deleted')
 * 
 * Part of Phase 4: Core UI & Rumor Management
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Rumor, Vote, User } from '@/database/schemas';
import { 
  errorResponse, 
  successResponse, 
  handleError,
  getSearchParams 
} from '@/lib/api-helpers';
import { rumorIdSchema, nullifierHashSchema } from '@/lib/validations';
import { ERROR_CODES } from '@/types/api';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/rumors/[id]
 * Get a single rumor with vote statistics
 * 
 * Query params:
 * - voterNullifier: (optional) Check if this user has voted
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    
    // Validate rumor ID format
    let validatedId: string;
    try {
      validatedId = rumorIdSchema.parse(id);
    } catch {
      return errorResponse(
        'Invalid rumor ID format',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }
    
    // Get the rumor
    const rumor = await Rumor.findById(validatedId).lean();
    
    if (!rumor) {
      return errorResponse(
        'Rumor not found',
        ERROR_CODES.RUMOR_NOT_FOUND,
        404
      );
    }
    
    // Get vote statistics
    const votes = await Vote.find({ rumorId: validatedId })
      .select('voteValue creditsSpent finalTrustScore')
      .lean();
    
    const trueVotes = votes.filter(v => v.voteValue).length;
    const falseVotes = votes.length - trueVotes;
    const totalCredits = votes.reduce((sum, v) => sum + v.creditsSpent, 0);
    const avgCreditsSpent = votes.length > 0 ? totalCredits / votes.length : 0;
    
    // Determine consensus
    let consensus: 'truth' | 'lie' | 'undetermined' = 'undetermined';
    if (votes.length >= 5) {
      consensus = trueVotes > falseVotes ? 'truth' : 'lie';
    }
    
    // Calculate age
    const ageHours = (Date.now() - new Date(rumor.createdAt).getTime()) / (1000 * 60 * 60);
    
    // Check if user has voted (if nullifier provided)
    const searchParams = getSearchParams(request);
    const voterNullifier = searchParams.get('voterNullifier');
    
    let userVote = null;
    if (voterNullifier) {
      try {
        const validatedNullifier = nullifierHashSchema.parse(voterNullifier);
        const existingVote = await Vote.findOne({
          rumorId: validatedId,
          voterNullifier: validatedNullifier,
        }).lean();
        
        if (existingVote) {
          userVote = {
            hasVoted: true,
            voteValue: existingVote.voteValue,
            creditsSpent: existingVote.creditsSpent,
            trustScoreEarned: existingVote.finalTrustScore,
          };
        } else {
          userVote = { hasVoted: false };
        }
      } catch {
        // Invalid nullifier format, ignore
      }
    }
    
    return successResponse({
      rumor: {
        _id: rumor._id.toString(),
        content: rumor.content,
        truthScore: rumor.truthScore,
        totalVotes: votes.length,
        trueVotes,
        falseVotes,
        avgCredits: Math.round(avgCreditsSpent * 10) / 10,
        consensus,
        status: rumor.status,
        createdAt: rumor.createdAt,
        updatedAt: rumor.updatedAt,
        ageHours: Math.round(ageHours * 10) / 10,
      },
      userVote,
    });
    
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/rumors/[id]
 * Soft-delete a rumor (set status='deleted')
 * 
 * Body: {
 *   requesterNullifier: string - Must be the original submitter
 * }
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();
    
    const { id } = await context.params;
    
    // Validate rumor ID format
    let validatedId: string;
    try {
      validatedId = rumorIdSchema.parse(id);
    } catch {
      return errorResponse(
        'Invalid rumor ID format',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { requesterNullifier } = body;
    
    // Validate nullifier
    if (!requesterNullifier) {
      return errorResponse(
        'requesterNullifier is required',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }
    
    let validatedNullifier: string;
    try {
      validatedNullifier = nullifierHashSchema.parse(requesterNullifier);
    } catch {
      return errorResponse(
        'Invalid nullifier format',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }
    
    // Get the rumor
    const rumor = await Rumor.findById(validatedId);
    
    if (!rumor) {
      return errorResponse(
        'Rumor not found',
        ERROR_CODES.RUMOR_NOT_FOUND,
        404
      );
    }
    
    // Check if already deleted
    if (rumor.status === 'deleted') {
      return errorResponse(
        'Rumor is already deleted',
        ERROR_CODES.RUMOR_DELETED,
        400
      );
    }
    
    // Verify ownership - only submitter can delete
    if (rumor.submitterNullifier !== validatedNullifier) {
      return errorResponse(
        'Only the original submitter can delete this rumor',
        ERROR_CODES.UNAUTHORIZED,
        403
      );
    }
    
    // Soft delete - the post('save') hook will zero out dependencies
    rumor.status = 'deleted';
    await rumor.save();
    
    return successResponse(
      { deleted: true, rumorId: validatedId },
      'Rumor deleted successfully'
    );
    
  } catch (error) {
    return handleError(error);
  }
}
