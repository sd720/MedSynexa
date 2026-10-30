import { Document as MongoDocument, Types } from 'mongoose';

// ─── Auth Types ───────────────────────────────────────────────────────────────
export interface IUser extends MongoDocument {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  speciality?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

export interface IRefreshToken extends MongoDocument {
  token: string;
  user: Types.ObjectId;
  expiresAt: Date;
}

// ─── Document Types ───────────────────────────────────────────────────────────
export type DocumentType = 'general' | 'lab_report' | 'textbook';

export interface IDocument extends MongoDocument {
  filename: string;
  localPath: string;       // Absolute path on disk
  mimeType: string;        // e.g. 'application/pdf'
  owner: Types.ObjectId;
  fileSize: number;
  chunkCount: number;
  documentType: DocumentType;
  processingStatus: 'pending' | 'processing' | 'ready' | 'failed';
  uploadDate: Date;
}

// ─── Chat & Citation Types ────────────────────────────────────────────────────
export interface ICitation {
  text: string;
  chunkIndex: number;
  sourceName: string;
  score?: number;
}

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: ICitation[];
  createdAt: Date;
}

export interface IChat extends MongoDocument {
  title: string;
  owner: Types.ObjectId;
  document: Types.ObjectId;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Clinical Copilot Types ───────────────────────────────────────────────────
export interface IClinicalInput {
  chiefComplaint: string;
  symptoms: string[];
  age: number;
  gender: 'male' | 'female' | 'other';
  vitals?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    spo2?: number;
    rbs?: number;           // Random Blood Sugar
    weight?: number;        // in kg
  };
  history?: string;
  allergies?: string[];
  currentMedications?: string[];
  duration?: string;        // e.g. "3 days", "2 weeks"
}

export interface IDifferentialDiagnosis {
  condition: string;
  likelihood: 'high' | 'moderate' | 'low';
  likelihood_percentage: number;
  icdCode?: string;
  reasoning: string;
}

export interface ITreatmentOption {
  drugName: string;          // Generic name
  indianBrandNames: string[];// Indian brand names
  dosage: string;
  frequency: string;
  duration: string;
  route: string;             // oral, IV, topical etc.
  contraindications: string[];
  sideEffects: string[];
  notes?: string;
}

export interface ISafetyFlag {
  type: 'drug_interaction' | 'allergy' | 'renal_caution' | 'hepatic_caution' | 'pregnancy' | 'pediatric' | 'elderly';
  severity: 'critical' | 'moderate' | 'informational';
  message: string;
  drugs?: string[];
}

export interface IClinicalOutput {
  differentialDiagnoses: IDifferentialDiagnosis[];
  diagnosticNextSteps: string[];
  treatmentOptions: ITreatmentOption[];
  safetyFlags: ISafetyFlag[];
  clinicalPearl?: string;
  referralRecommended?: boolean;
  referralSpeciality?: string;
  responseTimeMs?: number;
}

export interface IClinicalSession extends MongoDocument {
  userId: Types.ObjectId;
  input: IClinicalInput;
  output: IClinicalOutput;
  status: 'pending_physician_review' | 'verified_by_physician';
  physicianSignedOff: boolean;
  signedOffAt?: Date;
  createdAt: Date;
}

// ─── Lab Report Types ─────────────────────────────────────────────────────────
export interface ILabFinding {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'abnormal_high' | 'abnormal_low' | 'critical';
}

export interface IReportAnalysis extends MongoDocument {
  documentId: Types.ObjectId;
  userId: Types.ObjectId;
  findings: ILabFinding[];
  interpretation: string;
  clinicalImplications: string[];
  suggestedFollowUp: string[];
  urgencyLevel: 'routine' | 'urgent' | 'critical';
  createdAt: Date;
}

// ─── Patient & OPD Types ──────────────────────────────────────────────────────
export interface IPatient extends MongoDocument {
  name: string;
  age: number;
  weight?: number;
  gender: 'male' | 'female' | 'other';
  contactNumber?: string;
  doctorId: Types.ObjectId;
  medicalHistory?: string[];
  allergies?: string[];
  currentMedications?: {
    drugName?: string;
    dosage?: string;
    frequency?: string;
    startDate?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPatientReport extends MongoDocument {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  documentId: Types.ObjectId;
  condition: string;
  causes: string;
  cures: string;
  dietAndLifestyle: string;
  simpleSummary: string;
  createdAt: Date;
}

export interface IPatientReportOutput {
  causes: string;
  cures: string;
  dietAndLifestyle: string;
  simpleSummary: string;
}

// ─── pgvector Query Result ────────────────────────────────────────────────────
export interface VectorMatch {
  id: string;
  documentId: string;
  userId: string;
  filename: string;
  documentType: DocumentType;
  chunkIndex: number;
  content: string;
  score: number;
  metadata: Record<string, any>;
}

// ─── Express Global Types ─────────────────────────────────────────────────────
export interface UserPayload {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
