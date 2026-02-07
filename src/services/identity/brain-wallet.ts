/**
 * Brain Wallet Service
 * 
 * Manages the "brain wallet" concept for Citadel of Truth:
 * - Secret phrase is the "private key" stored in user's memory
 * - Same email + same phrase = same hash (deterministic)
 * - Works across any device without transferring files
 * 
 * This service handles client-side identity generation and verification
 */

import { User } from '@/database/schemas';
import { generateNullifier, generateVoteNullifier } from '@/utils/crypto/nullifier';
import { validateSecretPhrase } from '@/utils/validation/secretPhrase';

/**
 * Result of identity creation
 */
export interface IdentityResult {
  success: boolean;
  nullifierHash?: string;
  error?: string;
  isNewUser?: boolean;
}

/**
 * Generate identity hash on the client side
 * This should be called from the browser
 * 
 * @param email - User's verified email
 * @param secretPhrase - User's secret phrase
 * @returns Promise<string> - The nullifier hash
 */
export async function generateIdentity(
  email: string,
  secretPhrase: string
): Promise<string> {
  const validation = validateSecretPhrase(secretPhrase);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid secret phrase');
  }
  
  return generateNullifier(email, secretPhrase);
}

/**
 * Register a new user with their nullifier hash
 * Called after email verification and identity generation
 * 
 * @param nullifierHash - The user's nullifier hash (generated client-side)
 * @returns Promise<IdentityResult>
 */
export async function registerUser(nullifierHash: string): Promise<IdentityResult> {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ nullifierHash });
    
    if (existingUser) {
      return {
        success: true,
        nullifierHash,
        isNewUser: false,
      };
    }
    
    // Create new user
    await User.create({
      nullifierHash,
      reputationScore: 1.0,
      lastActive: new Date(),
    });
    
    return {
      success: true,
      nullifierHash,
      isNewUser: true,
    };
  } catch (error) {
    console.error('Error registering user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register user',
    };
  }
}

/**
 * Login an existing user by verifying their nullifier hash exists
 * 
 * @param nullifierHash - The user's nullifier hash (regenerated client-side)
 * @returns Promise<IdentityResult>
 */
export async function loginUser(nullifierHash: string): Promise<IdentityResult> {
  try {
    const user = await User.findOne({ nullifierHash });
    
    if (!user) {
      return {
        success: false,
        error: 'User not found. Please register first.',
      };
    }
    
    // Update last active timestamp
    await User.updateOne(
      { nullifierHash },
      { $set: { lastActive: new Date() } }
    );
    
    return {
      success: true,
      nullifierHash,
      isNewUser: false,
    };
  } catch (error) {
    console.error('Error logging in user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to login',
    };
  }
}

/**
 * Check if a nullifier hash exists in the database
 * 
 * @param nullifierHash - The nullifier hash to check
 * @returns Promise<boolean>
 */
export async function nullifierExists(nullifierHash: string): Promise<boolean> {
  const user = await User.findOne({ nullifierHash });
  return !!user;
}

/**
 * Get user info by nullifier hash
 * 
 * @param nullifierHash - The user's nullifier hash
 * @returns Promise<User | null>
 */
export async function getUserByNullifier(nullifierHash: string) {
  return User.findOne({ nullifierHash }).lean();
}

/**
 * Check if user has already voted on a rumor
 * 
 * @param userNullifier - The user's nullifier hash
 * @param rumorId - The rumor ID
 * @returns Promise<boolean>
 */
export async function hasUserVoted(
  userNullifier: string,
  rumorId: string
): Promise<boolean> {
  const { Vote } = await import('@/database/schemas');
  const voteNullifier = await generateVoteNullifier(userNullifier, rumorId);
  
  const existingVote = await Vote.findOne({ voteNullifier });
  return !!existingVote;
}

/**
 * Get user's reputation score
 * 
 * @param nullifierHash - The user's nullifier hash
 * @returns Promise<number> - Reputation score (default 1.0)
 */
export async function getUserReputation(nullifierHash: string): Promise<number> {
  const user = await User.findOne({ nullifierHash });
  return user?.reputationScore ?? 1.0;
}

const brainWalletService = {
  generateIdentity,
  registerUser,
  loginUser,
  nullifierExists,
  getUserByNullifier,
  hasUserVoted,
  getUserReputation,
};

export default brainWalletService;
