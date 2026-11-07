// src/models/Parent.ts
import { Schema, model, models, Document, Types } from 'mongoose';

export interface IParent extends Document {
  schoolId: Types.ObjectId;
  userId?: Types.ObjectId;       // Optional portal login account reference
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  occupation?: string;
  wardIds: Types.ObjectId[];     // Array of Student IDs linked to this Parent
}

const ParentSchema = new Schema<IParent>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    alternatePhone: { type: String },
    address: { type: String, required: true },
    occupation: { type: String },
    wardIds: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  },
  { timestamps: true }
);

// Index for fast lookup by phone or email within a school tenant
ParentSchema.index({ schoolId: 1, email: 1 });
ParentSchema.index({ schoolId: 1, phone: 1 });

export const Parent = models.Parent || model<IParent>('Parent', ParentSchema);