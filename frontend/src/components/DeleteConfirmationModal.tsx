'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  itemTitle: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  title,
  itemTitle,
  description,
  onClose,
  onConfirm,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5 text-rose-400">
            <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            {description}
          </p>
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-rose-500/30 text-xs font-bold text-rose-200 truncate">
            Target Record: <span className="text-white">{itemTitle}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-secondary text-xs py-2.5 px-4"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(225,29,72,0.4)]"
          >
            <Trash2 className="w-4 h-4" />
            <span>{loading ? 'Deleting Record...' : 'Confirm Permanent Deletion'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
