import { supabase, isSupabaseConfigured } from './supabase';
import { FileItem, FileType, SyncState } from './types';
import { getFileTypeFromExtension, sanitizeStorageKey } from './file-helpers';

// Helper to compute SHA-256 hash in browser
export async function calculateSHA256(file: File | Blob): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('Error calculating hash:', err);
    return 'sha256-' + Math.random().toString(36).substring(2, 15);
  }
}

export async function fetchFilesFromSupabase(): Promise<FileItem[]> {
  if (!supabase || !isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching files from Supabase:', error);
      return [];
    }

    return (data || []).map((row: any) => {
      let publicUrl = '';
      const storageKey = row.storage_path || sanitizeStorageKey(row.relative_path);
      if (storageKey) {
        const { data: urlData } = supabase!.storage
          .from('misarchivos')
          .getPublicUrl(storageKey);
        publicUrl = urlData?.publicUrl || '';
      }

      return {
        id: row.id,
        name: row.name,
        relativePath: row.relative_path,
        type: row.file_type as FileType,
        extension: row.extension,
        size: Number(row.size_bytes),
        mimeType: row.mime_type,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        hash: row.hash_sha256,
        syncStatus: row.sync_status as SyncState,
        isTrash: Boolean(row.is_trash),
        deletedAt: row.deleted_at,
        thumbnailUrl: row.file_type === 'image' ? publicUrl : undefined,
        downloadUrl: publicUrl || undefined,
        conflictInfo: row.conflict_info || undefined,
      };
    });
  } catch (err) {
    console.error('Error in fetchFilesFromSupabase:', err);
    return [];
  }
}

export async function uploadFileToSupabase(file: File, relativePath = ''): Promise<FileItem | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const hash = await calculateSHA256(file);
    const { type, extension } = getFileTypeFromExtension(file.name);
    const cleanPath = relativePath || file.name;
    const storagePath = sanitizeStorageKey(cleanPath);

    // 1. Upload to Supabase Storage bucket 'misarchivos'
    const { error: storageError } = await supabase.storage
      .from('misarchivos')
      .upload(storagePath, file, {
        upsert: true,
        contentType: file.type || 'application/octet-stream',
      });

    if (storageError) {
      console.error('Storage upload error:', storageError);
    }

    // 2. Query if record exists
    const { data: existingRows } = await supabase
      .from('files')
      .select('id')
      .eq('relative_path', cleanPath)
      .limit(1);

    const payload = {
      name: file.name,
      relative_path: cleanPath,
      file_type: type,
      extension,
      size_bytes: file.size,
      mime_type: file.type || 'application/octet-stream',
      hash_sha256: hash,
      storage_path: storagePath,
      sync_status: 'synced',
      is_trash: false,
      deleted_at: null,
      updated_at: new Date().toISOString(),
    };

    let record = null;
    if (existingRows && existingRows.length > 0) {
      const { data, error: updateError } = await supabase
        .from('files')
        .update(payload)
        .eq('id', existingRows[0].id)
        .select()
        .single();
      if (!updateError) record = data;
    } else {
      const { data, error: insertError } = await supabase
        .from('files')
        .insert(payload)
        .select()
        .single();
      if (!insertError) record = data;
    }

    const { data: urlData } = supabase.storage
      .from('misarchivos')
      .getPublicUrl(storagePath);

    return {
      id: record?.id || 'temp-' + Date.now(),
      name: file.name,
      relativePath: cleanPath,
      type,
      extension,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      createdAt: record?.created_at || new Date().toISOString(),
      updatedAt: record?.updated_at || new Date().toISOString(),
      hash,
      syncStatus: 'synced',
      isTrash: false,
      thumbnailUrl: type === 'image' ? urlData?.publicUrl : undefined,
      downloadUrl: urlData?.publicUrl || undefined,
    };
  } catch (err) {
    console.error('Error in uploadFileToSupabase:', err);
    return null;
  }
}

export async function softDeleteInSupabase(id: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;

  const { error } = await supabase
    .from('files')
    .update({
      is_trash: true,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  return !error;
}

export async function restoreFromTrashInSupabase(id: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;

  const { error } = await supabase
    .from('files')
    .update({
      is_trash: false,
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  return !error;
}

export async function permanentDeleteInSupabase(id: string, storagePath?: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;

  if (storagePath) {
    const cleanStorage = sanitizeStorageKey(storagePath);
    await supabase.storage.from('misarchivos').remove([cleanStorage]);
  }

  const { error } = await supabase.from('files').delete().eq('id', id);
  return !error;
}
