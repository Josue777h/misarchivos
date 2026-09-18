import React, { useState, useEffect, useRef } from 'react';
import { useFiles } from '../context/FileContext';
import {
  formatFileSize,
  formatDate,
  safeShareFile,
  downloadBlobOrUrl,
  isImageFile,
  isTextOrCodeFile,
  safeCopyText,
} from '../lib/file-helpers';
import { FileIconBadge } from './FileIconBadge';
import {
  X,
  Download,
  Share2,
  Info,
  ExternalLink,
  Trash2,
  FileText,
  Loader2,
  Copy,
  Check,
  FileCode,
  HardDrive,
  Calendar,
  FolderTree,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';

export function FilePreviewModal() {
  const { previewFile, setPreviewFile, setInfoFile, moveToTrash } = useFiles();
  const [imageError, setImageError] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Office document preview state
  const [officeLoading, setOfficeLoading] = useState(false);
  const [officeError, setOfficeError] = useState<string | null>(null);
  const [excelSheets, setExcelSheets] = useState<{ name: string; html: string }[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const docxContainerRef = useRef<HTMLDivElement>(null);

  const ext = previewFile?.extension.toLowerCase() || '';
  const isImage = previewFile ? isImageFile(previewFile.name, previewFile.mimeType) : false;
  const isTextOrCode = previewFile ? isTextOrCodeFile(previewFile.name, previewFile.mimeType) : false;
  const isPdf = previewFile?.type === 'pdf';
  const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext);
  const isVideo = ['mp4', 'webm', 'mov', 'mkv'].includes(ext);
  const isDocx = ext === 'docx';
  const isExcel = ['xlsx', 'xls', 'csv'].includes(ext) || previewFile?.type === 'excel';

  // Fetch text/code file content directly for instant in-app inspection
  useEffect(() => {
    if (!previewFile) {
      setTextContent(null);
      setImageError(false);
      return;
    }

    setImageError(false);
    const contentUrl = previewFile.downloadUrl || previewFile.thumbnailUrl;

    if (isTextOrCode && contentUrl) {
      setLoadingText(true);
      fetch(contentUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Fetch failed');
          return res.text();
        })
        .then((txt) => {
          setTextContent(txt);
        })
        .catch(() => {
          setTextContent(null);
        })
        .finally(() => {
          setLoadingText(false);
        });
    } else {
      setTextContent(null);
      setLoadingText(false);
    }
  }, [previewFile, isTextOrCode]);

  // Fetch and render Word / Excel documents
  useEffect(() => {
    if (!previewFile) {
      setExcelSheets([]);
      setOfficeError(null);
      setOfficeLoading(false);
      return;
    }

    const contentUrl = previewFile.downloadUrl || previewFile.thumbnailUrl;
    if (!contentUrl) {
      setOfficeLoading(false);
      return;
    }

    if (isDocx) {
      setOfficeLoading(true);
      setOfficeError(null);
      fetch(contentUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Error al descargar el archivo Word');
          return res.arrayBuffer();
        })
        .then(async (arrayBuffer) => {
          if (docxContainerRef.current) {
            docxContainerRef.current.innerHTML = '';
            await renderAsync(arrayBuffer, docxContainerRef.current, undefined, {
              className: 'docx',
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
              experimental: true,
            });
          }
        })
        .catch((err) => {
          console.error('Word rendering error:', err);
          setOfficeError('No se pudo renderizar la vista previa del documento Word.');
        })
        .finally(() => {
          setOfficeLoading(false);
        });
    } else if (isExcel) {
      setOfficeLoading(true);
      setOfficeError(null);
      fetch(contentUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Error al descargar la hoja de cálculo');
          return res.arrayBuffer();
        })
        .then((arrayBuffer) => {
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheets = workbook.SheetNames.map((name) => {
            const worksheet = workbook.Sheets[name];
            const html = XLSX.utils.sheet_to_html(worksheet, {
              id: `excel-sheet-${name}`,
              editable: false,
            });
            return { name, html };
          });
          setExcelSheets(sheets);
          setActiveSheetIndex(0);
        })
        .catch((err) => {
          console.error('Excel rendering error:', err);
          setOfficeError('No se pudo generar la vista previa de las hojas de Excel.');
        })
        .finally(() => {
          setOfficeLoading(false);
        });
    } else {
      setExcelSheets([]);
      setOfficeError(null);
      setOfficeLoading(false);
    }
  }, [previewFile, isDocx, isExcel]);

  if (!previewFile) return null;

  const handleShare = async () => {
    await safeShareFile({ name: previewFile.name, downloadUrl: previewFile.downloadUrl });
  };

  const handleDownload = () => {
    const url = previewFile.downloadUrl || previewFile.thumbnailUrl;
    if (url) {
      downloadBlobOrUrl(url, previewFile.name);
    }
  };

  const handleCopyCode = async () => {
    if (textContent) {
      const ok = await safeCopyText(textContent);
      if (ok) {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    }
  };

  const handleOpenExternal = () => {
    const url = previewFile.downloadUrl || previewFile.thumbnailUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const lines = textContent !== null ? textContent.split('\n') : [];

  return (
    <div
      onClick={() => setPreviewFile(null)}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150"
    >
      <div
        className="relative w-full max-w-4xl bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden border border-zinc-800 flex flex-col max-h-[94vh] h-full sm:h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <FileIconBadge type={previewFile.type} className="w-10 h-10 shrink-0" iconClassName="w-5 h-5" />
            <div className="min-w-0">
              <h3 className="font-bold text-white truncate text-sm sm:text-base" title={previewFile.name}>
                {previewFile.name}
              </h3>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-mono">
                {formatFileSize(previewFile.size)} • {formatDate(previewFile.updatedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setInfoFile(previewFile)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Ver detalles"
              aria-label="Detalles"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenExternal}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Abrir en pestaña nueva"
              aria-label="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewFile(null)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-format In-App Content Viewer Body */}
        <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-black min-h-[340px] max-h-[70vh]">
          {/* 1. Image Viewer (High Fidelity) */}
          {isImage && (previewFile.downloadUrl || previewFile.thumbnailUrl) && !imageError ? (
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              <img
                src={previewFile.downloadUrl || previewFile.thumbnailUrl}
                alt={previewFile.name}
                onError={() => setImageError(true)}
                className="max-h-[62vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              />
            </div>
          ) : /* 2. In-App Text / Code Viewer (HTML, CSS, JS, TS, Python, JSON, TXT, TLS, configs, etc.) */
          isTextOrCode ? (
            <div className="w-full h-full min-h-[50vh] flex flex-col rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950">
              {/* Code Viewer Subheader */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-cyan-400 font-mono font-bold text-[11px] uppercase">
                    {previewFile.extension || 'TEXTO'}
                  </span>
                  {textContent !== null && (
                    <span className="text-zinc-400 font-mono text-[11px]">
                      {lines.length} líneas • {formatFileSize(previewFile.size)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    disabled={!textContent}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors text-xs font-bold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar</span>
                  </button>
                </div>
              </div>

              {/* Code / Text Body */}
              <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed select-text text-zinc-300">
                {loadingText ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3 text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                    <span>Leyendo contenido del archivo...</span>
                  </div>
                ) : textContent !== null ? (
                  <div className="flex gap-4">
                    {/* Line numbers */}
                    <div className="select-none text-zinc-600 text-right font-mono pr-2 border-r border-zinc-850">
                      {lines.map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
                    {/* Text / Code Content */}
                    <pre className="flex-1 whitespace-pre overflow-x-auto font-mono text-zinc-200">
                      {textContent}
                    </pre>
                  </div>
                ) : (
                  <div className="p-8 text-center text-zinc-500 space-y-3">
                    <p>No se pudo cargar la vista previa directa de texto.</p>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-xs font-semibold hover:bg-zinc-700"
                    >
                      Descargar archivo para ver
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : /* 3. Native In-App PDF Reader */
          isPdf && previewFile.downloadUrl ? (
            <div className="w-full h-full min-h-[55vh] flex flex-col rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  Visor de PDF Integrado
                </span>
                <button
                  onClick={handleOpenExternal}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 hover:underline"
                >
                  <span>Pantalla completa</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <iframe
                src={`${previewFile.downloadUrl}#toolbar=1&navpanes=0`}
                className="w-full flex-1 min-h-[50vh] border-0"
                title={previewFile.name}
              />
            </div>
          ) : /* 4. In-App Video Player */
          isVideo && previewFile.downloadUrl ? (
            <div className="max-w-full max-h-full flex items-center justify-center">
              <video
                controls
                autoPlay={false}
                src={previewFile.downloadUrl}
                className="max-h-[58vh] max-w-full rounded-2xl shadow-lg border border-zinc-800"
              />
            </div>
          ) : /* 5. In-App Audio Player */
          isAudio && previewFile.downloadUrl ? (
            <div className="text-center p-8 max-w-md w-full space-y-4 bg-zinc-900/60 rounded-3xl border border-zinc-800">
              <FileIconBadge type="other" className="w-16 h-16 mx-auto shadow-md" iconClassName="w-8 h-8" />
              <h4 className="font-bold text-white text-base truncate">{previewFile.name}</h4>
              <audio controls src={previewFile.downloadUrl} className="w-full mt-2" />
            </div>
          ) : isDocx ? (
            /* 6. In-App Word Document Viewer (.docx) */
            <div className="w-full h-full min-h-[60vh] flex flex-col rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Visor de Word Integrado (.docx)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors text-xs font-bold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-zinc-950/80">
                {officeLoading ? (
                  <div className="flex flex-col items-center justify-center h-56 gap-3 text-zinc-400">
                    <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
                    <span>Renderizando páginas del documento Word...</span>
                  </div>
                ) : officeError ? (
                  <div className="p-8 text-center text-zinc-400 space-y-3">
                    <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                    <p>{officeError}</p>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-xs font-semibold hover:bg-zinc-700"
                    >
                      Descargar archivo para abrir en Office
                    </button>
                  </div>
                ) : (
                  <div ref={docxContainerRef} className="max-w-4xl mx-auto" />
                )}
              </div>
            </div>
          ) : isExcel ? (
            /* 7. In-App Excel Sheet Viewer (.xlsx, .xls, .csv) */
            <div className="w-full h-full min-h-[60vh] flex flex-col rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    Visor de Hojas de Cálculo
                  </span>
                </div>
                {/* Sheet Tabs */}
                {excelSheets.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto max-w-sm py-0.5">
                    {excelSheets.map((sheet, index) => (
                      <button
                        key={sheet.name}
                        onClick={() => setActiveSheetIndex(index)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          activeSheetIndex === index
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                        }`}
                      >
                        {sheet.name}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors text-xs font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-zinc-950">
                {officeLoading ? (
                  <div className="flex flex-col items-center justify-center h-56 gap-3 text-zinc-400">
                    <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
                    <span>Generando tablas de la hoja de cálculo...</span>
                  </div>
                ) : officeError ? (
                  <div className="p-8 text-center text-zinc-400 space-y-3">
                    <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                    <p>{officeError}</p>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-xs font-semibold hover:bg-zinc-700"
                    >
                      Descargar archivo para abrir en Excel
                    </button>
                  </div>
                ) : excelSheets.length > 0 && excelSheets[activeSheetIndex] ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: excelSheets[activeSheetIndex].html }}
                    className="excel-table-container p-4 overflow-auto max-h-[58vh]"
                  />
                ) : (
                  <div className="p-8 text-center text-zinc-500">
                    <p>No se encontraron datos tabulares en este archivo.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 6. In-App Document Inspection & 1-Click Download Panel (Word, Excel, PowerPoint, Zip, etc. - NO external Google Drive!) */
            <div className="w-full max-w-lg bg-zinc-900/80 rounded-2xl border border-zinc-800 p-6 space-y-4 shadow-xl text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center shadow-md">
                <FileIconBadge
                  type={previewFile.type}
                  className="w-14 h-14"
                  iconClassName="w-7 h-7"
                />
              </div>

              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[11px] font-semibold uppercase mb-1">
                  {previewFile.type === 'word'
                    ? 'Documento Word'
                    : previewFile.type === 'excel'
                    ? 'Hoja de Cálculo Excel'
                    : previewFile.type === 'powerpoint'
                    ? 'Presentación PowerPoint'
                    : `Archivo ${previewFile.extension.toUpperCase() || 'Binario'}`}
                </span>
                <h4 className="font-bold text-white text-base truncate px-2" title={previewFile.name}>
                  {previewFile.name}
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  {previewFile.relativePath || previewFile.name}
                </p>
              </div>

              {/* Specification Grid */}
              <div className="grid grid-cols-2 gap-2 text-left bg-zinc-950/70 p-3 rounded-xl border border-zinc-850 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Tamaño</span>
                  <span className="font-mono text-zinc-200 font-bold">{formatFileSize(previewFile.size)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Modificado</span>
                  <span className="text-zinc-200">{formatDate(previewFile.updatedAt)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Formato</span>
                  <span className="font-mono text-zinc-200">.{previewFile.extension || 'bin'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Tipo MIME</span>
                  <span className="font-mono text-zinc-200 truncate block" title={previewFile.mimeType}>
                    {previewFile.mimeType}
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Este archivo se encuentra seguro en tu almacenamiento. Puedes verificar sus especificaciones y descargarlo para abrirlo directamente en tu aplicación local.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  onClick={handleDownload}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-zinc-200 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar archivo ({formatFileSize(previewFile.size)})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-t border-zinc-800/80 bg-zinc-900/80 flex-wrap gap-2">
          <div className="text-xs text-zinc-400 truncate max-w-[140px] sm:max-w-xs font-mono">
            {previewFile.relativePath || previewFile.name}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                moveToTrash(previewFile.id);
                setPreviewFile(null);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-900/60 transition-all active:scale-95 cursor-pointer"
              title="Mover a papelera"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-white transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
