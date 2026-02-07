/**
 * Identity Services Index
 * 
 * Re-exports all identity-related services for the Identity Gateway module
 */

export { 
  generateOTPCode, 
  createOTP, 
  verifyOTP, 
  hasValidOTP, 
  isEmailVerified,
  cleanupExpiredOTPs,
  OTP_CONFIG,
} from './otp';

export { 
  sendOTPEmail, 
  verifyEmailConfig 
} from './email';

export { 
  generateIdentity,
  registerUser,
  loginUser,
  nullifierExists,
  getUserByNullifier,
  hasUserVoted,
  getUserReputation,
  type IdentityResult,
} from './brain-wallet';
