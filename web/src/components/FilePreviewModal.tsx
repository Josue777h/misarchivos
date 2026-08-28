'use client';

import React, { useState, useEffect } from 'react';
import { useFiles } from '../context/FileContext';
import { formatFileSize, formatDate, safeShareFile, downloadBlobOrUrl } from '../lib/file-helpers';
import { FileIconBadge } from './FileIconBadge';
import { X, Download, Share2, Info, ExternalLink, Eye, Trash2, FileText, Loader2, AlertCircle } from 'lucide-react';

export function FilePreviewModal() {
  const { previewFile, setPreviewFile, setInfoFile, moveToTrash, deletePermanently } = useFiles();
  const [imageError, setImageError] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);

  // Fetch text file content directly for instant in-app reading
  useEffect(() => {
    if (!previewFile) {
      setTextContent(null);
      setImageError(false);
      return;
    }

    setImageError(false);
    if (previewFile.type === 'text' && previewFile.downloadUrl) {
      setLoadingText(true);
      fetch(previewFile.downloadUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Fetch failed');
          return res.text();
        })
        .then((txt) => {
          setTextContent(txt);
        })
        .catch(() => {
          setTextContent(null);
        })
        .finally(() => {
          setLoadingText(false);
        });
    } else {
      setTextContent(null);
      setLoadingText(false);
    }
  }, [previewFile]);

  if (!previewFile) return null;

  const handleShare = async () => {
    await safeShareFile({ name: previewFile.name, downloadUrl: previewFile.downloadUrl });
  };

  const handleDownload = () => {
    if (previewFile.downloadUrl) {
      downloadBlobOrUrl(previewFile.downloadUrl, previewFile.name);
    }
  };

  const handleOpenExternal = () => {
    if (previewFile.downloadUrl) {
      window.open(previewFile.downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const isOfficeDoc = ['word', 'excel', 'powerpoint'].includes(previewFile.type);
  const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(previewFile.extension.toLowerCase());
  const isVideo = ['mp4', 'webm', 'mov', 'mkv'].includes(previewFile.extension.toLowerCase());

  return (
    <div
      onClick={() => setPreviewFile(null)}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150"
    >
      <div
        className="relative w-full max-w-4xl bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden border border-zinc-800 flex flex-col max-h-[94vh] h-full sm:h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <FileIconBadge type={previewFile.type} className="w-10 h-10 shrink-0" iconClassName="w-5 h-5" />
            <div className="min-w-0">
              <h3 className="font-bold text-white truncate text-sm sm:text-base" title={previewFile.name}>
                {previewFile.name}
              </h3>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-mono">
                {formatFileSize(previewFile.size)} • {formatDate(previewFile.updatedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setInfoFile(previewFile)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Ver detalles"
              aria-label="Detalles"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenExternal}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Abrir en pestaña nueva"
              aria-label="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewFile(null)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-format In-App Content Viewer Body */}
        <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-black min-h-[320px] max-h-[68vh]">
          {/* 1. Image Viewer */}
          {previewFile.type === 'image' && previewFile.downloadUrl && !imageError ? (
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              <img
                src={previewFile.downloadUrl}
                alt={previewFile.name}
                onError={() => setImageError(true)}
                className="max-h-[60vh] w-auto max-w-full rounded-2xl object-contain shadow-xl"
              />
            </div>
          ) : /* 2. Full In-App PDF Reader */
          previewFile.type === 'pdf' && previewFile.downloadUrl ? (
            <div className="w-full h-full min-h-[55vh] flex flex-col rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  Visor de PDF en vivo
                </span>
                <button
                  onClick={handleOpenExternal}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 hover:underline"
                >
                  <span>Pantalla completa</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <iframe
                src={`${previewFile.downloadUrl}#toolbar=1&navpanes=0`}
                className="w-full flex-1 min-h-[50vh] border-0"
                title={previewFile.name}
              />
            </div>
          ) : /* 3. In-App Video Player */
          isVideo && previewFile.downloadUrl ? (
            <div className="max-w-full max-h-full flex items-center justify-center">
              <video
                controls
                autoPlay={false}
                src={previewFile.downloadUrl}
                className="max-h-[58vh] max-w-full rounded-2xl shadow-lg border border-zinc-800"
              />
            </div>
          ) : /* 4. In-App Audio Player */
          isAudio && previewFile.downloadUrl ? (
            <div className="text-center p-8 max-w-md w-full space-y-4 bg-zinc-900/60 rounded-3xl border border-zinc-800">
              <FileIconBadge type="other" className="w-16 h-16 mx-auto shadow-md" iconClassName="w-8 h-8" />
              <h4 className="font-bold text-white text-base truncate">{previewFile.name}</h4>
              <audio controls src={previewFile.downloadUrl} className="w-full mt-2" />
            </div>
          ) : /* 5. In-App Text/Code Viewer */
          previewFile.type === 'text' ? (
            <div className="w-full h-full min-h-[45vh] bg-zinc-950 text-zinc-200 p-4 rounded-2xl font-mono text-xs overflow-auto leading-relaxed border border-zinc-800 whitespace-pre-wrap select-text">
              {loadingText ? (
                <div className="flex items-center justify-center h-48 gap-2 text-zinc-400">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Cargando contenido del archivo...</span>
                </div>
              ) : textContent !== null ? (
                textContent
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  <p>No se pudo cargar la vista previa directa.</p>
                  <button
                    onClick={handleDownload}
                    className="mt-3 px-4 py-2 bg-zinc-800 text-white rounded-xl font-sans text-xs font-semibold"
                  >
                    Descargar para ver
                  </button>
                </div>
              )}
            </div>
          ) : /* 6. In-App Office Document Viewer (Word, Excel, PowerPoint via Google Docs Viewer) */
          isOfficeDoc && previewFile.downloadUrl ? (
            <div className="w-full h-full min-h-[55vh] flex flex-col rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  Vista previa de documento ({previewFile.type.toUpperCase()})
                </span>
                <button
                  onClick={handleOpenExternal}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 hover:underline"
                >
                  <span>Abrir enlace directo</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewFile.downloadUrl)}&embedded=true`}
                className="w-full flex-1 min-h-[50vh] border-0"
                title={previewFile.name}
              />
            </div>
          ) : (
            /* 7. Fallback Generic File Card */
            <div className="text-center p-8 max-w-md space-y-3">
              <FileIconBadge
                type={previewFile.type}
                className="w-20 h-20 mx-auto shadow-md"
                iconClassName="w-10 h-10"
              />
              <h4 className="font-bold text-white text-base">
                {previewFile.name}
              </h4>
              <p className="text-xs text-zinc-400">
                Archivo sincronizado. Puedes abrirlo o descargarlo directamente.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:bg-zinc-200 shadow-md active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar archivo</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-t border-zinc-800/80 bg-zinc-900/80 flex-wrap gap-2">
          <div className="text-xs text-zinc-400 truncate max-w-[140px] sm:max-w-xs font-mono">
            {previewFile.relativePath || previewFile.name}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                moveToTrash(previewFile.id);
                setPreviewFile(null);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-900/60 transition-all active:scale-95"
              title="Mover a papelera"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-white transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 shadow-sm transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
