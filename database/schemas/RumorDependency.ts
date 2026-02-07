// Rumor Dependency Model - MongoDB Schema
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRumorDependency extends Document {
  parentRumorId: mongoose.Types.ObjectId;
  childRumorId: mongoose.Types.ObjectId;
  influenceWeight: number;
  createdAt: Date;
}

const RumorDependencySchema = new Schema<IRumorDependency>({
  parentRumorId: {
    type: Schema.Types.ObjectId,
    ref: 'Rumor',
    required: true,
    index: true,
  },
  childRumorId: {
    type: Schema.Types.ObjectId,
    ref: 'Rumor',
    required: true,
    index: true,
  },
  influenceWeight: {
    type: Number,
    default: 0.0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default (mongoose.models.RumorDependency as Model<IRumorDependency>) || 
  mongoose.model<IRumorDependency>('RumorDependency', RumorDependencySchema);
