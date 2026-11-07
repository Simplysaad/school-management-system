// src/models/announcement.model.ts
import { Schema, model, models, Document, Types } from 'mongoose';

export interface IAnnouncement extends Document {
  schoolId: Types.ObjectId;
  title: string;
  content: string;
  authorId: Types.ObjectId;       // User ID of publisher (Admin or Teacher)
  targetAudience: 'ALL' | 'CLASS' | 'TEACHERS' | 'PARENTS';
  classId?: Types.ObjectId;       // Required if targetAudience === 'CLASS'
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetAudience: {
      type: String,
      enum: ['ALL', 'CLASS', 'TEACHERS', 'PARENTS'],
      required: true,
      default: 'ALL',
    },
    classId: { type: Schema.Types.ObjectId, ref: 'Classroom' },
    priority: {
      type: String,
      enum: ['NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
    },
  },
  { timestamps: true }
);

export const Announcement = models.Announcement || model<IAnnouncement>('Announcement', AnnouncementSchema);