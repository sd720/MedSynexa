"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Stethoscope,
  ArrowRight,
  Zap,
  FileSearch,
  Pill,
  Users,
  BookOpen,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Lock,
  FileText,
  Sparkles,
  Server,
  ChevronRight,
  ChevronDown,
  Mic,
  Brain,
  HelpCircle,
  Eye,
  KeyRound,
  Database,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { SanitizedMedicalContent } from "../components/SanitizedMedicalContent";

// Core Platform Capabilities matching exact marketing pillars
const MARKETING_PILLARS = [
  {
    icon: Mic,
    title: "Real-Time Conversation Capture",
    desc: "Captures doctor–patient conversations in real time using Speech-to-Text dictation.",
    badge: "Speech-to-Text",
    color: "teal",
  },
  {
    icon: FileText,
    title: "Automated Structured Documentation",
    desc: "Automatically generates structured SOAP notes, eliminating tedious manual physician charting.",
    badge: "SOAP Automation",
    color: "emerald",
  },
  {
    icon: BookOpen,
    title: "Evidence-Based Medical RAG",
    desc: "Retrieves trusted medical knowledge through a Medical RAG pipeline for evidence-based clinical support.",
    badge: "Medical RAG",
    color: "cyan",
  },
  {
    icon: Brain,
    title: "Contextual Differential Diagnoses",
    desc: "Suggests differential diagnoses based on patient symptoms, vitals, and clinical context.",
    badge: "Clinical Reasoning",
    color: "indigo",
  },
  {
    icon: Users,
    title: "Unified Patient EHR History",
    desc: "Maintains a unified longitudinal history with consultations, prescriptions, reports, and diagnoses.",
    badge: "Longitudinal EHR",
    color: "teal",
  },
  {
    icon: Eye,
    title: "Vision AI Chest X-Ray Analysis",
    desc: "Analyzes chest X-rays using Vision AI to assist clinicians in detecting common thoracic diseases.",
    badge: "Vision AI",
    color: "emerald",
  },
  {
    icon: KeyRound,
    title: "Privacy-First Data Architecture",
    desc: "Secures patient data with end-to-end encryption, role-based access, and zero data retention.",
    badge: "HIPAA Compliant",
    color: "cyan",
  },
];

