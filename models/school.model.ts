// src/models/School.ts
import { Schema, model, models, Document } from 'mongoose';

export interface ISchool extends Document {
  name: string;
  slug: string; // e.g., "brightstars" -> brightstars.yourdomain.com
  customDomain?: string; // e.g., "portal.brightstarschool.org"
  contactEmail: string;
  phone: string;
  address: string;
  theme: {
    primaryColor: string;    // HEX code e.g., "#1e40af"
    secondaryColor: string;  // e.g., "#0d9488"
    accentColor: string;     // e.g., "#f59e0b"
    borderRadius: string;    // e.g., "0.5rem"
  };
  branding: {
    logoUrl: string;
    faviconUrl?: string;
    motto?: string;
  };
  settings: {
    academicYear: string;    // e.g., "2026/2027"
    currentTerm: string;      // e.g., "First Term"
    currency: string;         // e.g., "NGN", "USD"
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema = new Schema<ISchool>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    customDomain: { type: String, unique: true, sparse: true, lowercase: true },
    contactEmail: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    theme: {
      primaryColor: { type: String, default: '#0f172a' },
      secondaryColor: { type: String, default: '#475569' },
      accentColor: { type: String, default: '#2563eb' },
      borderRadius: { type: String, default: '0.375rem' },
    },
    branding: {
      logoUrl: { type: String, required: true },
      faviconUrl: { type: String },
      motto: { type: String },
    },
    settings: {
      academicYear: { type: String, required: true },
      currentTerm: { type: String, required: true },
      currency: { type: String, default: 'NGN' },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const School = models.School || model<ISchool>('School', SchoolSchema);