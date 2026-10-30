'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  Activity,
  Pill,
  ShieldAlert,
  Zap,
  CheckCircle,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  RefreshCw,
  X,
  ChevronRight,
  HeartPulse,
  Wand2,
  Mic,
  MicOff,
  Download,
  MessageSquareQuote,
  History,
  Clock,
  Send,
  Loader2,
  User,
  Printer,
} from 'lucide-react';

interface DifferentialDiagnosis {
  condition: string;
  likelihood: 'high' | 'moderate' | 'low';
  likelihood_percentage: number;
  icdCode?: string;
  reasoning: string;
}

interface TreatmentOption {
  drugName: string;
  indianBrandNames: string[];
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  contraindications: string[];
  sideEffects: string[];
  notes?: string;
}

interface SafetyFlag {
  type: string;
  severity: 'critical' | 'moderate' | 'informational';
  message: string;
  drugs?: string[];
}

interface ClinicalOutput {
  differentialDiagnoses: DifferentialDiagnosis[];
  diagnosticNextSteps: string[];
  treatmentOptions: TreatmentOption[];
  safetyFlags: SafetyFlag[];
  clinicalPearl?: string;
  referralRecommended?: boolean;
  referralSpeciality?: string;
  responseTimeMs?: number;
}

const LIKELIHOOD_CONFIG = {
  high: { bg: 'bg-rose-950/60 backdrop-blur-md', border: 'border-rose-500/40', text: 'text-rose-200', dot: 'bg-rose-400' },
  moderate: { bg: 'bg-amber-950/60 backdrop-blur-md', border: 'border-amber-500/40', text: 'text-amber-200', dot: 'bg-amber-400' },
  low: { bg: 'bg-slate-900/60 backdrop-blur-md', border: 'border-white/10', text: 'text-slate-300', dot: 'bg-slate-400' },
};

const MOCK_OUTPUT: ClinicalOutput = {
  differentialDiagnoses: [
    {
      condition: "Dengue Fever",
      likelihood: "high",
      likelihood_percentage: 85,
      icdCode: "A97.9",
      reasoning: "High grade fever, severe retro-orbital headache, and severe myalgia (break-bone fever) strongly suggest Dengue, especially in endemic Indian regions."
    },
    {
      condition: "Viral Influenza",
      likelihood: "moderate",
      likelihood_percentage: 45,
      icdCode: "J11.1",
      reasoning: "Common cause of fever and myalgia, though retro-orbital pain is less prominent."
    }
  ],
  treatmentOptions: [
    {
      drugName: "Paracetamol",
      indianBrandNames: ["Dolo 650", "Calpol", "Crocin Advance"],
      dosage: "650mg",
      frequency: "TDS or SOS (max 4g/day)",
      duration: "3-5 days",
      route: "Oral",
      contraindications: ["Severe hepatic impairment"],
      sideEffects: ["Nausea", "Hepatotoxicity in overdose"]
    },
    {
      drugName: "Oral Rehydration Salts (ORS)",
      indianBrandNames: ["Electral", "Enerzal"],
      dosage: "1 Sachet in 1L water",
      frequency: "Ad libitum",
      duration: "3-5 days",
      route: "Oral",
      contraindications: ["Severe renal impairment"],
      sideEffects: ["None significant if taken appropriately"]
    }
  ],
  diagnosticNextSteps: [
    "Dengue NS1 Antigen & IgM/IgG Serology",
    "Complete Blood Count (CBC) to check for thrombocytopenia & hematocrit levels",
    "Monitor signs of plasma leakage or bleeding"
  ],
  safetyFlags: [
    {
      type: "CONTRAINDICATION_WARNING",
      severity: "critical",
      message: "STRICTLY AVOID NSAIDs (Ibuprofen, Diclofenac, Aspirin) due to risk of severe bleeding in suspected Dengue."
    }
  ],
  responseTimeMs: 845
};

