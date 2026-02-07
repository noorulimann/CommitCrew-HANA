/**
 * Reputation Tracking System
 * Part of Module 2: Trust Scoring Algorithm
 * 
 * Core concept: Reputation is earned by being right when the majority is wrong
 * 
 * Reputation affects:
 * 1. Vote weight multiplier (higher rep = more influence)
 * 2. Bayesian bonus amount (higher rep = higher bonus potential)
 * 
 * Reputation updates:
 * - Based on voting accuracy (votes matching final consensus)
 * - Uses moving average: newRep = (oldRep × 0.9) + (accuracy × 0.1)
 * - This prevents rapid reputation swings while rewarding consistency
 */

import {
  DEFAULT_REPUTATION_SCORE,
  MIN_REPUTATION_SCORE,
  MAX_REPUTATION_SCORE,
  REPUTATION_DECAY_FACTOR,
  ACCURACY_WEIGHT,
  MIN_VOTES_FOR_REPUTATION_UPDATE,
} from './constants';

export interface VoteAccuracyData {
  voteValue: boolean;
  rumorConsensus: boolean; // What the rumor's final consensus was
}

export interface ReputationUpdateResult {
  previousReputation: number;
  newReputation: number;
  accuracyScore: number;
  votesAnalyzed: number;
  correctVotes: number;
  change: number;
}

/**
 * Calculate accuracy score from voting history
 * @param votes - Array of user's votes with consensus info
 * @returns Accuracy between 0 and 1
 */
export function calculateAccuracyScore(votes: VoteAccuracyData[]): number {
  if (votes.length === 0) return 0.5; // Neutral if no votes
  
  const correctVotes = votes.filter(v => v.voteValue === v.rumorConsensus).length;
  return correctVotes / votes.length;
}

/**
 * Update reputation using moving average formula
 * newRep = (oldRep × DECAY_FACTOR) + (accuracy × ACCURACY_WEIGHT)
 * 
 * @param currentReputation - User's current reputation
 * @param accuracyScore - Recent accuracy (0-1)
 * @returns New reputation score (bounded)
 */
export function calculateNewReputation(
  currentReputation: number,
  accuracyScore: number
): number {
  // Moving average calculation
  const newRep = (currentReputation * REPUTATION_DECAY_FACTOR) + (accuracyScore * ACCURACY_WEIGHT);
  
  // Bound between min and max
  return Math.max(MIN_REPUTATION_SCORE, Math.min(MAX_REPUTATION_SCORE, newRep));
}

/**
 * Full reputation update for a user
 * @param currentReputation - User's current reputation
 * @param recentVotes - User's recent votes with consensus info
 * @returns Detailed update result
 */
export function updateReputation(
  currentReputation: number,
  recentVotes: VoteAccuracyData[]
): ReputationUpdateResult {
  // Not enough votes for meaningful update
  if (recentVotes.length < MIN_VOTES_FOR_REPUTATION_UPDATE) {
    return {
      previousReputation: currentReputation,
      newReputation: currentReputation,
      accuracyScore: 0,
      votesAnalyzed: recentVotes.length,
      correctVotes: 0,
      change: 0,
    };
  }

  const correctVotes = recentVotes.filter(v => v.voteValue === v.rumorConsensus).length;
  const accuracyScore = correctVotes / recentVotes.length;
  const newReputation = calculateNewReputation(currentReputation, accuracyScore);

  return {
    previousReputation: currentReputation,
    newReputation,
    accuracyScore,
    votesAnalyzed: recentVotes.length,
    correctVotes,
    change: newReputation - currentReputation,
  };
}

/**
 * Get reputation tier for display purposes
 * @param reputation - User's reputation score
 * @returns Tier info
 */
export function getReputationTier(reputation: number): {
  tier: 'novice' | 'trusted' | 'expert' | 'oracle';
  label: string;
  minScore: number;
  nextTierScore: number | null;
} {
  if (reputation >= 3.0) {
    return {
      tier: 'oracle',
      label: 'Oracle',
      minScore: 3.0,
      nextTierScore: null, // Max tier
    };
  }
  if (reputation >= 2.0) {
    return {
      tier: 'expert',
      label: 'Expert',
      minScore: 2.0,
      nextTierScore: 3.0,
    };
  }
  if (reputation >= 1.5) {
    return {
      tier: 'trusted',
      label: 'Trusted',
      minScore: 1.5,
      nextTierScore: 2.0,
    };
  }
  return {
    tier: 'novice',
    label: 'Novice',
    minScore: 0,
    nextTierScore: 1.5,
  };
}

/**
 * Calculate effective vote influence
 * Combines quadratic weight with reputation multiplier
 * 
 * @param quadraticWeight - Base weight from √credits
 * @param reputation - User's reputation
 * @returns Effective influence
 */
export function calculateEffectiveInfluence(
  quadraticWeight: number,
  reputation: number
): number {
  return quadraticWeight * reputation;
}

/**
 * Get default reputation for new users
 */
export function getDefaultReputation(): number {
  return DEFAULT_REPUTATION_SCORE;
}

/**
 * Preview reputation change
 * Shows what would happen if user's accuracy changed
 * 
 * @param currentReputation - Current reputation
 * @param simulatedAccuracy - Hypothetical accuracy
 * @returns Preview of reputation change
 */
export function previewReputationChange(
  currentReputation: number,
  simulatedAccuracy: number
): {
  currentReputation: number;
  projectedReputation: number;
  change: number;
  percentChange: number;
} {
  const projected = calculateNewReputation(currentReputation, simulatedAccuracy);
  const change = projected - currentReputation;
  
  return {
    currentReputation,
    projectedReputation: projected,
    change,
    percentChange: currentReputation > 0 ? (change / currentReputation) * 100 : 0,
  };
}
