// Database connection check and model initialization
// Ensures all models are registered before use

import connectDB from './mongodb';

// Import all models to register them with Mongoose
import User from '../../database/schemas/User';
import OTP from '../../database/schemas/OTP';
import Rumor from '../../database/schemas/Rumor';
import Vote from '../../database/schemas/Vote';
import MerkleCommitment from '../../database/schemas/MerkleCommitment';
import RumorDependency from '../../database/schemas/RumorDependency';

// Re-export models for convenience
export { User, OTP, Rumor, Vote, MerkleCommitment, RumorDependency };

/**
 * Initialize database connection and ensure all models are ready
 */
export async function initializeDatabase() {
  const mongoose = await connectDB();
  
  // Verify connection
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database connection failed');
  }
  
  return mongoose;
}

/**
 * Get database instance with error handling
 */
export async function getDB() {
  try {
    return await initializeDatabase();
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}
