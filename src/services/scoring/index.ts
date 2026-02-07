/**
 * Scoring Services - Module 2: Trust Scoring Algorithm
 * 
 * This module implements the Quadratic Bayesian Scoring (QBS) system:
 * 
 * 1. Quadratic Voting: vote_weight = √(credits_spent)
 *    - Makes coordinate manipulation expensive
 *    - Fair for individual voters
 * 
 * 2. Bayesian Truth Serum: Rewards "surprising truth" predictions
 *    - Bonus for predicting consensus correctly but voting differently
 *    - Bonus for correctly predicting minority outcome
 * 
 * 3. Reputation System: Accuracy-based trust
 *    - Higher reputation = more vote influence
 *    - Uses moving average: newRep = (oldRep × 0.9) + (accuracy × 0.1)
 * 
 * Final Trust Score Formula:
 * Trust_Score = (Vote_Weight × Reputation) + Bayesian_Bonus
 */

// Constants
export * from './constants';

// Quadratic Voting
export {
  calculateQuadraticWeight,
  creditsNeededForWeight,
  calculateGroupInfluence,
  calculateSplitEfficiency,
  validateCredits,
  getVoteWeightPreview,
} from './quadratic';

// Bayesian Truth Serum
export {
  calculateConsensus,
  calculateWeightedConsensus,
  calculateBayesianBonus,
  previewBayesianBonus,
  type VoteData,
  type ConsensusInfo,
} from './bayesian';

// Reputation System
export {
  calculateAccuracyScore,
  calculateNewReputation,
  updateReputation,
  getReputationTier,
  calculateEffectiveInfluence,
  getDefaultReputation,
  previewReputationChange,
  type VoteAccuracyData,
  type ReputationUpdateResult,
} from './reputation';

// ============================================
// Unified Trust Score Calculator
// ============================================

import { calculateQuadraticWeight, validateCredits } from './quadratic';
import { calculateBayesianBonus, calculateConsensus, VoteData } from './bayesian';

export interface TrustScoreInput {
  creditsSpent: number;
  voteValue: boolean;
  predictedConsensus?: boolean;
  voterReputation: number;
  existingVotes: VoteData[];
}

export interface TrustScoreResult {
  quadraticWeight: number;
  bayesianBonus: number;
  finalTrustScore: number;
  effectiveInfluence: number;
  breakdown: {
    baseWeight: number;
    reputationMultiplier: number;
    bonusEarned: number;
  };
}

/**
 * Calculate complete trust score for a vote
 * This is the main function used by the Vote model hooks
 * 
 * @param input - All inputs needed for trust score calculation
 * @returns Complete trust score breakdown
 */
export function calculateTrustScore(input: TrustScoreInput): TrustScoreResult {
  const {
    creditsSpent,
    voteValue,
    predictedConsensus,
    voterReputation,
    existingVotes,
  } = input;

  // Validate credits
  const creditsValidation = validateCredits(creditsSpent);
  if (!creditsValidation.valid) {
    throw new Error(creditsValidation.error);
  }

  // Calculate quadratic weight
  const quadraticWeight = calculateQuadraticWeight(creditsSpent);

  // Calculate consensus from existing votes
  const consensus = calculateConsensus(existingVotes);

  // Calculate Bayesian bonus
  const bayesianBonus = calculateBayesianBonus(
    voteValue,
    predictedConsensus,
    consensus.consensusValue,
    voterReputation,
    consensus.isConsensusReached
  );

  // Calculate final trust score: (weight × reputation) + bonus
  const effectiveInfluence = quadraticWeight * voterReputation;
  const finalTrustScore = effectiveInfluence + bayesianBonus;

  return {
    quadraticWeight,
    bayesianBonus,
    finalTrustScore,
    effectiveInfluence,
    breakdown: {
      baseWeight: quadraticWeight,
      reputationMultiplier: voterReputation,
      bonusEarned: bayesianBonus,
    },
  };
}

/**
 * Calculate aggregate truth score for a rumor
 * Positive scores for "truth" votes, negative for "lie" votes
 * 
 * @param votes - All votes on the rumor
 * @returns Aggregate truth score
 */
export function calculateAggregateTruthScore(
  votes: Array<{ voteValue: boolean; finalTrustScore: number }>
): number {
  return votes.reduce((sum, vote) => {
    return sum + (vote.voteValue ? vote.finalTrustScore : -vote.finalTrustScore);
  }, 0);
}
