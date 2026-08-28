'use client';

import React, { useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFiles } from '../../context/FileContext';
import { FileCard } from '../../components/FileCard';
import { FileListItem } from '../../components/FileListItem';
import { FileType } from '../../lib/types';
import {
  Folder,
  LayoutGrid,
  List,
  Search,
  Filter,
  X,
  Upload,
} from 'lucide-react';

function FilesContent() {
  const {
    files,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    viewMode,
    setViewMode,
    setIsUploadModalOpen,
    addUploadedFile,
  } = useFiles();

  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') as FileType | null;

  // React to URL category param if present
  React.useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam, setSelectedCategory]);

  const activeFiles = useMemo(() => {
    return files.filter((f) => !f.isTrash);
  }, [files]);

  const filteredFiles = useMemo(() => {
    return activeFiles.filter((f) => {
      // Category filter
      if (selectedCategory !== 'all' && f.type !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = f.name.toLowerCase().includes(q);
        const matchPath = f.relativePath.toLowerCase().includes(q);
        const matchExt = f.extension.toLowerCase().includes(q);
        if (!matchName && !matchPath && !matchExt) {
          return false;
        }
      }
      return true;
    });
  }, [activeFiles, selectedCategory, searchQuery]);

  const categories: { id: FileType | 'all'; label: string; icon: string }[] = [
    { id: 'all', label: 'Todos', icon: '📁' },
    { id: 'image', label: 'Imágenes', icon: '📷' },
    { id: 'pdf', label: 'PDF', icon: '📄' },
    { id: 'word', label: 'Word', icon: '📝' },
    { id: 'excel', label: 'Excel', icon: '📊' },
    { id: 'powerpoint', label: 'Presentaciones', icon: '📽️' },
    { id: 'text', label: 'Texto', icon: '💻' },
    { id: 'other', label: 'Otros', icon: '📦' },
  ];

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

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

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Folder className="w-6 h-6 text-zinc-300" />
            <span>Explorador de Archivos</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {filteredFiles.length} de {activeFiles.length} archivos en total
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto flex-wrap">
          {/* View mode toggle */}
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Vista de cuadrícula"
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
              title="Vista de lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-black hover:bg-zinc-200 shadow-sm transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Subir</span>
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count =
            cat.id === 'all'
              ? activeFiles.length
              : activeFiles.filter((f) => f.type === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                isSelected
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
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

      {/* Active Search Filter Badge */}
      {searchQuery && (
        <div className="flex items-center gap-2 text-xs bg-zinc-900 text-zinc-200 px-3 py-1.5 rounded-xl border border-zinc-800 w-fit">
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <span>Filtrando por: &quot;{searchQuery}&quot;</span>
          <button
            onClick={() => setSearchQuery('')}
            className="p-0.5 hover:bg-zinc-800 rounded-full"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <div className="p-12 text-center bg-zinc-950 rounded-3xl border border-dashed border-zinc-800">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">
            No se encontraron archivos
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No hay archivos que coincidan con la búsqueda "${searchQuery}".`
              : 'No hay archivos dentro de esta categoría.'}
          </p>
          {(searchQuery || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 px-3.5 py-1.5 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Restablecer filtros
            </button>
          )}
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

export default function FilesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-zinc-500">Cargando archivos...</div>}>
      <FilesContent />
    </Suspense>
  );
}
