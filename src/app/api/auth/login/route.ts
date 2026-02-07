/**
 * Login API Endpoint
 * POST /api/auth/login
 * 
 * Verifies that a user's nullifier hash exists in the database
 * Used for login from a new device after regenerating the hash client-side
 * Part of the Identity Gateway (Module 1)
 * 
 * Important: The server only receives the hash, never the email or secret phrase
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { loginUser, getUserByNullifier } from '@/services/identity/brain-wallet';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { ERROR_CODES } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();
    
    // Parse request body
    const body = await request.json();
    const { nullifierHash } = body;
    
    // Validate nullifier hash format (64 hex characters for SHA256)
    if (!nullifierHash || typeof nullifierHash !== 'string' || 
        !/^[a-f0-9]{64}$/.test(nullifierHash)) {
      return errorResponse(
        'Invalid nullifier hash format',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }
    
    // Attempt login
    const result = await loginUser(nullifierHash);
    
    if (!result.success) {
      return errorResponse(
        result.error || 'Login failed. User not found.',
        ERROR_CODES.USER_NOT_FOUND,
        404
      );
    }
    
    // Get user info
    const user = await getUserByNullifier(nullifierHash);
    
    return successResponse(
      {
        authenticated: true,
        user: {
          nullifierHash,
          reputationScore: user?.reputationScore ?? 1.0,
          createdAt: user?.createdAt,
          lastActive: user?.lastActive,
        },
        message: 'Login successful. Welcome back!',
      },
      'Login successful'
    );
    
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(
      'An error occurred during login',
      ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Check if a nullifier exists (for client-side validation)
 * GET /api/auth/login?hash=<nullifierHash>
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();
    
    // Get nullifier hash from query params
    const { searchParams } = new URL(request.url);
    const nullifierHash = searchParams.get('hash');
    
    // Validate nullifier hash format
    if (!nullifierHash || !/^[a-f0-9]{64}$/.test(nullifierHash)) {
      return errorResponse(
        'Invalid nullifier hash format',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }
    
    // Check if user exists
    const user = await getUserByNullifier(nullifierHash);
    
    return successResponse({
      exists: !!user,
      reputationScore: user?.reputationScore ?? null,
    });
    
  } catch (error) {
    console.error('Check user error:', error);
    return errorResponse(
      'An error occurred while checking user',
      ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}
