/**
 * Scoring System Constants
 * Part of Module 2: Trust Scoring Algorithm
 */

// Credit constraints for quadratic voting
export const MIN_VOTE_CREDITS = 1;
export const MAX_VOTE_CREDITS = 100;

// Bayesian Truth Serum constants
export const MIN_VOTES_FOR_BAYESIAN = 10; // Minimum votes before Bayesian bonus applies
export const SURPRISING_TRUTH_BONUS = 0.5; // Bonus multiplier for "surprising truth"
export const MINORITY_CORRECT_BONUS = 0.3; // Bonus for correctly predicting minority

// Reputation system constants
export const DEFAULT_REPUTATION_SCORE = 1.0;
export const MIN_REPUTATION_SCORE = 0.1;
export const MAX_REPUTATION_SCORE = 5.0;
export const REPUTATION_DECAY_FACTOR = 0.9; // Weight for old reputation in moving average
export const ACCURACY_WEIGHT = 0.1; // Weight for new accuracy in moving average
export const MIN_VOTES_FOR_REPUTATION_UPDATE = 5; // Minimum votes before reputation is updated

// Consensus thresholds
export const CONSENSUS_THRESHOLD = 0.5; // >50% needed for consensus
export const STRONG_CONSENSUS_THRESHOLD = 0.75; // >75% for strong consensus
