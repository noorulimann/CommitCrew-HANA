// Merkle Commitment Model - MongoDB Schema
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMerkleCommitment extends Document {
  rootHash: string;
  blockHeight: number;
  rumorSnapshot: Record<string, any>; // JSON snapshot of all rumor scores
  committedAt: Date;
}

const MerkleCommitmentSchema = new Schema<IMerkleCommitment>({
  rootHash: {
    type: String,
    required: true,
  },
  blockHeight: {
    type: Number,
    required: true,
    index: true,
  },
  rumorSnapshot: {
    type: Schema.Types.Mixed,
    required: true,
  },
  committedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export default (mongoose.models.MerkleCommitment as Model<IMerkleCommitment>) || 
  mongoose.model<IMerkleCommitment>('MerkleCommitment', MerkleCommitmentSchema);
