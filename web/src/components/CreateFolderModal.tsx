'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFiles } from '../context/FileContext';
import { FolderPlus, X } from 'lucide-react';

export function CreateFolderModal() {
  const { isCreateFolderOpen, setIsCreateFolderOpen, createFolder, currentFolder } = useFiles();
  const [folderName, setFolderName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreateFolderOpen) {
      setFolderName('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCreateFolderOpen]);

  if (!isCreateFolderOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      createFolder(folderName);
      setIsCreateFolderOpen(false);
    }
  };

  return (
    <div
      onClick={() => setIsCreateFolderOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150"
    >
      <div
        className="relative w-full max-w-sm bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden border border-zinc-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base">Nueva Carpeta</h3>
          </div>
          <button
            onClick={() => setIsCreateFolderOpen(false)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              {currentFolder ? `Ubicación: Mi Unidad / ${currentFolder}` : 'Ubicación: Mi Unidad (Raíz)'}
            </label>
            <input
              ref={inputRef}
              type="text"
              placeholder="Nombre de la carpeta (ej. Proyectos)"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateFolderOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-850 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!folderName.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Crear Carpeta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
