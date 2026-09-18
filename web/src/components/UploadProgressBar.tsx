'use client';

import React from 'react';
import { useFiles } from '../context/FileContext';
import { Loader2, CheckCircle2, UploadCloud } from 'lucide-react';

export function UploadProgressBar() {
  const { uploadProgress } = useFiles();

  if (!uploadProgress || !uploadProgress.active) return null;

  const percentage = Math.round((uploadProgress.completed / Math.max(uploadProgress.total, 1)) * 100);

  return (
    <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="glass px-4 py-3 rounded-2xl border border-zinc-700/80 shadow-2xl bg-zinc-950/95 backdrop-blur-xl text-white max-w-sm w-80 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>Subiendo en paralelo...</span>
          </div>
          <span className="font-mono text-zinc-400">
            {uploadProgress.completed} / {uploadProgress.total} ({percentage}%)
          </span>
        </div>

        {/* Progress bar line */}
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-200"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {uploadProgress.currentFileName && (
          <p className="text-[10px] text-zinc-400 truncate font-mono">
            {uploadProgress.currentFileName}
          </p>
        )}
      </div>
    </div>
  );
}
