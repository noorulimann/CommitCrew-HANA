import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStateCommitment extends Document {
  _id: mongoose.Types.ObjectId;
  timestamp: Date;
  hourKey: string; // Format: "YYYY-MM-DD-HH" for uniqueness
  rootHash: string; // Merkle root hash of all rumor scores
  rumorCount: number; // Number of rumors included in this commitment
  rumors: Array<{
    id: string;
    score: number;
    hash: string; // Individual rumor hash
  }>;
  verified: boolean; // Whether this commitment has been verified
  createdAt: Date;
  updatedAt: Date;
}

const StateCommitmentSchema = new Schema(
  {
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    hourKey: {
      type: String,
      required: true,
      
      unique: true,
      index: true,
      // Format: "YYYY-MM-DD-HH"
    },
    rootHash: {
      type: String,
      required: true,
      index: true,
    },
    rumorCount: {
      type: Number,
      required: true,
      default: 0,
    },
    rumors: [
      {
        id: String,
        score: Number,
        hash: String,
      },
    ],
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const StateCommitmentModel: Model<IStateCommitment> =
  mongoose.models.StateCommitment ||
  mongoose.model<IStateCommitment>('StateCommitment', StateCommitmentSchema);

export default StateCommitmentModel;
