/**
 * Project File Structure Documentation
 * 
 * This file serves as a reference for the complete folder structure
 * of the Citadel of Truth project using MongoDB + Next.js
 */

export const PROJECT_STRUCTURE = {
  root: {
    'README.md': 'Project overview and requirements',
    'ARCHITECTURE.md': 'Detailed system architecture',
    'SETUP.md': 'Quick start guide and setup instructions',
    'package.json': 'Dependencies and scripts',
    'tsconfig.json': 'TypeScript configuration',
    'next.config.js': 'Next.js configuration',
    'tailwind.config.js': 'Tailwind CSS configuration',
    'postcss.config.js': 'PostCSS configuration',
    '.env.example': 'Environment variables template',
    '.env.local': 'Local environment variables (git ignored)',
    '.gitignore': 'Git ignore rules',
  },
  
  src: {
    app: {
      api: {
        auth: {
          'send-otp/route.ts': 'Send OTP to email',
          'verify-otp/route.ts': 'Verify OTP code',
          'login/route.ts': 'Login with secret phrase',
        },
        rumors: {
          'route.ts': 'Get/Create rumors',
          '[id]/route.ts': 'Get/Update/Delete specific rumor',
        },
        votes: {
          'route.ts': 'Cast vote on rumor',
        },
        merkle: {
          'commit/route.ts': 'Create state commitment',
          'verify/route.ts': 'Verify historical state',
        },
        'health/route.ts': 'Health check endpoint',
      },
      feed: {
        'page.tsx': 'Main rumor feed page',
      },
      login: {
        'page.tsx': 'Authentication page',
      },
      submit: {
        'page.tsx': 'Rumor submission page',
      },
      'layout.tsx': 'Root layout component',
      'page.tsx': 'Homepage',
    },
    
    components: {
      rumors: {
        'RumorCard.tsx': 'Individual rumor display',
        'RumorFeed.tsx': 'List of rumors',
        'RumorSubmitForm.tsx': 'Create rumor form',
      },
      voting: {
        'VoteSlider.tsx': 'Quadratic voting slider',
        'PredictionInput.tsx': 'Consensus prediction input',
        'TrustScoreDisplay.tsx': 'Show trust score',
      },
      auth: {
        'EmailVerificationForm.tsx': 'Email + OTP verification',
        'SecretPhraseInput.tsx': 'Secret phrase creation/entry',
        'NullifierDisplay.tsx': 'Show user hash',
      },
      ui: {
        'Button.tsx': 'Reusable button component',
        'Input.tsx': 'Reusable input component',
        'Card.tsx': 'Reusable card component',
      },
    },
    
    services: {
      identity: {
        'nullifier.ts': 'Generate user nullifier hash',
        'otp.ts': 'OTP generation and validation',
        'brain-wallet.ts': 'Secret phrase management',
      },
      scoring: {
        'quadratic.ts': 'Quadratic voting calculations',
        'bayesian.ts': 'Bayesian Truth Serum',
        'reputation.ts': 'User reputation tracking',
      },
      merkle: {
        'tree.ts': 'Merkle tree construction',
        'anchor.ts': 'State commitment',
        'verify.ts': 'State verification',
      },
      graph: {
        'dependency.ts': 'Rumor dependency graph',
        'tombstone.ts': 'Deleted rumor handling',
        'influence.ts': 'Influence calculations',
      },
    },
    
    lib: {
      'mongodb.ts': 'MongoDB connection handler',
      'config.ts': 'App configuration',
      'constants.ts': 'Global constants',
    },
    
    utils: {
      crypto: {
        'hash.ts': 'SHA-256 hashing utilities',
        'verify.ts': 'Hash verification',
      },
      validation: {
        'email.ts': 'Email validation',
        'rumor.ts': 'Rumor content validation',
        'vote.ts': 'Vote input validation',
      },
      math: {
        'quadratic.ts': 'Quadratic calculations',
        'rankingAlgorithm.ts': 'Rumor ranking logic',
      },
    },
    
    types: {
      'index.ts': 'Global type exports',
      'rumor.ts': 'Rumor-related types',
      'user.ts': 'User-related types',
      'vote.ts': 'Vote-related types',
    },
  },
  
  database: {
    schemas: {
      'User.ts': 'User Mongoose model',
      'OTP.ts': 'OTP Mongoose model',
      'Rumor.ts': 'Rumor Mongoose model',
      'Vote.ts': 'Vote Mongoose model with hooks',
      'MerkleCommitment.ts': 'Merkle commitment model',
      'RumorDependency.ts': 'Dependency graph model',
      'index.ts': 'Export all models',
    },
    functions: {
      'index.ts': 'Database utility functions',
    },
    'README.md': 'MongoDB setup documentation',
  },
  
  public: {
    images: {},
    icons: {},
  },
} as const;

/**
 * Key Files to Understand:
 * 
 * 1. Entry Points:
 *    - src/app/page.tsx (Homepage)
 *    - src/app/feed/page.tsx (Main app)
 * 
 * 2. Database:
 *    - src/lib/mongodb.ts (Connection)
 *    - database/schemas/*.ts (Models)
 * 
 * 3. Core Logic:
 *    - database/schemas/Vote.ts (Trust scoring)
 *    - src/services/scoring/* (Algorithms)
 * 
 * 4. Configuration:
 *    - .env.local (Environment)
 *    - src/lib/config.ts (App config)
 */
