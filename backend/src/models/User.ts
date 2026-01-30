import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  githubId?: string;
  gitlabId?: string;
  discordId?: string;
  linkedinId?: string;
  settings: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    defaultAlgorithm?: string;
  };
  profile: {
    avatarUrl?: string;
    bio?: string;
  };
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: false },
  googleId: { type: String, required: false, unique: true, sparse: true },
  githubId: { type: String, required: false, unique: true, sparse: true },
  gitlabId: { type: String, required: false, unique: true, sparse: true },
  discordId: { type: String, required: false, unique: true, sparse: true },
  linkedinId: { type: String, required: false, unique: true, sparse: true },
  settings: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, default: 'en' },
    defaultAlgorithm: { type: String },
  },
  profile: {
    avatarUrl: { type: String },
    bio: { type: String, maxlength: 500 },
  },
  createdAt: { type: Date, default: Date.now },
});

export const User = model<IUser>('User', userSchema);
