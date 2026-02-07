/**
 * Quadratic Voting Logic
 * Part of Module 2: Trust Scoring Algorithm
 * 
 * Core concept: vote_weight = √(credits_spent)
 * This makes it expensive to dominate votes:
 * - To double influence, you must quadruple credits (2² = 4)
 * - Prevents bot-swarming and coordinated manipulation
 */

import { MAX_VOTE_CREDITS, MIN_VOTE_CREDITS } from './constants';

/**
 * Calculate quadratic vote weight from credits spent
 * @param creditsSpent - Number of credits (1-100)
 * @returns Quadratic weight = √credits
 */
export function calculateQuadraticWeight(creditsSpent: number): number {
  // Validate credits are within bounds
  const validCredits = Math.max(MIN_VOTE_CREDITS, Math.min(MAX_VOTE_CREDITS, creditsSpent));
  return Math.sqrt(validCredits);
}

/**
 * Calculate the cost to achieve a desired vote weight
 * @param desiredWeight - The vote weight you want
 * @returns Credits needed = weight²
 */
export function creditsNeededForWeight(desiredWeight: number): number {
  const credits = Math.pow(desiredWeight, 2);
  return Math.min(MAX_VOTE_CREDITS, Math.ceil(credits));
}

/**
 * Calculate total influence from multiple voters
 * Used in Sybil resistance calculations
 * 
 * @param creditsList - Array of credits spent by each voter
 * @returns Total quadratic influence
 */
export function calculateGroupInfluence(creditsList: number[]): number {
  return creditsList.reduce((sum, credits) => sum + calculateQuadraticWeight(credits), 0);
}

/**
 * Calculate cost efficiency of splitting credits
 * Demonstrates why it's inefficient to create multiple accounts
 * 
 * Single account: √(total_credits)
 * Multiple accounts: sum of √(credits_each)
 * 
 * @param totalCredits - Total credits available
 * @param numAccounts - Number of accounts to split across
 * @returns Efficiency ratio (< 1 means splitting is wasteful)
 */
export function calculateSplitEfficiency(totalCredits: number, numAccounts: number): number {
  if (numAccounts <= 0 || totalCredits <= 0) return 0;
  
  // Single account influence
  const singleInfluence = calculateQuadraticWeight(totalCredits);
  
  // Split equally across accounts
  const creditsPerAccount = totalCredits / numAccounts;
  const splitInfluence = calculateGroupInfluence(Array(numAccounts).fill(creditsPerAccount));
  
  // Return efficiency (< 1 means concentrated is better for the individual,
  // but quadratic voting makes this costly overall)
  return splitInfluence / singleInfluence;
}

/**
 * Validate credits value
 * @param credits - Credits to validate
 * @returns Object with validity and error message
 */
export function validateCredits(credits: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(credits)) {
    return { valid: false, error: 'Credits must be a whole number' };
  }
  if (credits < MIN_VOTE_CREDITS) {
    return { valid: false, error: `Must spend at least ${MIN_VOTE_CREDITS} credit` };
  }
  if (credits > MAX_VOTE_CREDITS) {
    return { valid: false, error: `Cannot spend more than ${MAX_VOTE_CREDITS} credits` };
  }
  return { valid: true };
}

/**
 * Get vote weight preview for UI display
 * @param credits - Credits to spend
 * @returns Formatted weight info
 */
export function getVoteWeightPreview(credits: number): {
  credits: number;
  weight: number;
  weightFormatted: string;
  doubleWeightCost: number;
} {
  const weight = calculateQuadraticWeight(credits);
  return {
    credits,
    weight,
    weightFormatted: weight.toFixed(2),
    doubleWeightCost: Math.min(MAX_VOTE_CREDITS, Math.pow(weight * 2, 2)),
  };
}