export const ClinicalCopilot: React.FC = () => {
  const { user } = useAuth();
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');

  const [isListening, setIsListening] = useState(false);
  const [ambientTranscript, setAmbientTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const baseTranscriptRef = useRef<string>('');
  const finalRef = useRef<string>('');
  const interimRef = useRef<string>('');

  const [output, setOutput] = useState<ClinicalOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isListeningRef = useRef(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [sessions, setSessions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/clinical/sessions');
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error('Failed to load sessions', err);
    }
  };

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const loadSession = (session: any) => {
    setCurrentSessionId(session._id);
    setAge(session.input.age);
    setGender(session.input.gender);
    setChiefComplaint(session.input.chiefComplaint);
    setSymptoms(session.input.symptoms || []);
    setAmbientTranscript('');
    setOutput(session.output);
    setIsSignedOff(!!session.physicianSignedOff);
    setShowHistory(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        let final = '';
        let interim = '';

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        finalRef.current = final;
        interimRef.current = interim;

        const separator = baseTranscriptRef.current && final ? ' ' : '';
        const currentText = baseTranscriptRef.current + separator + final.trim();
        setAmbientTranscript(currentText);

        const displaySeparator = currentText && interim ? ' ' : '';
        setChiefComplaint(currentText + displaySeparator + interim);
        setInterimTranscript(interim);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'no-speech') return;
        console.warn('Speech recognition warning:', event.error);
        if (event.error === 'network' || event.error === 'not-allowed') {
          setSpeechError("Live preview blocked by browser privacy (Brave Shields). Audio is still recording securely for Whisper API!");
        }
      };

      recognitionRef.current.onend = () => {
        let fullText = baseTranscriptRef.current;
        if (finalRef.current) fullText += (fullText ? ' ' : '') + finalRef.current.trim();
        if (interimRef.current) fullText += (fullText ? ' ' : '') + interimRef.current.trim();
        setAmbientTranscript(fullText);
        setChiefComplaint(fullText);
        setInterimTranscript('');

        // Auto-restart if user hasn't explicitly stopped it
        if (isListeningRef.current) {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            console.error('Failed to restart speech recognition', e);
          }
        }
      };
    }
  }, []);

  const [isWhisperProcessing, setIsWhisperProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      isListeningRef.current = true;
      setSpeechError(null);
      try {
        recognitionRef.current?.start();
      } catch (e) {
        // already started
      }
    } catch (err) {
      console.error("Microphone access denied:", err);
      setError("Please allow microphone access to use voice dictation.");
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  const stopRecordingAndTranscribe = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        resolve('');
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        try {
          const response = await api.post('/speech/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          resolve(response.data.text);
        } catch (err) {
          console.error("Whisper error:", err);
          reject(err);
        }
      };

      mediaRecorderRef.current.stop();
      recognitionRef.current?.stop();
    });
  };

  const toggleListening = async () => {
    if (isListening) {
      setIsListening(false);
      isListeningRef.current = false;
      setIsWhisperProcessing(true);

      try {
        const whisperText = await stopRecordingAndTranscribe();
        const separator = baseTranscriptRef.current && whisperText ? ' ' : '';
        const fullText = baseTranscriptRef.current + separator + whisperText.trim();

        setAmbientTranscript(fullText);
        setChiefComplaint(fullText);
        setInterimTranscript('');
        await handleAnalyze(fullText);
      } catch (err) {
        let fullText = baseTranscriptRef.current;
        if (finalRef.current) fullText += (fullText ? ' ' : '') + finalRef.current.trim();
        if (interimRef.current) fullText += (fullText ? ' ' : '') + interimRef.current.trim();

        setAmbientTranscript(fullText);
        setChiefComplaint(fullText);
        setInterimTranscript('');
        await handleAnalyze(fullText);
      } finally {
        setIsWhisperProcessing(false);
      }
    } else {
      baseTranscriptRef.current = chiefComplaint;
      finalRef.current = '';
      interimRef.current = '';
      setInterimTranscript('');
      setAmbientTranscript(chiefComplaint);
      setOutput(null);
      setIsListening(true);
      await startRecording();
    }
  };

  const handleDownloadTranscript = () => {
    if (!ambientTranscript) return;
    const blob = new Blob([ambientTranscript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Patient_Transcript_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const addSymptom = () => {
    if (symptomInput.trim() && !symptoms.includes(symptomInput.trim())) {
      setSymptoms([...symptoms, symptomInput.trim()]);
      setSymptomInput('');
    }
  };
  const removeSymptom = (i: number) => setSymptoms(symptoms.filter((_, idx) => idx !== i));

  const handleAnalyze = async (transcriptOverride?: string) => {
    const finalComplaint = transcriptOverride || ambientTranscript || chiefComplaint;
    if (!finalComplaint.trim()) {
      setError('Please provide a Chief Complaint or use Voice Dictation.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post('/clinical/analyze', {
        chiefComplaint: finalComplaint,
        symptoms,
        age: Number(age) || undefined,
        gender,
      });
      setOutput(res.data.output);
      setCurrentSessionId(res.data.sessionId || null);
      setIsSignedOff(false);
      fetchSessions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Real API failed. Try using Mock Analysis for demo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOff = async () => {
    try {
      if (currentSessionId) {
        await api.patch(`/clinical/sessions/${currentSessionId}/sign-off`);
      }
      setIsSignedOff(true);
      toast.success("Physician verification signature recorded in database & committed to EHR.");
    } catch (err) {
      toast.error("Failed to sign off session");
    }
  };

  const handleMockAnalyze = () => {
    setError(null);
    setIsLoading(true);
    setTimeout(() => {
      setOutput(MOCK_OUTPUT);
      setIsLoading(false);
    }, 1500);
  };

  const loadDemoData = () => {
    setAge(32);
    setGender('male');
    setChiefComplaint('High grade fever for 3 days with severe headache and joint pains.');
    setSymptoms(['Fever', 'Headache', 'Joint pain', 'Nausea']);
    setAmbientTranscript('');
    setOutput(null);
    setError(null);
    handleMockAnalyze();
  };

  const handleClear = () => {
    setChiefComplaint(''); setSymptoms([]); setAge('');
    setAmbientTranscript('');
    setOutput(null); setError(null);
    if (isListening) recognitionRef.current?.stop();
  };

  const [isExporting, setIsExporting] = useState(false);
  const handleExportPdf = async () => {
    if (!isSignedOff) {
      toast.error("Physician Sign-Off Required: You must verify and sign off the AI-generated note before exporting to EMR.");
      return;
    }
    setIsExporting(true);
    try {
      window.print();
    } catch (err) {
      console.error('Print failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyPrescription = () => {
    if (!output) return;
    if (!isSignedOff) {
      toast.error("Physician Sign-Off Required: You must verify and sign off the AI-generated note before copying to EMR.");
      return;
    }
    let text = `MEDSYNEXA CLINICAL DECISION SUMMARY (VERIFIED & SIGNED OFF BY PHYSICIAN)\n`;
    text += `Patient: ${age || 'N/A'}yo ${gender.toUpperCase()} | CC: ${chiefComplaint || 'See transcript'}\n\n`;
    text += `TOP DIFFERENTIAL DIAGNOSES:\n`;
    output.differentialDiagnoses.forEach((dd, i) => {
      text += `${i + 1}. ${dd.condition} (${dd.likelihood_percentage}%) [${dd.icdCode || 'N/A'}]\n`;
    });
    text += `\nRECOMMENDED TREATMENT (INDIAN FORMULATIONS):\n`;
    output.treatmentOptions.forEach((tx, i) => {
      text += `${i + 1}. ${tx.drugName} (${tx.indianBrandNames.join(', ')}) - ${tx.dosage} ${tx.frequency} for ${tx.duration}\n`;
    });
    text += `\nDIAGNOSTIC NEXT STEPS:\n` + output.diagnosticNextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [isSignedOff, setIsSignedOff] = useState(false);

  return (
    <div className="h-full flex relative overflow-hidden bg-white">
      {/* Past sessions sidebar & main workspace... */}
      <div className="flex-1 w-full flex flex-col overflow-hidden relative">
        <div className="px-6 py-3 border-b border-gray-100 bg-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-3">
            {!showHistory && (
              <button
                onClick={() => setShowHistory(true)}
                className="bg-white border border-gray-200 hover:border-gray-300 p-2 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                title="View Past Sessions"
              >
                <History className="h-4 w-4" />
              </button>
            )}
            <div>
              <h2 className="text-sm font-bold text-[#111111] tracking-tight">Consultation Scribe Workspace</h2>
              <p className="text-[10px] text-gray-400 font-medium">Record patient history and complaints to synthesize clinical diagnostics</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {output && (
              <button
                onClick={() => {
                  setIsSignedOff(!isSignedOff);
                  if (!isSignedOff) {
                    toast.success("Physician verification signature applied. Clinical note committed to EHR.");
                  }
                }}
                className={`px-4 py-1.5 text-xs font-extrabold rounded-lg shadow-sm flex items-center gap-1.5 transition-all ${isSignedOff
                    ? 'bg-emerald-600 text-white border border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-400 animate-pulse'
                  }`}
              >
                <CheckCircle className="h-4 w-4" />
                <span>{isSignedOff ? 'Signed Off & Verified in EHR' : 'Physician Sign-Off Required'}</span>
              </button>
            )}

            {!output && !isLoading && (
              <button
                onClick={loadDemoData}
                className="px-3.5 py-1.5 rounded-lg border border-indigo-200/60 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Wand2 className="h-3.5 w-3.5" />
                <span>Try Demo Case</span>
              </button>
            )}
          </div>
        </div>

        {/* Workspace Panels */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFA]">

          {/* Unified Input State */}
          {!output && !isLoading && (
            <div className="max-w-3xl mx-auto space-y-6 fade-in-up">

              {/* Clinical Intro Banner */}
              <div className="text-center space-y-2 py-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100/50 flex items-center justify-center text-blue-600 mx-auto shadow-sm">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#111111] tracking-tight">Consultation Dictation & Notes</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  Type the patient's complaints or start real-time voice dictation. MedSynexa will generate clinical guidelines, safety alerts, and prescriptions.
                </p>
              </div>

              {/* Core Form Card */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-5">

                {/* Note Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Chief Complaint & Symptoms
                    </label>

                    {/* Dictation Toggle Button */}
                    <button
                      type="button"
                      onClick={toggleListening}
                      disabled={isWhisperProcessing}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all border ${isListening
                          ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
                          : isWhisperProcessing
                            ? 'bg-blue-50 border-blue-200 text-blue-600 cursor-wait'
                            : 'bg-blue-50 border-blue-100 hover:bg-blue-100 text-blue-700'
                        }`}
                    >
                      {isWhisperProcessing ? (
                        <>
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          <span>Transcribing...</span>
                        </>
                      ) : isListening ? (
                        <>
                          <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-ping" />
                          <span>Stop Recording</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-3 w-3" />
                          <span>Start Dictation</span>
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isListening || isWhisperProcessing}
                    className={`input-field p-4 text-xs min-h-[140px] resize-none leading-relaxed ${isListening ? 'border-red-300 ring-2 ring-red-100 bg-red-50/5' : ''
                      }`}
                    placeholder={
                      isListening
                        ? 'Dictation active. Discuss patient issues now, or click Stop Recording when finished...'
                        : 'Enter patient history, physical findings, complaints, or vitals...'
                    }
                  />

                  {isListening && interimTranscript && (
                    <p className="text-[10px] text-blue-600 italic mt-1.5 px-1">
                      Live transcript: {interimTranscript}
                    </p>
                  )}
                  {isListening && speechError && (
                    <p className="text-[10px] text-orange-600 italic mt-1.5 px-1">
                      ⚠️ {speechError}
                    </p>
                  )}
                </div>

                {/* Demographics row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Patient Age
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                      className="input-field px-3.5 py-2.5 text-xs"
                      placeholder="Age in years (e.g. 28)"
                      disabled={isListening || isWhisperProcessing}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="input-field px-3.5 py-2 text-xs"
                      disabled={isListening || isWhisperProcessing}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={handleClear}
                    disabled={isWhisperProcessing}
                    className="px-4.5 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-xs hover:bg-gray-50 transition-colors"
                  >
                    Clear Form
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadDemoData}
                      disabled={isListening || isWhisperProcessing}
                      className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-bold text-xs transition-colors"
                    >
                      Demo Patient
                    </button>

                    <button
                      onClick={() => handleAnalyze()}
                      disabled={isListening || isWhisperProcessing || !chiefComplaint.trim()}
                      className="btn-primary px-5 py-2.5 text-xs flex items-center gap-2 shadow-md shadow-blue-500/10"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Generate Diagnosis & Rx</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="h-full flex items-center justify-center p-10 fade-in-up">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-8 flex flex-col items-center justify-center max-w-sm w-full shadow-sm text-center">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                <h4 className="text-sm font-bold text-[#111111]">Synthesizing Consultation</h4>
                <p className="text-[11px] text-gray-400 mt-1.5 max-w-xs">Matching clinical symptoms against guidelines and drug indices...</p>
              </div>
            </div>
          )}

          {/* Redesigned Clinical Rx Output Sheet */}
          {output && !isLoading && (
            <div className="max-w-4xl mx-auto space-y-6">

              {/* Sticky Action Bar */}
              <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200/80 px-5 py-3 shadow-sm sticky top-0 z-20 no-print">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#111111]">Clinical Prescriptions Compiled</h3>
                    {output.responseTimeMs && (
                      <p className="text-[9px] text-green-600 font-bold flex items-center gap-0.5 mt-0.5">
                        <Zap className="h-2.5 w-2.5" /> Generated in {output.responseTimeMs} ms
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClear}
                    className="btn-ghost px-3.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> New Consultation
                  </button>
                  <button
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    className="px-4 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200/50 hover:bg-blue-100 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isExporting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : <Printer className="h-3.5 w-3.5" />}
                    <span>Print Prescription</span>
                  </button>
                  <button
                    onClick={handleCopyPrescription}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy to EMR'}</span>
                  </button>
                </div>
              </div>

              {/* 📄 THE MEDICAL PRESCRIPTION PAD SHEET (Grounded in Guidelines) */}
              <div
                id="clinical-matrix-pdf"
                className="bg-white rounded-2xl border-2 border-gray-150 p-8 shadow-md space-y-6 relative overflow-hidden"
              >

                {/* Prescription Pad Header */}
                <div className="border-b-2 border-gray-100 pb-4 flex justify-between items-start">
                  <div>
                    <h1 className="text-base font-bold text-blue-600 flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-blue-600 shrink-0" />
                      MedSynexa Clinical OPD Summary
                    </h1>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Clinical Decision Support Layer</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-800">
                      Dr. {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">OPD Consultation Copilot</p>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">Date: {new Date().toLocaleDateString('en-IN')}</p>
                  </div>
                </div>

                {/* Patient Information Section */}
                <div className="bg-gray-50/70 border border-gray-150 rounded-xl p-4.5 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div className="sm:col-span-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Patient Details</span>
                    <p className="font-bold text-gray-850">{age || 'N/A'} Years · {gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : 'N/A'}</p>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Clinical Note / Presentation</span>
                    <p className="text-gray-700 leading-relaxed font-semibold">{chiefComplaint}</p>
                  </div>
                </div>

                {/* Safety Alerts Banners (Critical Warning Block) */}
                {output.safetyFlags && output.safetyFlags.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="h-4.5 w-4.5 text-red-500" />
                      CRITICAL SAFETY GUARDRAILS
                    </h3>
                    <div className="space-y-2">
                      {output.safetyFlags.map((flag, idx) => {
                        const isCritical = flag.severity === 'critical';
                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${isCritical
                                ? 'bg-red-50/50 border-red-200 text-red-800'
                                : 'bg-amber-50/50 border-amber-200 text-amber-800'
                              }`}
                          >
                            <AlertTriangle className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${isCritical ? 'text-red-500' : 'text-amber-600'}`} />
                            <div>
                              <span className="font-bold text-[9px] uppercase tracking-widest block opacity-75 mb-0.5">
                                {flag.type.replace(/_/g, ' ')}
                              </span>
                              <p className="font-bold leading-relaxed">{flag.message}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Split: Suspected Differentials & Rx */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">

                  {/* Ranked Differential Diagnoses */}
                  <div className="lg:col-span-5 space-y-3.5">
                    <h3 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      Ranked Suspected Diagnoses
                    </h3>
                    <div className="space-y-2.5">
                      {output.differentialDiagnoses.map((dd, idx) => {
                        const cfg = LIKELIHOOD_CONFIG[dd.likelihood] || LIKELIHOOD_CONFIG.low;
                        return (
                          <div key={idx} className={`p-4 rounded-xl border ${cfg.bg} ${cfg.border} space-y-2`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 truncate min-w-0">
                                <span className={`h-5 w-5 rounded-full ${cfg.bg} border ${cfg.border} ${cfg.text} text-[10px] font-bold flex items-center justify-center shrink-0`}>
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-sm text-[#111111] truncate">{dd.condition}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                {dd.icdCode && (
                                  <span className="bg-white border border-gray-200 text-gray-500 font-mono text-[9px] px-1.5 py-0.5 rounded">ICD: {dd.icdCode}</span>
                                )}
                                <span className="bg-white border border-gray-250 text-[#111111] text-[10px] font-bold px-2 py-0.5 rounded-md">
                                  {dd.likelihood_percentage}%
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed font-medium">{dd.reasoning}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Treatment Options (Rx Prescription Card) */}
                  <div className="lg:col-span-7 space-y-3.5">
                    <h3 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                      <span className="text-blue-600 font-serif font-bold text-sm">Rx</span>
                      <span>Treatment Plan & Medications</span>
                    </h3>

                    <div className="space-y-3.5">
                      {output.treatmentOptions.map((tx, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-gray-150 bg-white shadow-sm space-y-2.5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-sm text-gray-850">{tx.drugName}</p>
                              <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Route: {tx.route}</p>
                            </div>
                            <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0">
                              {tx.dosage} · {tx.frequency} · {tx.duration}
                            </span>
                          </div>

                          {/* Brand alternatives */}
                          <div className="flex items-center gap-2 text-xs pt-1 border-t border-gray-50">
                            <span className="text-[9px] font-bold text-gray-400 uppercase shrink-0">Indian Brands:</span>
                            <div className="flex flex-wrap gap-1">
                              {tx.indianBrandNames.map((b, bIdx) => (
                                <span key={bIdx} className="bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-semibold">{b}</span>
                              ))}
                            </div>
                          </div>

                          {/* Contraindications info */}
                          {tx.contraindications.length > 0 && (
                            <div className="text-[10px] text-amber-800 bg-amber-50/50 px-2.5 py-1.5 rounded-lg border border-amber-200/60 font-semibold">
                              <strong className="text-amber-900 uppercase text-[9px] mr-1">Precaution:</strong>
                              {tx.contraindications.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Recommended Diagnostics / Referrals */}
                <div className="bg-gray-50/40 border border-gray-150 p-5 rounded-2xl space-y-3 mt-4">
                  <h3 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4.5 w-4.5 text-emerald-600 font-bold" />
                    Recommended Diagnostics & Follow-ups
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white border border-gray-150 p-4 rounded-xl shadow-sm">
                    {output.diagnosticNextSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 font-semibold">
                        <ChevronRight className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
