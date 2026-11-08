// src/models/User.ts
import { Schema, model, models, Document, Types } from "mongoose";

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  SCHOOL_ADMIN = "SCHOOL_ADMIN",
  TEACHER = "TEACHER",
  ACCOUNTANT = "ACCOUNTANT",
  PARENT = "PARENT",
  STUDENT = "STUDENT",
}

export interface IUser extends Document {
  schoolId?: Types.ObjectId; // Nullable only for global SUPER_ADMIN
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  isOnboarded: boolean;
  isActive: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(UserRole), required: true },
    phone: { type: String },
    avatarUrl: { type: String },
    isOnboarded: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Compound index to ensure unique email per school (or globally for super admin)
UserSchema.index({ schoolId: 1, email: 1 }, { unique: true });

export const User = models.User || model<IUser>("User", UserSchema);
export default User 
