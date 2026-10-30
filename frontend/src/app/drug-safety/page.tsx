"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { toast, Toaster } from "react-hot-toast";
import {
  Loader2,
  Plus,
  X,
  Pill,
  Send,
  Calendar,
  Activity,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  User,
  Info,
} from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { SanitizedMedicalContent } from "../../components/SanitizedMedicalContent";

const stripMarkdown = (text: string) => {
  if (!text) return "";
  return text.replace(/\*\*/g, '').replace(/^[*\-•]\s+/gm, '').replace(/#/g, '').trim();
};

export default function DrugSafetyPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Form State
  const [patientId, setPatientId] = useState("");
  const [drugName, setDrugName] = useState("");
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [reportsRes, patientsRes] = await Promise.all([
        api.get("/safety/reports"),
        api.get("/patients"),
      ]);
      setReports(reportsRes.data || []);
      setPatients(patientsRes.data || []);
    } catch (err) {
      toast.error("Failed to load drug safety data");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !drugName.trim()) {
      return toast.error("Please select a patient and enter a drug name.");
    }

    setActionLoading(true);
    try {
      const res = await api.post("/safety/check", {
        patientId,
        drugName: drugName.trim(),
        includeReport: true,
      });

      toast.success("Drug Safety Check Complete!");
      setIsCreating(false);
      setDrugName("");

      const newReportData = {
        ...res.data,
        createdAt: new Date().toISOString(),
        status: res.data.safetyCheck?.status || "SAFE",
        patientName: res.data.patient?.name,
        drugName: res.data.drug?.name,
      };

      setSelectedReport(newReportData);

      const updatedReports = await api.get("/safety/reports");
      setReports(updatedReports.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Safety check failed");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SAFE":
        return (
          <span className="badge-clinical badge-emerald">
            <ShieldCheck className="w-3.5 h-3.5" /> Approved / Safe
          </span>
        );
      case "WARNING":
        return (
          <span className="badge-clinical badge-amber">
            <AlertTriangle className="w-3.5 h-3.5" /> Precaution Advised
          </span>
        );
      case "BLOCKED":
        return (
          <span className="badge-clinical badge-rose">
            <ShieldAlert className="w-3.5 h-3.5" /> Contraindicated
          </span>
        );
      default:
        return (
          <span className="badge-clinical badge-teal">
            <Info className="w-3.5 h-3.5" /> Checked
          </span>
        );
    }
  };

  const filteredReports = reports.filter(
    (r) =>
      r.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.drugName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen text-slate-100 font-sans flex flex-col">
      <Toaster position="top-right" />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Hero Banner */}
        <div className="relative bg-slate-900/80 backdrop-blur-2xl text-white rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden">
          {/* Ambient Mesh Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(13,148,136,0.2)]">
                <Pill className="w-3.5 h-3.5 text-teal-400" />
                <span>Pharmacovigilance & Safety</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Drug Safety & Interaction Checker
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Multi-drug interaction screening, dosage guardrails, patient allergy conflicts, and FDA/ICMR contraindication alerts.
              </p>
            </div>

            {!isCreating && !selectedReport && (
              <button
                onClick={() => {
                  setDrugName("");
                  setPatientId("");
                  setIsCreating(true);
                }}
                className="btn-teal text-xs py-3 px-6 shadow-[0_0_20px_rgba(13,148,136,0.4)] shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>New Safety Check</span>
              </button>
            )}
          </div>

          {/* Quick Metrics Bar */}
          {!isCreating && !selectedReport && (
            <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold border border-teal-500/30">
                  {reports.length}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Screenings</span>
                  <span className="font-bold text-white">Safety History</span>
                </div>
              </div>

              <div className="bg-slate-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-[11px] border border-teal-500/30">
                  FDA
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">OpenFDA API</span>
                  <span className="font-bold text-white">Live Label Sync</span>
                </div>
              </div>

              <div className="bg-slate-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3 col-span-2 sm:col-span-1">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-[11px] border border-emerald-500/30">
                  100%
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Allergy Guard</span>
                  <span className="font-bold text-white">Conflict Checker</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && !isCreating && !selectedReport ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-3" />
            <p className="text-xs text-slate-500 font-semibold">Loading medication safety logs...</p>
          </div>
        ) : (
          <>
            {isCreating && (
              <div className="bg-slate-900/90 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 p-6 sm:p-8 space-y-6 max-w-3xl mx-auto backdrop-blur-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Pill className="w-5 h-5 text-teal-400" /> New Medication Safety Screening
                  </h2>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAnalyze} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Patient Profile
                      </label>
                      <select
                        required
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        className="w-full p-3 bg-slate-950/80 border border-white/15 rounded-2xl text-xs text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 outline-none"
                      >
                        <option value="" className="bg-slate-900 text-slate-400">Select a patient...</option>
                        {patients.map((p) => (
                          <option key={p._id} value={p._id} className="bg-slate-900 text-white">
                            {p.name} (Age: {p.age}, {p.gender})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Medication / Drug Name
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Cimetidine 400mg, Warfarin 5mg"
                        value={drugName}
                        onChange={(e) => setDrugName(e.target.value)}
                        className="w-full p-3 bg-slate-950/80 border border-white/15 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Additional Clinical Notes / Existing Regimen (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Patient is currently prescribed Ketoconazole. Check for CYP450 enzyme inhibition."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-3 bg-slate-950/80 border border-white/15 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 outline-none resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="btn-teal text-sm py-3.5 px-6 w-full justify-center shadow-[0_0_20px_rgba(13,148,136,0.4)]"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Cross-Referencing FDA & ICMR Indices...
                        </>
                      ) : (
                        "Run Safety & Interaction Check"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Display Report View */}
            {selectedReport && !isCreating && (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="flex items-center gap-2 text-xs font-bold text-teal-300 hover:text-teal-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Safety Log
                </button>

                <div className="bg-slate-900/90 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] border border-white/10 overflow-hidden backdrop-blur-2xl">
                  <div className="bg-slate-950/80 p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2.5">
                        <Activity className="w-5 h-5 text-teal-400" />
                        Drug Safety & Interaction Assessment
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5 font-medium">
                        <span>Patient: <strong className="text-white">{selectedReport.patientName || selectedReport.patient?.name}</strong></span>
                        <span>•</span>
                        <span>Drug: <strong className="text-white">{selectedReport.drugName || selectedReport.drug?.name}</strong></span>
                        <span>•</span>
                        <span>{new Date(selectedReport.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {getStatusBadge(selectedReport.status || selectedReport.safetyCheck?.status)}
                  </div>

                  <div className="p-6 sm:p-8 space-y-6 bg-slate-900/50">
                    <SanitizedMedicalContent
                      content={selectedReport.report || selectedReport.message || selectedReport.safetyCheck?.message}
                      badgeLabel="Verified Against FDA/ICMR Indices"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Past Reports Grid */}
            {!isCreating && !selectedReport && (
              <div className="space-y-5">
                <div className="flex justify-end">
                  <input
                    type="text"
                    placeholder="Filter by patient or drug..."
                    className="w-full sm:w-80 px-4 py-2 bg-slate-950/80 border border-white/15 rounded-full text-xs text-white placeholder-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 outline-none backdrop-blur-md transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredReports.length === 0 ? (
                    <div className="col-span-full text-center py-16 bg-slate-900/60 rounded-3xl border border-white/10 text-slate-400 text-xs backdrop-blur-xl">
                      No drug safety screenings logged. Click "New Safety Screening" to check medication safety.
                    </div>
                  ) : (
                    filteredReports.map((report) => (
                      <div
                        key={report._id}
                        onClick={() => setSelectedReport(report)}
                        className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 shadow-lg hover:border-teal-500/50 hover:shadow-[0_0_30px_rgba(13,148,136,0.25)] transition-all duration-300 cursor-pointer flex flex-col justify-between group hover:-translate-y-1 backdrop-blur-xl relative overflow-hidden"
                      >
                        {/* Ambient Glow */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-teal-500/20 transition-all" />

                        <div>
                          <div className="flex items-center justify-between mb-3.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                              {report.patientName || "Patient"}
                            </span>
                            {getStatusBadge(report.status)}
                          </div>

                          <h3 className="text-base font-extrabold text-white mb-1.5 group-hover:text-teal-300 transition-colors">
                            {report.drugName}
                          </h3>
                          <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed font-medium">
                            {stripMarkdown(report.message)}
                          </p>
                        </div>

                        <div className="pt-3.5 border-t border-white/10 flex items-center justify-between text-xs font-bold text-teal-300 group-hover:text-teal-200">
                          <span>View Full Safety Report</span>
                          <span className="group-hover:translate-x-1.5 transition-transform font-bold">&rarr;</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
