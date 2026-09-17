import { FileType, CategoryInfo, FileItem } from './types';

export const IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'svg',
  'avif',
  'bmp',
  'ico',
  'heic',
  'jfif',
  'tiff',
];

export function isImageFile(filename: string, mimeType?: string): boolean {
  if (mimeType && mimeType.toLowerCase().startsWith('image/')) return true;
  const parts = (filename || '').split('.');
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  return IMAGE_EXTENSIONS.includes(ext);
}

export function getFileTypeFromExtension(filename: string): { type: FileType; extension: string } {
  const parts = (filename || '').split('.');
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : '';

  if (IMAGE_EXTENSIONS.includes(ext)) {
    return { type: 'image', extension: ext };
  }
  if (['pdf'].includes(ext)) {
    return { type: 'pdf', extension: ext };
  }
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) {
    return { type: 'word', extension: ext };
  }
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
    return { type: 'excel', extension: ext };
  }
  if (['ppt', 'pptx', 'odp'].includes(ext)) {
    return { type: 'powerpoint', extension: ext };
  }
  if (['txt', 'md', 'json', 'log', 'xml', 'yaml', 'yml', 'js', 'ts', 'html', 'css'].includes(ext)) {
    return { type: 'text', extension: ext };
  }

  return { type: 'other', extension: ext };
}

// Sanitize storage key to prevent S3/Supabase 'Invalid key' errors
export function sanitizeStorageKey(filePath: string): string {
  const normalized = (filePath || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const parts = normalized.split(/[\/\\]/);
  const cleanParts = parts.map((part) =>
    part
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
  );
  return cleanParts.join('/');
}

// Safe cross-platform clipboard copy (works on HTTP, HTTPS, Android & iOS)
export async function safeCopyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    // fallback
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Copy fallback failed:', err);
    return false;
  }
}

// Safe share for mobile devices
export async function safeShareFile(file: { name: string; downloadUrl?: string }): Promise<void> {
  const shareUrl = file.downloadUrl || (typeof window !== 'undefined' ? window.location.href : '');
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: file.name,
        text: `Archivo compartido: ${file.name}`,
        url: shareUrl,
      });
      return;
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn('Share error fallback:', err);
    }
  }
  await safeCopyText(shareUrl);
}

// 1-Click safe download for mobile & desktop
export async function downloadBlobOrUrl(url: string, filename: string) {
  if (!url) return;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Fetch failed');
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    }, 1000);
  } catch (err) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 1000);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getCategoriesMetadata(files: FileItem[]): CategoryInfo[] {
  const activeFiles = files.filter((f) => !f.isTrash);

  const categories: {
    type: FileType;
    title: string;
    iconName: string;
    extensions: string[];
    color: string;
    bgColor: string;
  }[] = [
    {
      type: 'image',
      title: 'Imágenes',
      iconName: 'Image',
      extensions: IMAGE_EXTENSIONS,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      type: 'pdf',
      title: 'PDF',
      iconName: 'FileText',
      extensions: ['pdf'],
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
    {
      type: 'word',
      title: 'Documentos Word',
      iconName: 'FileEdit',
      extensions: ['doc', 'docx'],
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      type: 'excel',
      title: 'Hojas de Cálculo',
      iconName: 'FileSpreadsheet',
      extensions: ['xls', 'xlsx', 'csv'],
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      type: 'powerpoint',
      title: 'Presentaciones',
      iconName: 'Presentation',
      extensions: ['ppt', 'pptx'],
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
    {
      type: 'text',
      title: 'Archivos de Texto',
      iconName: 'FileCode',
      extensions: ['txt', 'md', 'json', 'log'],
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    },
    {
      type: 'other',
      title: 'Otros Archivos',
      iconName: 'FolderArchive',
      extensions: ['zip', 'rar', 'bin', 'etc'],
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
  ];

  return categories.map((cat) => {
    const matching = activeFiles.filter((f) => f.type === cat.type);
    const totalSize = matching.reduce((acc, f) => acc + f.size, 0);
    return {
      ...cat,
      count: matching.length,
      sizeBytes: totalSize,
    };
  });
}
