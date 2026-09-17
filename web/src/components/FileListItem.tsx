'use client';

import React, { useState } from 'react';
import { FileItem } from '../lib/types';
import { formatFileSize, formatDate, downloadBlobOrUrl, isImageFile } from '../lib/file-helpers';
import { FileIconBadge } from './FileIconBadge';
import { FileActionsMenu } from './FileActionsMenu';
import { useFiles } from '../context/FileContext';
import { AlertCircle, RefreshCw, CheckCircle2, Clock, Download, Trash2 } from 'lucide-react';

interface Props {
  file: FileItem;
}

export function FileListItem({ file }: Props) {
  const { setPreviewFile, moveToTrash } = useFiles();
  const [imageError, setImageError] = useState(false);

  const isImage = file.type === 'image' || isImageFile(file.name, file.mimeType);
  const imageSource = !imageError && isImage ? file.thumbnailUrl || file.downloadUrl : undefined;

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
      className="group flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-600 hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.99]"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {imageSource ? (
          <div className="w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-xs flex items-center justify-center">
            <img
              src={imageSource}
              alt={file.name}
              onError={() => setImageError(true)}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
            />
          </div>
        ) : (
          <FileIconBadge
            type={file.type}
            className="w-11 h-11 shrink-0 shadow-xs"
            iconClassName="w-5 h-5"
          />
        )}

        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-bold text-white truncate group-hover:text-zinc-300 transition-colors"
            title={file.name}
          >
            {file.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5 font-mono">
            <span className="truncate max-w-[140px] sm:max-w-xs">{file.relativePath || file.name}</span>
            <span>•</span>
            <span className="font-medium text-zinc-300">{formatFileSize(file.size)}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline text-zinc-400">{formatDate(file.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {/* Sync Status Badge */}
        <div className="hidden md:flex items-center text-xs">
          {file.syncStatus === 'synced' && (
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-emerald-900/60">
              <CheckCircle2 className="w-3 h-3" />
              <span>Sincronizado</span>
            </span>
          )}
          {file.syncStatus === 'syncing' && (
            <span className="flex items-center gap-1 text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-full text-[11px] font-semibold">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Sincronizando</span>
            </span>
          )}
          {file.syncStatus === 'pending' && (
            <span className="flex items-center gap-1 text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full text-[11px] font-semibold">
              <Clock className="w-3 h-3" />
              <span>Pendiente</span>
            </span>
          )}
        </div>

        {/* 1-Click Download button */}
        <button
          onClick={handleDownload}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Descargar con 1 clic"
          aria-label="Descargar archivo"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* 1-Click Delete button */}
        <button
          onClick={handleDelete}
          className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
          title="Mover a papelera"
          aria-label="Eliminar archivo"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <FileActionsMenu file={file} />
      </div>
    </div>
  );
}
