// src/models/Invoice.ts
import { Schema, model, models, Document, Types } from 'mongoose';

export interface IInvoice extends Document {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  invoiceNumber: string;
  academicYear: string;
  term: string;
  lineItems: {
    description: string;
    amount: number;
  }[];
  totalAmount: number;
  amountPaid: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  dueDate: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    invoiceNumber: { type: String, required: true },
    academicYear: { type: String, required: true },
    term: { type: String, required: true },
    lineItems: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'],
      default: 'UNPAID',
    },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

InvoiceSchema.index({ schoolId: 1, invoiceNumber: 1 }, { unique: true });

export const Invoice = models.Invoice || model<IInvoice>('Invoice', InvoiceSchema);