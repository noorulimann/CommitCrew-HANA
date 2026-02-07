/**
 * Rumors API Endpoint
 * POST /api/rumors - Create a new rumor
 * GET /api/rumors - List active rumors (ranked)
 * 
 * Part of Phase 4: Core UI & Rumor Management
 * Basic implementation for Phase 3 QA testing
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Rumor, User } from '@/database/schemas';
import { 
  errorResponse, 
  successResponse, 
  handleError,
  getPaginationParams 
} from '@/lib/api-helpers';
import { createRumorSchema } from '@/lib/validations';
import { ERROR_CODES } from '@/types/api';

/**
 * POST /api/rumors
 * Create a new rumor
 * 
 * Body: {
 *   content: string (10-1000 chars),
 *   submitterNullifier: string (64 hex chars)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createRumorSchema.parse(body);
    
    const { content, submitterNullifier } = validatedData;
    
    // Verify user exists
    const user = await User.findOne({ nullifierHash: submitterNullifier });
    if (!user) {
      return errorResponse(
        'User not found. Please register first.',
        ERROR_CODES.USER_NOT_FOUND,
        404
      );
    }
    
    // Create rumor
    const rumor = new Rumor({
      content,
      submitterNullifier,
      truthScore: 0,
      totalVotes: 0,
      status: 'active',
    });
    
    await rumor.save();
    
    // Update user's last active
    user.lastActive = new Date();
    await user.save();
    
    return successResponse(
      {
        _id: rumor._id.toString(),
        content: rumor.content,
        truthScore: rumor.truthScore,
        totalVotes: rumor.totalVotes,
        status: rumor.status,
        createdAt: rumor.createdAt.toISOString(),
      },
      'Rumor created successfully'
    );
    
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/rumors
 * List active rumors, ranked by score/age
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by status (default: active)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { page, limit, skip } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    
    // Get rumors with pagination
    const query = status === 'all' ? {} : { status };
    
    const [rumors, total] = await Promise.all([
      Rumor.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Rumor.countDocuments(query),
    ]);
    
    // Calculate age and rank score for each rumor
    const rankedRumors = rumors.map(rumor => {
      const ageHours = (Date.now() - new Date(rumor.createdAt).getTime()) / (1000 * 60 * 60);
      const rankScore = rumor.truthScore / (1 + Math.pow(ageHours, 1.5));
      
      return {
        _id: rumor._id.toString(),
        content: rumor.content,
        truthScore: rumor.truthScore,
        totalVotes: rumor.totalVotes,
        status: rumor.status,
        createdAt: rumor.createdAt,
        updatedAt: rumor.updatedAt,
        ageHours: Math.round(ageHours * 10) / 10,
        rankScore: Math.round(rankScore * 100) / 100,
      };
    });
    
    // Sort by rank score
    rankedRumors.sort((a, b) => b.rankScore - a.rankScore);
    
    return successResponse({
      data: rankedRumors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    return handleError(error);
  }
}
