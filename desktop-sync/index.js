require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const chokidar = require('chokidar');
const mime = require('mime-types');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SYNC_DIR = process.env.SYNC_DIR || 'C:\\MisArchivos';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS || '4000', 10);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\x1b[31m[ERROR]\x1b[0m Falta SUPABASE_URL o SUPABASE_KEY en .env');
  process.exit(1);
}

// Ensure sync dir exists
if (!fs.existsSync(SYNC_DIR)) {
  fs.mkdirSync(SYNC_DIR, { recursive: true });
}

// Ensure local trash folder exists
const TRASH_DIR = path.join(SYNC_DIR, '.papelera');
if (!fs.existsSync(TRASH_DIR)) {
  fs.mkdirSync(TRASH_DIR, { recursive: true });
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Track local in-flight operations to prevent feedback loops
const inFlightDownloads = new Set();
const inFlightUploads = new Set();
const fileHashMap = new Map(); // relativePath -> hash

// Calculate SHA-256 of local file
function getFileSHA256(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch (err) {
    return null;
  }
}

// Classify file type
function classifyFileType(filename) {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) return { type: 'image', ext };
  if (['pdf'].includes(ext)) return { type: 'pdf', ext };
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return { type: 'word', ext };
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return { type: 'excel', ext };
  if (['ppt', 'pptx'].includes(ext)) return { type: 'powerpoint', ext };
  if (['txt', 'md', 'json', 'log', 'xml', 'yaml', 'yml', 'js', 'ts', 'html', 'css'].includes(ext)) return { type: 'text', ext };
  return { type: 'other', ext };
}

// Check if file should be ignored
function isIgnored(filePath) {
  const base = path.basename(filePath);
  if (base.startsWith('~$') || base.startsWith('.tmp') || base.startsWith('.') || base === 'desktop.ini' || base === 'Thumbs.db') {
    return true;
  }
  if (filePath.includes('.papelera') || filePath.includes('node_modules')) {
    return true;
  }
  return false;
}

// Sanitize storage key to prevent S3/Supabase 'Invalid key' errors with accents and special characters
function sanitizeStorageKey(filePath) {
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

// Upload file to Supabase
async function uploadLocalFile(fullPath) {
  if (isIgnored(fullPath)) return;
  const relativePath = path.relative(SYNC_DIR, fullPath).replace(/\\/g, '/');

  if (inFlightDownloads.has(relativePath) || inFlightUploads.has(relativePath)) {
    return;
  }

  // Wait a small delay to ensure file write is finished
  await new Promise((r) => setTimeout(r, 400));
  if (!fs.existsSync(fullPath)) return;

  const currentHash = getFileSHA256(fullPath);
  if (!currentHash) return;

  // Prevent redundant upload if hash hasn't changed
  if (fileHashMap.get(relativePath) === currentHash) {
    return;
  }

  inFlightUploads.add(relativePath);
  console.log(`\x1b[36m[SUBIDA 📤]\x1b[0m Detectado cambio en: ${relativePath}`);

  try {
    const stats = fs.statSync(fullPath);
    const filename = path.basename(fullPath);
    const { type, ext } = classifyFileType(filename);
    const mimeType = mime.lookup(filename) || 'application/octet-stream';
    const fileBuffer = fs.readFileSync(fullPath);

    // 1. Upload to Supabase Storage with clean ASCII-safe key
    const storagePath = sanitizeStorageKey(relativePath);
    const { error: storageError } = await supabase.storage
      .from('misarchivos')
      .upload(storagePath, fileBuffer, {
        upsert: true,
        contentType: mimeType,
      });

    if (storageError) {
      console.error(`\x1b[31m[ERROR STORAGE]\x1b[0m Error al subir ${relativePath} (${storagePath}):`, storageError.message);
    }

    // 2. Check if file record already exists in DB
    const { data: existingRows } = await supabase
      .from('files')
      .select('id')
      .eq('relative_path', relativePath)
      .limit(1);

    const payload = {
      name: filename,
      relative_path: relativePath,
      file_type: type,
      extension: ext,
      size_bytes: stats.size,
      mime_type: mimeType,
      hash_sha256: currentHash,
      storage_path: storagePath,
      sync_status: 'synced',
      is_trash: false,
      deleted_at: null,
      updated_at: new Date().toISOString(),
    };

    let dbError = null;
    if (existingRows && existingRows.length > 0) {
      const { error } = await supabase
        .from('files')
        .update(payload)
        .eq('id', existingRows[0].id);
      dbError = error;
    } else {
      const { error } = await supabase
        .from('files')
        .insert(payload);
      dbError = error;
    }

    if (dbError) {
      console.error(`\x1b[31m[ERROR DB]\x1b[0m Error al guardar metadatos:`, dbError.message);
    } else {
      fileHashMap.set(relativePath, currentHash);
      console.log(`\x1b[32m[SINCRONIZADO ✓]\x1b[0m ${relativePath} sincronizado con la nube.`);
    }
  } catch (err) {
    console.error(`\x1b[31m[ERROR]\x1b[0m Error procesando ${relativePath}:`, err.message);
  } finally {
    setTimeout(() => {
      inFlightUploads.delete(relativePath);
    }, 1000);
  }
}

// Handle local file deletion
async function handleLocalDelete(fullPath) {
  if (isIgnored(fullPath)) return;
  const relativePath = path.relative(SYNC_DIR, fullPath).replace(/\\/g, '/');

  if (inFlightDownloads.has(relativePath)) return;

  console.log(`\x1b[33m[ELIMINACIÓN LOCAL 🗑️]\x1b[0m ${relativePath} eliminado en PC. Moviendo a papelera en la nube...`);
  fileHashMap.delete(relativePath);

  try {
    await supabase
      .from('files')
      .update({
        is_trash: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('relative_path', relativePath);
  } catch (err) {
    console.error(`\x1b[31m[ERROR]\x1b[0m Error al actualizar papelera:`, err.message);
  }
}

// Synchronize changes from remote (Celular / Supabase → PC)
async function syncRemoteChanges() {
  try {
    const { data: remoteFiles, error } = await supabase
      .from('files')
      .select('*');

    if (error || !remoteFiles) return;

    for (const rFile of remoteFiles) {
      const localRelPath = rFile.relative_path.replace(/\//g, path.sep);
      const localFullPath = path.join(SYNC_DIR, localRelPath);

      // Case 1: Remote file is in Trash
      if (rFile.is_trash) {
        if (fs.existsSync(localFullPath)) {
          console.log(`\x1b[33m[PAPELERA REMOTA 🗑️]\x1b[0m Moviendo ${rFile.relative_path} a .papelera local`);
          inFlightDownloads.add(rFile.relative_path);
          try {
            const trashDest = path.join(TRASH_DIR, path.basename(localFullPath));
            fs.renameSync(localFullPath, trashDest);
            fileHashMap.delete(rFile.relative_path);
          } catch (e) {}
          setTimeout(() => inFlightDownloads.delete(rFile.relative_path), 1000);
        }
        continue;
      }

      // Case 2: Active remote file
      const localExists = fs.existsSync(localFullPath);
      const localHash = localExists ? getFileSHA256(localFullPath) : null;

      // If local file is missing or has a different hash
      if (!localExists || localHash !== rFile.hash_sha256) {
        // If file exists and local hash is different from our recorded hash, handle conflict
        if (localExists && fileHashMap.has(rFile.relative_path) && localHash !== fileHashMap.get(rFile.relative_path)) {
          const nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
          const ext = path.extname(localFullPath);
          const baseNoExt = path.basename(localFullPath, ext);
          const conflictPath = path.join(path.dirname(localFullPath), `${baseNoExt} (Conflicto PC ${nowStr})${ext}`);
          
          console.log(`\x1b[35m[CONFLICTO ⚠️]\x1b[0m Archivo modificado en ambos lados. Guardando copia local: ${path.basename(conflictPath)}`);
          fs.copyFileSync(localFullPath, conflictPath);
        }

        // Download the file from Supabase Storage
        inFlightDownloads.add(rFile.relative_path);
        console.log(`\x1b[34m[DESCARGA 📥]\x1b[0m Descargando desde celular/nube: ${rFile.relative_path}`);

        const storagePath = rFile.storage_path || sanitizeStorageKey(rFile.relative_path);
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('misarchivos')
          .download(storagePath);

        if (!downloadError && fileData) {
          const buffer = Buffer.from(await fileData.arrayBuffer());
          fs.mkdirSync(path.dirname(localFullPath), { recursive: true });
          fs.writeFileSync(localFullPath, buffer);
          fileHashMap.set(rFile.relative_path, rFile.hash_sha256);
          console.log(`\x1b[32m[DESCARGADO ✓]\x1b[0m ${rFile.relative_path} listo en PC.`);
        } else if (downloadError) {
          console.error(`\x1b[31m[ERROR DESCARGA]\x1b[0m No se pudo descargar ${rFile.relative_path}:`, downloadError.message);
        }

        setTimeout(() => inFlightDownloads.delete(rFile.relative_path), 1000);
      } else {
        fileHashMap.set(rFile.relative_path, rFile.hash_sha256);
      }
    }
  } catch (err) {
    // Silent catch on network hiccups
  }
}

// Initialize watcher and polling loop
function startSyncDaemon() {
  console.log(`\n========================================================`);
  console.log(`   🚀 MISARCHIVOS - AGENTE DE SINCRONIZACIÓN WINDOWS`);
  console.log(`========================================================`);
  console.log(`📁 Carpeta vigilada : \x1b[32m${SYNC_DIR}\x1b[0m`);
  console.log(`☁️  Servidor nube    : \x1b[34m${SUPABASE_URL}\x1b[0m`);
  console.log(`⚡ Modo             : Bidireccional Automático (PC ⇄ Celular)`);
  console.log(`🛡️  Integridad       : Hashes SHA-256 & Manejo de Conflictos`);
  console.log(`========================================================\n`);

  // 1. Initial sync from remote
  syncRemoteChanges().then(() => {
    console.log(`\x1b[32m[INICIO ✓]\x1b[0m Sincronización inicial completada. Vigilando cambios...\n`);
  });

  // 2. Chokidar local folder watcher
  const watcher = chokidar.watch(SYNC_DIR, {
    ignored: /(^|[\/\\])\..|~\$|\.tmp/,
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  watcher
    .on('add', (file) => uploadLocalFile(file))
    .on('change', (file) => uploadLocalFile(file))
    .on('unlink', (file) => handleLocalDelete(file))
    .on('error', (err) => console.error('\x1b[31m[ERROR WATCHER]\x1b[0m', err));

  // 3. Periodic remote sync loop
  setInterval(syncRemoteChanges, POLL_INTERVAL);
}

startSyncDaemon();
