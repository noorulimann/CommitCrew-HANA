/**
 * Verify OTP API Endpoint
 * POST /api/auth/verify-otp
 * 
 * Verifies a 6-digit OTP code sent to a .edu email
 * Part of the Identity Gateway (Module 1)
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyOTP } from '@/services/identity/otp';
import { validateEmail } from '@/utils/validation/email';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { ERROR_CODES } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();
    
    // Parse request body
    const body = await request.json();
    const { email, otp } = body;
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return errorResponse(
        emailValidation.error || 'Invalid email',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }
    
    // Validate OTP format
    if (!otp || typeof otp !== 'string' || otp.length !== 6) {
      return errorResponse(
        'Invalid OTP format. Must be 6 digits.',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }
    
    // Verify OTP
    const result = await verifyOTP(email, otp);
    
    if (!result.success) {
      return errorResponse(
        result.error || 'Invalid OTP',
        ERROR_CODES.OTP_INVALID,
        400
      );
    }
    
    return successResponse(
      {
        verified: true,
        emailHash: result.emailHash,
        message: 'Email verified successfully',
      },
      'OTP verified successfully'
    );
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    return errorResponse(
      'An error occurred while verifying the code',
      ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}
