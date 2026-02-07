// App-wide constants
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  FEED: '/feed',
  SUBMIT: '/submit',
  API: {
    AUTH: {
      SEND_OTP: '/api/auth/send-otp',
      VERIFY_OTP: '/api/auth/verify-otp',
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
    },
    RUMORS: '/api/rumors',
    VOTES: {
      BASE: '/api/votes',
      CHECK: '/api/votes/check',
    },
    MERKLE: '/api/merkle',
  },
} as const;

export const VOTE_TYPE = {
  TRUTH: true,
  LIE: false,
} as const;

export const RUMOR_STATUS = {
  ACTIVE: 'active',
  DELETED: 'deleted',
  ARCHIVED: 'archived',
} as const;

// Re-export scoring constants for convenience
// (Main definitions are in @/services/scoring/constants.ts)
export const MIN_VOTES_FOR_BAYESIAN = 10;
export const REPUTATION_MOVING_AVERAGE_WEIGHT = 0.9;
export const ACCURACY_WEIGHT = 0.1;
export const MIN_VOTE_CREDITS = 1;
export const MAX_VOTE_CREDITS = 100;
export const DEFAULT_REPUTATION_SCORE = 1.0;
