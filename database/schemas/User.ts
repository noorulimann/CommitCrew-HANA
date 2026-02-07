// User Model - MongoDB Schema
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  nullifierHash: string;
  reputationScore: number;
  createdAt: Date;
  lastActive: Date;
}

const UserSchema = new Schema<IUser>({
  nullifierHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  reputationScore: {
    type: Number,
    default: 1.0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
});

// Update lastActive on any update
UserSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

export default (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
