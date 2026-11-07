// src/models/teacher.model.ts
import { Schema, model, models, Document, Types } from "mongoose";

export interface ITeacher extends Document {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  userId: Types.ObjectId; // Ref to User account
  employeeId: string; // e.g., "TCH/2026/001"
  qualification: string; // e.g., "B.Ed, B.Sc Civil Engineering"
  specialization: string[]; // e.g., ["Mathematics", "Physics"]
  phone: string;
  address: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT";
  joiningDate: Date;
  status: "ACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema = new Schema<ITeacher>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    // employeeId: { type: String, required: true, trim: true },
    classId: { type: Schema.Types.ObjectId, ref: "Classroom" },
    qualification: { type: String, required: true, trim: true },
    specialization: [{ type: String, trim: true }],
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    employmentType: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "CONTRACT"],
      default: "FULL_TIME",
    },
    joiningDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

// Ensure unique employee ID per school tenant
TeacherSchema.index({ schoolId: 1, employeeId: 1 }, { unique: true });

export const Teacher =
  models.Teacher || model<ITeacher>("Teacher", TeacherSchema);
