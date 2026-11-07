// src/models/grade.model.ts
import { Schema, model, models, Document, Types } from 'mongoose';

export interface IGrade extends Document {
  schoolId: Types.ObjectId;
  assessmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  scoreObtained: number;
  remarks?: string;
  enteredBy: Types.ObjectId;     // User ID of teacher or admin
  createdAt: Date;
  updatedAt: Date;
}

const GradeSchema = new Schema<IGrade>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    scoreObtained: { type: Number, required: true, min: 0 },
    remarks: { type: String, trim: true },
    enteredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// One score entry per student per assessment
GradeSchema.index({ schoolId: 1, assessmentId: 1, studentId: 1 }, { unique: true });

export const Grade = models.Grade || model<IGrade>('Grade', GradeSchema);