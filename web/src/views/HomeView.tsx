import React, { useRef, useState, useMemo } from 'react';
import { useFiles } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';
import { FileCard } from '../components/FileCard';
import { FileListItem } from '../components/FileListItem';
import { FileType } from '../lib/types';
import { extractDroppedItems } from '../lib/file-helpers';
import {
  FolderOpen,
  LayoutGrid,
  List,
  Upload,
  RefreshCw,
  Camera,
  Folder,
  FolderUp,
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: 'home' | 'files' | 'trash' | 'settings', category?: FileType | 'all') => void;
}

export function HomeView({ onNavigate }: HomeViewProps) {
  const {
    files,
    viewMode,
    setViewMode,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    triggerManualSync,
    addUploadedFile,
    stats,
  } = useFiles();

  const { user } = useAuth();
  const [isSyncingLocal, setIsSyncingLocal] = useState(false);
  const [dragOverPage, setDragOverPage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
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

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const relativePath = (file as any).webkitRelativePath || file.name;
        await addUploadedFile(file, relativePath);
      }
      e.target.value = '';
    }
  };

  const handlePageDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPage(false);
    const items = await extractDroppedItems(e.dataTransfer);
    for (const item of items) {
      await addUploadedFile(item.file, item.relativePath);
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
    { id: 'word', label: 'Docs', icon: '📝' },
    { id: 'excel', label: 'Excel', icon: '📊' },
    { id: 'text', label: 'Texto', icon: '💻' },
    { id: 'other', label: 'Otros', icon: '📦' },
  ];

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOverPage(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDragOverPage(false);
        }
      }}
      onDrop={handlePageDrop}
      className={`relative space-y-4 sm:space-y-5 animate-in fade-in duration-150 rounded-3xl transition-all ${
        dragOverPage ? 'ring-2 ring-white ring-offset-4 ring-offset-black bg-zinc-950/40' : ''
      }`}
    >
      {/* Hidden inputs for 1-click uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleQuickUpload(e, false)}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderUpload}
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

      {/* Hero Action Bar */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-300">
              {user?.email ? user.email.split('@')[0] : 'Mis Archivos'}
            </span>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {stats.totalFiles} archivos ({activeFiles.length > 0 ? (activeFiles.reduce((a, b) => a + b.size, 0) / (1024 * 1024)).toFixed(1) : 0} MB)
          </span>
        </div>

        {/* 1-Click Action Buttons */}
        <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center sm:gap-3">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white text-black font-bold text-xs sm:text-sm hover:bg-zinc-200 active:scale-95 transition-all text-center cursor-pointer"
          >
            <Camera className="w-4 h-4 text-black shrink-0" />
            <span className="hidden sm:inline">Tomar</span> Foto
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all text-center cursor-pointer"
            title="Subir archivos sueltos"
          >
            <Upload className="w-4 h-4 text-zinc-300 shrink-0" />
            <span>Subir</span>
          </button>

          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all text-center cursor-pointer"
            title="Subir carpeta completa con toda su estructura"
          >
            <FolderUp className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Carpeta</span>
          </button>

          <button
            onClick={handleSyncClick}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-xs sm:text-sm active:scale-95 transition-all text-center cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${isSyncingLocal ? 'animate-spin text-white' : ''}`} />
            <span>{isSyncingLocal ? 'Listo' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <span>{chip.icon}</span>
              <span>{chip.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
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

      {/* Section Header with count and view mode toggle */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm sm:text-base font-bold text-white">
            {selectedCategory === 'all' ? 'Archivos' : `${selectedCategory.toUpperCase()}`}
          </h2>
          <span className="text-xs text-zinc-500 font-mono">
            ({filteredFiles.length})
          </span>
        </div>

        <div className="flex items-center bg-zinc-900 p-0.5 rounded-xl border border-zinc-800">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Cuadrícula"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Lista"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-zinc-950 rounded-2xl border border-dashed border-zinc-850">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">
            {searchQuery ? 'No hay resultados' : 'No hay archivos'}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
            {searchQuery
              ? `Sin coincidencias para "${searchQuery}".`
              : 'Sube un archivo o toma una foto para comenzar.'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 active:scale-95 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Foto</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 border border-zinc-700 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 active:scale-95 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
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
