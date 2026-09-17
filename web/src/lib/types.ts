export type FileType =
  | 'image'
  | 'pdf'
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'text'
  | 'other';

export type SyncState = 'synced' | 'syncing' | 'pending' | 'conflict' | 'error';

export interface ConflictInfo {
  conflictAt: string;
  device: string;
  originalName: string;
  conflictPath: string;
}

export interface FileItem {
  id: string;
  userId?: string;
  name: string;
  relativePath: string;
  type: FileType;
  extension: string;
  size: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  hash: string;
  syncStatus: SyncState;
  isTrash?: boolean;
  deletedAt?: string | null;
  thumbnailUrl?: string;
  downloadUrl?: string;
  contentUrl?: string;
  conflictInfo?: ConflictInfo;
}

export interface StorageStats {
  totalFiles: number;
  usedBytes: number;
  syncedCount: number;
  syncingCount: number;
  pendingCount: number;
  trashCount: number;
  syncState: 'synced' | 'syncing' | 'pending' | 'conflict';
  lastSyncTime: string;
}

export interface CategoryInfo {
  type: FileType;
  title: string;
  iconName: string;
  extensions: string[];
  count: number;
  sizeBytes: number;
  color: string;
  bgColor: string;
}
