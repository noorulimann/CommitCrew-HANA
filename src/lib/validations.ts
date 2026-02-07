// Zod validation schemas for all entities
import { z } from 'zod';

// ============================================
// Email Validation
// ============================================
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .refine((email) => email.endsWith('.edu'), {
    message: 'Must be a valid .edu email address',
  });

// ============================================
// Secret Phrase Validation
// ============================================
export const secretPhraseSchema = z
  .string()
  .min(12, 'Secret phrase must be at least 12 characters')
  .refine(
    (phrase) => {
      // Either 12+ characters OR 3+ words
      const words = phrase.trim().split(/\s+/);
      return phrase.length >= 12 || words.length >= 3;
    },
    {
      message: 'Secret phrase must be at least 12 characters or 3 words',
    }
  );

// ============================================
// OTP Validation
// ============================================
export const otpSchema = z
  .string()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only digits');

// ============================================
// Nullifier Hash Validation
// ============================================
export const nullifierHashSchema = z
  .string()
  .length(64, 'Invalid nullifier hash')
  .regex(/^[a-f0-9]{64}$/, 'Invalid hash format');

// ============================================
// Rumor Validation
// ============================================
export const rumorContentSchema = z
  .string()
  .min(10, 'Rumor must be at least 10 characters')
  .max(1000, 'Rumor must be less than 1000 characters')
  .trim();

export const createRumorSchema = z.object({
  content: rumorContentSchema,
  submitterNullifier: nullifierHashSchema,
});

export const rumorIdSchema = z.string().regex(/^[a-f0-9]{24}$/, 'Invalid rumor ID');

// ============================================
// Vote Validation
// ============================================
export const creditsSchema = z
  .number()
  .int('Credits must be a whole number')
  .min(1, 'Must spend at least 1 credit')
  .max(100, 'Cannot spend more than 100 credits');

export const createVoteSchema = z.object({
  rumorId: rumorIdSchema,
  voterNullifier: nullifierHashSchema,
  voteValue: z.boolean(),
  creditsSpent: creditsSchema,
  predictedConsensus: z.boolean().optional(),
});

// ============================================
// Auth Validation
// ============================================
export const sendOtpSchema = z.object({
  email: emailSchema,
});

export const verifyOtpSchema = z.object({
  email: emailSchema,
  otpCode: otpSchema,
});

export const registerSchema = z.object({
  nullifierHash: nullifierHashSchema,
});

export const loginSchema = z.object({
  nullifierHash: nullifierHashSchema,
});

// ============================================
// Merkle Validation
// ============================================
export const merkleVerifySchema = z.object({
  rumorId: rumorIdSchema,
  blockHeight: z.number().int().positive().optional(),
});

// ============================================
// Type Exports (inferred from schemas)
// ============================================
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateRumorInput = z.infer<typeof createRumorSchema>;
export type CreateVoteInput = z.infer<typeof createVoteSchema>;
export type MerkleVerifyInput = z.infer<typeof merkleVerifySchema>;
