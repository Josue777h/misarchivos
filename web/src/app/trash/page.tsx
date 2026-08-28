'use client';

import React, { useState } from 'react';
import { useFiles } from '../../context/FileContext';
import { formatFileSize, formatDate } from '../../lib/file-helpers';
import { FileIconBadge } from '../../components/FileIconBadge';
import { Trash2, RotateCcw, ShieldCheck } from 'lucide-react';

export default function TrashPage() {
  const { files, restoreFromTrash, deletePermanently, emptyTrash } = useFiles();
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const trashFiles = files.filter((f) => f.isTrash);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Trash2 className="w-6 h-6 text-rose-500" />
            <span>Papelera de Reciclaje</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Los archivos borrados se protegen aquí y puedes restaurarlos en 1 clic
          </p>
        </div>

        {trashFiles.length > 0 && (
          <div className="flex items-center gap-2">
            {confirmEmpty ? (
              <div className="flex items-center gap-2 animate-in fade-in duration-100">
                <span className="text-xs text-rose-400 font-semibold">
                  ¿Vaciar toda la papelera?
                </span>
                <button
                  onClick={() => {
                    emptyTrash();
                    setConfirmEmpty(false);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
                >
                  Sí, vaciar
                </button>
                <button
                  onClick={() => setConfirmEmpty(false)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmEmpty(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 border border-rose-900/60 transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Vaciar papelera</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Safety Notice */}
      <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex items-start gap-3 text-xs text-zinc-300">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-white block mb-0.5">Protección activa de archivos</strong>
          Los elementos eliminados se guardan aquí. Puedes recuperarlos a su ubicación original o borrarlos definitivamente.
        </div>
      </div>

      {/* Trash list */}
      {trashFiles.length === 0 ? (
        <div className="p-16 text-center bg-zinc-950 rounded-3xl border border-dashed border-zinc-800">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">
            La papelera está vacía
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            No tienes ningún archivo en la papelera de reciclaje.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {trashFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <FileIconBadge
                  type={file.type}
                  className="w-10 h-10 shrink-0 opacity-60"
                  iconClassName="w-5 h-5"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-400 line-through truncate">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5 font-mono">
                    <span className="truncate max-w-[150px]">{file.relativePath}</span>
                    <span>•</span>
                    <span>{formatFileSize(file.size)}</span>
                    {file.deletedAt && (
                      <>
                        <span>•</span>
                        <span>Eliminado {formatDate(file.deletedAt)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <button
                  onClick={() => restoreFromTrash(file.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-all active:scale-95"
                  title="Restaurar a su carpeta"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Restaurar</span>
                </button>

                <button
                  onClick={() => deletePermanently(file.id)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="Eliminar definitivamente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
