'use client';

import React from 'react';
import { useFiles } from '../../context/FileContext';
import {
  Settings,
  Database,
  Laptop,
  Smartphone,
  FolderSync,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function SettingsPage() {
  const { stats, triggerManualSync } = useFiles();

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-zinc-300" />
          <span>Configuración y Sincronización</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Estado del enlace entre tu PC Windows, Supabase Cloud y tu celular
        </p>
      </div>

      {/* Sync Topology Architecture Card */}
      <div className="bg-zinc-950 rounded-3xl p-6 border border-zinc-800 shadow-md space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <FolderSync className="w-4 h-4 text-zinc-400" />
          <span>Topología de Sincronización Bidireccional</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center items-center py-2">
          {/* Node 1: PC */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 text-white flex items-center justify-center mx-auto shadow-sm">
              <Laptop className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs text-white">Computador Windows</h3>
            <p className="font-mono text-[10px] text-zinc-400 bg-zinc-950 py-0.5 rounded px-2">
              C:\MisArchivos
            </p>
            <span className="inline-block text-[10px] text-emerald-400 font-semibold">
              ● Agente de vigilancia activo
            </span>
          </div>

          {/* Node 2: Supabase */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs text-white">Supabase Cloud</h3>
            <p className="text-[10px] text-zinc-400">
              PostgreSQL + Storage + Realtime
            </p>
            <span className="inline-block text-[10px] text-emerald-400 font-semibold">
              ● Almacenamiento seguro
            </span>
          </div>

          {/* Node 3: Mobile PWA */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 text-white flex items-center justify-center mx-auto shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs text-white">Celular (PWA)</h3>
            <p className="text-[10px] text-zinc-400">
              Cámara, visor directo y descargas
            </p>
            <span className="inline-block text-[10px] text-emerald-400 font-semibold">
              ● Compatible Android / iOS
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <span className="text-xs text-zinc-400">
            Última comprobación: {stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleTimeString('es-ES') : 'Ahora'}
          </span>
          <button
            onClick={triggerManualSync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-semibold transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Probar conexión</span>
          </button>
        </div>
      </div>

      {/* Connection Status Card */}
      <div className="bg-zinc-950 rounded-3xl p-6 border border-zinc-800 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Conexión Supabase Cloud</span>
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Conectado
          </span>
        </div>

        <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-zinc-800 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Servidor Supabase:</span>
            <span className="font-mono font-semibold text-zinc-200">hfeatjqxvueqtiskphrb.supabase.co</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Bucket de Almacenamiento:</span>
            <span className="font-mono font-semibold text-zinc-200">misarchivos</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Carpeta Local Windows:</span>
            <span className="font-mono font-semibold text-white">C:\MisArchivos</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Sincronización bidireccional activa
          </span>
          <button
            onClick={triggerManualSync}
            className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Comprobar ahora</span>
          </button>
        </div>
      </div>

      {/* Sync Strategy and Conflict Policy */}
      <div className="bg-zinc-950 rounded-3xl p-6 border border-zinc-800 shadow-md space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Políticas de Sincronización y Detección de Conflictos</span>
        </h2>
        <ul className="space-y-2 text-xs text-zinc-300">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>
              <strong>Detección por Hashing (SHA-256):</strong> Evita re-subir o re-descargar archivos cuyo contenido no haya cambiado.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>
              <strong>Manejo de Conflictos:</strong> Si un archivo es modificado simultáneamente en PC y celular, se conservan ambas versiones renombrando con sufijo de fecha y dispositivo.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>
              <strong>Papelera de Seguridad:</strong> Todo borrado pasa primero a la papelera para evitar pérdidas accidentales.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
