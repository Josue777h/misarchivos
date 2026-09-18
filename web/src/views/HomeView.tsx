import React, { useRef, useState, useMemo } from 'react';
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
  FolderOpen,
  LayoutGrid,
  List,
  Upload,
  RefreshCw,
  Camera,
  Folder,
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
    uploadBatchFiles,
    currentFolder,
    customFolders,
    selectedFileIds,
    selectAllFiles,
    clearSelection,
    setIsCreateFolderOpen,
  } = useFiles();

  const [isSyncingLocal, setIsSyncingLocal] = useState(false);
  const [dragOverPage, setDragOverPage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const activeFiles = useMemo(() => files.filter((f) => !f.isTrash), [files]);

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

  // Filtered files for current view
  const filteredFiles = useMemo(() => {
    return activeFiles.filter((f) => {
      // If user selected a specific type filter (like Photos, Docs), show across all or within folder
      if (selectedCategory !== 'all' && f.type !== selectedCategory) {
        return false;
      }

      // If user typed a search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.relativePath.toLowerCase().includes(q) ||
          f.extension.toLowerCase().includes(q)
        );
      }

      // If viewing all and no search query, filter to current folder (Google Drive experience)
      if (selectedCategory === 'all') {
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

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCamera = false) => {
    if (e.target.files && e.target.files.length > 0) {
      const folder = isCamera
        ? currentFolder ? `${currentFolder}/Fotos` : 'Fotos'
        : currentFolder;
      const items = Array.from(e.target.files).map((file) => ({
        file,
        relativePath: folder ? `${folder}/${file.name}` : file.name,
      }));
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

  const handleSyncClick = async () => {
    setIsSyncingLocal(true);
    await triggerManualSync();
    setTimeout(() => setIsSyncingLocal(false), 800);
  };

  // Professional Lucide icon category pills
  const categoryChips: {
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
      {/* Hidden inputs for uploads */}
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

      {/* Action Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white text-black font-semibold text-xs sm:text-sm hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>Subir archivos</span>
        </button>

        <button
          onClick={() => setIsCreateFolderOpen(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-white font-semibold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer"
        >
          <FolderPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 shrink-0" />
          <span>Nueva carpeta</span>
        </button>

        <button
          onClick={() => folderInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 font-semibold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer"
          title="Subir carpeta completa"
        >
          <FolderUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500 shrink-0" />
          <span className="hidden sm:inline">Subir carpeta</span>
        </button>

        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-medium text-xs sm:text-sm active:scale-95 transition-all cursor-pointer"
          title="Cámara"
        >
          <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        </button>

        <button
          onClick={handleSyncClick}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-medium text-xs sm:text-sm active:scale-95 transition-all cursor-pointer ml-auto"
          title="Actualizar"
        >
          <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSyncingLocal ? 'animate-spin text-white' : ''}`} />
        </button>
      </div>

      {/* Breadcrumbs Navigation */}
      <BreadcrumbsNav />

      {/* Category Pills Slider (Professional Lucide Icons) */}
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
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all active:scale-95 cursor-pointer ${
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

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-300">
            {selectedCategory === 'all'
              ? currentFolder ? currentFolder.split('/').pop() : 'Archivos'
              : selectedCategory === 'image' ? 'Imágenes'
              : selectedCategory === 'word' ? 'Documentos'
              : selectedCategory === 'excel' ? 'Hojas de cálculo'
              : selectedCategory === 'pdf' ? 'PDFs'
              : selectedCategory === 'text' ? 'Código y texto'
              : 'Otros'}
          </h2>
          <span className="text-[11px] text-zinc-600 font-mono">({filteredFiles.length})</span>
        </div>

        <div className="flex items-center gap-2">
          {filteredFiles.length > 0 && (
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              {isAllSelected ? (
                <><CheckSquare className="w-3.5 h-3.5 text-emerald-400" /><span>Deseleccionar</span></>
              ) : (
                <><Square className="w-3.5 h-3.5" /><span>Seleccionar todo</span></>
              )}
            </button>
          )}

          <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-300'
              }`}
              title="Cuadrícula"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-300'
              }`}
              title="Lista"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Files Display */}
      {filteredFiles.length === 0 && subfolders.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-zinc-950 rounded-2xl border border-dashed border-zinc-850 animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">
            {searchQuery ? 'No hay resultados' : 'Esta carpeta está vacía'}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
            {searchQuery
              ? `Sin coincidencias para "${searchQuery}".`
              : 'Arrastra archivos aquí o usa los botones para agregar contenido.'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 active:scale-95 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir archivos</span>
            </button>
            <button
              onClick={() => setIsCreateFolderOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 border border-zinc-700 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 active:scale-95 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Nueva Carpeta</span>
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

      {/* Create Folder Modal */}
      <CreateFolderModal />

      {/* Floating Batch Action Bar (Batch Delete, Download, etc.) */}
      <BatchActionBar />

      {/* Floating Live Upload Progress Bar */}
      <UploadProgressBar />
    </div>
  );
}
