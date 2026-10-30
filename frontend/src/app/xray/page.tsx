"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { toast, Toaster } from "react-hot-toast";
import {
  Loader2,
  Plus,
  Edit2,
  X,
  FileImage,
  User,
  Calendar,
  Activity,
  Save,
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  Trash2,
  Search,
} from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { SanitizedMedicalContent } from "../../components/SanitizedMedicalContent";
import { DeleteConfirmationModal } from "../../components/DeleteConfirmationModal";

export default function XrayPage() {
  const [studies, setStudies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [uploadLoading, setUploadLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    studyType: "Chest PA",
    modality: "Digital X-Ray",
    view: "PA View",
    file: null as File | null,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  const [deletingStudy, setDeletingStudy] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchStudies();
    fetchPatients();
  }, []);

  const fetchStudies = async () => {
    try {
      setLoading(true);
      const res = await api.get("/xray/studies");
      setStudies(res.data || []);
    } catch (err) {
      toast.error("Failed to load X-ray reports");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteStudy = async () => {
    if (!deletingStudy) return;
    try {
      setIsDeleting(true);
      await api.delete(`/xray/studies/${deletingStudy._id}`);
      toast.success("Radiology study deleted successfully");
      setStudies((prev) => prev.filter((s) => s._id !== deletingStudy._id));
      if (selectedStudy?.study?._id === deletingStudy._id) {
        setSelectedStudy(null);
      }
      setDeletingStudy(null);
    } catch (err: any) {
      toast.error("Failed to delete radiology study");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteStudy = (e: React.MouseEvent, study: any) => {
    e.stopPropagation();
    setDeletingStudy(study);
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get("/patients");
      setPatients(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.patientId)
      return toast.error("Please select patient and X-ray image file");
    setUploadLoading(true);
    try {
      const form = new FormData();
      form.append("patientId", formData.patientId);
      form.append("studyType", formData.studyType);
      form.append("modality", formData.modality);
      form.append("view", formData.view);
      form.append("image", formData.file);

      const res = await api.post("/xray/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("X-ray analyzed and findings generated");
      setIsCreating(false);
      setFormData({ ...formData, file: null });
      fetchStudies();
      if (res.data?.studyId) {
        handleSelectStudy(res.data.studyId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSelectStudy = async (studyId: string) => {
    try {
      setLoading(true);
      setIsCreating(false);
      setImageUrl("");
      const res = await api.get(`/xray/studies/${studyId}`);
      setSelectedStudy(res.data);
      setEditContent(res.data.aiReport?.generatedReport || "");
      setIsEditing(false);

      try {
        const imageRes = await api.get(`/xray/studies/${studyId}/image`, {
          responseType: "blob",
        });
        const url = URL.createObjectURL(imageRes.data);
        setImageUrl(url);
      } catch (imgErr) {
        console.error("Failed to load image", imgErr);
      }
    } catch (err) {
      toast.error("Failed to fetch study details");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedStudy) return;
    setSaveLoading(true);
    try {
      await api.put(`/xray/studies/${selectedStudy.study._id}/tech-submit`, {
        editedReport: editContent,
      });
      toast.success("Radiologist report updated");
      setIsEditing(false);
      setSelectedStudy({
        ...selectedStudy,
        aiReport: {
          ...selectedStudy.aiReport,
          generatedReport: editContent,
        },
      });
      fetchStudies();
    } catch (err) {
      toast.error("Failed to save report changes");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans flex flex-col">
      <Toaster position="top-right" />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Hero Banner */}
        <div className="relative bg-slate-900/80 backdrop-blur-2xl text-white rounded-3xl p-6 sm:p-8 shadow-[0_15px_35px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden">
          {/* Ambient Mesh Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(13,148,136,0.2)]">
                <FileImage className="w-3.5 h-3.5 text-teal-400" />
                <span>AI Radiology Diagnostic Suite</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                X-Ray Radiology Diagnostic Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Multi-class lesion detection, DICOM digital radiogram analysis, and radiologist decision support.
              </p>
            </div>

            {!isCreating && !selectedStudy && (
              <button
                onClick={() => setIsCreating(true)}
                className="btn-teal text-xs py-3 px-6 shadow-[0_0_20px_rgba(13,148,136,0.4)] shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Upload New X-Ray</span>
              </button>
            )}
          </div>

          {/* Quick Metrics Bar */}
          {!isCreating && !selectedStudy && (
            <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold border border-teal-500/30">
                  {studies.length}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Scans</span>
                  <span className="font-bold text-white">Radiology Vault</span>
                </div>
              </div>

              <div className="bg-slate-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold border border-teal-500/30">
                  2.5
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Vision Model</span>
                  <span className="font-bold text-white">Gemini Vision AI</span>
                </div>
              </div>

              <div className="bg-slate-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3 col-span-2 sm:col-span-1">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[11px] border border-cyan-500/30">
                  RAG
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Grounded Analysis</span>
                  <span className="font-bold text-white">Textbook Verified</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && !selectedStudy && !isCreating ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-3" />
            <p className="text-xs text-slate-500 font-semibold">Loading radiology records...</p>
          </div>
        ) : (
          <>
            {/* Create Form */}
            {isCreating && (
              <div className="bg-slate-900/90 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 p-6 sm:p-8 space-y-6 max-w-3xl mx-auto backdrop-blur-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <FileImage className="w-5 h-5 text-teal-400" /> Upload X-Ray Scan for Pathology Analysis
                  </h2>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Patient Record
                      </label>
                      <select
                        required
                        className="w-full p-3 bg-slate-950/80 border border-white/15 rounded-2xl text-xs text-white focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 outline-none"
                        value={formData.patientId}
                        onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                      >
                        <option value="" className="bg-slate-900 text-slate-400">Select a patient...</option>
                        {patients.map((p) => (
                          <option key={p._id} value={p._id} className="bg-slate-900 text-white">
                            {p.name} (Age: {p.age})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Study Description
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full p-3 bg-slate-950/80 border border-white/15 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 outline-none"
                        value={formData.studyType}
                        onChange={(e) => setFormData({ ...formData, studyType: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Select X-Ray File (DICOM / Image)
                    </label>
                    <div className="border-2 border-dashed border-teal-500/30 rounded-2xl p-6 text-center hover:bg-teal-500/10 transition-colors relative overflow-hidden bg-slate-950/50">
                      <input
                        required
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            file: e.target.files?.[0] || null,
                          })
                        }
                      />
                      <UploadCloud className="w-10 h-10 mx-auto text-teal-400 mb-2 opacity-90" />
                      <p className="text-xs font-semibold text-slate-300">
                        {formData.file ? formData.file.name : "Drag & drop or click to choose X-ray image"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={uploadLoading}
                      className="btn-teal text-sm py-3.5 px-6 w-full justify-center shadow-[0_0_20px_rgba(13,148,136,0.4)]"
                    >
                      {uploadLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Processing X-Ray Radiology AI...
                        </>
                      ) : (
                        "Generate Radiologist Report"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Study Detail View */}
            {selectedStudy && !isCreating && (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedStudy(null)}
                  className="flex items-center gap-2 text-xs font-bold text-teal-300 hover:text-teal-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Radiology Records
                </button>

                <div className="bg-slate-900/90 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden backdrop-blur-2xl">
                  <div className="bg-slate-950/80 p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2.5">
                        <User className="w-5 h-5 text-teal-400" />
                        {selectedStudy.study?.patientId?.name || "Patient Record"}
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-medium">
                        <span>{selectedStudy.study?.studyType} ({selectedStudy.study?.modality})</span>
                        <span>•</span>
                        <span>{new Date(selectedStudy.study?.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-[0_0_15px_rgba(13,148,136,0.2)]">
                        <ShieldCheck className="w-4 h-4 text-teal-400" />
                        Verified Against Radiologist Guidelines
                      </span>
                      {selectedStudy.study?._id && (
                        <button
                          onClick={(e) => handleDeleteStudy(e, selectedStudy.study._id)}
                          className="px-3 py-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Scan</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Image Column */}
                    <div className="p-6 bg-slate-950/90 border-r border-white/10 flex flex-col min-h-[400px]">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">Digital Radiogram View</span>
                      <div className="flex-1 bg-black/90 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center p-3 shadow-inner">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="X-Ray Scan"
                            className="max-h-[500px] w-full object-contain rounded-xl"
                          />
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">Loading digital scan...</span>
                        )}
                      </div>
                    </div>

                    {/* Report Column */}
                    <div className="p-6 flex flex-col justify-between bg-slate-900/50">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                          <h3 className="text-sm font-extrabold text-white">Radiology Diagnostic Impression</h3>
                          {!isEditing ? (
                            <button
                              onClick={() => setIsEditing(true)}
                              className="btn-secondary text-xs py-1.5 px-3"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit Report
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setIsEditing(false)}
                                className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveEdit}
                                disabled={saveLoading}
                                className="btn-teal text-xs py-1.5 px-3"
                              >
                                <Save className="w-3.5 h-3.5" /> Save
                              </button>
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <textarea
                            className="w-full h-80 p-3.5 bg-slate-950/90 border border-white/15 rounded-2xl text-xs font-mono leading-relaxed outline-none focus:border-teal-400 text-white"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                          />
                        ) : (
                          <SanitizedMedicalContent
                            content={selectedStudy.aiReport?.generatedReport}
                            badgeLabel="Radiology Protocol Formatted"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Studies Grid */}
            {!isCreating && !selectedStudy && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-white/10 backdrop-blur-xl shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <FileImage className="w-4 h-4 text-teal-400" />
                    <span>Radiology Records ({studies.length})</span>
                  </div>

                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter by patient name or study type..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-white/15 rounded-full text-xs text-white placeholder-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 outline-none transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {studies.filter(
                    (s) =>
                      s.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.studyType?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length === 0 ? (
                    <div className="col-span-full text-center py-16 bg-slate-900/60 rounded-3xl border border-white/10 text-slate-400 text-xs backdrop-blur-xl">
                      No X-ray studies logged. Click "Upload New X-Ray" to upload a scan.
                    </div>
                  ) : (
                    studies
                      .filter(
                        (s) =>
                          s.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.studyType?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((study) => (
                    <div
                      key={study._id}
                      onClick={() => handleSelectStudy(study._id)}
                      className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 shadow-lg hover:border-teal-500/50 hover:shadow-[0_0_30px_rgba(13,148,136,0.25)] transition-all duration-300 cursor-pointer flex flex-col justify-between group hover:-translate-y-1 backdrop-blur-xl relative overflow-hidden"
                    >
                      {/* Ambient Accent Glow */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-teal-500/20 transition-all" />

                      <div>
                        <div className="flex items-center justify-between mb-3.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-2.5 py-0.5 rounded-full border border-teal-500/40">
                            {study.studyType}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium">
                              {new Date(study.createdAt).toLocaleDateString()}
                            </span>
                            <button
                              onClick={(e) => handleDeleteStudy(e, study)}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Delete Radiology Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-base font-extrabold text-white mb-1 group-hover:text-teal-300 transition-colors">
                          {study.patientId?.name || "Patient Scan"}
                        </h3>
                        <p className="text-xs text-slate-400 mb-4 font-semibold">{study.modality} • {study.view || "PA View"}</p>
                      </div>

                      <div className="pt-3.5 border-t border-white/10 flex items-center justify-between text-xs font-bold text-teal-300 group-hover:text-teal-200">
                        <span>View Radiologist Report</span>
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
          isOpen={!!deletingStudy}
          title="Delete Radiology Study"
          itemTitle={deletingStudy?.studyType || "Chest X-Ray Record"}
          description="Are you sure you want to delete this X-Ray radiology record and AI analysis? This action cannot be undone."
          onClose={() => setDeletingStudy(null)}
          onConfirm={confirmDeleteStudy}
          loading={isDeleting}
        />
      </main>
    </div>
  );
}
