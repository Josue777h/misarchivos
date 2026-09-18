'use client';

import React from 'react';
import { useFiles } from '../context/FileContext';
import { downloadBlobOrUrl } from '../lib/file-helpers';
import { Trash2, Download, X, CheckSquare } from 'lucide-react';

export function BatchActionBar() {
  const { files, selectedFileIds, clearSelection, deleteMultipleFiles } = useFiles();

  if (selectedFileIds.size === 0) return null;

  const selectedCount = selectedFileIds.size;
  const selectedFiles = files.filter((f) => selectedFileIds.has(f.id));

  const handleDeleteSelected = async () => {
    if (
      window.confirm(
        `¿Mover ${selectedCount} ${selectedCount === 1 ? 'archivo' : 'archivos'} a la papelera?`
      )
    ) {
      await deleteMultipleFiles(Array.from(selectedFileIds));
    }
  };

  const handleDownloadSelected = async () => {
    for (const f of selectedFiles) {
      if (f.downloadUrl || f.thumbnailUrl) {
        downloadBlobOrUrl(f.downloadUrl || f.thumbnailUrl!, f.name);
      }
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[92vw] animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="glass px-4 py-2.5 rounded-2xl border border-zinc-700/80 shadow-2xl flex items-center gap-3 bg-zinc-900/95 backdrop-blur-xl text-white">
        <div className="flex items-center gap-2 pr-2 border-r border-zinc-700 text-xs font-semibold">
          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {selectedCount} {selectedCount === 1 ? 'seleccionado' : 'seleccionados'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDownloadSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold transition-all active:scale-95 text-zinc-200"
            title="Descargar archivos seleccionados"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Descargar</span>
          </button>

          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/70 border border-rose-800/60 text-rose-300 text-xs font-semibold transition-all active:scale-95"
            title="Mover seleccionados a la papelera"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>

          <button
            onClick={clearSelection}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Deseleccionar todo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
