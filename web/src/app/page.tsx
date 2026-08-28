'use client';

import React, { useRef, useState, useMemo } from 'react';
import { useFiles } from '../context/FileContext';
import { FileCard } from '../components/FileCard';
import { FileListItem } from '../components/FileListItem';
import { FileType } from '../lib/types';
import {
  FolderOpen,
  LayoutGrid,
  List,
  Upload,
  RefreshCw,
  Camera,
  CheckCircle2,
  HardDrive,
  Plus,
} from 'lucide-react';

export default function HomePage() {
  const {
    files,
    viewMode,
    setViewMode,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    triggerManualSync,
    addUploadedFile,
    isLoading,
    stats,
  } = useFiles();

  const [isSyncingLocal, setIsSyncingLocal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const activeFiles = useMemo(() => files.filter((f) => !f.isTrash), [files]);

  const filteredFiles = useMemo(() => {
    return activeFiles.filter((f) => {
      if (selectedCategory !== 'all' && f.type !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.relativePath.toLowerCase().includes(q) ||
          f.extension.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeFiles, selectedCategory, searchQuery]);

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCamera = false) => {
    if (e.target.files && e.target.files.length > 0) {
      const folder = isCamera ? 'Fotos' : '';
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const relativePath = folder ? `${folder}/${file.name}` : file.name;
        await addUploadedFile(file, relativePath);
      }
      e.target.value = '';
    }
  };

  const handleSyncClick = async () => {
    setIsSyncingLocal(true);
    await triggerManualSync();
    setTimeout(() => setIsSyncingLocal(false), 800);
  };

  const categoryChips: { id: FileType | 'all'; label: string; icon: string }[] = [
    { id: 'all', label: 'Todos', icon: '📁' },
    { id: 'image', label: 'Fotos', icon: '📷' },
    { id: 'pdf', label: 'PDFs', icon: '📄' },
    { id: 'word', label: 'Word', icon: '📝' },
    { id: 'excel', label: 'Excel', icon: '📊' },
    { id: 'text', label: 'Texto', icon: '💻' },
    { id: 'other', label: 'Otros', icon: '📦' },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Hidden inputs for 1-click uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleQuickUpload(e, false)}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleQuickUpload(e, true)}
        className="hidden"
      />

      {/* Hero Action Bar - Pure OLED Dark 1-Click Actions */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-zinc-300 tracking-wide uppercase">
                Sincronización PC ⇄ Celular
              </span>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              {stats.totalFiles} archivos ({activeFiles.length > 0 ? (activeFiles.reduce((a, b) => a + b.size, 0) / (1024 * 1024)).toFixed(1) : 0} MB)
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Tus Archivos a la Palma de la Mano
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
            Sube fotos, documentos y PDFs con 1 clic. Todo se sincroniza instantáneamente con tu PC.
          </p>

          {/* 1-Click Action Buttons */}
          <div className="grid grid-cols-3 gap-2.5 sm:flex sm:items-center sm:gap-3 mt-4 pt-1">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 rounded-2xl bg-white text-black font-bold text-xs sm:text-sm shadow-md hover:bg-zinc-200 active:scale-95 transition-all text-center"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              <span>Tomar Foto</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all text-center"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300" />
              <span>Subir Archivo</span>
            </button>

            <button
              onClick={handleSyncClick}
              className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-xs sm:text-sm active:scale-95 transition-all text-center"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isSyncingLocal ? 'animate-spin text-white' : ''}`} />
              <span>{isSyncingLocal ? 'Sincronizando' : 'Sincronizar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Slider - 1 Click Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {categoryChips.map((chip) => {
          const isSelected = selectedCategory === chip.id;
          const count =
            chip.id === 'all'
              ? activeFiles.length
              : activeFiles.filter((f) => f.type === chip.id).length;

          return (
            <button
              key={chip.id}
              onClick={() => setSelectedCategory(chip.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold shrink-0 transition-all active:scale-95 ${
                isSelected
                  ? 'bg-white text-black font-bold shadow-md'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <span>{chip.icon}</span>
              <span>{chip.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected
                    ? 'bg-black text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* File List Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-white" />
          <h2 className="text-base sm:text-lg font-bold text-white">
            {selectedCategory === 'all' ? 'Todos los Archivos' : `Categoría: ${selectedCategory.toUpperCase()}`}
          </h2>
          <span className="text-xs text-zinc-400 font-mono">
            ({filteredFiles.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Files Container */}
      {filteredFiles.length === 0 ? (
        <div className="p-10 sm:p-14 text-center bg-zinc-950 rounded-3xl border border-dashed border-zinc-800">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
            <FolderOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">
            {searchQuery ? 'No hay resultados' : 'Aún no hay archivos aquí'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            {searchQuery
              ? `No se encontró ningún archivo con "${searchQuery}".`
              : 'Toma una foto con tu celular o sube un archivo con un solo clic.'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 shadow-md active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Tomar foto</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 border border-zinc-700 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir archivo</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredFiles.map((file) => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file) => (
            <FileListItem key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}
