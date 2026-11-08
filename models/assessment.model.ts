// src/models/assessment.model.ts
import { Schema, model, models, Document, Types } from "mongoose";

export interface IQuestion {
  title: string; 
  description: string;
  type: "multiple-choice" | "true-false" | "short-answer" | "essay";
  options?: {
    text: string;
    isCorrect: boolean;
  }[];
}

export interface IAssessment extends Document {
  schoolId: Types.ObjectId;
  academicYear: string;
  term: string;
  classId: Types.ObjectId;
  subjectName: string;
  title: string;
  maxScore: number;
  weightage: number;
  questions: IQuestion[]; 
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ["multiple-choice", "true-false", "short-answer", "essay"],
    required: true,
  },
  options: [
    {
      text: { type: String, required: true },
      isCorrect: { type: Boolean, required: true, default: false },
    },
  ],
});

const AssessmentSchema = new Schema<IAssessment>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    academicYear: { type: String, required: true },
    term: { type: String, required: true },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
      index: true,
    },
    subjectName: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    questions: [QuestionSchema], // 3. Fixed: Used the subdocument schema array syntax
    maxScore: { type: Number, required: true, default: 100 },
    weightage: { type: Number, required: true, default: 100 },
  },
  { timestamps: true },
);

export const Assessment =
  models.Assessment || model<IAssessment>("Assessment", AssessmentSchema);
