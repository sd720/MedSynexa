"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { toast, Toaster } from "react-hot-toast";
import {
  Loader2,
  UploadCloud,
  FileText,
  BookOpen,
  Trash2,
  Calendar,
  Download,
  Eye,
  Search,
  CheckCircle2,
} from "lucide-react";
import { DeleteConfirmationModal } from "../../components/DeleteConfirmationModal";
import { Navbar } from "../../components/Navbar";

export default function LibraryManagerPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingDoc, setDeletingDoc] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deletingDoc) return;
    try {
      setIsDeleting(true);
      await api.delete(`/documents/${deletingDoc._id}`);
      toast.success("Document removed from clinical library.");
      fetchDocuments();
      setDeletingDoc(null);
    } catch (err) {
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/documents");
      setDocuments(res.data.documents || []);
    } catch (err) {
      toast.error("Failed to load library documents");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      return toast.error("Only PDF files are supported currently.");
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", "guideline");

    try {
      await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded & processed for RAG vector search!");
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDelete = (doc: any) => {
    setDeletingDoc(doc);
  };

  const handleDownload = async (docId: string, filename: string) => {
    try {
      const res = await api.get(`/documents/${docId}/file`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error("Failed to download document");
    }
  };

  const handleView = async (docId: string) => {
    try {
      const res = await api.get(`/documents/${docId}/file`, {
        responseType: 'blob',
      });
      const fileURL = URL.createObjectURL(res.data);
      window.open(fileURL, '_blank');
    } catch (err) {
      toast.error("Failed to open document");
    }
  };

  const filteredDocs = documents.filter(d =>
    d.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen text-slate-100 font-sans flex flex-col bg-[#080F19]">
      <Toaster position="top-right" />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-white/10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-3 shadow-[0_0_15px_rgba(13,148,136,0.2)]">
              <BookOpen className="w-3.5 h-3.5" /> Clinical Knowledge Base
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Medical RAG Knowledge Base & Library
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
              Manage clinical textbooks, ICMR guidelines, and hospital protocols indexed for semantic AI search
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search library..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-white/15 rounded-full text-xs text-white placeholder-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 outline-none transition-all"
              />
            </div>

            <label className="btn-teal text-xs py-2.5 px-5 shrink-0 cursor-pointer shadow-[0_0_20px_rgba(13,148,136,0.4)]">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" /> Upload PDF Guideline
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-teal-400 mb-3" />
            <p className="text-xs text-slate-400 font-semibold">Loading medical knowledge base...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-slate-900/80 rounded-3xl border border-white/10 text-slate-400 text-xs backdrop-blur-xl">
                <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <h3 className="text-sm font-extrabold text-white mb-1">No Medical Documents Found</h3>
                <p className="text-slate-400">Upload a PDF guideline or clinical textbook to begin semantic vector search.</p>
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <div
                  key={doc._id}
                  className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 shadow-lg hover:border-teal-500/50 hover:shadow-[0_0_30px_rgba(13,148,136,0.25)] transition-all duration-300 flex flex-col justify-between group backdrop-blur-2xl relative overflow-hidden"
                >
                  {/* Ambient Accent Glow */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-teal-500/20 transition-all" />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-[0_0_12px_rgba(13,148,136,0.2)]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Vector Indexed
                      </span>
                      <button
                        onClick={() => setDeletingDoc(doc)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-base font-extrabold text-white mb-1.5 line-clamp-2 group-hover:text-teal-300 transition-colors" title={doc.filename}>
                      {doc.filename}
                    </h3>
                    <span className="text-xs text-slate-400 font-medium block mb-5">
                      Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                    <button
                      onClick={() => handleView(doc._id)}
                      className="flex-1 btn-secondary text-xs py-2.5 px-4 min-h-[44px]"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => handleDownload(doc._id, doc.filename)}
                      className="flex-1 btn-secondary text-xs py-2.5 px-4 min-h-[44px]"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <DeleteConfirmationModal
          isOpen={!!deletingDoc}
          title="Remove Guideline Document"
          itemTitle={deletingDoc?.filename || ""}
          description="Are you sure you want to delete this document from the RAG knowledge base? This action cannot be undone."
          onClose={() => setDeletingDoc(null)}
          onConfirm={confirmDelete}
          loading={isDeleting}
        />
      </main>
    </div>
  );
}
