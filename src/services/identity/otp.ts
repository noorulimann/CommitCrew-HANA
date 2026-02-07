/**
 * OTP (One-Time Password) Service
 * 
 * Generates and verifies 6-digit OTPs with 5-minute expiry
 * Used for email verification in the Identity Gateway
 */

import { OTP } from '@/database/schemas';
import { sha256Sync } from '@/utils/crypto/hash';

/**
 * OTP Configuration
 */
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  MAX_ATTEMPTS: 3,
};

/**
 * Generate a cryptographically secure 6-digit OTP
 * @returns string - 6-digit OTP code
 */
export function generateOTPCode(): string {
  // Generate random bytes and convert to number
  const randomBytes = new Uint8Array(4);
  
  // Use crypto.getRandomValues in browser, or Node.js crypto
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    // Fallback for Node.js
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto');
    const buffer = nodeCrypto.randomBytes(4);
    for (let i = 0; i < 4; i++) {
      randomBytes[i] = buffer[i];
    }
  }
  
  // Convert to number and take last 6 digits
  const number = randomBytes.reduce((acc, byte, i) => acc + byte * Math.pow(256, i), 0);
  const otp = (number % 1000000).toString().padStart(6, '0');
  
  return otp;
}

/**
 * Create a new OTP for an email address
 * @param email - The email to send OTP to
 * @returns Object containing OTP code and expiry time
 */
export async function createOTP(email: string): Promise<{
  otpCode: string;
  expiresAt: Date;
  emailHash: string;
}> {
  const normalizedEmail = email.toLowerCase().trim();
  const emailHash = sha256Sync(`email:${normalizedEmail}`);
  const otpCode = generateOTPCode();
  const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);
  
  // Delete any existing OTPs for this email
  await OTP.deleteMany({ emailHash });
  
  // Create new OTP record
  await OTP.create({
    emailHash,
    otpCode,
    expiresAt,
    verified: false,
  });
  
  return { otpCode, expiresAt, emailHash };
}

/**
 * Verify an OTP code for an email
 * @param email - The email address
 * @param code - The OTP code to verify
 * @returns Object with verification result
 */
export async function verifyOTP(email: string, code: string): Promise<{
  success: boolean;
  error?: string;
  emailHash?: string;
}> {
  const normalizedEmail = email.toLowerCase().trim();
  const emailHash = sha256Sync(`email:${normalizedEmail}`);
  
  // Find the OTP record
  const otpRecord = await OTP.findOne({ emailHash });
  
  if (!otpRecord) {
    return { success: false, error: 'No OTP found. Please request a new code.' };
  }
  
  // Check if expired
  if (new Date() > otpRecord.expiresAt) {
    await OTP.deleteOne({ emailHash });
    return { success: false, error: 'OTP has expired. Please request a new code.' };
  }
  
  // Check if already verified
  if (otpRecord.verified) {
    return { success: false, error: 'OTP already used. Please request a new code.' };
  }
  
  // Verify the code
  if (otpRecord.otpCode !== code) {
    return { success: false, error: 'Invalid OTP code.' };
  }
  
  // Mark as verified
  await OTP.updateOne({ emailHash }, { $set: { verified: true } });
  
  return { success: true, emailHash };
}

/**
 * Check if an email has a valid (unused) OTP
 * @param email - The email to check
 * @returns boolean
 */
export async function hasValidOTP(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const emailHash = sha256Sync(`email:${normalizedEmail}`);
  
  const otpRecord = await OTP.findOne({ 
    emailHash,
    expiresAt: { $gt: new Date() },
    verified: false,
  });
  
  return !!otpRecord;
}

/**
 * Check if an email has been verified (via OTP)
 * @param email - The email to check
 * @returns boolean
 */
export async function isEmailVerified(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const emailHash = sha256Sync(`email:${normalizedEmail}`);
  
  const otpRecord = await OTP.findOne({ 
    emailHash,
    verified: true,
  });
  
  return !!otpRecord;
}

/**
 * Clean up expired OTPs
 * Called periodically or by TTL index
 */
export async function cleanupExpiredOTPs(): Promise<number> {
  const result = await OTP.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  
  return result.deletedCount;
}

const otpService = {
  generateOTPCode,
  createOTP,
  verifyOTP,
  hasValidOTP,
  isEmailVerified,
  cleanupExpiredOTPs,
  OTP_CONFIG,
};

export default otpService;
