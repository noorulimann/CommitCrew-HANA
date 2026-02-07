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

export interface CreateVoteInput {
  rumorId: string;
  voterNullifier: string;
  voteValue: boolean;
  creditsSpent: number;
  predictedConsensus?: boolean;
}
