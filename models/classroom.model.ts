// src/models/classroom.model.ts
import { Schema, model, models, Document, Types } from 'mongoose';

export interface IClassroom extends Document {
  schoolId: Types.ObjectId;
  name: string;                    // e.g., "Grade 5", "JSS 1"
  section?: string;                // e.g., "A", "Gold", "Blue"
  category: 'PRIMARY' | 'SECONDARY' | 'KINDERGARTEN';
  classTeacherId?: Types.ObjectId; // Ref to Teacher model
  students: Types.ObjectId[];      // Array of Student IDs
  capacity: number;                // Max students allowed
  createdAt: Date;
  updatedAt: Date;
}

const ClassroomSchema = new Schema<IClassroom>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true, trim: true },
    section: { type: String, trim: true },
    category: {
      type: String,
      enum: ['PRIMARY', 'SECONDARY', 'KINDERGARTEN'],
      required: true,
    },
    classTeacherId: { type: Schema.Types.ObjectId, ref: 'Teacher' },
    students: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    capacity: { type: Number, default: 40 },
  },
  { timestamps: true }
);

ClassroomSchema.index({ schoolId: 1, name: 1, section: 1 }, { unique: true });

export const Classroom = models.Classroom || model<IClassroom>('Classroom', ClassroomSchema);