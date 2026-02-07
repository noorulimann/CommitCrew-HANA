import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { createOTP, isEmailVerified } from '@/services/identity/otp';
import { sendOTPEmail } from '@/services/identity/email';
import { validateEmail } from '@/utils/validation/email';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { ERROR_CODES } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { email } = body;
    
    // 1. Validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid || !email.endsWith('@nu.edu.pk')) {
      return errorResponse(
        'Please use a valid @nu.edu.pk email address',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }
    
    // 2. Check if user is returning user
    const isReturningUser = await isEmailVerified(email);
    
    // If returning user, don't send OTP
    // They should use their secret phrase instead
    if (isReturningUser) {
      return successResponse(
        {
          message: 'User recognized. Please use your secret phrase to login.',
          isReturningUser: true,
          expiresAt: null,
        },
        'Returning user detected'
      );
    }
    
    // 3. For new users, create and send OTP
    const { otpCode, expiresAt } = await createOTP(email);
    
    // 4. Email Action
    const emailResult = await sendOTPEmail(email, otpCode, 5);
    
    if (!emailResult.success) {
      // Log the specific error to your terminal for debugging
      console.error("SMTP Configuration Error:", emailResult.error);

      // In production, we must fail if the email didn't send
      if (process.env.NODE_ENV !== 'development') {
        return errorResponse(
          'Failed to send email. Ensure your SMTP credentials are correct.',
          ERROR_CODES.INTERNAL_ERROR,
          500
        );
      }
    }
    
    return successResponse(
      {
        message: 'Verification code sent to your email',
        expiresAt: expiresAt.toISOString(),
        isReturningUser: false,
        ...(process.env.NODE_ENV === 'development' && { devOtp: otpCode }),
      },
      'OTP sent successfully'
    );
    
  } catch (error) {
    console.error('Critical Send OTP error:', error);
    return errorResponse(
      'An internal error occurred. Please check server logs.',
      ERROR_CODES.INTERNAL_ERROR,
      500
    );
  }
}