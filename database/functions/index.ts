// Database utility functions for MongoDB
// Replaces SQL functions with MongoDB/Mongoose equivalents
// Updated for Module 2: Trust Scoring Algorithm

import { Rumor, Vote, User } from '../schemas';
import { 
  updateReputation as updateReputationCalc,
  calculateConsensus,
  MIN_VOTES_FOR_REPUTATION_UPDATE,
  type VoteAccuracyData 
} from '@/services/scoring';

/**
 * Get active rumors with calculated scores
 * Implements graph isolation by excluding deleted rumors
 * Equivalent to get_active_rumors SQL function
 */
export async function getActiveRumors(limitCount: number = 50) {
  const rumors = await Rumor.find({ status: 'active' })
    .lean()
    .exec();

  // Calculate age and apply ranking algorithm
  const rankedRumors = rumors.map(rumor => {
    const ageHours = (Date.now() - new Date(rumor.createdAt).getTime()) / (1000 * 60 * 60);
    const rankScore = rumor.truthScore / (1 + Math.pow(ageHours, 1.5));
    
    return {
      ...rumor,
      ageHours,
      rankScore,
    };
  });

  // Sort by rank score and limit results
  return rankedRumors
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, limitCount);
}

/**
 * Update user reputation based on voting accuracy
 * Uses Module 2 scoring services for calculation
 * 
 * @param nullifierHash - Optional: update specific user, otherwise update all
 */
export async function updateUserReputation(nullifierHash?: string) {
  const filter = nullifierHash ? { nullifierHash } : {};
  const users = await User.find(filter);

  const results: Array<{
    nullifierHash: string;
    previousReputation: number;
    newReputation: number;
    change: number;
  }> = [];

  for (const user of users) {
    // Get all votes by this user
    const userVotes = await Vote.find({ voterNullifier: user.nullifierHash });

    if (userVotes.length < MIN_VOTES_FOR_REPUTATION_UPDATE) continue;

    // Build vote accuracy data
    const voteAccuracyData: VoteAccuracyData[] = [];

    for (const vote of userVotes) {
      // Get all votes for the rumor to determine consensus
      const allVotesForRumor = await Vote.find({ rumorId: vote.rumorId })
        .select('voteValue finalTrustScore')
        .lean();
      
      if (allVotesForRumor.length < 5) continue; // Skip if not enough votes for reliable consensus

      // Calculate consensus using scoring service
      const consensus = calculateConsensus(allVotesForRumor.map(v => ({
        voteValue: v.voteValue,
        finalTrustScore: v.finalTrustScore,
      })));

      voteAccuracyData.push({
        voteValue: vote.voteValue,
        rumorConsensus: consensus.consensusValue,
      });
    }

    // Use scoring service to calculate new reputation
    const reputationUpdate = updateReputationCalc(user.reputationScore, voteAccuracyData);

    if (reputationUpdate.change !== 0) {
      user.reputationScore = reputationUpdate.newReputation;
      user.lastActive = new Date();
      await user.save();

      results.push({
        nullifierHash: user.nullifierHash,
        previousReputation: reputationUpdate.previousReputation,
        newReputation: reputationUpdate.newReputation,
        change: reputationUpdate.change,
      });
    }
  }

  return results;
}

/**
 * Get rumor statistics
 */
export async function getRumorStats(rumorId: string) {
  const votes = await Vote.find({ rumorId });

  const trueVotes = votes.filter(v => v.voteValue).length;
  const falseVotes = votes.length - trueVotes;
  const totalTrustScore = votes.reduce((sum, v) => sum + v.finalTrustScore, 0);
  const avgCreditsSpent = votes.reduce((sum, v) => sum + v.creditsSpent, 0) / (votes.length || 1);

  return {
    totalVotes: votes.length,
    trueVotes,
    falseVotes,
    totalTrustScore,
    avgCreditsSpent,
    consensus: trueVotes > falseVotes ? 'truth' : 'lie',
  };
}

/**
 * Check if user has already voted on a rumor
 */
export async function hasUserVoted(rumorId: string, voterNullifier: string): Promise<boolean> {
  const existingVote = await Vote.findOne({ rumorId, voterNullifier });
  return !!existingVote;
}

/**
 * Delete expired OTPs (cleanup function)
 */
export async function cleanupExpiredOTPs() {
  const OTP = (await import('../schemas/OTP')).default;
  const result = await OTP.deleteMany({ expiresAt: { $lt: new Date() } });
  return result.deletedCount;
}
