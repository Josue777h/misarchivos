'use client';

import React from 'react';
import { useFiles } from '../../context/FileContext';
import { useAuth } from '../../context/AuthContext';
import { formatFileSize } from '../../lib/file-helpers';
import {
  User,
  LogOut,
  HardDrive,
  Database,
  RefreshCw,
  Trash2,
  Folder,
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { stats, triggerManualSync } = useFiles();
  const { user, signOut } = useAuth();
  const [syncing, setSyncing] = React.useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await triggerManualSync();
    setTimeout(() => setSyncing(false), 600);
  };

  return (
    <div className="space-y-4 max-w-2xl animate-in fade-in duration-150">
      <h1 className="text-xl sm:text-2xl font-bold text-white">
        Cuenta y Ajustes
      </h1>

      {/* Profile Card */}
      <div className="bg-zinc-950 rounded-2xl p-4 sm:p-5 border border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white font-bold text-lg">
              {user?.email ? user.email.charAt(0).toUpperCase() : <User className="w-6 h-6 text-zinc-400" />}
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                {user?.email || 'Usuario'}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                ID: {user?.id ? `${user.id.slice(0, 8)}...` : 'Local'}
              </span>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-900/60 text-zinc-300 hover:text-rose-400 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Storage & Cloud Status */}
      <div className="bg-zinc-950 rounded-2xl p-4 sm:p-5 border border-zinc-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-zinc-400" />
            Almacenamiento Usado
          </span>
          <span className="text-xs font-mono font-semibold text-zinc-300">
            {formatFileSize(stats.usedBytes)}
          </span>
        </div>

        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
          <div
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(3, (stats.usedBytes / (1024 * 1024 * 100)) * 100))}%` }}
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Nube Supabase Conectada
          </span>
          <button
            onClick={handleSync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Sincronizando' : 'Sincronizar'}</span>
          </button>
        </div>
      </div>

      {/* Quick shortcuts */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <Link
          href="/files"
          className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 flex items-center gap-2.5 text-xs font-semibold text-zinc-300 hover:text-white transition-all"
        >
          <Folder className="w-4 h-4 text-zinc-400" />
          <span>Ver todos los archivos ({stats.totalFiles})</span>
        </Link>
        <Link
          href="/trash"
          className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 flex items-center gap-2.5 text-xs font-semibold text-zinc-300 hover:text-white transition-all"
        >
          <Trash2 className="w-4 h-4 text-zinc-400" />
          <span>Papelera ({stats.trashCount})</span>
        </Link>
      </div>
    </div>
  );
}
