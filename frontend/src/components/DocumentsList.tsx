'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import {
  FileText,
  Search,
  Trash2,
  Edit2,
  Eye,
  UploadCloud,
  Check,
  X,
  BookOpen,
  MessageSquare,
  FlaskConical,
  Layers,
  HardDrive,
  Calendar,
  Hash,
} from 'lucide-react';

interface DocumentItem {
  _id: string;
  filename: string;
  fileSize: number;
  chunkCount: number;
  documentType: 'general' | 'lab_report';
  mimeType: string;
  uploadDate: string;
}

interface DocumentsListProps {
  onStartChatWithDoc?: (doc: DocumentItem) => void;
}

export const DocumentsList: React.FC<DocumentsListProps> = ({ onStartChatWithDoc }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [isUploadingGeneral, setIsUploadingGeneral] = useState(false);
  const [isUploadingLab, setIsUploadingLab] = useState(false);
  
  const [deletingDoc, setDeletingDoc] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/documents');
      setDocuments(res.data.documents || []);
    } catch (err: any) {
      setError('Failed to fetch uploaded documents.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: 'general' | 'lab_report') => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', docType);

    if (docType === 'general') setIsUploadingGeneral(true);
    else setIsUploadingLab(true);
    setError(null);

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocuments([res.data.document, ...documents]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'File upload failed.');
    } finally {
      if (docType === 'general') setIsUploadingGeneral(false);
      else setIsUploadingLab(false);
    }
    e.target.value = '';
  };
  const confirmDeleteDoc = async () => {
    if (!deletingDoc) return;
    try {
      setIsDeleting(true);
      await api.delete(`/documents/${deletingDoc._id}`);
      setDocuments(documents.filter((d) => d._id !== deletingDoc._id));
      setDeletingDoc(null);
    } catch {
      alert('Failed to delete document.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = (doc: DocumentItem) => {
    setDeletingDoc(doc);
  };

  const handleSaveRename = async (docId: string) => {
    if (!editingName.trim()) return;
    try {
      await api.put(`/documents/${docId}/rename`, { filename: editingName.trim() });
      setDocuments(documents.map((d) => (d._id === docId ? { ...d, filename: editingName.trim() } : d)));
      setEditingId(null);
    } catch {
      alert('Failed to rename document.');
    }
  };

  const handleStartChat = async (doc: DocumentItem) => {
    try {
      const res = await api.post('/chats', { documentId: doc._id });
      if (onStartChatWithDoc) onStartChatWithDoc(doc);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start chat session.');
    }
  };

  const handleViewFile = async (docId: string, mimeType: string) => {
    try {
      const res = await api.get(`/documents/${docId}/file`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: mimeType || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch {
      alert('Failed to view document.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const generalDocs = documents.filter(
    (d) => d.documentType === 'general' && d.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const labDocs = documents.filter(
    (d) => d.documentType === 'lab_report' && d.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const DocCard = ({ doc }: { doc: DocumentItem }) => {
    const isLab = doc.documentType === 'lab_report';
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3.5 hover:border-gray-300 hover:shadow-md transition-all group">
        <div className="flex items-start justify-between gap-2">
          <div className={`icon-container ${isLab ? 'icon-cyan' : 'icon-blue'} h-8 w-8 shrink-0`}>
            {isLab ? <FlaskConical className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </div>
          <span className={`badge ${isLab ? 'badge-cyan' : 'badge-blue'} text-[9px] shrink-0`}>
            {isLab ? 'Lab Report' : 'Textbook'}
          </span>
        </div>

        {editingId === doc._id ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              className="input-field flex-1 px-2 py-1 text-xs"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(doc._id)}
            />
            <button onClick={() => handleSaveRename(doc._id)} className="text-green-600 p-1 hover:bg-green-50 rounded-lg">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setEditingId(null)} className="text-gray-400 p-1 hover:bg-gray-50 rounded-lg">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <h4 className="text-xs font-bold text-[#111111] truncate leading-tight" title={doc.filename}>
            {doc.filename}
          </h4>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-gray-400">
          <div className="flex items-center gap-1">
            <Hash className="h-3 w-3 text-blue-500" />
            <span>{doc.chunkCount} chunks</span>
          </div>
          <div className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            <span>{formatFileSize(doc.fileSize)}</span>
          </div>
          <div className="flex items-center gap-1 col-span-2">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(doc.uploadDate)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 mt-1">
          <button
            onClick={() => handleViewFile(doc._id, doc.mimeType)}
            className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleStartChat(doc)}
              className="p-1 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              title="Start Q&A Chat"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setEditingId(doc._id); setEditingName(doc.filename); }}
              className="p-1 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-gray-50 transition-colors"
              title="Rename"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleDelete(doc)}
              className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DocSection = ({
    title,
    subtitle,
    icon: Icon,
    iconClass,
    docs,
    uploadType,
    isUploading,
    emptyMsg,
    accentClass,
  }: {
    title: string;
    subtitle: string;
    icon: React.ElementType;
    iconClass: string;
    docs: DocumentItem[];
    uploadType: 'general' | 'lab_report';
    isUploading: boolean;
    emptyMsg: string;
    accentClass: string;
  }) => (
    <div className="bg-white rounded-2xl border border-gray-250/70 shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className={`flex items-center justify-between px-5 py-3.5 border-b border-gray-100 ${accentClass}`}>
        <div className="flex items-center gap-3">
          <div className={`icon-container ${iconClass} h-8 w-8`}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#111111]">{title}</h3>
            <p className="text-[9px] text-gray-400 font-semibold mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-slate text-[9px]">{docs.length} files</span>
          <label className="btn-ghost px-3 py-1.5 text-xs cursor-pointer flex items-center gap-1">
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 text-blue-600" />
            ) : (
              <UploadCloud className="h-3.5 w-3.5" />
            )}
            <span>{isUploading ? 'Uploading…' : 'Upload'}</span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.png,.jpg,.jpeg"
              onChange={(e) => handleFileUpload(e, uploadType)}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="p-5 bg-gray-50/20">
        {isUploading && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-2.5 mb-4">
            <Loader2 className="h-3.5 w-3.5 text-blue-600" />
            <span>Scanning pages and processing document reference...</span>
          </div>
        )}

        {docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 px-4 gap-3 bg-white rounded-xl border border-dashed border-gray-200">
            <div className={`icon-container ${iconClass} h-10 w-10`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-xs text-gray-400 font-medium">{emptyMsg}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {docs.map((doc) => (
              <DocCard key={doc._id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden p-5 bg-[#FAFAFA]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200/80 px-5 py-3 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="icon-container icon-blue h-10 w-10">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#111111] tracking-tight">Document Library</h2>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">All uploaded guidelines and lab reports reference sheets</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents…"
            className="input-field pl-9 pr-4 py-2 text-xs"
          />
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs shrink-0 font-semibold">
          {error}
        </div>
      )}

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-600" />
          </div>
        ) : (
          <>
            {/* ── Section 1: Textbooks & Guidelines ── */}
            <DocSection
              title="Textbooks & Guidelines"
              subtitle="Clinical manuals, ICMR guidelines, research journals"
              icon={BookOpen}
              iconClass="icon-blue"
              docs={generalDocs}
              uploadType="general"
              isUploading={isUploadingGeneral}
              emptyMsg="No textbooks uploaded yet. Upload clinical manuals, ICMR guidelines, or research papers."
              accentClass="bg-blue-50/20"
            />

            {/* ── Section 2: Lab Reports ── */}
            <DocSection
              title="Lab Reports"
              subtitle="Blood tests, CBC, LFT, KFT, Lipid panels, pathology reports"
              icon={FlaskConical}
              iconClass="icon-cyan"
              docs={labDocs}
              uploadType="lab_report"
              isUploading={isUploadingLab}
              emptyMsg="No lab reports uploaded yet. Upload CBC, LFT, KFT, or Lipid Panel PDFs/scans."
              accentClass="bg-cyan-50/20"
            />
          </>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={!!deletingDoc}
        title="Delete Reference Document"
        itemTitle={deletingDoc?.filename || ""}
        description="Are you sure you want to delete this document? This action cannot be undone."
        onClose={() => setDeletingDoc(null)}
        onConfirm={confirmDeleteDoc}
        loading={isDeleting}
      />
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={`${className} animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
