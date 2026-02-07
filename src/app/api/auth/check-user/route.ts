/**
 * Check User API Endpoint
 * POST /api/auth/check-user
 * 
 * Checks if an email is a returning user (has verified OTP) or new user
 * Helps determine the authentication flow (OTP or direct phrase entry)
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { isEmailVerified } from '@/services/identity/otp';
import { validateEmail } from '@/utils/validation/email';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { ERROR_CODES } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();
    
    // Parse request body
    const body = await request.json();
    const { email } = body;
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return errorResponse(
        emailValidation.error || 'Invalid email',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }
    
    // Check if email is verified (has been used to register before)
    const isReturningUser = await isEmailVerified(email);
    
    return successResponse(
      {
        email,
        isReturningUser,
        message: isReturningUser 
          ? 'Welcome back! Please enter your secret phrase.'
          : 'New user detected. Sending verification code...',
      },
      'User check completed'
    );
    
  } catch (error) {
    console.error('Check user error:', error);
    return errorResponse(
      'An error occurred while checking user status',
      ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}
