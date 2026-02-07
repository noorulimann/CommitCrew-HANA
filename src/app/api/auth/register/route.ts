/**
 * Register API Endpoint
 * POST /api/auth/register
 * 
 * Registers a new user with their nullifier hash
 * Called after email verification and client-side identity generation
 * Part of the Identity Gateway (Module 1)
 * 
 * Important: The server only receives the hash, never the email or secret phrase
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { registerUser, nullifierExists } from '@/services/identity/brain-wallet';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { ERROR_CODES } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();
    
    // Parse request body
    const body = await request.json();
    const { nullifierHash, emailHash } = body;
    
    // Validate nullifier hash format (64 hex characters for SHA256)
    if (!nullifierHash || typeof nullifierHash !== 'string' || 
        !/^[a-f0-9]{64}$/.test(nullifierHash)) {
      return errorResponse(
        'Invalid nullifier hash format',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }
    
    // Verify that email was verified via OTP (if emailHash provided)
    // This is optional additional verification
    if (emailHash) {
      const { OTP } = await import('@/database/schemas');
      const otpRecord = await OTP.findOne({ emailHash, verified: true });
      
      if (!otpRecord) {
        return errorResponse(
          'Email not verified. Please complete OTP verification first.',
          ERROR_CODES.UNAUTHORIZED,
          401
        );
      }
    }
    
    // Check if user already exists
    const exists = await nullifierExists(nullifierHash);
    if (exists) {
      return successResponse(
        {
          registered: true,
          isNewUser: false,
          message: 'User already registered. You can login.',
        },
        'User already exists'
      );
    }
    
    // Register new user
    const result = await registerUser(nullifierHash);
    
    if (!result.success) {
      return errorResponse(
        result.error || 'Registration failed',
        ERROR_CODES.INTERNAL_ERROR,
        500
      );
    }
    
    return successResponse(
      {
        registered: true,
        isNewUser: true,
        message: 'Registration successful. Welcome to Citadel of Truth!',
      },
      'Registration successful',
      201
    );
    
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse(
      'An error occurred during registration',
      ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}
