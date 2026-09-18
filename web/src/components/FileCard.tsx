import React, { useState } from 'react';
import { FileItem } from '../lib/types';
import { formatFileSize, formatDate, downloadBlobOrUrl, isImageFile } from '../lib/file-helpers';
import { FileIconBadge } from './FileIconBadge';
import { FileActionsMenu } from './FileActionsMenu';
import { useFiles } from '../context/FileContext';
import { AlertCircle, RefreshCw, CheckCircle2, Clock, Download, Trash2, Check } from 'lucide-react';

interface Props {
  file: FileItem;
}

export function FileCard({ file }: Props) {
  const { setPreviewFile, moveToTrash, selectedFileIds, toggleFileSelection } = useFiles();
  const [imageError, setImageError] = useState(false);

  const isSelected = selectedFileIds.has(file.id);
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
      className={`group relative bg-zinc-900/90 rounded-2xl border shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between active:scale-[0.99] animate-in fade-in zoom-in-95 ${
        isSelected
          ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-zinc-850'
          : 'border-zinc-800 hover:border-zinc-600'
      }`}
    >
      {/* Thumbnail or File Type Area */}
      <div className="relative w-full h-40 bg-zinc-950 flex items-center justify-center overflow-hidden">
        {imageSource ? (
          <img
            src={imageSource}
            alt={file.name}
            onError={() => setImageError(true)}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <FileIconBadge
            type={file.type}
            className="w-16 h-16 shadow-inner"
            iconClassName="w-8 h-8"
          />
        )}

        {/* Selection Checkbox (always visible if selected, shows on hover if unselected) */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            toggleFileSelection(file.id);
          }}
          className={`absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            isSelected
              ? 'bg-emerald-500 text-black shadow-md'
              : 'bg-black/60 backdrop-blur-md border border-zinc-600 text-transparent opacity-0 group-hover:opacity-100 hover:border-white hover:text-white'
          }`}
          title={isSelected ? 'Deseleccionar' : 'Seleccionar'}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>

        {/* Sync Status Badge Overlay */}
        <div className="absolute top-2.5 left-10 flex items-center gap-1 bg-zinc-900/95 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-semibold border border-zinc-800 shadow-xs">
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
