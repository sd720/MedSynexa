import { Schema, model } from 'mongoose';
import { IClinicalSession } from '../types';

const vitalSchema = new Schema({
  bloodPressure: String,
  heartRate: Number,
  temperature: Number,
  spo2: Number,
  rbs: Number,
  weight: Number,
}, { _id: false });

const differentialSchema = new Schema({
  condition: { type: String, required: true },
  likelihood: { type: String, enum: ['high', 'moderate', 'low'], required: true },
  likelihood_percentage: { type: Number, required: true },
  icdCode: String,
  reasoning: { type: String, required: true },
}, { _id: false });

const treatmentSchema = new Schema({
  drugName: { type: String, required: true },
  indianBrandNames: [String],
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  route: { type: String, required: true },
  contraindications: [String],
  sideEffects: [String],
  notes: String,
}, { _id: false });

const safetyFlagSchema = new Schema({
  type: {
    type: String,
    enum: ['drug_interaction', 'allergy', 'renal_caution', 'hepatic_caution', 'pregnancy', 'pediatric', 'elderly', 'informational', 'other'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['critical', 'moderate', 'informational'],
    required: true,
  },
  message: { type: String, required: true },
  drugs: [String],
}, { _id: false });

const clinicalSessionSchema = new Schema<IClinicalSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    input: {
      chiefComplaint: { type: String, required: true },
      symptoms: [String],
      age: { type: Number, required: false },
      gender: { type: String, enum: ['male', 'female', 'other'], required: true },
      vitals: vitalSchema,
      history: String,
      allergies: [String],
      currentMedications: [String],
      duration: String,
    },
    output: {
      differentialDiagnoses: [differentialSchema],
      diagnosticNextSteps: [String],
      treatmentOptions: [treatmentSchema],
      safetyFlags: [safetyFlagSchema],
      clinicalPearl: String,
      referralRecommended: Boolean,
      referralSpeciality: String,
      responseTimeMs: Number,
    },
    status: {
      type: String,
      enum: ['pending_physician_review', 'verified_by_physician'],
      default: 'pending_physician_review',
    },
    physicianSignedOff: {
      type: Boolean,
      default: false,
    },
    signedOffAt: Date,
  },
  {
    timestamps: true,
  }
);

clinicalSessionSchema.index({ userId: 1, createdAt: -1 });

export const ClinicalSession = model<IClinicalSession>('ClinicalSession', clinicalSessionSchema);
