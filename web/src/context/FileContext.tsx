'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { FileItem, FileType, StorageStats, SyncState, BatchUploadProgress, FolderInfo } from '../lib/types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getFileTypeFromExtension, isImageFile } from '../lib/file-helpers';
import {
  fetchFilesFromSupabase,
  uploadFileToSupabase,
  softDeleteInSupabase,
  batchSoftDeleteInSupabase,
  restoreFromTrashInSupabase,
  batchRestoreFromTrashInSupabase,
  permanentDeleteInSupabase,
  batchPermanentDeleteInSupabase,
  calculateSHA256,
} from '../lib/supabase-service';

// In-memory cache for instant zero-delay image previews
const blobUrlCache = new Map<string, string>();

interface FileContextType {
  files: FileItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: FileType | 'all';
  setSelectedCategory: (cat: FileType | 'all') => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  currentFolder: string;
  setCurrentFolder: (folder: string) => void;
  customFolders: string[];
  createFolder: (name: string) => void;
  deleteFolder: (folderPath: string) => Promise<void>;
  selectedFileIds: Set<string>;
  toggleFileSelection: (id: string) => void;
  selectAllFiles: (ids: string[]) => void;
  clearSelection: () => void;
  deleteMultipleFiles: (ids: string[]) => Promise<void>;
  restoreMultipleFiles: (ids: string[]) => Promise<void>;
  stats: StorageStats;
  previewFile: FileItem | null;
  setPreviewFile: (file: FileItem | null) => void;
  infoFile: FileItem | null;
  setInfoFile: (file: FileItem | null) => void;
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  isCreateFolderOpen: boolean;
  setIsCreateFolderOpen: (open: boolean) => void;
  addUploadedFile: (file: File, relativePath?: string) => Promise<void>;
  uploadBatchFiles: (items: { file: File; relativePath: string }[], concurrency?: number) => Promise<void>;
  uploadProgress: BatchUploadProgress | null;
  moveToTrash: (id: string) => Promise<void>;
  restoreFromTrash: (id: string) => Promise<void>;
  deletePermanently: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  triggerManualSync: () => Promise<void>;
  isSupabaseLive: boolean;
  isLoading: boolean;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FileType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [customFolders, setCustomFolders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('misarchivos_custom_folders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<BatchUploadProgress | null>(null);

  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [infoFile, setInfoFile] = useState<FileItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);

  // Persist custom folders
  useEffect(() => {
    try {
      localStorage.setItem('misarchivos_custom_folders', JSON.stringify(customFolders));
    } catch (e) {
      console.warn('Could not save folders to localStorage:', e);
    }
  }, [customFolders]);

  const createFolder = (name: string) => {
    const trimmed = name.trim().replace(/[\/\\]+/g, '');
    if (!trimmed) return;
    const fullPath = currentFolder ? `${currentFolder}/${trimmed}` : trimmed;
    if (!customFolders.includes(fullPath)) {
      setCustomFolders((prev) => [...prev, fullPath]);
    }
  };

  const deleteFolder = async (folderPath: string) => {
    // 1. Remove from custom folders
    setCustomFolders((prev) => prev.filter((p) => p !== folderPath && !p.startsWith(`${folderPath}/`)));

    // 2. Soft-delete all files inside this folder
    const filesInFolder = files.filter(
      (f) => !f.isTrash && (f.relativePath === folderPath || f.relativePath.startsWith(`${folderPath}/`))
    );
    if (filesInFolder.length > 0) {
      await deleteMultipleFiles(filesInFolder.map((f) => f.id));
    }

    if (currentFolder === folderPath || currentFolder.startsWith(`${folderPath}/`)) {
      setCurrentFolder('');
    }
  };

  // Selection handlers
  const toggleFileSelection = (id: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiles = (ids: string[]) => {
    setSelectedFileIds(new Set(ids));
  };

  const clearSelection = () => {
    setSelectedFileIds(new Set());
  };

  // Load files for the authenticated user only
  const loadFiles = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setFiles([]);
      setIsLoading(false);
      return;
    }

    if (isSupabaseConfigured) {
      try {
        setIsSyncing(true);
        const remoteFiles = await fetchFilesFromSupabase(user.id);
        const mappedWithCache = (remoteFiles || []).map((f) => {
          if (f.type === 'image' && !f.thumbnailUrl) {
            const cached =
              blobUrlCache.get(f.relativePath) ||
              blobUrlCache.get(f.name) ||
              (f.hash ? blobUrlCache.get(f.hash) : undefined);
            if (cached) {
              return { ...f, thumbnailUrl: cached, downloadUrl: f.downloadUrl || cached };
            }
          }
          return f;
        });
        setFiles(mappedWithCache);
        setIsSupabaseLive(true);
      } catch (err) {
        console.error('Error connecting to Supabase:', err);
      } finally {
        setIsSyncing(false);
        setIsLoading(false);
        setLastSyncTime(new Date().toISOString());
      }
    } else {
      setFiles([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadFiles();
    } else {
      setFiles([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, loadFiles]);

  // Realtime subscription to database changes for this user
  useEffect(() => {
    if (isAuthenticated && user?.id && isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel(`realtime-files-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'files',
          },
          () => {
            loadFiles();
          }
        )
        .subscribe();

      return () => {
        supabase?.removeChannel(channel);
      };
    }
  }, [isAuthenticated, user?.id, loadFiles]);

  // Calculate storage stats from active files only
  const activeFiles = files.filter((f) => !f.isTrash);
  const trashFiles = files.filter((f) => f.isTrash);
  const totalUsedBytes = activeFiles.reduce((acc, f) => acc + (f.size || 0), 0);
  const syncedCount = activeFiles.filter((f) => f.syncStatus === 'synced').length;
  const syncingCount = activeFiles.filter((f) => f.syncStatus === 'syncing').length;
  const pendingCount = activeFiles.filter((f) => f.syncStatus === 'pending').length;

  const currentSyncState: 'synced' | 'syncing' | 'pending' | 'conflict' = isSyncing
    ? 'syncing'
    : syncingCount > 0
    ? 'syncing'
    : pendingCount > 0
    ? 'pending'
    : 'synced';

  const stats: StorageStats = {
    totalFiles: activeFiles.length,
    usedBytes: totalUsedBytes,
    syncedCount,
    syncingCount,
    pendingCount,
    trashCount: trashFiles.length,
    syncState: currentSyncState,
    lastSyncTime,
  };

  const addUploadedFile = async (file: File, relativePath = '') => {
    const hash = await calculateSHA256(file);
    const cleanRelPath = relativePath || file.name;
    const { type: detectedType, extension: detectedExt } = getFileTypeFromExtension(file.name);
    const isImg = detectedType === 'image' || isImageFile(file.name, file.type);

    let localPreviewUrl: string | undefined = undefined;
    if (isImg) {
      try {
        localPreviewUrl = URL.createObjectURL(file);
        blobUrlCache.set(cleanRelPath, localPreviewUrl);
        blobUrlCache.set(file.name, localPreviewUrl);
        if (hash) blobUrlCache.set(hash, localPreviewUrl);
      } catch (e) {
        console.warn('Could not create ObjectURL:', e);
      }
    }

    const tempItem: FileItem = {
      id: 'temp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      userId: user?.id,
      name: file.name,
      relativePath: cleanRelPath,
      type: isImg ? 'image' : detectedType,
      extension: detectedExt,
      size: file.size,
      mimeType: file.type || (isImg ? 'image/jpeg' : 'application/octet-stream'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hash,
      syncStatus: 'syncing',
      isTrash: false,
      thumbnailUrl: localPreviewUrl,
      downloadUrl: localPreviewUrl,
    };

    setFiles((prev) => [tempItem, ...prev]);

    if (isSupabaseConfigured && user?.id) {
      const result = await uploadFileToSupabase(file, cleanRelPath, user.id);
      if (result) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === tempItem.id
              ? {
                  ...result,
                  syncStatus: 'synced',
                  thumbnailUrl: result.thumbnailUrl || localPreviewUrl,
                  downloadUrl: result.downloadUrl || localPreviewUrl,
                }
              : f
          )
        );
      } else {
        await loadFiles();
      }
    }

    setLastSyncTime(new Date().toISOString());
  };

  // Concurrent high-performance bulk uploader (solves 100+ files bottleneck)
  const uploadBatchFiles = async (
    items: { file: File; relativePath: string }[],
    concurrency = 4
  ) => {
    if (items.length === 0) return;

    const tempItems: { temp: FileItem; file: File; cleanRelPath: string }[] = [];
    const now = Date.now();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const { type: detectedType, extension: detectedExt } = getFileTypeFromExtension(item.file.name);
      const isImg = detectedType === 'image' || isImageFile(item.file.name, item.file.type);
      let localPreviewUrl: string | undefined = undefined;
      if (isImg) {
        try {
          localPreviewUrl = URL.createObjectURL(item.file);
          blobUrlCache.set(item.relativePath, localPreviewUrl);
          blobUrlCache.set(item.file.name, localPreviewUrl);
        } catch (e) {}
      }

      const temp: FileItem = {
        id: `temp-${now}-${i}`,
        userId: user?.id,
        name: item.file.name,
        relativePath: item.relativePath,
        type: isImg ? 'image' : detectedType,
        extension: detectedExt,
        size: item.file.size,
        mimeType: item.file.type || (isImg ? 'image/jpeg' : 'application/octet-stream'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hash: 'hash-' + now + '-' + i,
        syncStatus: 'syncing',
        isTrash: false,
        thumbnailUrl: localPreviewUrl,
        downloadUrl: localPreviewUrl,
      };

      tempItems.push({ temp, file: item.file, cleanRelPath: item.relativePath });
    }

    // Insert all cards in a SINGLE state update to prevent UI freezing
    setFiles((prev) => [...tempItems.map((t) => t.temp), ...prev]);
    setUploadProgress({
      active: true,
      completed: 0,
      total: items.length,
      currentFileName: items[0]?.file.name,
    });

    let completedCount = 0;
    const queue = [...tempItems];

    async function worker() {
      while (queue.length > 0) {
        const current = queue.shift();
        if (!current) break;

        try {
          if (isSupabaseConfigured && user?.id) {
            const result = await uploadFileToSupabase(
              current.file,
              current.cleanRelPath,
              user.id
            );
            if (result) {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === current.temp.id
                    ? {
                        ...result,
                        syncStatus: 'synced',
                        thumbnailUrl: result.thumbnailUrl || current.temp.thumbnailUrl,
                        downloadUrl: result.downloadUrl || current.temp.downloadUrl,
                      }
                    : f
                )
              );
            }
          }
        } catch (err) {
          console.error('Error uploading batch item:', current.file.name, err);
        } finally {
          completedCount++;
          setUploadProgress((prev) =>
            prev
              ? {
                  ...prev,
                  completed: completedCount,
                  currentFileName: queue[0]?.file.name,
                }
              : null
          );
        }
      }
    }

    const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
    await Promise.all(workers);

    setUploadProgress(null);
    setLastSyncTime(new Date().toISOString());
  };

  const moveToTrash = async (id: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              isTrash: true,
              deletedAt: new Date().toISOString(),
            }
          : f
      )
    );
    if (previewFile?.id === id) setPreviewFile(null);
    if (infoFile?.id === id) setInfoFile(null);

    if (isSupabaseConfigured && user?.id) {
      await softDeleteInSupabase(id, user.id);
    }
  };

  const deleteMultipleFiles = async (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);

    setFiles((prev) =>
      prev.map((f) =>
        idSet.has(f.id)
          ? {
              ...f,
              isTrash: true,
              deletedAt: new Date().toISOString(),
            }
          : f
      )
    );

    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });

    if (previewFile && idSet.has(previewFile.id)) setPreviewFile(null);
    if (infoFile && idSet.has(infoFile.id)) setInfoFile(null);

    if (isSupabaseConfigured && user?.id) {
      await batchSoftDeleteInSupabase(ids, user.id);
    }
  };

  const restoreFromTrash = async (id: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              isTrash: false,
              deletedAt: null,
            }
          : f
      )
    );

    if (isSupabaseConfigured && user?.id) {
      await restoreFromTrashInSupabase(id, user.id);
    }
  };

  const restoreMultipleFiles = async (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);

    setFiles((prev) =>
      prev.map((f) =>
        idSet.has(f.id)
          ? {
              ...f,
              isTrash: false,
              deletedAt: null,
            }
          : f
      )
    );

    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });

    if (isSupabaseConfigured && user?.id) {
      await batchRestoreFromTrashInSupabase(ids, user.id);
    }
  };

  const deletePermanently = async (id: string) => {
    const target = files.find((f) => f.id === id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (previewFile?.id === id) setPreviewFile(null);
    if (infoFile?.id === id) setInfoFile(null);

    if (isSupabaseConfigured && target && user?.id) {
      await permanentDeleteInSupabase(id, target.relativePath, user.id);
    }
  };

  const emptyTrash = async () => {
    const trashList = files.filter((f) => f.isTrash);
    setFiles((prev) => prev.filter((f) => !f.isTrash));

    if (isSupabaseConfigured && user?.id) {
      const items = trashList.map((f) => ({ id: f.id, storagePath: f.relativePath }));
      await batchPermanentDeleteInSupabase(items, user.id);
    }
  };

  const triggerManualSync = async () => {
    setIsSyncing(true);
    await loadFiles();
    setIsSyncing(false);
  };

  return (
    <FileContext.Provider
      value={{
        files,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        viewMode,
        setViewMode,
        currentFolder,
        setCurrentFolder,
        customFolders,
        createFolder,
        deleteFolder,
        selectedFileIds,
        toggleFileSelection,
        selectAllFiles,
        clearSelection,
        deleteMultipleFiles,
        restoreMultipleFiles,
        stats,
        previewFile,
        setPreviewFile,
        infoFile,
        setInfoFile,
        isUploadModalOpen,
        setIsUploadModalOpen,
        isCreateFolderOpen,
        setIsCreateFolderOpen,
        addUploadedFile,
        uploadBatchFiles,
        uploadProgress,
        moveToTrash,
        restoreFromTrash,
        deletePermanently,
        emptyTrash,
        triggerManualSync,
        isSupabaseLive,
        isLoading,
      }}
    >
      {children}
    </FileContext.Provider>
  );
}

export function useFiles() {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
}
