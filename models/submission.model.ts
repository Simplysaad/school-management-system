import { Schema, model, models, Document, Types } from "mongoose";

export interface IAnswer {
  questionId: Types.ObjectId; 
  selectedOptionIndex?: number;
  textAnswer?: string;
  isCorrect?: boolean;
  pointsAwarded?: number;
}

export interface ISubmission extends Document {
  schoolId: Types.ObjectId;
  assessmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  status: "PENDING" | "SUBMITTED" | "GRADED";
  answers: IAnswer[];
  scoreObtained: number;
  remarks?: string;
  submittedAt?: Date;
  gradedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema = new Schema<IAnswer>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    selectedOptionIndex: { type: Number },
    textAnswer: { type: String, trim: true },
    isCorrect: { type: Boolean },
    pointsAwarded: { type: Number, default: 0 },
  },
  { _id: false } 
);

const SubmissionSchema = new Schema<ISubmission>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUBMITTED", "GRADED"],
      default: "PENDING",
      required: true,
    },
    answers: [AnswerSchema],
    scoreObtained: { type: Number, required: true, default: 0, min: 0 },
    remarks: { type: String, trim: true },
    submittedAt: { type: Date },
    gradedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

SubmissionSchema.index(
  { schoolId: 1, assessmentId: 1, studentId: 1 },
  { unique: true }
);

export const Submission =
  models.Submission || model<ISubmission>("Submission", SubmissionSchema);