const FEATURES = [
  {
    id: "opd",
    title: "OPD Voice Dictation & AI Copilot",
    href: "/opd",
    icon: Stethoscope,
    category: "Consultation Suite",
    desc: "Real-time speech-to-text dictation converting clinical conversations into structured SOAP notes and differential diagnosis suggestions.",
    metrics: "SOAP Note Automation",
    previewData: {
      patient: "Rajesh Kumar, 45M",
      dictation: "Patient presents with persistent dry cough, low grade fever for 4 days, mild breathlessness on exertion.",
      diagnosis: "Acute Bronchitis (ICD-10 J40) - Rule out atypical pneumonia",
      plan: "Azithromycin 500mg OD x 5 days, Steam inhalation, Monitor SpO2 twice daily.",
    },
  },
  {
    id: "xray",
    title: "X-Ray Pathology Radiology Portal",
    href: "/xray",
    icon: Zap,
    category: "Diagnostic Imaging",
    desc: "Assists radiographers and doctors by analyzing chest X-rays using Vision AI for common thoracic disease indicators.",
    metrics: "Vision AI Decision Support",
    previewData: {
      study: "Chest Radiogram (PA View)",
      impression: "Left lower lobe opacity consistent with focal consolidation.",
      status: "Stable - Radiologist Review Required",
    },
  },
  {
    id: "drug-safety",
    title: "Drug Safety & Interaction Engine",
    href: "/drug-safety",
    icon: Pill,
    category: "Medication Risk",
    desc: "Multi-drug interaction screening, patient allergy conflict alerts, and contraindication flags prior to prescribing.",
    metrics: "Safety Guardrails",
    previewData: {
      prescription: "Warfarin + Fluconazole",
      warning: "CAUTION: Fluconazole inhibits CYP2C9, increasing Warfarin concentration & bleeding risk.",
      recommendation: "Consider alternative antifungal agent or monitor INR.",
    },
  },
  {
    id: "documents",
    title: "Lab Report OCR & PDF Parser",
    href: "/documents",
    icon: FileSearch,
    category: "Document Intelligence",
    desc: "Extracts unstructured PDF lab test reports, converts unstructured tables into normalized EHR metrics, and highlights abnormal values.",
    metrics: "Structured Extraction",
    previewData: {
      file: "CBC_Lipid_Panel_082026.pdf",
      extracted: [
        { test: "Hemoglobin", result: "11.2 g/dL", status: "Mild Anemia" },
        { test: "Total Cholesterol", result: "245 mg/dL", status: "Elevated" },
      ],
    },
  },
  {
    id: "patients",
    title: "Patient Directory & EHR Records",
    href: "/patients",
    icon: Users,
    category: "Longitudinal EHR",
    desc: "Unified patient history consolidating past consultations, prescriptions, radiology reports, and medical allergy logs.",
    metrics: "360° EHR Record Vault",
    previewData: {
      recordsCount: "12 Encounters",
      primaryRisk: "Hypertension Stage II, Type 2 Diabetes",
      lastVisit: "August 1, 2026 - OPD Follow-up",
    },
  },
  {
    id: "library",
    title: "Medical Knowledge RAG Search",
    href: "/library",
    icon: BookOpen,
    category: "Knowledge Base",
    desc: "Semantic vector RAG retrieval across trusted medical guidelines and standard clinical workflows for evidence-based decision support.",
    metrics: "Evidence-Based RAG",
    previewData: {
      query: "First-line therapy for adult uncomplicated UTI",
      answer: "Nitrofurantoin 100mg BD x 5 days as per standard clinical guidelines.",
    },
  },
];

const FAQS = [
  {
    q: "What is MedSynexa?",
    a: "MedSynexa is an AI-Powered Clinical Intelligence Platform built using a Medical RAG Pipeline. It assists clinicians by capturing voice dictation, generating structured SOAP notes, suggesting differential diagnoses, analyzing chest X-rays with Vision AI, and maintaining unified patient health records.",
  },
  {
    q: "How does Medical RAG support evidence-based clinical decisions?",
    a: "Our RAG pipeline performs high-dimensional vector search across trusted medical reference literature and guidelines, allowing clinicians to review evidence-grounded recommendations without manual searching.",
  },
  {
    q: "How is patient data secured on MedSynexa?",
    a: "Patient privacy is protected through end-to-end encryption (AES-256), role-based access control (RBAC), and a zero-data-retention architecture. Data is never shared or used to train public LLM models.",
  },
  {
    q: "Does MedSynexa replace physician judgment?",
    a: "No. MedSynexa is designed strictly as a clinical decision support tool for licensed healthcare professionals. All AI-generated notes, diagnostic suggestions, and treatment drafts require final physician verification.",
  },
];

