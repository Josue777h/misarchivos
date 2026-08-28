'use client';

import React, { useState } from 'react';
import { FileItem } from '../lib/types';
import { formatFileSize, formatDate, downloadBlobOrUrl } from '../lib/file-helpers';
import { FileIconBadge } from './FileIconBadge';
import { FileActionsMenu } from './FileActionsMenu';
import { useFiles } from '../context/FileContext';
import { AlertCircle, RefreshCw, CheckCircle2, Clock, Download, Eye, Trash2 } from 'lucide-react';

interface Props {
  file: FileItem;
}

export function FileCard({ file }: Props) {
  const { setPreviewFile, moveToTrash } = useFiles();
  const [imageError, setImageError] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (file.downloadUrl) {
      downloadBlobOrUrl(file.downloadUrl, file.name);
    } else {
      setPreviewFile(file);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    moveToTrash(file.id);
  };

  return (
    <div
      onClick={() => setPreviewFile(file)}
      className="group relative bg-zinc-900/90 rounded-2xl border border-zinc-800 hover:border-zinc-600 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between active:scale-[0.99]"
    >
      {/* Thumbnail or File Type Area */}
      <div className="relative w-full h-36 bg-black flex items-center justify-center overflow-hidden">
        {file.type === 'image' && file.thumbnailUrl && !imageError ? (
          <img
            src={file.thumbnailUrl}
            alt={file.name}
            onError={() => setImageError(true)}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <FileIconBadge
            type={file.type}
            className="w-16 h-16 shadow-inner"
            iconClassName="w-8 h-8"
          />
        )}

        {/* Sync Status Badge Overlay */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-zinc-900/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-semibold border border-zinc-800 shadow-xs">
          {file.syncStatus === 'synced' && (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>Sincronizado</span>
            </span>
          )}
          {file.syncStatus === 'syncing' && (
            <span className="flex items-center gap-1 text-amber-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Sincronizando</span>
            </span>
          )}
          {file.syncStatus === 'pending' && (
            <span className="flex items-center gap-1 text-zinc-400">
              <Clock className="w-3 h-3" />
              <span>Pendiente</span>
            </span>
          )}
          {file.syncStatus === 'conflict' && (
            <span className="flex items-center gap-1 text-rose-400">
              <AlertCircle className="w-3 h-3" />
              <span>Conflicto</span>
            </span>
          )}
        </div>

        {/* Quick Actions top-right */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-zinc-900/95 backdrop-blur-md rounded-xl p-0.5 border border-zinc-800 shadow-xs">
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Descargar con 1 clic"
            aria-label="Descargar archivo"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
            title="Mover a papelera"
            aria-label="Eliminar archivo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <FileActionsMenu file={file} />
        </div>
      </div>

      {/* File Info */}
      <div className="p-3.5 flex flex-col justify-between flex-1">
        <div className="mb-2">
          <p
            className="text-sm font-bold text-white truncate group-hover:text-zinc-300 transition-colors"
            title={file.name}
          >
            {file.name}
          </p>
          <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-mono" title={file.relativePath}>
            {file.relativePath || file.name}
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80">
          <span className="font-mono font-medium">{formatFileSize(file.size)}</span>
          <span>{formatDate(file.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
