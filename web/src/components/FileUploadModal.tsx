'use client';

import React, { useState, useRef } from 'react';
import { useFiles } from '../context/FileContext';
import {
  UploadCloud,
  Camera,
  Image,
  X,
  Folder,
  FolderUp,
  Check,
  FileText,
  Loader2,
  FileCode,
} from 'lucide-react';
import { formatFileSize, extractDroppedItems, DroppedUploadItem } from '../lib/file-helpers';

interface FileUploadPreview {
  name: string;
  relativePath: string;
  size: number;
  type: string;
  previewUrl?: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

export function FileUploadModal() {
  const { isUploadModalOpen, setIsUploadModalOpen, addUploadedFile } = useFiles();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [uploading, setUploading] = useState(false);
  const [filePreviews, setFilePreviews] = useState<FileUploadPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isUploadModalOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processItems = async (itemsList: DroppedUploadItem[]) => {
    if (!itemsList || itemsList.length === 0) return;

    // Create preview list
    const previews: FileUploadPreview[] = itemsList.map((item) => {
      const isImg = item.file.type.startsWith('image/');
      return {
        name: item.file.name,
        relativePath: item.relativePath,
        size: item.file.size,
        type: item.file.type,
        previewUrl: isImg ? URL.createObjectURL(item.file) : undefined,
        status: 'uploading',
      };
    });

    setFilePreviews(previews);
    setUploading(true);

    try {
      for (let i = 0; i < itemsList.length; i++) {
        const item = itemsList[i];
        const relativePath = selectedFolder
          ? `${selectedFolder}/${item.relativePath}`
          : item.relativePath;

        await addUploadedFile(item.file, relativePath);

        setFilePreviews((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, status: 'done' } : p))
        );
      }
    } catch (err) {
      console.error('Error during upload batch:', err);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setFilePreviews([]);
        setIsUploadModalOpen(false);
      }, 700);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedItems = await extractDroppedItems(e.dataTransfer);
    if (droppedItems.length > 0) {
      await processItems(droppedItems);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const items: DroppedUploadItem[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        items.push({ file, relativePath: file.name });
      }
      await processItems(items);
      e.target.value = '';
    }
  };

  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const items: DroppedUploadItem[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const relPath = (file as any).webkitRelativePath || file.name;
        items.push({ file, relativePath: relPath });
      }
      await processItems(items);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden border border-zinc-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700 text-white flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                Subir Archivos y Carpetas
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                HTML, CSS, Código, Word, Excel, TXT, TLS, Fotos, etc.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!uploading) setIsUploadModalOpen(false);
            }}
            disabled={uploading}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Subfolder selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-zinc-400" />
              Carpeta de destino en tu nube
            </label>
            <div className="flex gap-1.5 flex-wrap text-xs">
              {['', 'Fotos', 'Documentos', 'Trabajo', 'Proyectos', 'Descargas'].map((folder) => (
                <button
                  key={folder || 'root'}
                  type="button"
                  onClick={() => setSelectedFolder(folder)}
                  className={`px-3 py-1.5 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                    selectedFolder === folder
                      ? 'bg-white text-black border-white shadow-xs'
                      : 'border-zinc-800 text-zinc-400 bg-zinc-900/60 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {folder ? folder : 'Raíz (C:\\MisArchivos)'}
                </button>
              ))}
            </div>
          </div>

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={folderInputRef}
            type="file"
            // @ts-ignore
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleFolderChange}
            className="hidden"
          />

          {/* Drag & Drop Area */}
          {!uploading ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all ${
                dragActive
                  ? 'border-white bg-zinc-900 scale-[0.99]'
                  : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900/50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 text-white flex items-center justify-center mb-2">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">
                Arrastra y suelta tus archivos o carpetas aquí
              </p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Puedes soltar carpetas completas de código o páginas web manteniendo su estructura interna.
              </p>

              {/* Upload actions buttons */}
              <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Seleccionar archivos</span>
                </button>

                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  <FolderUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>Subir carpeta completa</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Uploading Progress Box */
            <div className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-zinc-300 font-semibold mb-1">
                <span>Subiendo y procesando...</span>
                <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> En progreso
                </span>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {filePreviews.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {f.previewUrl ? (
                        <img src={f.previewUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <FileText className="w-6 h-6 text-zinc-400" />
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate max-w-[240px]">{f.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[240px]">
                          {f.relativePath} • {formatFileSize(f.size)}
                        </p>
                      </div>
                    </div>
                    <div>
                      {f.status === 'done' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Mobile Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              disabled={uploading}
              onClick={() => {
                cameraInputRef.current?.click();
              }}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-semibold text-xs transition-all active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-zinc-300" />
              <span>Tomar foto</span>
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              disabled={uploading}
              onClick={() => folderInputRef.current?.click()}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-semibold text-xs transition-all active:scale-95 cursor-pointer"
            >
              <FolderUp className="w-4 h-4 text-amber-400" />
              <span>Subir carpeta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
