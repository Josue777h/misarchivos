'use client';

import React, { useState } from 'react';
import { FolderInfo } from '../lib/types';
import { useFiles } from '../context/FileContext';
import { formatFileSize } from '../lib/file-helpers';
import { Folder, MoreVertical, Trash2, FolderOpen, ArrowRight } from 'lucide-react';

interface Props {
  folder: FolderInfo;
}

export function FolderCard({ folder }: Props) {
  const { setCurrentFolder, deleteFolder, addUploadedFile } = useFiles();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleOpenFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFolder(folder.path);
  };

  const handleDeleteFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (window.confirm(`¿Seguro que deseas eliminar la carpeta "${folder.name}" y todos sus archivos?`)) {
      await deleteFolder(folder.path);
    }
  };

  const handleDropOnFolder = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        const targetPath = `${folder.path}/${file.name}`;
        await addUploadedFile(file, targetPath);
      }
    }
  };

  return (
    <div
      onClick={handleOpenFolder}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
      }}
      onDrop={handleDropOnFolder}
      className={`group relative p-4 rounded-2xl bg-zinc-900/90 border transition-all duration-200 cursor-pointer select-none flex items-center justify-between active:scale-[0.99] shadow-sm hover:shadow-md animate-in fade-in zoom-in-95 ${
        isDragOver
          ? 'border-amber-400 bg-amber-950/30 scale-102 ring-2 ring-amber-400/40'
          : 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-850'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-amber-500/20 transition-all">
          <Folder className="w-6 h-6 fill-amber-400/20" />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors"
            title={folder.name}
          >
            {folder.name}
          </p>
          <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-mono">
            {folder.fileCount} {folder.fileCount === 1 ? 'archivo' : 'archivos'}
            {folder.totalSizeBytes > 0 && ` • ${formatFileSize(folder.totalSizeBytes)}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleOpenFolder}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Abrir carpeta"
        >
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Opciones de carpeta"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-44 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95">
                <button
                  onClick={handleOpenFolder}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors text-left"
                >
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  <span>Abrir</span>
                </button>
                <button
                  onClick={handleDeleteFolder}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 transition-colors text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar carpeta</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
