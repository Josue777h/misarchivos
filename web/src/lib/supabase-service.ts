import { supabase, isSupabaseConfigured } from './supabase';
import { FileItem, FileType, SyncState } from './types';
import { getFileTypeFromExtension, isImageFile, sanitizeStorageKey } from './file-helpers';

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

export async function fetchFilesFromSupabase(userId?: string): Promise<FileItem[]> {
  if (!supabase || !isSupabaseConfigured) return [];

  try {
    let query = supabase
      .from('files')
      .select('*')
      .order('updated_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching files from Supabase:', error);
      return [];
    }

    return (data || []).map((row: any) => {
      let publicUrl = '';
      const storageKey = row.storage_path || (userId ? `${userId}/${sanitizeStorageKey(row.relative_path)}` : sanitizeStorageKey(row.relative_path));
      if (storageKey) {
        const { data: urlData } = supabase!.storage
          .from('misarchivos')
          .getPublicUrl(storageKey);
        publicUrl = urlData?.publicUrl || '';
      }

      const isImg = row.file_type === 'image' || isImageFile(row.name, row.mime_type);

      return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        relativePath: row.relative_path,
        type: (isImg ? 'image' : row.file_type) as FileType,
        extension: row.extension,
        size: Number(row.size_bytes),
        mimeType: row.mime_type,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        hash: row.hash_sha256,
        syncStatus: row.sync_status as SyncState,
        isTrash: Boolean(row.is_trash),
        deletedAt: row.deleted_at,
        thumbnailUrl: isImg ? publicUrl : undefined,
        downloadUrl: publicUrl || undefined,
        conflictInfo: row.conflict_info || undefined,
      };
    });
  } catch (err) {
    console.error('Error in fetchFilesFromSupabase:', err);
    return [];
  }
}

export async function uploadFileToSupabase(
  file: File,
  relativePath = '',
  userId?: string
): Promise<FileItem | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const hash = await calculateSHA256(file);
    const { type, extension } = getFileTypeFromExtension(file.name);
    const isImg = type === 'image' || isImageFile(file.name, file.type);
    const cleanPath = relativePath || file.name;
    const cleanKey = sanitizeStorageKey(cleanPath);
    const storagePath = userId ? `${userId}/${cleanKey}` : cleanKey;

    // 1. Upload to Supabase Storage bucket 'misarchivos' in user's isolated folder
    const { error: storageError } = await supabase.storage
      .from('misarchivos')
      .upload(storagePath, file, {
        upsert: true,
        contentType: file.type || (isImg ? 'image/jpeg' : 'application/octet-stream'),
      });

    if (storageError) {
      console.error('Storage upload error:', storageError);
    }

    // 2. Query if record exists for THIS user
    let existingQuery = supabase
      .from('files')
      .select('id')
      .eq('relative_path', cleanPath);

    if (userId) {
      existingQuery = existingQuery.eq('user_id', userId);
    }

    const { data: existingRows } = await existingQuery.limit(1);

    const payload: any = {
      name: file.name,
      relative_path: cleanPath,
      file_type: isImg ? 'image' : type,
      extension,
      size_bytes: file.size,
      mime_type: file.type || (isImg ? 'image/jpeg' : 'application/octet-stream'),
      hash_sha256: hash,
      storage_path: storagePath,
      sync_status: 'synced',
      is_trash: false,
      deleted_at: null,
      updated_at: new Date().toISOString(),
    };

    if (userId) {
      payload.user_id = userId;
    }

    let record = null;
    if (existingRows && existingRows.length > 0) {
      let updateQuery = supabase
        .from('files')
        .update(payload)
        .eq('id', existingRows[0].id);

      if (userId) {
        updateQuery = updateQuery.eq('user_id', userId);
      }

      const { data, error: updateError } = await updateQuery.select().single();
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
      userId: record?.user_id || userId,
      name: file.name,
      relativePath: cleanPath,
      type: (isImg ? 'image' : type) as FileType,
      extension,
      size: file.size,
      mimeType: file.type || (isImg ? 'image/jpeg' : 'application/octet-stream'),
      createdAt: record?.created_at || new Date().toISOString(),
      updatedAt: record?.updated_at || new Date().toISOString(),
      hash,
      syncStatus: 'synced',
      isTrash: false,
      thumbnailUrl: isImg ? urlData?.publicUrl : undefined,
      downloadUrl: urlData?.publicUrl || undefined,
    };
  } catch (err) {
    console.error('Error in uploadFileToSupabase:', err);
    return null;
  }
}

export async function softDeleteInSupabase(id: string, userId?: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;

  let query = supabase
    .from('files')
    .update({
      is_trash: true,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { error } = await query;
  return !error;
}

export async function restoreFromTrashInSupabase(id: string, userId?: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;

  let query = supabase
    .from('files')
    .update({
      is_trash: false,
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { error } = await query;
  return !error;
}

export async function permanentDeleteInSupabase(
  id: string,
  storagePath?: string,
  userId?: string
): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;

  if (storagePath) {
    const cleanStorage = sanitizeStorageKey(storagePath);
    await supabase.storage.from('misarchivos').remove([cleanStorage]);
  }

  let query = supabase.from('files').delete().eq('id', id);
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { error } = await query;
  return !error;
}
