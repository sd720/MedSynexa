"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { toast, Toaster } from "react-hot-toast";
import {
  Loader2,
  Plus,
  UploadCloud,
  FileText,
  BookOpen,
  Trash2,
  MessageSquare,
  X,
  FileSearch,
} from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { ChatInterface } from "../../components/ChatInterface";
import { DocumentViewer } from "../../components/DocumentViewer";
import { DeleteConfirmationModal } from "../../components/DeleteConfirmationModal";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'viewer' | 'chat'>('viewer');
  
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [activeChat, setActiveChat] = useState<any>(null);
  
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const [deletingChat, setDeletingChat] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [docsRes, chatsRes] = await Promise.all([
        api.get("/documents"),
        api.get("/chats"),
      ]);
      const docs = docsRes.data.documents || [];
      setDocuments(docs);
      setChats(chatsRes.data.chats || []);
      if (docs.length > 0) {
        setSelectedDoc(docs[0]);
      }
    } catch (err) {
      toast.error("Failed to load clinical library data");
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
      toast.success("Document uploaded & processed successfully!");
      const docsRes = await api.get("/documents");
      const docs = docsRes.data.documents || [];
      setDocuments(docs);
      if (docs.length > 0) setSelectedDoc(docs[0]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const startNewChat = async (documentId?: string, filename?: string) => {
    setIsCreatingChat(true);
    try {
      const payload: any = {};
      if (documentId) {
        payload.documentId = documentId;
        payload.title = `Querying: ${filename}`;
      } else {
        payload.title = "Global Medical Library Chat";
      }

      const res = await api.post("/chats", payload);
      const chatRes = await api.get(`/chats/${res.data.chat._id}`);
      setActiveChat(chatRes.data.chat);
      setIsNewChatModalOpen(false);
      setActiveTab('chat');

      const updatedChatsRes = await api.get("/chats");
      setChats(updatedChatsRes.data.chats || []);
    } catch (err) {
      toast.error("Failed to initiate query session");
    } finally {
      setIsCreatingChat(false);
    }
  };

  const confirmDeleteChat = async () => {
    if (!deletingChat) return;
    try {
      setIsDeleting(true);
      await api.delete(`/chats/${deletingChat._id}`);
      toast.success("Chat removed.");
      if (activeChat?._id === deletingChat._id) {
        setActiveChat(null);
      }
      const updatedChatsRes = await api.get("/chats");
      setChats(updatedChatsRes.data.chats || []);
      setDeletingChat(null);
    } catch (err) {
      toast.error("Failed to delete chat");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteChat = (chat: any) => {
    setDeletingChat(chat);
  };

  const refreshChat = async (chatId: string) => {
    try {
      const chatRes = await api.get(`/chats/${chatId}`);
      setActiveChat(chatRes.data.chat);
    } catch (err) {
      console.error("Failed to refresh chat", err);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans flex flex-col h-screen overflow-hidden">
      <Toaster position="top-right" />
      <Navbar />

      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-400" /> Start RAG Query Session
              </h3>
              <button onClick={() => setIsNewChatModalOpen(false)} className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button 
                disabled={isCreatingChat}
                onClick={() => startNewChat()}
                className="w-full text-left p-4 rounded-2xl border border-teal-500/40 bg-teal-500/15 hover:bg-teal-500/25 transition-colors flex flex-col"
              >
                <span className="font-extrabold text-teal-300 flex items-center gap-2 text-xs sm:text-sm">
                  <BookOpen className="w-4 h-4 text-teal-400"/> Global Medical Search
                </span>
                <span className="text-xs text-slate-300 mt-1 font-medium">Chat and search across ALL uploaded documents simultaneously.</span>
              </button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400"><span className="px-2 bg-slate-900">Or Select Specific Document</span></div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {documents.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-4">No documents uploaded yet.</p>
                ) : (
                  documents.map(doc => (
                    <button
                      key={doc._id}
                      disabled={isCreatingChat}
                      onClick={() => startNewChat(doc._id, doc.filename)}
                      className="w-full text-left p-3 rounded-2xl border border-white/10 hover:border-teal-500/40 hover:bg-white/5 transition-colors flex items-center gap-3"
                    >
                      <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                      <div className="truncate">
                        <p className="font-bold text-white text-xs truncate">{doc.filename}</p>
                        <p className="text-[10px] text-slate-400">{new Date(doc.uploadDate).toLocaleDateString()}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 bg-slate-900/90 border-r border-white/10 flex flex-col h-full shrink-0 backdrop-blur-2xl">
          <div className="p-4 border-b border-white/10 space-y-3 bg-slate-950/40">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileSearch className="w-4 h-4 text-teal-400" /> Clinical Documents
              </h2>
              <label className="p-1.5 bg-teal-500/20 border border-teal-500/30 text-teal-300 hover:bg-teal-500/30 rounded-xl cursor-pointer transition-colors" title="Upload new document">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>

            <div className="flex rounded-full bg-slate-950/80 p-1 border border-white/10 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('viewer')}
                className={`flex-1 py-1.5 rounded-full transition-all ${activeTab === 'viewer' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
              >
                Documents ({documents.length})
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-1.5 rounded-full transition-all ${activeTab === 'chat' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
              >
                Chats ({chats.length})
              </button>
            </div>

            <button 
              onClick={() => setIsNewChatModalOpen(true)}
              className="w-full btn-teal text-xs py-2 px-3 justify-center"
            >
              <Plus className="w-3.5 h-3.5" /> Start RAG Query
            </button>
          </div>

          {/* List Section */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-900/60">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
              </div>
            ) : activeTab === 'viewer' ? (
              documents.map((doc) => {
                const isSelected = selectedDoc?._id === doc._id;
                return (
                  <div
                    key={doc._id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-teal-500/20 border-teal-500/50 text-white shadow-[0_0_15px_rgba(13,148,136,0.2)]"
                        : "bg-slate-950/40 border-white/5 text-slate-300 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-teal-300' : 'text-slate-500'}`} />
                      <div className="truncate">
                        <p className="font-bold text-xs truncate">{doc.filename}</p>
                        <p className="text-[10px] text-slate-400">{new Date(doc.uploadDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              chats.map((chat) => {
                const isActive = activeChat?._id === chat._id;
                return (
                  <div
                    key={chat._id}
                    onClick={() => {
                      refreshChat(chat._id);
                      setActiveTab('chat');
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? "bg-teal-500/20 border-teal-500/50 text-white shadow-[0_0_15px_rgba(13,148,136,0.2)]"
                        : "bg-slate-950/40 border-white/5 text-slate-300 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MessageSquare className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="text-xs font-bold truncate">{chat.title}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat);
                      }}
                      className="text-slate-400 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-slate-950/80 p-4 sm:p-6 overflow-y-auto backdrop-blur-xl">
          {activeTab === 'viewer' ? (
            <DocumentViewer
              document={selectedDoc}
              onStartChat={(docId) => startNewChat(docId, selectedDoc?.filename)}
              isCreatingChat={isCreatingChat}
            />
          ) : (
            <ChatInterface chat={activeChat} onRefreshChat={refreshChat} />
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={!!deletingChat}
        title="Delete RAG Chat Session"
        itemTitle={deletingChat?.title || "Query Chat"}
        description="Are you sure you want to delete this RAG chat history? This action cannot be undone."
        onClose={() => setDeletingChat(null)}
        onConfirm={confirmDeleteChat}
        loading={isDeleting}
      />
    </div>
  );
}
