'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { FileItem, FileType, StorageStats, SyncState } from '../lib/types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  fetchFilesFromSupabase,
  uploadFileToSupabase,
  softDeleteInSupabase,
  restoreFromTrashInSupabase,
  permanentDeleteInSupabase,
  calculateSHA256,
} from '../lib/supabase-service';

interface FileContextType {
  files: FileItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: FileType | 'all';
  setSelectedCategory: (cat: FileType | 'all') => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  stats: StorageStats;
  previewFile: FileItem | null;
  setPreviewFile: (file: FileItem | null) => void;
  infoFile: FileItem | null;
  setInfoFile: (file: FileItem | null) => void;
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  addUploadedFile: (file: File, relativePath?: string) => Promise<void>;
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
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [infoFile, setInfoFile] = useState<FileItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);

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
        setFiles(remoteFiles || []);
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

    const tempItem: FileItem = {
      id: 'temp-' + Date.now(),
      userId: user?.id,
      name: file.name,
      relativePath: cleanRelPath,
      type: 'other',
      extension: file.name.split('.').pop() || '',
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hash,
      syncStatus: 'syncing',
      isTrash: false,
    };

    setFiles((prev) => [tempItem, ...prev]);

    if (isSupabaseConfigured && user?.id) {
      const result = await uploadFileToSupabase(file, cleanRelPath, user.id);
      if (result) {
        setFiles((prev) =>
          prev.map((f) => (f.id === tempItem.id ? { ...result, syncStatus: 'synced' } : f))
        );
      } else {
        await loadFiles();
      }
    }

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
      for (const f of trashList) {
        await permanentDeleteInSupabase(f.id, f.relativePath, user.id);
      }
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
        stats,
        previewFile,
        setPreviewFile,
        infoFile,
        setInfoFile,
        isUploadModalOpen,
        setIsUploadModalOpen,
        addUploadedFile,
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
