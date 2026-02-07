// Global configuration constants
export const CONFIG = {
  // Security
  OTP_EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES || '5'),
  MIN_SECRET_PHRASE_LENGTH: parseInt(process.env.MIN_SECRET_PHRASE_LENGTH || '12'),
  
  // Voting
  DEFAULT_REPUTATION_SCORE: parseFloat(process.env.DEFAULT_REPUTATION_SCORE || '1'),
  MAX_VOTE_CREDITS: parseInt(process.env.MAX_VOTE_CREDITS || '100'),
  
  // Merkle
  MERKLE_COMMIT_INTERVAL: parseInt(process.env.MERKLE_COMMIT_INTERVAL || '3600000'),
  
  // App
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // Email
  SMTP: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'noreply@citadeloftruth.com',
  },
} as const;

export default CONFIG;
