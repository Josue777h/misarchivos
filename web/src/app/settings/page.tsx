'use client';

import React, { useState } from 'react';
import { useFiles } from '../../context/FileContext';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Database,
  Laptop,
  Smartphone,
  FolderSync,
  ShieldCheck,
  RefreshCw,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const { stats, triggerManualSync } = useFiles();
  const { isPinSet, changePin, lockApp } = useAuth();

  const [isChangingPin, setIsChangingPin] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage(null);

    if (newPin.length < 4) {
      setPinMessage({ type: 'error', text: 'El nuevo PIN debe tener al menos 4 dígitos' });
      return;
    }

    if (newPin !== confirmNewPin) {
      setPinMessage({ type: 'error', text: 'Los nuevos PINs no coinciden' });
      return;
    }

    const success = await changePin(oldPin, newPin);
    if (success) {
      setPinMessage({ type: 'success', text: '¡PIN actualizado con éxito!' });
      setOldPin('');
      setNewPin('');
      setConfirmNewPin('');
      setTimeout(() => setIsChangingPin(false), 1500);
    } else {
      setPinMessage({ type: 'error', text: 'El PIN actual no es correcto' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-zinc-300" />
          <span>Configuración y Seguridad</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Estado del enlace entre tu PC Windows, Supabase Cloud y la protección por PIN
        </p>
      </div>

      {/* Security & PIN Lock Card */}
      <div className="bg-zinc-950 rounded-3xl p-6 border border-zinc-800 shadow-md space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-white shadow-xs">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Bloqueo y PIN de Seguridad</h2>
              <p className="text-[11px] text-zinc-400">
                Nadie puede ver tus archivos sin ingresar el PIN personal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isPinSet ? 'Protección Activa' : 'Sin Configurar'}
            </span>
            <button
              onClick={lockApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold active:scale-95 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Bloquear Ahora</span>
            </button>
          </div>
        </div>

        {!isChangingPin ? (
          <div className="p-3.5 bg-zinc-900/80 rounded-2xl border border-zinc-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="space-y-0.5">
              <span className="text-white font-bold">Cifrado SHA-256</span>
              <p className="text-zinc-400 text-[11px]">
                Tu PIN se verifica localmente y no se almacena en texto plano.
              </p>
            </div>
            <button
              onClick={() => {
                setIsChangingPin(true);
                setPinMessage(null);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              Cambiar PIN
            </button>
          </div>
        ) : (
          <form onSubmit={handleChangePinSubmit} className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold text-white">Cambiar PIN de Acceso</h3>

            {pinMessage && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  pinMessage.type === 'success'
                    ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/50 border border-rose-800 text-rose-300'
                }`}
              >
                {pinMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{pinMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                  PIN Actual
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-500 font-mono tracking-widest text-center"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                  Nuevo PIN
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-500 font-mono tracking-widest text-center"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                  Confirmar Nuevo PIN
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-zinc-500 font-mono tracking-widest text-center"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsChangingPin(false)}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Guardar Nuevo PIN
              </button>
            </div>
          </form>
        )}
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
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
            className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
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
          <span>Políticas de Privacidad y Seguridad Total</span>
        </h2>
        <ul className="space-y-2 text-xs text-zinc-300">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>
              <strong>Bloqueo Personal con PIN:</strong> Nadie puede ver ni descargar archivos sin escribir tu clave maestra.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>
              <strong>Cifrado SHA-256:</strong> Cada archivo y tu PIN se validan mediante firmas criptográficas de alta seguridad.
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
