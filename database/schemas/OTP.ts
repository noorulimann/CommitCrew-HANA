// OTP Model - MongoDB Schema
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOTP extends Document {
  emailHash: string;
  otpCode: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

const OTPSchema = new Schema<IOTP>({
  emailHash: {
    type: String,
    required: true,
    index: true,
  },
  otpCode: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    // Index defined below with TTL
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-delete expired OTPs (TTL index)
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default (mongoose.models.OTP as Model<IOTP>) || mongoose.model<IOTP>('OTP', OTPSchema);
