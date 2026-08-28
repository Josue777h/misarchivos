'use client';

import React from 'react';
import { useFiles } from '../context/FileContext';
import { formatFileSize, formatDate } from '../lib/file-helpers';
import { HardDrive, Files, CheckCircle2, RefreshCw, Smartphone, Laptop } from 'lucide-react';

export function StatsCard() {
  const { stats, triggerManualSync } = useFiles();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Total files */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-400">Total Archivos</p>
          <h4 className="text-2xl font-bold text-white mt-1">
            {stats.totalFiles}
          </h4>
          <p className="text-[11px] text-zinc-500 mt-0.5">En carpeta personal</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-300 flex items-center justify-center">
          <Files className="w-6 h-6" />
        </div>
      </div>

      {/* Used storage */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-400">Espacio Utilizado</p>
          <h4 className="text-2xl font-bold text-white mt-1">
            {formatFileSize(stats.usedBytes)}
          </h4>
          <p className="text-[11px] text-zinc-500 mt-0.5">En la nube y PC</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 text-emerald-400 flex items-center justify-center">
          <HardDrive className="w-6 h-6" />
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-400">Sincronización</p>
          <div className="flex items-center gap-1.5 mt-1">
            {stats.syncState === 'syncing' ? (
              <span className="text-sm font-bold text-amber-400 flex items-center gap-1">
                <RefreshCw className="w-4 h-4 animate-spin" /> Sincronizando...
              </span>
            ) : (
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Al día
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
            {formatDate(stats.lastSyncTime)}
          </p>
        </div>
        <button
          onClick={triggerManualSync}
          className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
          title="Forzar sincronización ahora"
        >
          <RefreshCw className={`w-5 h-5 ${stats.syncState === 'syncing' ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Devices Connected */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-400">Dispositivos</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs font-semibold text-zinc-200">
              <Laptop className="w-4 h-4 text-zinc-400" /> PC
            </span>
            <span className="text-zinc-600">⇄</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-zinc-200">
              <Smartphone className="w-4 h-4 text-zinc-400" /> Móvil
            </span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 font-medium">
            Bidireccional en vivo
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
          <div className="relative">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full block animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
