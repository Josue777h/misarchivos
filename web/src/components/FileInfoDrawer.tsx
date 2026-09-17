'use client';

import React, { useState } from 'react';
import { useFiles } from '../context/FileContext';
import { formatFileSize, formatDate, safeCopyText, isImageFile } from '../lib/file-helpers';
import { FileIconBadge } from './FileIconBadge';
import { X, Copy, Check, Hash, Calendar, HardDrive, FolderTree, ShieldCheck, AlertTriangle } from 'lucide-react';

export function FileInfoDrawer() {
  const { infoFile, setInfoFile } = useFiles();
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!infoFile) return null;

  const isImage = infoFile.type === 'image' || isImageFile(infoFile.name, infoFile.mimeType);
  const imageSource = !imageError && isImage ? infoFile.thumbnailUrl || infoFile.downloadUrl : undefined;

  const copyToClipboard = async (text: string, type: 'hash' | 'path') => {
    const success = await safeCopyText(text);
    if (success) {
      if (type === 'hash') {
        setCopiedHash(true);
        setTimeout(() => setCopiedHash(false), 2000);
      } else {
        setCopiedPath(true);
        setTimeout(() => setCopiedPath(false), 2000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden border border-zinc-800 flex flex-col max-h-[90vh] h-full sm:h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <h3 className="font-bold text-white text-base">
            Detalles del Archivo
          </h3>
          <button
            onClick={() => setInfoFile(null)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Details */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Main identity */}
          <div className="flex items-center gap-4 p-3.5 bg-zinc-900 rounded-2xl border border-zinc-800">
            {imageSource ? (
              <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                <img
                  src={imageSource}
                  alt={infoFile.name}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <FileIconBadge type={infoFile.type} className="w-12 h-12 shrink-0" iconClassName="w-6 h-6" />
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-white truncate" title={infoFile.name}>
                {infoFile.name}
              </h4>
              <p className="text-xs text-zinc-400 uppercase font-mono mt-0.5">
                {infoFile.extension ? `.${infoFile.extension}` : 'Archivo'} • {infoFile.mimeType}
              </p>
            </div>
          </div>

          {/* Conflict Notice if present */}
          {infoFile.conflictInfo && (
            <div className="p-3.5 bg-amber-950/40 border border-amber-800 rounded-2xl text-amber-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Archivo en Conflicto de Versión</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Modificado simultáneamente en <strong>{infoFile.conflictInfo.device}</strong> el {formatDate(infoFile.conflictInfo.conflictAt)}.
              </p>
            </div>
          )}

          {/* Properties list */}
          <div className="space-y-2.5 text-xs">
            {/* Relative path */}
            <div className="flex items-start justify-between gap-2 p-2.5 rounded-xl hover:bg-zinc-900/60 transition-colors">
              <div className="flex items-center gap-2 text-zinc-400 shrink-0">
                <FolderTree className="w-4 h-4 text-zinc-400" />
                <span>Ruta Relativa</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-zinc-200 text-right truncate">
                <span className="truncate max-w-[180px]">{infoFile.relativePath || infoFile.name}</span>
                <button
                  onClick={() => copyToClipboard(infoFile.relativePath || infoFile.name, 'path')}
                  className="p-1 text-zinc-400 hover:text-white"
                  title="Copiar ruta"
                >
                  {copiedPath ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Size */}
            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-900/60 transition-colors">
              <div className="flex items-center gap-2 text-zinc-400">
                <HardDrive className="w-4 h-4 text-zinc-400" />
                <span>Tamaño</span>
              </div>
              <span className="font-mono text-zinc-200">
                {formatFileSize(infoFile.size)} ({infoFile.size.toLocaleString('es-ES')} bytes)
              </span>
            </div>

            {/* Dates */}
            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-900/60 transition-colors">
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar className="w-4 h-4 text-zinc-400" />
                <span>Modificado</span>
              </div>
              <span className="text-zinc-200">
                {formatDate(infoFile.updatedAt)}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-900/60 transition-colors">
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar className="w-4 h-4 text-zinc-400" />
                <span>Creado</span>
              </div>
              <span className="text-zinc-200">
                {formatDate(infoFile.createdAt)}
              </span>
            </div>

            {/* Sync status */}
            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-900/60 transition-colors">
              <div className="flex items-center gap-2 text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Estado de Sincronización</span>
              </div>
              <span className="font-semibold text-emerald-400">
                {infoFile.syncStatus === 'synced' ? 'Sincronizado' : infoFile.syncStatus}
              </span>
            </div>

            {/* Hash SHA-256 */}
            <div className="p-3 bg-zinc-900 rounded-xl space-y-1 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Hash className="w-3.5 h-3.5 text-zinc-400" />
                  Hash SHA-256 (Integridad)
                </span>
                <button
                  onClick={() => copyToClipboard(infoFile.hash, 'hash')}
                  className="flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white hover:underline"
                >
                  {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedHash ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <p className="font-mono text-[10px] text-zinc-300 break-all leading-tight">
                {infoFile.hash}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
