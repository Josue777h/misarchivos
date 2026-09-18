import React, { useMemo, useRef, useState } from 'react';
import { useFiles } from '../context/FileContext';
import { FileCard } from '../components/FileCard';
import { FileListItem } from '../components/FileListItem';
import { FolderCard } from '../components/FolderCard';
import { BreadcrumbsNav } from '../components/BreadcrumbsNav';
import { CreateFolderModal } from '../components/CreateFolderModal';
import { BatchActionBar } from '../components/BatchActionBar';
import { UploadProgressBar } from '../components/UploadProgressBar';
import { FileType } from '../lib/types';
import { extractDroppedItems } from '../lib/file-helpers';
import {
  Folder,
  LayoutGrid,
  List,
  Search,
  Filter,
  X,
  Upload,
  FolderUp,
  FolderPlus,
  Layers,
  Image as ImageIcon,
  FileText,
  FileEdit,
  FileSpreadsheet,
  FileCode,
  Package,
  CheckSquare,
  Square,
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
    uploadBatchFiles,
    currentFolder,
    customFolders,
    selectedFileIds,
    selectAllFiles,
    clearSelection,
    setIsCreateFolderOpen,
  } = useFiles();

  const [dragOverPage, setDragOverPage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const activeFiles = useMemo(() => {
    return files.filter((f) => !f.isTrash);
  }, [files]);

  // Derived subfolders for currentFolder
  const subfolders = useMemo(() => {
    const folderMap = new Map<string, { itemCount: number; totalSize: number }>();
    const prefix = currentFolder ? `${currentFolder}/` : '';

    // Files inside current folder structure
    activeFiles.forEach((f) => {
      const path = f.relativePath || f.name;
      if (path.startsWith(prefix)) {
        const rest = path.slice(prefix.length);
        const slashIndex = rest.indexOf('/');
        if (slashIndex > 0) {
          const subName = rest.slice(0, slashIndex);
          const current = folderMap.get(subName) || { itemCount: 0, totalSize: 0 };
          current.itemCount += 1;
          current.totalSize += f.size;
          folderMap.set(subName, current);
        }
      }
    });

    // Explicit custom created folders
    customFolders.forEach((cf) => {
      if (cf.startsWith(prefix)) {
        const rest = cf.slice(prefix.length);
        if (rest && !rest.includes('/')) {
          if (!folderMap.has(rest)) {
            folderMap.set(rest, { itemCount: 0, totalSize: 0 });
          }
        }
      }
    });

    return Array.from(folderMap.entries()).map(([name, data]) => ({
      name,
      path: prefix ? `${prefix}${name}` : name,
      fileCount: data.itemCount,
      totalSizeBytes: data.totalSize,
    }));
  }, [activeFiles, currentFolder, customFolders]);

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
      } else if (selectedCategory === 'all') {
        // In root/folder view without query, show items in current folder
        const path = f.relativePath || f.name;
        const prefix = currentFolder ? `${currentFolder}/` : '';
        if (prefix) {
          if (!path.startsWith(prefix)) return false;
          const rest = path.slice(prefix.length);
          return !rest.includes('/');
        } else {
          return !path.includes('/');
        }
      }
      return true;
    });
  }, [activeFiles, selectedCategory, searchQuery, currentFolder]);

  const isAllSelected =
    filteredFiles.length > 0 && filteredFiles.every((f) => selectedFileIds.has(f.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAllFiles(filteredFiles.map((f) => f.id));
    }
  };

  const categories: {
    id: FileType | 'all';
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'all', label: 'Todos', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'image', label: 'Fotos', icon: <ImageIcon className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'pdf', label: 'PDFs', icon: <FileText className="w-3.5 h-3.5 text-rose-400" /> },
    { id: 'word', label: 'Docs', icon: <FileEdit className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'excel', label: 'Excel', icon: <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'text', label: 'Código', icon: <FileCode className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'other', label: 'Otros', icon: <Package className="w-3.5 h-3.5 text-amber-400" /> },
  ];

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const items = Array.from(e.target.files).map((file) => {
        const path = currentFolder ? `${currentFolder}/${file.name}` : file.name;
        return { file, relativePath: path };
      });
      await uploadBatchFiles(items);
      e.target.value = '';
    }
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const items = Array.from(e.target.files).map((file) => {
        const rel = (file as any).webkitRelativePath || file.name;
        const path = currentFolder ? `${currentFolder}/${rel}` : rel;
        return { file, relativePath: path };
      });
      await uploadBatchFiles(items);
      e.target.value = '';
    }
  };

  const handlePageDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPage(false);
    const items = await extractDroppedItems(e.dataTransfer);
    if (items.length > 0) {
      const mapped = items.map((item) => ({
        file: item.file,
        relativePath: currentFolder
          ? `${currentFolder}/${item.relativePath}`
          : item.relativePath,
      }));
      await uploadBatchFiles(mapped);
    }
  };

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
      className={`space-y-4 sm:space-y-5 animate-in fade-in duration-150 rounded-3xl transition-all ${
        dragOverPage ? 'ring-2 ring-white ring-offset-4 ring-offset-black bg-zinc-950/40' : ''
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleQuickUpload}
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

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <button
            onClick={() => setIsCreateFolderOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            title="Crear nueva carpeta"
          >
            <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nueva Carpeta</span>
          </button>

          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            title="Subir carpeta completa con toda su estructura"
          >
            <FolderUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Subir Carpeta</span>
          </button>

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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir archivos</span>
          </button>
        </div>
      </div>

      {/* Breadcrumbs Navigation */}
      <BreadcrumbsNav />

      {/* Category Pills Filter (Professional Lucide Icons) */}
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
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all active:scale-95 cursor-pointer ${
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

      {/* Subfolders Section (Google Drive Style) */}
      {selectedCategory === 'all' && !searchQuery.trim() && subfolders.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <Folder className="w-3.5 h-3.5 text-zinc-500" />
            <span>Carpetas ({subfolders.length})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {subfolders.map((folder) => (
              <FolderCard key={folder.path} folder={folder} />
            ))}
          </div>
        </div>
      )}

      {/* Files Section Title and Select All */}
      <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-white">
            {selectedCategory === 'all'
              ? currentFolder ? `Archivos en ${currentFolder.split('/').pop()}` : 'Archivos'
              : `${selectedCategory.toUpperCase()}`}
          </h2>

          {filteredFiles.length > 0 && (
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800"
              title="Seleccionar o deseleccionar todos los archivos visibles"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Deseleccionar</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Seleccionar todo</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Files Display */}
      {filteredFiles.length === 0 && subfolders.length === 0 ? (
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
              : 'Esta carpeta se encuentra vacía.'}
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

      {/* Create Folder Modal */}
      <CreateFolderModal />

      {/* Floating Batch Action Bar */}
      <BatchActionBar />

      {/* Floating Live Upload Progress Bar */}
      <UploadProgressBar />
    </div>
  );
}
