// Rumor Model - MongoDB Schema
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRumor extends Document {
  _id: mongoose.Types.ObjectId;
  content: string;
  submitterNullifier: string;
  truthScore: number;
  totalVotes: number;
  status: 'active' | 'deleted' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const RumorSchema = new Schema<IRumor>({
  content: {
    type: String,
    required: true,
  },
  submitterNullifier: {
    type: String,
    required: true,
    index: true,
  },
  truthScore: {
    type: Number,
    default: 0.0,
  },
  totalVotes: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'deleted', 'archived'],
    default: 'active',
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
RumorSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Module 4: Graph Isolation - Zero influence when deleted
RumorSchema.post('save', async function(doc) {
  if (doc.status === 'deleted') {
    const RumorDependency = mongoose.model('RumorDependency');
    await RumorDependency.updateMany(
      { $or: [{ parentRumorId: doc._id }, { childRumorId: doc._id }] },
      { $set: { influenceWeight: 0 } }
    );
  }
});

export default (mongoose.models.Rumor as Model<IRumor>) || mongoose.model<IRumor>('Rumor', RumorSchema);
