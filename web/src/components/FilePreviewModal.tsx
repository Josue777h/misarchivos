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
  sanitizeStorageKey,
} from '../lib/file-helpers';
import { supabase } from '../lib/supabase';
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
  FileSpreadsheet,
  AlertCircle,
  Presentation,
} from 'lucide-react';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

/** Robust download from Supabase Storage using the SDK (avoids CORS on direct fetch) */
async function downloadFromSupabase(
  userId: string | undefined,
  relativePath: string,
  downloadUrl?: string
): Promise<ArrayBuffer | null> {
  if (supabase) {
    try {
      const cleanKey = sanitizeStorageKey(relativePath);
      const candidates = [
        userId ? `${userId}/${cleanKey}` : cleanKey,
        cleanKey,
        cleanKey.split('/').pop() || cleanKey,
      ];
      for (const storagePath of candidates) {
        const { data, error } = await supabase.storage.from('misarchivos').download(storagePath);
        if (!error && data) {
          return await data.arrayBuffer();
        }
      }
    } catch (err) {
      console.warn('Supabase storage download warning:', err);
    }
  }

  // Fallback: direct URL fetch if available
  if (downloadUrl) {
    try {
      const res = await fetch(downloadUrl);
      if (res.ok) {
        return await res.arrayBuffer();
      }
    } catch (err) {
      console.warn('Direct URL fetch fallback failed:', err);
    }
  }

  return null;
}

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
  const [wordParagraphs, setWordParagraphs] = useState<string[]>([]);
  const [pptSlides, setPptSlides] = useState<{ slideNumber: number; title: string; lines: string[] }[]>([]);
  const docxContainerRef = useRef<HTMLDivElement>(null);

  const ext = previewFile?.extension.toLowerCase() || '';
  const isImage = previewFile ? isImageFile(previewFile.name, previewFile.mimeType) : false;
  const isDocx = ['docx', 'doc', 'odt', 'rtf'].includes(ext) || previewFile?.type === 'word';
  const isExcel = ['xlsx', 'xls', 'csv', 'ods'].includes(ext) || previewFile?.type === 'excel';
  const isPpt = ['pptx', 'ppt', 'odp'].includes(ext) || previewFile?.type === 'powerpoint';
  const isPdf = previewFile?.type === 'pdf';
  const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext);
  const isVideo = ['mp4', 'webm', 'mov', 'mkv'].includes(ext);
  // Strictly code/text files, explicitly never office documents
  const isTextOrCode =
    previewFile && !isDocx && !isExcel && !isPpt && !isPdf && !isImage && !isAudio && !isVideo
      ? isTextOrCodeFile(previewFile.name, previewFile.mimeType)
      : false;

  // Fetch text/code file content
  useEffect(() => {
    if (!previewFile || !isTextOrCode) {
      setTextContent(null);
      setImageError(false);
      return;
    }

    setImageError(false);
    setLoadingText(true);

    downloadFromSupabase(previewFile.userId, previewFile.relativePath || previewFile.name, previewFile.downloadUrl)
      .then((buffer) => {
        if (!buffer) throw new Error('No buffer');
        const decoder = new TextDecoder('utf-8');
        setTextContent(decoder.decode(buffer));
      })
      .catch(() => {
        const url = previewFile.downloadUrl || previewFile.thumbnailUrl;
        if (!url) {
          setTextContent(null);
          return;
        }
        fetch(url)
          .then((r) => (r.ok ? r.text() : Promise.reject()))
          .then((t) => setTextContent(t))
          .catch(() => setTextContent(null));
      })
      .finally(() => {
        setLoadingText(false);
      });
  }, [previewFile, isTextOrCode]);

  // Fetch and render Word / Excel / PowerPoint documents
  useEffect(() => {
    if (!previewFile || (!isDocx && !isExcel && !isPpt)) {
      setExcelSheets([]);
      setWordParagraphs([]);
      setPptSlides([]);
      setOfficeError(null);
      setOfficeLoading(false);
      return;
    }

    let isCancelled = false;

    async function loadOfficeDocument() {
      if (!previewFile) return;

      setOfficeLoading(true);
      setOfficeError(null);
      setExcelSheets([]);
      setWordParagraphs([]);
      setPptSlides([]);

      const arrayBuffer = await downloadFromSupabase(
        previewFile.userId,
        previewFile.relativePath || previewFile.name,
        previewFile.downloadUrl || previewFile.thumbnailUrl
      );

      if (isCancelled) return;

      if (!arrayBuffer) {
        setOfficeError('No se pudo descargar el archivo para previsualización.');
        setOfficeLoading(false);
        return;
      }

      // 1. Word Document (.docx, .doc)
      if (isDocx) {
        let renderedWithDocxPreview = false;

        // Try docx-preview with full options
        if (docxContainerRef.current) {
          try {
            docxContainerRef.current.innerHTML = '';
            await renderAsync(arrayBuffer, docxContainerRef.current, undefined, {
              className: 'docx',
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
              renderHeaders: true,
              renderFooters: true,
              renderFootnotes: true,
              renderEndnotes: true,
              breakPages: true,
              useBase64URL: true,
              experimental: true,
            });

            if (docxContainerRef.current.innerHTML.trim().length > 60) {
              renderedWithDocxPreview = true;
            }
          } catch (docxErr) {
            console.warn('docx-preview failed, attempting comprehensive XML extraction:', docxErr);
          }
        }

        if (isCancelled) return;

        // Fallback: extract 100% of all paragraphs and tables directly from word/document.xml
        if (!renderedWithDocxPreview) {
          try {
            const zip = await JSZip.loadAsync(arrayBuffer);
            const docXml = zip.file('word/document.xml');
            if (docXml) {
              const xml = await docXml.async('text');
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(xml, 'application/xml');

              // Query all paragraphs using wildcard namespace to catch every single paragraph and table cell
              const paragraphs = Array.from(xmlDoc.getElementsByTagNameNS('*', 'p'));
              const allLines: string[] = [];

              paragraphs.forEach((p) => {
                const textNodes = Array.from(p.getElementsByTagNameNS('*', 't')).map((t) => t.textContent || '');
                const line = textNodes.join('').trim();
                if (line.length > 0) {
                  allLines.push(line);
                }
              });

              if (allLines.length > 0) {
                setWordParagraphs(allLines);
                setOfficeLoading(false);
                return;
              }
            }
          } catch (zipErr) {
            console.warn('JSZip Word extraction error:', zipErr);
          }

          if (!renderedWithDocxPreview) {
            setOfficeError('No se pudo renderizar la vista previa del documento Word.');
          }
        }

        setOfficeLoading(false);
        return;
      }

      // 2. Excel Spreadsheet (.xlsx, .xls, .csv)
      if (isExcel) {
        try {
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheets = workbook.SheetNames.map((name) => {
            const worksheet = workbook.Sheets[name];
            const html = XLSX.utils.sheet_to_html(worksheet, {
              id: `excel-sheet-${name}`,
              editable: false,
            });
            return { name, html };
          });
          if (sheets.length > 0) {
            setExcelSheets(sheets);
            setActiveSheetIndex(0);
          } else {
            setOfficeError('No se encontraron tablas de datos en esta hoja de cálculo.');
          }
        } catch (err) {
          console.error('Excel rendering error:', err);
          setOfficeError('No se pudo generar la vista previa de las hojas de Excel.');
        } finally {
          setOfficeLoading(false);
        }
        return;
      }

      // 3. PowerPoint Presentation (.pptx)
      if (isPpt) {
        try {
          const zip = await JSZip.loadAsync(arrayBuffer);
          const slideEntries = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f));
          slideEntries.sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)![0], 10);
            const numB = parseInt(b.match(/\d+/)![0], 10);
            return numA - numB;
          });

          const parser = new DOMParser();
          const parsedSlides: { slideNumber: number; title: string; lines: string[] }[] = [];

          for (let i = 0; i < slideEntries.length; i++) {
            const xml = await zip.files[slideEntries[i]].async('text');
            const xmlDoc = parser.parseFromString(xml, 'application/xml');
            const paragraphs = Array.from(xmlDoc.getElementsByTagNameNS('*', 'p'));
            const textLines = paragraphs
              .map((p) => {
                const texts = Array.from(p.getElementsByTagNameNS('*', 't'));
                return texts.map((t) => t.textContent || '').join('');
              })
              .filter((l) => l.trim().length > 0);

            const title = textLines[0] || `Diapositiva ${i + 1}`;
            const lines = textLines.length > 1 ? textLines.slice(1) : [];
            parsedSlides.push({ slideNumber: i + 1, title, lines });
          }

          if (parsedSlides.length > 0) {
            setPptSlides(parsedSlides);
          } else {
            setOfficeError('No se encontraron textos en las diapositivas de la presentación.');
          }
        } catch (err) {
          console.error('PowerPoint parse error:', err);
          setOfficeError('No se pudo generar la vista previa de la presentación PowerPoint.');
        } finally {
          setOfficeLoading(false);
        }
      }
    }

    loadOfficeDocument();

    return () => {
      isCancelled = true;
    };
  }, [previewFile, isDocx, isExcel, isPpt, ext]);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-150"
    >
      <div
        className="relative w-full max-w-5xl bg-zinc-950 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden border-0 sm:border sm:border-zinc-800 flex flex-col h-full sm:h-[92vh] max-h-full sm:max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-zinc-800/80 bg-zinc-900/80 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
            <FileIconBadge type={previewFile.type} className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" iconClassName="w-4 h-4 sm:w-5 sm:h-5" />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-white truncate text-xs sm:text-base max-w-[200px] sm:max-w-md" title={previewFile.name}>
                {previewFile.name}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate mt-0.5 font-mono">
                {formatFileSize(previewFile.size)} • {formatDate(previewFile.updatedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setInfoFile(previewFile)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Ver detalles"
              aria-label="Detalles"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenExternal}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Abrir en pestaña nueva"
              aria-label="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewFile(null)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-format In-App Content Viewer Body (Full scrollable height without clipping) */}
        <div className="flex-1 overflow-y-auto flex flex-col bg-zinc-950 min-h-0 relative">
          {/* 1. Image Viewer (High Fidelity) */}
          {isImage && (previewFile.downloadUrl || previewFile.thumbnailUrl) && !imageError ? (
            <div className="flex-1 flex items-center justify-center p-4 bg-black">
              <img
                src={previewFile.downloadUrl || previewFile.thumbnailUrl}
                alt={previewFile.name}
                onError={() => setImageError(true)}
                className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              />
            </div>
          ) : /* 2. In-App Word Document Viewer (.docx, .doc) */
          isDocx ? (
            <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
              {/* Document Toolbar */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-zinc-900 border-b border-zinc-800 text-xs shrink-0">
                <span className="font-semibold text-zinc-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Documento Word (.docx)</span>
                  {wordParagraphs.length > 0 && (
                    <span className="text-zinc-500 font-normal">
                      ({wordParagraphs.length} párrafos)
                    </span>
                  )}
                </span>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors text-xs font-bold cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Word</span>
                </button>
              </div>

              {/* Document Content Scroll Area */}
              <div className="flex-1 overflow-y-auto relative min-h-0 bg-[#141416]">
                {officeLoading && (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    <span className="text-sm font-medium">Cargando páginas del documento...</span>
                  </div>
                )}

                {officeError && wordParagraphs.length === 0 && !officeLoading && (
                  <div className="p-12 text-center text-zinc-400 space-y-3">
                    <AlertCircle className="w-9 h-9 text-rose-400 mx-auto" />
                    <p className="text-sm">{officeError}</p>
                    <button
                      onClick={handleDownload}
                      className="px-5 py-2.5 bg-zinc-800 text-white rounded-xl text-xs font-semibold hover:bg-zinc-700 cursor-pointer"
                    >
                      Descargar archivo para abrir en Word
                    </button>
                  </div>
                )}

                {/* docx-preview container: ALWAYS mounted in DOM so ref is permanently valid */}
                <div
                  ref={docxContainerRef}
                  className={`w-full min-h-full ${
                    officeLoading || wordParagraphs.length > 0 || (officeError && wordParagraphs.length === 0)
                      ? 'hidden'
                      : 'block'
                  }`}
                />

                {/* Comprehensive Fallback: full document rendered with 100% extracted paragraphs */}
                {wordParagraphs.length > 0 && !officeLoading && (
                  <div className="w-full bg-[#141416] p-4 sm:p-10 flex justify-center min-h-full">
                    <div className="w-full max-w-4xl bg-white text-zinc-900 p-8 sm:p-14 rounded-lg shadow-2xl space-y-4 font-sans text-sm sm:text-base leading-relaxed select-text border border-zinc-200">
                      <div className="border-b border-zinc-200 pb-3 mb-6">
                        <h2 className="text-lg sm:text-xl font-bold text-zinc-900">{previewFile.name}</h2>
                      </div>
                      {wordParagraphs.map((paragraph, idx) => (
                        <p key={idx} className="text-zinc-800 leading-relaxed text-justify">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : /* 3. In-App Excel Sheet Viewer (.xlsx, .xls, .csv) */
          isExcel ? (
            <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
              <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-zinc-900 border-b border-zinc-800 text-xs gap-2 flex-wrap shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    Hoja de Cálculo
                  </span>
                </div>
                {/* Sheet Tabs */}
                {excelSheets.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto max-w-md py-0.5">
                    {excelSheets.map((sheet, index) => (
                      <button
                        key={sheet.name}
                        onClick={() => setActiveSheetIndex(index)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          activeSheetIndex === index
                            ? 'bg-emerald-600 text-white shadow-xs font-bold'
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
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors text-xs font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto bg-zinc-950 p-2 sm:p-4 min-h-0">
                {officeLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                    <span className="text-sm font-medium">Generando tablas de la hoja de cálculo...</span>
                  </div>
                ) : officeError ? (
                  <div className="p-12 text-center text-zinc-400 space-y-3">
                    <AlertCircle className="w-9 h-9 text-rose-400 mx-auto" />
                    <p className="text-sm">{officeError}</p>
                    <button
                      onClick={handleDownload}
                      className="px-5 py-2.5 bg-zinc-800 text-white rounded-xl text-xs font-semibold hover:bg-zinc-700 cursor-pointer"
                    >
                      Descargar archivo para abrir en Excel
                    </button>
                  </div>
                ) : excelSheets.length > 0 && excelSheets[activeSheetIndex] ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: excelSheets[activeSheetIndex].html }}
                    className="excel-table-container overflow-auto w-full"
                  />
                ) : (
                  <div className="p-12 text-center text-zinc-500">
                    <p>No se encontraron datos tabulares en este archivo.</p>
                  </div>
                )}
              </div>
            </div>
          ) : /* 4. In-App PowerPoint Slide Viewer (.pptx) */
          isPpt ? (
            <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
              <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-zinc-900 border-b border-zinc-800 text-xs shrink-0">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Presentation className="w-4 h-4 text-amber-400" />
                  Presentación PowerPoint (.pptx)
                </span>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors text-xs font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950 min-h-0">
                {officeLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    <span className="text-sm font-medium">Extrayendo diapositivas de la presentación...</span>
                  </div>
                ) : officeError ? (
                  <div className="p-12 text-center text-zinc-400 space-y-3">
                    <AlertCircle className="w-9 h-9 text-rose-400 mx-auto" />
                    <p className="text-sm">{officeError}</p>
                    <button
                      onClick={handleDownload}
                      className="px-5 py-2.5 bg-zinc-800 text-white rounded-xl text-xs font-semibold hover:bg-zinc-700 cursor-pointer"
                    >
                      Descargar archivo para abrir en PowerPoint
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                    {pptSlides.map((slide) => (
                      <div
                        key={slide.slideNumber}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[180px]"
                      >
                        <div>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-bold">
                            Diapositiva {slide.slideNumber}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-2 mb-2">{slide.title}</h4>
                          {slide.lines.length > 0 && (
                            <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside mt-2">
                              {slide.lines.slice(0, 8).map((line, lIdx) => (
                                <li key={lIdx} className="leading-relaxed">
                                  {line}
                                </li>
                              ))}
                              {slide.lines.length > 8 && (
                                <li className="text-zinc-500 italic">+{slide.lines.length - 8} puntos más...</li>
                              )}
                            </ul>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : /* 5. Native In-App PDF Reader */
          isPdf && previewFile.downloadUrl ? (
            <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
              <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-zinc-900 border-b border-zinc-800 text-xs shrink-0">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  Visor de PDF Integrado
                </span>
                <button
                  onClick={handleOpenExternal}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Pantalla completa</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <iframe
                src={`${previewFile.downloadUrl}#toolbar=1&navpanes=0`}
                className="w-full flex-1 border-0 min-h-0"
                title={previewFile.name}
              />
            </div>
          ) : /* 6. In-App Video Player */
          isVideo && previewFile.downloadUrl ? (
            <div className="flex-1 flex items-center justify-center p-4 bg-black">
              <video
                controls
                autoPlay={false}
                src={previewFile.downloadUrl}
                className="max-h-[75vh] max-w-full rounded-2xl shadow-lg border border-zinc-800"
              />
            </div>
          ) : /* 7. In-App Audio Player */
          isAudio && previewFile.downloadUrl ? (
            <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950">
              <div className="text-center p-8 max-w-md w-full space-y-4 bg-zinc-900/60 rounded-3xl border border-zinc-800">
                <FileIconBadge type="other" className="w-16 h-16 mx-auto shadow-md" iconClassName="w-8 h-8" />
                <h4 className="font-bold text-white text-base truncate">{previewFile.name}</h4>
                <audio controls src={previewFile.downloadUrl} className="w-full mt-2" />
              </div>
            </div>
          ) : /* 8. In-App Text / Code Viewer */
          isTextOrCode ? (
            <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
              <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs shrink-0">
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

              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed select-text text-zinc-300 min-h-0">
                {loadingText ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                    <span>Leyendo contenido del archivo...</span>
                  </div>
                ) : textContent !== null ? (
                  <div className="flex gap-4">
                    <div className="select-none text-zinc-600 text-right font-mono pr-2 border-r border-zinc-850">
                      {lines.map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
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
          ) : (
            /* 9. Other Binary / Generic Files */
            <div className="flex-1 flex items-center justify-center p-6 bg-zinc-950">
              <div className="w-full max-w-lg bg-zinc-900/80 rounded-2xl border border-zinc-800 p-6 space-y-4 shadow-xl text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center shadow-md">
                  <FileIconBadge type={previewFile.type} className="w-14 h-14" iconClassName="w-7 h-7" />
                </div>

                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[11px] font-semibold uppercase mb-1">
                    {`Archivo ${previewFile.extension.toUpperCase() || 'Binario'}`}
                  </span>
                  <h4 className="font-bold text-white text-base truncate px-2" title={previewFile.name}>
                    {previewFile.name}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                    {previewFile.relativePath || previewFile.name}
                  </p>
                </div>

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
                  Este archivo se encuentra seguro en tu almacenamiento. Puedes descargarlo para abrirlo en tu dispositivo.
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
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 border-t border-zinc-800/80 bg-zinc-900/80 shrink-0 gap-2 pb-safe">
          <div className="text-xs text-zinc-400 truncate max-w-[120px] sm:max-w-xs font-mono hidden sm:block">
            {previewFile.relativePath || previewFile.name}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                moveToTrash(previewFile.id);
                setPreviewFile(null);
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-900/60 transition-all active:scale-95 cursor-pointer"
              title="Mover a papelera"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">Eliminar</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-white transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 shadow-sm transition-all active:scale-95 cursor-pointer"
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
