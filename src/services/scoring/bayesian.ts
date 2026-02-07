/**
 * Bayesian Truth Serum (BTS) Logic
 * Part of Module 2: Trust Scoring Algorithm
 * 
 * Core concept: Rewards users who predict "surprising truth" over "obvious lie"
 * 
 * The Bayesian Truth Serum works by:
 * 1. User votes True/False on a rumor
 * 2. User predicts what the majority will vote
 * 3. Bonus is awarded based on prediction accuracy and vote alignment
 * 
 * Key principle: It's harder to predict the truth than to lie about predicting it
 */

import {
  MIN_VOTES_FOR_BAYESIAN,
  SURPRISING_TRUTH_BONUS,
  MINORITY_CORRECT_BONUS,
} from './constants';

export interface VoteData {
  voteValue: boolean;
  finalTrustScore?: number;
}

export interface ConsensusInfo {
  trueVotes: number;
  falseVotes: number;
  totalVotes: number;
  consensusValue: boolean;
  consensusStrength: number; // 0-1, how strong the consensus is
  isConsensusReached: boolean;
}

/**
 * Calculate the current consensus from vote data
 * @param votes - Array of existing votes
 * @returns Consensus information
 */
export function calculateConsensus(votes: VoteData[]): ConsensusInfo {
  const trueVotes = votes.filter(v => v.voteValue).length;
  const falseVotes = votes.length - trueVotes;
  const totalVotes = votes.length;
  
  // Consensus is true if more true votes than false
  const consensusValue = trueVotes >= falseVotes; // True wins ties
  
  // Strength is how far from 50/50 the vote is
  const majorityVotes = Math.max(trueVotes, falseVotes);
  const consensusStrength = totalVotes > 0 ? majorityVotes / totalVotes : 0.5;
  
  return {
    trueVotes,
    falseVotes,
    totalVotes,
    consensusValue,
    consensusStrength,
    isConsensusReached: totalVotes >= MIN_VOTES_FOR_BAYESIAN,
  };
}

/**
 * Calculate weighted consensus (using trust scores)
 * More accurate representation of actual community belief
 * @param votes - Array of votes with trust scores
 * @returns Consensus based on weighted votes
 */
export function calculateWeightedConsensus(votes: VoteData[]): ConsensusInfo {
  const trueScore = votes
    .filter(v => v.voteValue)
    .reduce((sum, v) => sum + (v.finalTrustScore || 1), 0);
  
  const falseScore = votes
    .filter(v => !v.voteValue)
    .reduce((sum, v) => sum + (v.finalTrustScore || 1), 0);
  
  const totalScore = trueScore + falseScore;
  
  return {
    trueVotes: votes.filter(v => v.voteValue).length,
    falseVotes: votes.filter(v => !v.voteValue).length,
    totalVotes: votes.length,
    consensusValue: trueScore >= falseScore,
    consensusStrength: totalScore > 0 ? Math.max(trueScore, falseScore) / totalScore : 0.5,
    isConsensusReached: votes.length >= MIN_VOTES_FOR_BAYESIAN,
  };
}

/**
 * Calculate Bayesian bonus for a vote
 * 
 * Bonus scenarios:
 * 1. SURPRISING_TRUTH: Predicted consensus correctly BUT voted against it
 *    - Shows user understands crowd behavior but has private info
 *    - Bonus: reputation * 0.5
 * 
 * 2. MINORITY_CORRECT: Predicted minority AND was correct (minority became majority)
 *    - Shows user had insight before it was popular
 *    - Bonus: reputation * 0.3
 * 
 * @param voteValue - User's vote (true = Truth, false = Lie)
 * @param predictedConsensus - What user predicted majority would vote
 * @param actualConsensus - What the majority actually voted
 * @param voterReputation - User's current reputation score
 * @param hasEnoughVotes - Whether there are enough votes for Bayesian to apply
 * @returns Bayesian bonus amount
 */
export function calculateBayesianBonus(
  voteValue: boolean,
  predictedConsensus: boolean | undefined,
  actualConsensus: boolean,
  voterReputation: number,
  hasEnoughVotes: boolean
): number {
  // No bonus if prediction not made or not enough votes
  if (predictedConsensus === undefined || !hasEnoughVotes) {
    return 0;
  }

  // Scenario 1: Predicted consensus correctly but voted differently (surprising truth)
  // User understood what crowd would think but had different private information
  if (predictedConsensus === actualConsensus && voteValue !== predictedConsensus) {
    return voterReputation * SURPRISING_TRUTH_BONUS;
  }

  // Scenario 2: Predicted minority but was actually correct
  // User predicted something unpopular but it turned out to match their vote
  if (predictedConsensus !== actualConsensus && voteValue === predictedConsensus) {
    return voterReputation * MINORITY_CORRECT_BONUS;
  }

  // No bonus for:
  // - Predicted consensus and voted with consensus (too easy)
  // - Predicted minority but voted differently (confused)
  return 0;
}

/**
 * Preview what bonus user might get
 * Useful for UI to show potential outcomes
 * 
 * @param voteValue - User's vote
 * @param predictedConsensus - User's prediction
 * @param currentConsensus - Current consensus info
 * @param voterReputation - User's reputation
 * @returns Potential bonus scenarios
 */
export function previewBayesianBonus(
  voteValue: boolean,
  predictedConsensus: boolean | undefined,
  currentConsensus: ConsensusInfo,
  voterReputation: number
): {
  potentialBonus: number;
  bonusType: 'none' | 'surprising_truth' | 'minority_correct';
  explanation: string;
} {
  if (predictedConsensus === undefined) {
    return {
      potentialBonus: 0,
      bonusType: 'none',
      explanation: 'Make a prediction to potentially earn a bonus',
    };
  }

  if (!currentConsensus.isConsensusReached) {
    return {
      potentialBonus: 0,
      bonusType: 'none',
      explanation: `Bonus applies after ${MIN_VOTES_FOR_BAYESIAN} votes`,
    };
  }

  const bonus = calculateBayesianBonus(
    voteValue,
    predictedConsensus,
    currentConsensus.consensusValue,
    voterReputation,
    currentConsensus.isConsensusReached
  );

  if (bonus > 0) {
    if (predictedConsensus === currentConsensus.consensusValue && voteValue !== predictedConsensus) {
      return {
        potentialBonus: bonus,
        bonusType: 'surprising_truth',
        explanation: 'Surprising Truth bonus: You correctly predicted the crowd but voted differently',
      };
    }
    return {
      potentialBonus: bonus,
      bonusType: 'minority_correct',
      explanation: 'Minority Correct bonus: Your minority prediction aligned with your vote',
    };
  }

  return {
    potentialBonus: 0,
    bonusType: 'none',
    explanation: 'No bonus for this vote/prediction combination',
  };
}
