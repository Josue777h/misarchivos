'use client';

import React from 'react';
import { useFiles } from '../context/FileContext';
import { CheckCircle2, RefreshCw, AlertTriangle, Clock } from 'lucide-react';

export function SyncStatusBadge() {
  const { stats, triggerManualSync } = useFiles();

  if (stats.syncState === 'syncing') {
    return (
      <button
        onClick={triggerManualSync}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer"
        title="Sincronizando cambios..."
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Sincronizando {stats.syncingCount > 0 ? `${stats.syncingCount} archivos...` : '...'}</span>
      </button>
    );
  }

  if (stats.syncState === 'conflict') {
    return (
      <button
        onClick={triggerManualSync}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Conflicto detectado</span>
      </button>
    );
  }

  if (stats.syncState === 'pending') {
    return (
      <button
        onClick={triggerManualSync}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all cursor-pointer"
      >
        <Clock className="w-3.5 h-3.5" />
        <span>{stats.pendingCount} pendientes</span>
      </button>
    );
  }

  return (
    <button
      onClick={triggerManualSync}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-emerald-400 hover:border-zinc-700 transition-all cursor-pointer active:scale-95 shadow-xs"
      title="Clic para sincronizar ahora"
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      <span className="hidden sm:inline">Sincronizado</span>
      <span className="sm:hidden">En línea</span>
    </button>
  );
}
