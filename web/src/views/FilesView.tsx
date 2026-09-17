import React, { useMemo, useRef } from 'react';
import { useFiles } from '../context/FileContext';
import { FileCard } from '../components/FileCard';
import { FileListItem } from '../components/FileListItem';
import { FileType } from '../lib/types';
import {
  Folder,
  LayoutGrid,
  List,
  Search,
  Filter,
  X,
  Upload,
} from 'lucide-react';

export function FilesView() {
  const {
    files,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    viewMode,
    setViewMode,
    addUploadedFile,
  } = useFiles();

  const activeFiles = useMemo(() => {
    return files.filter((f) => !f.isTrash);
  }, [files]);

  const filteredFiles = useMemo(() => {
    return activeFiles.filter((f) => {
      if (selectedCategory !== 'all' && f.type !== selectedCategory) {
        return false;
      }
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
    { id: 'image', label: 'Fotos', icon: '📷' },
    { id: 'pdf', label: 'PDFs', icon: '📄' },
    { id: 'word', label: 'Docs', icon: '📝' },
    { id: 'excel', label: 'Excel', icon: '📊' },
    { id: 'text', label: 'Texto', icon: '💻' },
    { id: 'other', label: 'Otros', icon: '📦' },
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        await addUploadedFile(file, file.name);
      }
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleQuickUpload}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Folder className="w-5 h-5 text-zinc-300" />
            <span>Todos los Archivos</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {filteredFiles.length} de {activeFiles.length} archivos
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
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

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
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

      {/* Active Search Filter Badge */}
      {searchQuery && (
        <div className="flex items-center gap-2 text-xs bg-zinc-900 text-zinc-200 px-3 py-1.5 rounded-xl border border-zinc-800 w-fit">
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <span>Filtrando por: &quot;{searchQuery}&quot;</span>
          <button
            onClick={() => setSearchQuery('')}
            className="p-0.5 hover:bg-zinc-800 rounded-full cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <div className="p-10 text-center bg-zinc-950 rounded-2xl border border-dashed border-zinc-850">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">
            No se encontraron archivos
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No hay archivos que coincidan con "${searchQuery}".`
              : 'No hay archivos en esta categoría.'}
          </p>
          {(searchQuery || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-3 px-3.5 py-1.5 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
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
