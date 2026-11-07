// src/models/assessment.model.ts
import { Schema, model, models, Document, Types } from 'mongoose';

export interface IAssessment extends Document {
  schoolId: Types.ObjectId;
  academicYear: string;           // e.g., "2026/2027"
  term: string;                   // e.g., "First Term"
  classId: Types.ObjectId;        // Classroom receiving assessment
  subjectName: string;            // e.g., "Mathematics", "English Language"
  title: string;                  // e.g., "Mid-Term Test", "Final Exam", "Assignment 1"
  maxScore: number;               // Maximum possible mark (e.g., 30, 70, 100)
  weightage: number;              // Percentage toward total term grade (e.g., 30%)
  createdAt: Date;
  updatedAt: Date;
}

// this will eventually have something like QuizId, where quizzes are applicable

const AssessmentSchema = new Schema<IAssessment>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    academicYear: { type: String, required: true },
    term: { type: String, required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true, index: true },
    subjectName: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    maxScore: { type: Number, required: true, default: 100 },
    weightage: { type: Number, required: true, default: 100 },
  },
  { timestamps: true }
);

export const Assessment = models.Assessment || model<IAssessment>('Assessment', AssessmentSchema);