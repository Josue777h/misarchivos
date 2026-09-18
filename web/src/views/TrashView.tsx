import React, { useState, useMemo } from 'react';
import { useFiles } from '../context/FileContext';
import { formatFileSize, formatDate } from '../lib/file-helpers';
import { FileIconBadge } from '../components/FileIconBadge';
import { Trash2, RotateCcw, ShieldCheck, CheckCheck, CheckSquare } from 'lucide-react';

export function TrashView() {
  const {
    files,
    restoreFromTrash,
    deletePermanently,
    emptyTrash,
    restoreMultipleFiles,
    deleteMultipleFiles,
  } = useFiles();
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const trashFiles = useMemo(() => files.filter((f) => f.isTrash), [files]);

  const isAllSelected = trashFiles.length > 0 && trashFiles.every((f) => selectedIds.has(f.id));
  const selectedCount = selectedIds.size;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(trashFiles.map((f) => f.id)));
    }
  };

  const handleBatchRestore = async () => {
    const ids = Array.from(selectedIds);
    await restoreMultipleFiles(ids);
    setSelectedIds(new Set());
  };

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds);
    await deleteMultipleFiles(ids);
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4 max-w-4xl animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-500" />
            <span>Papelera</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {trashFiles.length} {trashFiles.length === 1 ? 'elemento' : 'elementos'} en la papelera
          </p>
        </div>

        {trashFiles.length > 0 && (
          <div className="flex items-center gap-2">
            {confirmEmpty ? (
              <div className="flex items-center gap-2 animate-in fade-in duration-100">
                <span className="text-xs text-rose-400 font-semibold">¿Vaciar toda la papelera?</span>
                <button
                  onClick={() => { emptyTrash(); setConfirmEmpty(false); setSelectedIds(new Set()); }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Sí, vaciar
                </button>
                <button
                  onClick={() => setConfirmEmpty(false)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmEmpty(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 border border-rose-900/60 transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar papelera</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Safety Notice */}
      <div className="p-3 bg-zinc-950 border border-zinc-800/60 rounded-2xl flex items-center gap-3 text-xs text-zinc-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Los archivos eliminados se conservan aquí. Puedes restaurarlos en cualquier momento.</span>
      </div>

      {/* Batch action bar */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-700/60 rounded-2xl animate-in slide-in-from-bottom-2 duration-150">
          <span className="text-xs font-semibold text-white">
            {selectedCount} {selectedCount === 1 ? 'elemento seleccionado' : 'elementos seleccionados'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchRestore}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar</span>
            </button>
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar definitivamente</span>
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Trash list */}
      {trashFiles.length === 0 ? (
        <div className="p-14 text-center bg-zinc-950 rounded-2xl border border-dashed border-zinc-800">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-600">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">La papelera está vacía</h3>
          <p className="text-xs text-zinc-500 mt-1">No hay archivos eliminados.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {/* Select all header */}
          <div className="flex items-center gap-3 px-1 pb-1">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {isAllSelected ? (
                <CheckCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <CheckSquare className="w-4 h-4" />
              )}
              <span>{isAllSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}</span>
            </button>
          </div>

          {trashFiles.map((file) => {
            const isSelected = selectedIds.has(file.id);
            return (
              <div
                key={file.id}
                onClick={() => toggleSelect(file.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-zinc-900 border-zinc-600'
                    : 'bg-zinc-950 border-zinc-800/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-zinc-700 bg-zinc-900'
                    }`}
                  />

                  <FileIconBadge
                    type={file.type}
                    className="w-8 h-8 shrink-0 opacity-60"
                    iconClassName="w-4 h-4"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-zinc-400 line-through truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-600 mt-0.5">
                      <span className="truncate max-w-[120px] font-mono">{file.relativePath || file.name}</span>
                      <span>·</span>
                      <span>{formatFileSize(file.size)}</span>
                      {file.deletedAt && (
                        <>
                          <span>·</span>
                          <span>{formatDate(file.deletedAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Per-item quick actions */}
                <div
                  className="flex items-center gap-1.5 shrink-0 ml-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => restoreFromTrash(file.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 transition-all active:scale-95 cursor-pointer"
                    title="Restaurar"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Restaurar</span>
                  </button>
                  <button
                    onClick={() => deletePermanently(file.id)}
                    className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Eliminar definitivamente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
