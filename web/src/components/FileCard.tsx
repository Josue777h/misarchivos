import React, { useState } from 'react';
import { FileItem } from '../lib/types';
import { formatFileSize, formatDate, downloadBlobOrUrl, isImageFile } from '../lib/file-helpers';
import { FileIconBadge } from './FileIconBadge';
import { useFiles } from '../context/FileContext';
import { Download, Trash2, Check } from 'lucide-react';

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
      <div className="relative w-full h-36 bg-zinc-950 flex items-center justify-center overflow-hidden">
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
            className="w-14 h-14"
            iconClassName="w-7 h-7"
          />
        )}

        {/* Selection Checkbox */}
        <div
          onClick={(e) => { e.stopPropagation(); toggleFileSelection(file.id); }}
          className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
            isSelected
              ? 'bg-emerald-500 text-white shadow-md opacity-100'
              : 'bg-black/60 backdrop-blur-sm border border-zinc-600 opacity-60 sm:opacity-0 group-hover:opacity-100 hover:border-white'
          }`}
        >
          {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
        </div>

        {/* Quick Actions — visible on hover */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-zinc-300 hover:text-white transition-colors"
            title="Descargar"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-zinc-400 hover:text-rose-400 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
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
