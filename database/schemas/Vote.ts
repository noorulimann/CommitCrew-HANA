/**
 * Vote Model - MongoDB Schema with Trust Score Calculation
 * Part of Module 2: Trust Scoring Algorithm
 * 
 * Implements Quadratic Bayesian Scoring (QBS):
 * - quadraticWeight = √(creditsSpent)
 * - bayesianBonus = reputation × bonus_multiplier (based on prediction accuracy)
 * - finalTrustScore = (quadraticWeight × reputation) + bayesianBonus
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVote extends Document {
  _id: mongoose.Types.ObjectId;
  rumorId: mongoose.Types.ObjectId;
  voterNullifier: string;
  voteValue: boolean; // true = Truth, false = Lie
  creditsSpent: number;
  predictedConsensus?: boolean;
  quadraticWeight: number;
  bayesianBonus: number;
  finalTrustScore: number;
  createdAt: Date;
}

const VoteSchema = new Schema<IVote>({
  rumorId: {
    type: Schema.Types.ObjectId,
    ref: 'Rumor',
    required: true,
    index: true,
  },
  voterNullifier: {
    type: String,
    required: true,
    index: true,
  },
  voteValue: {
    type: Boolean,
    required: true,
  },
  creditsSpent: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
  },
  predictedConsensus: {
    type: Boolean,
  },
  quadraticWeight: {
    type: Number,
    default: 0,
  },
  bayesianBonus: {
    type: Number,
    default: 0,
  },
  finalTrustScore: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index to prevent double voting
VoteSchema.index({ rumorId: 1, voterNullifier: 1 }, { unique: true });

/**
 * Module 2: Calculate Trust Score (Quadratic Bayesian Scoring) - BEFORE SAVE
 * 
 * Trust_Score = (Vote_Weight × Reputation) + Bayesian_Bonus
 * 
 * Where:
 * - Vote_Weight = √(creditsSpent) -> Quadratic cost makes coordination expensive
 * - Bayesian_Bonus = reputation × multiplier based on prediction accuracy
 */
VoteSchema.pre('save', async function(next) {
  // Import scoring services dynamically to avoid circular dependencies
  const { 
    calculateQuadraticWeight, 
    calculateBayesianBonus, 
    calculateConsensus,
    DEFAULT_REPUTATION_SCORE 
  } = await import('@/services/scoring');
  
  const User = mongoose.model('User');
  const Vote = mongoose.model('Vote');

  // Get voter's reputation (default to 1.0 for new users)
  const user = await User.findOne({ nullifierHash: this.voterNullifier });
  const voterReputation = user?.reputationScore || DEFAULT_REPUTATION_SCORE;

  // Calculate quadratic weight: √credits
  this.quadraticWeight = calculateQuadraticWeight(this.creditsSpent);

  // Get existing votes on this rumor (excluding current vote if it's an update)
  const existingVotes = await Vote.find({ 
    rumorId: this.rumorId,
    _id: { $ne: this._id }
  }).select('voteValue finalTrustScore').lean();

  // Calculate consensus from existing votes
  const consensus = calculateConsensus(existingVotes.map(v => ({
    voteValue: v.voteValue,
    finalTrustScore: v.finalTrustScore
  })));

  // Calculate Bayesian bonus
  this.bayesianBonus = calculateBayesianBonus(
    this.voteValue,
    this.predictedConsensus,
    consensus.consensusValue,
    voterReputation,
    consensus.isConsensusReached
  );

  // Calculate final trust score: (weight × reputation) + bonus
  this.finalTrustScore = (this.quadraticWeight * voterReputation) + this.bayesianBonus;

  next();
});

/**
 * Update Rumor Score AFTER vote is saved
 * Uses aggregate truth score calculation from scoring services
 * Also tracks true/false vote counts
 */
VoteSchema.post('save', async function(doc) {
  const { calculateAggregateTruthScore } = await import('@/services/scoring');
  
  const Rumor = mongoose.model('Rumor');
  const Vote = mongoose.model('Vote');

  // Get all votes for this rumor
  const votes = await Vote.find({ rumorId: doc.rumorId })
    .select('voteValue finalTrustScore')
    .lean();

  // Count true and false votes
  const trueVotes = votes.filter(v => v.voteValue === true).length;
  const falseVotes = votes.filter(v => v.voteValue === false).length;

  // Calculate aggregate truth score using scoring service
  const truthScore = calculateAggregateTruthScore(
    votes.map(v => ({
      voteValue: v.voteValue as boolean,
      finalTrustScore: v.finalTrustScore as number,
    }))
  );

  // Update rumor with new score and vote counts
  const result = await Rumor.findByIdAndUpdate(doc.rumorId, {
    truthScore,
    totalVotes: votes.length,
    trueVotes,
    falseVotes,
    updatedAt: new Date(),
  }, { new: true });
});

/**
 * Update Rumor Score AFTER vote is deleted
 * Recalculates aggregate score without the deleted vote
 * Also updates true/false vote counts
 */
VoteSchema.post('findOneAndDelete', async function(doc) {
  if (!doc) return;

  const { calculateAggregateTruthScore } = await import('@/services/scoring');
  
  const Rumor = mongoose.model('Rumor');
  const Vote = mongoose.model('Vote');

  const votes = await Vote.find({ rumorId: doc.rumorId })
    .select('voteValue finalTrustScore')
    .lean();

  // Count true and false votes
  const trueVotes = votes.filter(v => v.voteValue === true).length;
  const falseVotes = votes.filter(v => v.voteValue === false).length;

  const truthScore = calculateAggregateTruthScore(
    votes.map(v => ({
      voteValue: v.voteValue as boolean,
      finalTrustScore: v.finalTrustScore as number,
    }))
  );

  await Rumor.findByIdAndUpdate(doc.rumorId, {
    truthScore,
    totalVotes: votes.length,
    trueVotes,
    falseVotes,
    updatedAt: new Date(),
  });
});

export default (mongoose.models.Vote as Model<IVote>) || mongoose.model<IVote>('Vote', VoteSchema);