export default function HighConvertingLandingPage() {
  const [activeFeature, setActiveFeature] = useState(FEATURES[0]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#080F19] text-slate-100 selection:bg-teal-500/30 selection:text-teal-200 flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 border-b border-white/10 overflow-hidden bg-[#080F19]">
        {/* Ambient Radial Mesh Glows */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[100px] pointer-events-none animate-glow-pulse" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none animate-glow-pulse" style={{ animationDelay: '2s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-[0_0_20px_rgba(13,148,136,0.3)]">
              <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-spin" style={{ animationDuration: '8s' }} />
              <span>India-Localized Clinical AI Decision Support Engine</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Executive Clinical AI Copilot for{" "}
              <span className="gradient-text-teal">
                Modern Healthcare
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
              Sub-10-second differential diagnoses, automated SOAP note generation, ICMR/NHP protocol alignment, and lab OCR parser for Indian hospitals and clinics.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/opd" className="btn-teal text-sm py-3.5 px-8 w-full sm:w-auto shadow-[0_0_25px_rgba(13,148,136,0.4)]">
                <span>Launch Clinical Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#features" className="btn-secondary text-sm py-3.5 px-8 w-full sm:w-auto">
                <span>View Clinical Capabilities</span>
              </a>
            </div>

            {/* Trust Badges Strip */}
            <div className="pt-10 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300 text-xs font-semibold">
              <div className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-md">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-md">
                <Lock className="w-4 h-4 text-teal-400 shrink-0" />
                <span>End-to-End Encrypted</span>
              </div>
              <div className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-md">
                <Server className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Role-Based Access</span>
              </div>
              <div className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-md">
                <Activity className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Zero Data Retention</span>
              </div>
            </div>
          </div>

          {/* Clean Interactive Module Showcase */}
          <div className="mt-14 max-w-5xl mx-auto relative">
            <div className="rounded-3xl border border-white/15 bg-slate-900/90 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-2xl">
              <div className="bg-slate-950 px-5 py-3.5 flex items-center justify-between border-b border-white/10 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-400 font-mono ml-2 hidden sm:inline">medsynexa.ai / clinical-workspace</span>
                </div>
                <span className="text-[11px] font-bold tracking-wider text-teal-300 bg-teal-950/80 px-3 py-1 rounded-full border border-teal-700/50 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                  Interactive Feature Showcase
                </span>
              </div>

              <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/40">
                <div className="lg:col-span-4 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Select Clinical Suite
                  </span>
                  {FEATURES.map((feat) => {
                    const Icon = feat.icon;
                    const isSelected = activeFeature.id === feat.id;
                    return (
                      <button
                        key={feat.id}
                        onClick={() => setActiveFeature(feat)}
                        className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-teal-500/20 border-teal-500/50 text-teal-200 font-extrabold shadow-[0_0_20px_rgba(13,148,136,0.3)] translate-x-1"
                            : "bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span>{feat.title}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isSelected ? "text-teal-400" : "text-slate-600"}`} />
                      </button>
                    );
                  })}
                </div>

                <div className="lg:col-span-8 bg-slate-950/80 p-6 rounded-2xl border border-white/10 shadow-inner flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-teal-300 bg-teal-500/20 px-2.5 py-0.5 rounded-full border border-teal-500/40">
                          {activeFeature.category}
                        </span>
                        <h3 className="text-lg font-extrabold text-white mt-1">{activeFeature.title}</h3>
                      </div>
                      <Link href={activeFeature.href} className="btn-teal text-xs py-2 px-4">
                        Open Workspace
                      </Link>
                    </div>

                    <p className="text-xs text-slate-300 mb-4 leading-relaxed font-normal">{activeFeature.desc}</p>

                    <div className="p-4 bg-slate-900/80 rounded-xl border border-white/10">
                      <SanitizedMedicalContent content={activeFeature.previewData} badgeLabel={activeFeature.metrics} />
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Physician Decision Support Mode
                    </span>
                    <span className="font-mono font-bold text-xs text-teal-300 bg-teal-950 px-2.5 py-0.5 rounded-full border border-teal-700/60">{activeFeature.metrics}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities (Marketing Pillars Grid) */}
      <section id="features" className="py-20 bg-[#080F19] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3.5 py-1 rounded-full border border-teal-500/40 shadow-[0_0_15px_rgba(13,148,136,0.2)]">
              What MedSynexa Does
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              AI-Powered Clinical Intelligence
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Streamlining clinical workflows, evidence-based reasoning, and patient records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MARKETING_PILLARS.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-white/10 bg-slate-900/80 hover:border-teal-500/50 hover:shadow-[0_0_30px_rgba(13,148,136,0.2)] transition-all duration-300 flex flex-col justify-between group overflow-hidden hover:-translate-y-1 backdrop-blur-xl relative"
                >
                  <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />

                  <div className="p-6">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(13,148,136,0.2)]">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider block mb-1">
                      {pillar.badge}
                    </span>
                    <h3 className="text-lg font-extrabold text-white mb-2 group-hover:text-teal-300 transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium mb-4">{pillar.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3-Step Implementation Sequence */}
      <section className="py-20 bg-slate-950/60 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3.5 py-1 rounded-full border border-teal-500/40">
              Seamless Workflow Integration
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              3 Steps to Clinical Automation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 shadow-lg relative hover:border-teal-500/40 transition-all backdrop-blur-xl">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-extrabold text-base flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(13,148,136,0.4)]">
                1
              </div>
              <h3 className="text-base font-extrabold text-white mb-2">Real-Time Speech & Document Capture</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Capture ambient doctor-patient conversations via Speech-to-Text or upload lab PDFs and chest X-rays.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 shadow-lg relative hover:border-teal-500/40 transition-all backdrop-blur-xl">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-extrabold text-base flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(13,148,136,0.4)]">
                2
              </div>
              <h3 className="text-base font-extrabold text-white mb-2">Medical RAG & Vision AI Pipeline</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Retrieves evidence-based medical knowledge, suggests differential diagnoses, and checks drug safety.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/80 border border-white/10 shadow-lg relative hover:border-teal-500/40 transition-all backdrop-blur-xl">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-extrabold text-base flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(13,148,136,0.4)]">
                3
              </div>
              <h3 className="text-base font-extrabold text-white mb-2">Physician Review & Unified EHR</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Review structured SOAP notes, edit differential diagnoses, and update longitudinal patient health records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical FAQ Accordion Section */}
      <section className="py-20 bg-[#080F19] border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3.5 py-1 rounded-full border border-teal-500/40 flex items-center justify-center gap-1.5 w-fit mx-auto shadow-[0_0_15px_rgba(13,148,136,0.2)]">
              <HelpCircle className="w-3.5 h-3.5 text-teal-400" /> Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Platform & Clinical Decision Support FAQs
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-slate-900/80 overflow-hidden transition-all backdrop-blur-xl"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-5 flex items-center justify-between font-extrabold text-white text-sm hover:text-teal-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-teal-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-300 font-medium leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enterprise Protection Strip */}
      <section className="py-16 bg-slate-950/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-3.5 py-1 rounded-full border border-emerald-500/40">
                Enterprise Clinical Data Protection
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3 mb-2">
                Privacy-First Data Protection & Encryption
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
                Patient privacy is paramount. MedSynexa employs end-to-end encryption (AES-256), role-based access control (RBAC), and zero-data-retention AI pipelines to safeguard sensitive medical records.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-3.5">
                <Lock className="w-5 h-5 text-teal-400 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-white">Role-Based Access Control</h3>
                  <p className="text-[11px] text-slate-400 font-medium">RBAC & granular permission controls</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-3.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-white">Provider-In-The-Loop</h3>
                  <p className="text-[11px] text-slate-400 font-medium">All AI outputs require physician review</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dark Footer */}
      <footer className="py-12 bg-slate-950 text-slate-400 text-xs border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold text-base shadow-[0_0_15px_rgba(13,148,136,0.3)]">
                <Stethoscope className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">MedSynexa Clinical AI</span>
            </div>

            <div className="flex flex-wrap gap-6 text-slate-400 font-semibold">
              <Link href="/opd" className="hover:text-white transition-colors">OPD Copilot</Link>
              <Link href="/xray" className="hover:text-white transition-colors">X-Ray Radiology</Link>
              <Link href="/drug-safety" className="hover:text-white transition-colors">Drug Safety</Link>
              <Link href="/documents" className="hover:text-white transition-colors">Lab PDFs</Link>
              <Link href="/patients" className="hover:text-white transition-colors">Patients</Link>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500">
            <p>© 2026 MedSynexa Health Inc. All rights reserved.</p>
            <p className="max-w-xl text-center sm:text-right">
              <strong>Clinical Disclaimer:</strong> MedSynexa is an AI clinical decision support tool built to assist healthcare professionals. It does not replace medical judgment or provide diagnostic certainty.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
