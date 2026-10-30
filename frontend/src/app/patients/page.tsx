"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { toast, Toaster } from "react-hot-toast";
import {
  Loader2,
  Plus,
  Edit2,
  X,
  User,
  Users,
  Activity,
  Save,
  Trash2,
  Phone,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Pill,
  FileImage,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Search,
} from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { SanitizedMedicalContent } from "../../components/SanitizedMedicalContent";
import { usePhi } from "../../context/PhiContext";
import { DeleteConfirmationModal } from "../../components/DeleteConfirmationModal";

export default function PatientsPage() {
  const { maskName } = usePhi();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeletePatient = async () => {
    if (!deletingPatient) return;
    try {
      setIsDeleting(true);
      await api.delete(`/patients/${deletingPatient._id}`);
      toast.success("Patient record deleted");
      fetchPatients();
      setDeletingPatient(null);
    } catch (error) {
      toast.error("Failed to delete patient");
    } finally {
      setIsDeleting(false);
    }
  };

  // Patient Timeline State
  const [selectedTimelinePatient, setSelectedTimelinePatient] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [activeTab, setActiveTab] = useState<"safety" | "xray" | "reports">("safety");

  const initialFormState = {
    _id: "",
    name: "",
    age: "",
    weight: "",
    gender: "male",
    contactNumber: "",
    medicalHistory: "",
    allergies: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get("/patients");
      setPatients(res.data || []);
    } catch (err) {
      toast.error("Failed to load patients directory");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTimeline = async (patient: any) => {
    setSelectedTimelinePatient(patient);
    setLoadingTimeline(true);
    try {
      const res = await api.get(`/patients/${patient._id}/timeline`);
      setTimelineData(res.data);
    } catch (err) {
      toast.error("Failed to fetch patient EHR timeline");
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.age) {
      return toast.error("Please provide patient name and age");
    }

    setActionLoading(true);
    try {
      const payload = {
        name: formData.name,
        age: Number(formData.age),
        weight: formData.weight ? Number(formData.weight) : undefined,
        gender: formData.gender,
        contactNumber: formData.contactNumber,
        medicalHistory: formData.medicalHistory
          ? formData.medicalHistory.split(",").map((h) => h.trim())
          : [],
        allergies: formData.allergies
          ? formData.allergies.split(",").map((a) => a.trim())
          : [],
      };

      if (isEditing && formData._id) {
        await api.put(`/patients/${formData._id}`, payload);
        toast.success("Patient record updated successfully");
      } else {
        await api.post("/patients", payload);
        toast.success("Patient registered successfully");
      }

      setIsCreating(false);
      setIsEditing(false);
      setFormData(initialFormState);
      fetchPatients();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePatient = (patient: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingPatient(patient);
  };

  const handleEditClick = (patient: any) => {
    setFormData({
      _id: patient._id,
      name: patient.name,
      age: patient.age.toString(),
      weight: patient.weight ? patient.weight.toString() : "",
      gender: patient.gender || "male",
      contactNumber: patient.contactNumber || "",
      medicalHistory: Array.isArray(patient.medicalHistory)
        ? patient.medicalHistory.join(", ")
        : patient.medicalHistory || "",
      allergies: Array.isArray(patient.allergies)
        ? patient.allergies.join(", ")
        : patient.allergies || "",
    });
    setIsEditing(true);
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p._id?.toLowerCase().includes(searchTerm.toLowerCase())
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
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span>Longitudinal Health Records</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Patient EHR Directory & Clinical Encounters
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Centralized electronic health record vault, patient demographics, allergy alerts, and multi-modal diagnostic encounter history.
              </p>
            </div>

            {!isCreating && !isEditing && !selectedTimelinePatient && (
              <button
                onClick={() => {
                  setFormData(initialFormState);
                  setIsCreating(true);
                }}
                className="btn-teal text-xs py-3 px-6 shadow-[0_0_20px_rgba(13,148,136,0.4)] shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Register Patient</span>
              </button>
            )}
          </div>

          {/* Quick Metrics Bar */}
          {!isCreating && !isEditing && !selectedTimelinePatient && (
            <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold border border-teal-500/30">
                  {patients.length}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Patients</span>
                  <span className="font-bold text-white">Registered Vault</span>
                </div>
              </div>

              <div className="bg-slate-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold border border-rose-500/30">
                  {patients.filter((p) => p.allergies?.length > 0).length}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Allergy Alerts</span>
                  <span className="font-bold text-white">Flagged Cases</span>
                </div>
              </div>

              <div className="bg-slate-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3 col-span-2 sm:col-span-1">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-[11px] border border-emerald-500/30">
                  100%
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">HIPAA Verified</span>
                  <span className="font-bold text-white">Encrypted Storage</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && !isCreating && !isEditing && !selectedTimelinePatient ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-3" />
            <p className="text-xs text-slate-500 font-semibold">Loading patient directory...</p>
          </div>
        ) : (
          <>
            {/* Create/Edit Form */}
            {(isCreating || isEditing) && (
              <div className="bg-slate-900/90 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 p-6 sm:p-8 space-y-6 max-w-3xl mx-auto backdrop-blur-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-teal-400" />
                    {isEditing ? "Edit Patient EHR Details" : "Register New Patient Record"}
                  </h2>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                      setFormData(initialFormState);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateOrUpdate} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Full Name *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full p-3 bg-slate-950/80 border border-white/15 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 outline-none"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        className="w-full p-3 bg-slate-950/80 border border-white/15 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 outline-none"
                        value={formData.contactNumber}
                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Age (Years) *
                      </label>
                      <input
                        required
                        type="number"
                        placeholder="45"
                        className="w-full p-3 bg-slate-950/80 border border-white/15 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 outline-none"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        placeholder="68"
                        className="w-full p-3 bg-slate-950/80 border border-white/15 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 outline-none"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Gender *
                      </label>
                      <select
                        required
                        className="w-full p-3 bg-slate-950/80 border border-white/15 rounded-2xl text-xs text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 outline-none"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="male" className="bg-slate-900 text-white">Male</option>
                        <option value="female" className="bg-slate-900 text-white">Female</option>
                        <option value="other" className="bg-slate-900 text-white">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Medical History (comma-separated)
                    </label>
                    <textarea
                      placeholder="Hypertension, Type 2 Diabetes, Asthma"
                      rows={2}
                      className="w-full p-3 bg-slate-950/80 border border-white/15 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 outline-none resize-none"
                      value={formData.medicalHistory}
                      onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Allergies & Sensitivities
                    </label>
                    <textarea
                      placeholder="Penicillin, Sulfa drugs"
                      rows={2}
                      className="w-full p-3 bg-slate-950/80 border border-white/15 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 outline-none resize-none"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    />
                  </div>

                  <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                      }}
                      className="btn-secondary text-xs py-2 px-4"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="btn-teal text-xs py-2 px-5 shadow-[0_0_20px_rgba(13,148,136,0.4)]"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>{isEditing ? "Save Changes" : "Register Patient"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Patient EHR Timeline View */}
            {selectedTimelinePatient && !isCreating && !isEditing && (
              <div className="space-y-6">
                <button
                  onClick={() => {
                    setSelectedTimelinePatient(null);
                    setTimelineData(null);
                  }}
                  className="flex items-center gap-2 text-xs font-bold text-teal-300 hover:text-teal-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Patient Directory
                </button>

                <div className="bg-slate-900/90 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden backdrop-blur-2xl">
                  {/* Patient Profile Header */}
                  <div className="bg-slate-950/80 p-6 border-b border-white/10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-lg border border-teal-500/30 shadow-[0_0_15px_rgba(13,148,136,0.3)]">
                            {selectedTimelinePatient.name?.[0] || "P"}
                          </div>
                          <div>
                            <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
                              {selectedTimelinePatient.name}
                              <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                {selectedTimelinePatient.age} yrs • {selectedTimelinePatient.gender}
                              </span>
                            </h2>
                            <p className="text-xs text-slate-400 mt-1 font-medium">
                              Patient ID: <code className="font-mono text-teal-300">{selectedTimelinePatient._id}</code>
                            </p>
                          </div>
                        </div>
                      </div>

                      {selectedTimelinePatient.contactNumber && (
                        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 px-3.5 py-2 rounded-2xl border border-white/10">
                          <Phone className="w-3.5 h-3.5 text-teal-400" />
                          <span className="font-mono">{selectedTimelinePatient.contactNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* Allergies & Medical History Badges */}
                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-4 text-xs">
                      {selectedTimelinePatient.allergies?.length > 0 && (
                        <div className="flex items-center gap-1.5 text-rose-200 bg-rose-950/50 px-3.5 py-1.5 rounded-2xl border border-rose-500/30">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          <span className="font-bold uppercase text-[10px]">Allergies:</span>
                          <span>{Array.isArray(selectedTimelinePatient.allergies) ? selectedTimelinePatient.allergies.join(", ") : selectedTimelinePatient.allergies}</span>
                        </div>
                      )}

                      {selectedTimelinePatient.medicalHistory?.length > 0 && (
                        <div className="flex items-center gap-1.5 text-slate-200 bg-slate-900 px-3.5 py-1.5 rounded-2xl border border-white/10">
                          <Activity className="w-3.5 h-3.5 text-teal-400" />
                          <span className="font-bold uppercase text-[10px]">History:</span>
                          <span>{Array.isArray(selectedTimelinePatient.medicalHistory) ? selectedTimelinePatient.medicalHistory.join(", ") : selectedTimelinePatient.medicalHistory}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Tabs */}
                  <div className="border-b border-white/10 bg-slate-950/50 px-6 flex gap-6">
                    <button
                      onClick={() => setActiveTab("safety")}
                      className={`py-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === "safety"
                          ? "border-teal-400 text-teal-300"
                          : "border-transparent text-slate-400 hover:text-white"
                      }`}
                    >
                      <Pill className="w-4 h-4" />
                      <span>Drug Safety Checks ({timelineData?.safetyReports?.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("xray")}
                      className={`py-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === "xray"
                          ? "border-teal-400 text-teal-300"
                          : "border-transparent text-slate-400 hover:text-white"
                      }`}
                    >
                      <FileImage className="w-4 h-4" />
                      <span>Radiology X-Rays ({timelineData?.xrayStudies?.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("reports")}
                      className={`py-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === "reports"
                          ? "border-teal-400 text-teal-300"
                          : "border-transparent text-slate-400 hover:text-white"
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Clinical Condition Reports ({timelineData?.patientReports?.length || 0})</span>
                    </button>
                  </div>

                  {/* Tab Body */}
                  <div className="p-6 bg-slate-900/50">
                    {loadingTimeline ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
                        <span className="text-xs text-slate-400 font-semibold">Querying MongoDB EHR records...</span>
                      </div>
                    ) : (
                      <>
                        {/* Tab 1: Drug Safety Checks */}
                        {activeTab === "safety" && (
                          <div className="space-y-4">
                            {!timelineData?.safetyReports || timelineData.safetyReports.length === 0 ? (
                              <div className="text-center py-12 text-slate-400 text-xs bg-slate-950/40 rounded-2xl border border-white/10">
                                No medication safety screenings recorded for this patient.
                              </div>
                            ) : (
                              timelineData.safetyReports.map((report: any) => (
                                <div key={report._id} className="p-5 rounded-2xl border border-white/10 bg-slate-950/60 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Pill className="w-4 h-4 text-teal-400" />
                                      <span className="text-sm font-extrabold text-white">{report.drugName}</span>
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium">
                                      {new Date(report.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <SanitizedMedicalContent content={report.report || report.message} badgeLabel="FDA/ICMR Screened" />
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* Tab 2: Radiology X-Rays */}
                        {activeTab === "xray" && (
                          <div className="space-y-4">
                            {!timelineData?.xrayStudies || timelineData.xrayStudies.length === 0 ? (
                              <div className="text-center py-12 text-slate-400 text-xs bg-slate-950/40 rounded-2xl border border-white/10">
                                No radiology X-ray scans logged for this patient.
                              </div>
                            ) : (
                              timelineData.xrayStudies.map((item: any) => (
                                <div key={item.study?._id} className="p-5 rounded-2xl border border-white/10 bg-slate-950/60 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="text-sm font-extrabold text-white">{item.study?.studyType} ({item.study?.modality})</span>
                                      <span className="text-xs text-slate-400 block">{new Date(item.study?.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <span className="badge-clinical badge-teal">Status: {item.study?.status}</span>
                                  </div>
                                  <SanitizedMedicalContent content={item.aiReport?.generatedReport} badgeLabel="Radiology AI Report" />
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* Tab 3: Clinical Condition Reports */}
                        {activeTab === "reports" && (
                          <div className="space-y-4">
                            {!timelineData?.patientReports || timelineData.patientReports.length === 0 ? (
                              <div className="text-center py-12 text-slate-400 text-xs bg-slate-950/40 rounded-2xl border border-white/10">
                                No condition summary reports generated for this patient.
                              </div>
                            ) : (
                              timelineData.patientReports.map((rep: any) => (
                                <div key={rep._id} className="p-5 rounded-2xl border border-white/10 bg-slate-950/60 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-extrabold text-white">Condition: {rep.condition}</span>
                                    <span className="text-xs text-slate-400 font-medium">
                                      {new Date(rep.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {rep.simpleSummary && (
                                    <p className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-900 p-3.5 rounded-xl border border-white/10">
                                      {rep.simpleSummary}
                                    </p>
                                  )}
                                  <SanitizedMedicalContent content={rep.cures || rep.dietAndLifestyle} badgeLabel="Treatment Guidance" />
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Patients Grid */}
            {!isCreating && !isEditing && !selectedTimelinePatient && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <Users className="w-4 h-4 text-teal-400" />
                    <span>Patient Records ({filteredPatients.length} of {patients.length})</span>
                  </div>

                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search patients by name or ID..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-white/15 rounded-full text-xs text-white placeholder-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 outline-none transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPatients.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-slate-900/60 rounded-3xl border border-white/10 text-slate-400 text-xs backdrop-blur-xl">
                      No patient records found. Click "Register Patient" to add a new record.
                    </div>
                  ) : (
                    filteredPatients.map((patient) => (
                      <div
                        key={patient._id}
                        className="rounded-3xl bg-slate-900/80 border border-white/10 shadow-lg hover:border-teal-500/50 hover:shadow-[0_0_30px_rgba(13,148,136,0.25)] transition-all duration-300 flex flex-col justify-between group overflow-hidden hover:-translate-y-1 relative backdrop-blur-xl"
                      >
                        {/* Top Gradient Accent Line */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />

                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <span className="badge-clinical badge-teal shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Stable Record
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(patient);
                                }}
                                className="p-1.5 text-slate-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition-colors"
                                title="Edit Record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeletePatient(patient, e)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-base border border-teal-500/30 group-hover:scale-105 transition-transform">
                              {patient.name?.[0] || "P"}
                            </div>
                            <div>
                              <h3 className="text-base font-extrabold text-white group-hover:text-teal-300 transition-colors">
                                {maskName(patient.name)}
                              </h3>
                              <div className="text-xs text-slate-400 font-semibold flex items-center gap-2">
                                <span>{patient.age} yrs</span>
                                <span>•</span>
                                <span className="capitalize">{patient.gender}</span>
                                {patient.weight && <span>• {patient.weight} kg</span>}
                              </div>
                            </div>
                          </div>

                          {patient.contactNumber && (
                            <div className="text-xs text-slate-300 flex items-center gap-2 mb-4 bg-slate-950/60 p-2.5 rounded-xl border border-white/10">
                              <Phone className="w-3.5 h-3.5 text-teal-400" />
                              <span className="font-mono">{maskName(patient.contactNumber)}</span>
                            </div>
                          )}

                          {patient.allergies?.length > 0 && (
                            <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs">
                              <span className="font-bold block mb-1 text-[10px] uppercase tracking-wider text-rose-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-400" /> Allergies & Sensitivities
                              </span>
                              <span className="font-semibold">{Array.isArray(patient.allergies) ? patient.allergies.join(", ") : patient.allergies}</span>
                            </div>
                          )}
                        </div>

                        <div
                          onClick={() => handleOpenTimeline(patient)}
                          className="px-6 py-4 bg-slate-950/60 border-t border-white/10 flex items-center justify-between text-xs font-bold text-teal-300 cursor-pointer hover:bg-teal-500/20 hover:text-white transition-colors"
                        >
                          <span>View Detailed EHR History</span>
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

        <DeleteConfirmationModal
          isOpen={!!deletingPatient}
          title="Delete Patient Record"
          itemTitle={deletingPatient?.name || ""}
          description="Are you sure you want to permanently delete this patient record and associated EHR history? This action cannot be undone."
          onClose={() => setDeletingPatient(null)}
          onConfirm={confirmDeletePatient}
          loading={isDeleting}
        />
      </main>
    </div>
  );
}
