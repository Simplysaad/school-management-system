// src/models/Attendance.ts
import { Schema, model, models, Document, Types } from 'mongoose';

export interface IAttendance extends Document {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  date: Date;
  markedBy: Types.ObjectId;
  records: {
    studentId: Types.ObjectId;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    remark?: string;
  }[];
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    date: { type: Date, required: true },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    records: [
      {
        studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
        status: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'], required: true },
        remark: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// One attendance document per class per day within a school
AttendanceSchema.index({ schoolId: 1, classId: 1, date: 1 }, { unique: true });

export const Attendance = models.Attendance || model<IAttendance>('Attendance', AttendanceSchema);