'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Eye,
  Download,
  Share2,
  Info,
  Trash2,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react';
import { FileItem } from '../lib/types';
import { useFiles } from '../context/FileContext';
import { safeCopyText, safeShareFile, downloadBlobOrUrl } from '../lib/file-helpers';

interface Props {
  file: FileItem;
}

export function FileActionsMenu({ file }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { setPreviewFile, setInfoFile, moveToTrash, restoreFromTrash, deletePermanently } = useFiles();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside as any);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as any);
    };
  }, [isOpen]);

  const handleShare = async () => {
    setIsOpen(false);
    await safeShareFile({ name: file.name, downloadUrl: file.downloadUrl });
  };

  const handleCopyLink = async () => {
    const url = file.downloadUrl || (typeof window !== 'undefined' ? `${window.location.origin}/files?id=${file.id}` : '');
    const success = await safeCopyText(url);
    if (success) {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1500);
    }
  };

  const handlePreview = () => {
    setIsOpen(false);
    setPreviewFile(file);
  };

  const handleInfo = () => {
    setIsOpen(false);
    setInfoFile(file);
  };

  const handleDownload = () => {
    setIsOpen(false);
    if (file.downloadUrl) {
      downloadBlobOrUrl(file.downloadUrl, file.name);
    } else {
      setPreviewFile(file);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        aria-label="Acciones de archivo"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-1 w-52 rounded-2xl bg-zinc-900 shadow-2xl border border-zinc-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {!file.isTrash ? (
            <>
              <button
                onClick={handlePreview}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white text-left transition-colors"
              >
                <Eye className="w-4 h-4 text-zinc-400" />
                <span>Ver y Abrir</span>
              </button>

              <button
                onClick={handleDownload}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white text-left transition-colors"
              >
                <Download className="w-4 h-4 text-zinc-400" />
                <span>Descargar</span>
              </button>

              <button
                onClick={handleShare}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white text-left transition-colors"
              >
                <Share2 className="w-4 h-4 text-zinc-400" />
                <span>Compartir</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white text-left transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                <span>{copied ? '¡Enlace copiado!' : 'Copiar enlace'}</span>
              </button>

              <button
                onClick={handleInfo}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white text-left transition-colors"
              >
                <Info className="w-4 h-4 text-zinc-400" />
                <span>Detalles</span>
              </button>

              <div className="my-1.5 border-t border-zinc-800" />

              <button
                onClick={() => {
                  setIsOpen(false);
                  moveToTrash(file.id);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 text-left transition-colors"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Mover a papelera</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsOpen(false);
                  restoreFromTrash(file.id);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-950/40 text-left transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                <span>Restaurar archivo</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  deletePermanently(file.id);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 text-left transition-colors"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Eliminar definitivamente</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
