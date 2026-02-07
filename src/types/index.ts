// TypeScript type definitions for the application

// ============================================
// Core Entity Types
// ============================================
export interface UserType {
  _id: string;
  nullifierHash: string;
  reputationScore: number;
  createdAt: Date;
  lastActive: Date;
}

export interface RumorType {
  _id: string;
  content: string;
  submitterNullifier: string;
  truthScore: number;
  totalVotes: number;
  status: 'active' | 'deleted' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface VoteType {
  _id: string;
  rumorId: string;
  voterNullifier: string;
  voteValue: boolean;
  creditsSpent: number;
  predictedConsensus?: boolean;
  quadraticWeight: number;
  bayesianBonus: number;
  finalTrustScore: number;
  createdAt: Date;
}

export interface OTPType {
  emailHash: string;
  otpCode: string;
  expiresAt: Date;
  verified: boolean;
}

export interface MerkleCommitmentType {
  rootHash: string;
  blockHeight: number;
  rumorSnapshot: Record<string, unknown>;
  committedAt: Date;
}

export interface RumorDependencyType {
  _id: string;
  parentRumorId: string;
  childRumorId: string;
  influenceWeight: number;
  createdAt: Date;
}

// ============================================
// Extended Types (with computed fields)
// ============================================
export interface RumorWithStats extends RumorType {
  ageHours: number;
  rankScore: number;
}

export interface UserWithStats extends UserType {
  totalVotes: number;
  accuracyRate: number;
}

// ============================================
// Re-export API types
// ============================================
export * from './api';
export * from './user';
export * from './rumor';
export * from './vote';
