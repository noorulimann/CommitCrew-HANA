// API Request and Response Types
// Standardized types for all API endpoints

// ============================================
// Generic API Response Types
// ============================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Auth API Types
// ============================================
export interface SendOtpRequest {
  email: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  expiresAt?: string; // ISO date string
}

export interface VerifyOtpRequest {
  email: string;
  otpCode: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  verified: boolean;
  message: string;
}

export interface RegisterRequest {
  nullifierHash: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  isNewUser: boolean;
}

export interface LoginRequest {
  nullifierHash: string;
}

export interface LoginResponse {
  success: boolean;
  exists: boolean;
  reputationScore?: number;
  message: string;
}

// ============================================
// Rumor API Types
// ============================================
export interface CreateRumorRequest {
  content: string;
  submitterNullifier: string;
}

export interface RumorResponse {
  _id: string;
  content: string;
  truthScore: number;
  totalVotes: number;
  status: 'active' | 'deleted' | 'archived';
  createdAt: string;
  updatedAt: string;
  ageHours?: number;
  rankScore?: number;
}

export type RumorListResponse = PaginatedResponse<RumorResponse>;

export interface RumorDetailResponse extends ApiResponse<RumorResponse> {
  stats?: {
    trueVotes: number;
    falseVotes: number;
    avgCreditsSpent: number;
    consensus: 'truth' | 'lie' | 'undetermined';
  };
  userVote?: {
    hasVoted: boolean;
    voteValue?: boolean;
    trustScoreEarned?: number;
  };
}

// ============================================
// Vote API Types
// ============================================
export interface CreateVoteRequest {
  rumorId: string;
  voterNullifier: string;
  voteValue: boolean;
  creditsSpent: number;
  predictedConsensus?: boolean;
}

export interface VoteResponse {
  success: boolean;
  vote: {
    _id: string;
    quadraticWeight: number;
    bayesianBonus: number;
    finalTrustScore: number;
  };
  rumor: {
    newTruthScore: number;
    newTotalVotes: number;
  };
  message: string;
}

export interface CheckVoteRequest {
  rumorId: string;
  voterNullifier: string;
}

export interface CheckVoteResponse {
  hasVoted: boolean;
  vote?: {
    voteValue: boolean;
    creditsSpent: number;
    finalTrustScore: number;
    createdAt: string;
  };
}

// ============================================
// Merkle API Types
// ============================================
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MerkleCommitRequest {
  // Triggered by cron job, no body needed
}

export interface MerkleCommitResponse {
  success: boolean;
  commitment: {
    rootHash: string;
    blockHeight: number;
    rumorsIncluded: number;
    committedAt: string;
  };
}

export interface MerkleVerifyRequest {
  rumorId: string;
  blockHeight?: number; // Optional: verify at specific block
}

export interface MerkleVerifyResponse {
  success: boolean;
  verified: boolean;
  currentScore: number;
  historicalScore?: number;
  blockHeight: number;
  committedAt: string;
  tamperingDetected: boolean;
  message: string;
}

export interface MerkleHistoryResponse {
  commitments: Array<{
    rootHash: string;
    blockHeight: number;
    committedAt: string;
    rumorsCount: number;
  }>;
  totalCommitments: number;
}

// ============================================
// Health API Types
// ============================================
export interface HealthResponse {
  status: 'ok' | 'error';
  database: 'connected' | 'disconnected' | 'failed';
  timestamp: string;
  error?: string;
}

// ============================================
// Error Types
// ============================================
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export const ERROR_CODES = {
  // Auth errors
  INVALID_EMAIL: 'INVALID_EMAIL',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_INVALID: 'OTP_INVALID',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  
  // Rumor errors
  RUMOR_NOT_FOUND: 'RUMOR_NOT_FOUND',
  RUMOR_DELETED: 'RUMOR_DELETED',
  INVALID_CONTENT: 'INVALID_CONTENT',
  
  // Vote errors
  ALREADY_VOTED: 'ALREADY_VOTED',
  INVALID_CREDITS: 'INVALID_CREDITS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Merkle errors
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  TAMPERING_DETECTED: 'TAMPERING_DETECTED',
  
  // General errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
