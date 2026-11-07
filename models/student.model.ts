// src/models/Student.ts
import { Schema, model, models, Document, Types } from 'mongoose';

export interface IStudentParent {
  guardianId: Types.ObjectId;
  relationship: 'FATHER' | 'MOTHER' | 'UNCLE' | 'AUNT' | 'GUARDIAN' | 'SPONSOR';
  isPrimaryBillingContact: boolean;
}

export interface IStudent extends Document {
  schoolId: Types.ObjectId;
  userId?: Types.ObjectId;       // Optional student portal login account
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dob: Date;
  gender: 'MALE' | 'FEMALE';
  classId: Types.ObjectId;       // Ref to Class model
  Parents: IStudentParent[];
  medicalFlags: {
    condition: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    instructions: string;
  }[];
  status: 'ACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'WITHDRAWN';
}

const StudentSchema = new Schema<IStudent>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    admissionNumber: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['MALE', 'FEMALE'], required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true, index: true },
    Parents: [
      {
        ParentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
        relationship: {
          type: String,
          enum: ['FATHER', 'MOTHER', 'UNCLE', 'AUNT', 'GUARDIAN', 'SPONSOR'],
          required: true,
        },
        isPrimaryBillingContact: { type: Boolean, default: false },
      },
    ],
    medicalFlags: [
      {
        condition: { type: String, required: true },
        severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
        instructions: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'GRADUATED', 'WITHDRAWN'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

// Ensure admission number is unique per school tenant
StudentSchema.index({ schoolId: 1, admissionNumber: 1 }, { unique: true });

export const Student = models.Student || model<IStudent>('Student', StudentSchema);