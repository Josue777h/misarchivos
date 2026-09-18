'use client';

import React from 'react';
import { useFiles } from '../context/FileContext';
import { ChevronRight, Home, FolderPlus, ArrowLeft } from 'lucide-react';

export function BreadcrumbsNav() {
  const { currentFolder, setCurrentFolder, setIsCreateFolderOpen } = useFiles();

  const parts = currentFolder ? currentFolder.split('/').filter(Boolean) : [];

  const handleNavigateToSegment = (index: number) => {
    if (index === -1) {
      setCurrentFolder('');
    } else {
      const newPath = parts.slice(0, index + 1).join('/');
      setCurrentFolder(newPath);
    }
  };

  const handleGoBack = () => {
    if (parts.length <= 1) {
      setCurrentFolder('');
    } else {
      setCurrentFolder(parts.slice(0, -1).join('/'));
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs flex-wrap">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
        {parts.length > 0 && (
          <button
            onClick={handleGoBack}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors mr-1 cursor-pointer"
            title="Subir un nivel"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={() => handleNavigateToSegment(-1)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-semibold transition-colors cursor-pointer ${
            parts.length === 0
              ? 'bg-white text-black font-bold shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Mi Unidad</span>
        </button>

        {parts.map((part, idx) => {
          const isLast = idx === parts.length - 1;
          return (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              <button
                onClick={() => handleNavigateToSegment(idx)}
                className={`px-2.5 py-1 rounded-xl font-semibold transition-colors truncate max-w-[150px] cursor-pointer ${
                  isLast
                    ? 'bg-white text-black font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title={part}
              >
                {part}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      <button
        onClick={() => setIsCreateFolderOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-semibold text-xs border border-zinc-700 transition-all active:scale-95 cursor-pointer shrink-0 ml-auto"
        title="Crear nueva carpeta en esta ubicación"
      >
        <FolderPlus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Nueva Carpeta</span>
      </button>
    </div>
  );
}
