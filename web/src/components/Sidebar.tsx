import React from 'react';
import {
  Home,
  Folder,
  Trash2,
  Settings,
  HardDrive,
  CheckCircle2,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { useFiles } from '../context/FileContext';
import { formatFileSize } from '../lib/file-helpers';

interface SidebarProps {
  activeView: 'home' | 'files' | 'trash' | 'settings';
  onNavigate: (view: 'home' | 'files' | 'trash' | 'settings') => void;
}

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  const { stats } = useFiles();

  const navItems: { id: 'home' | 'files' | 'trash' | 'settings'; label: string; icon: any; count?: number }[] = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'files', label: 'Todos los Archivos', icon: Folder, count: stats.totalFiles },
    { id: 'trash', label: 'Papelera', icon: Trash2, count: stats.trashCount },
    { id: 'settings', label: 'Cuenta y Ajustes', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800/80 bg-zinc-950/60 p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation links */}
      <nav className="space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 text-white border border-zinc-700/80 shadow-xs'
                  : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-white text-black'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Storage widget */}
      <div className="mt-auto pt-4 border-t border-zinc-800/80">
        <div className="bg-zinc-900/80 rounded-2xl p-3.5 border border-zinc-800/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
              Almacenamiento
            </span>
            <span className="text-zinc-400 font-mono">
              {formatFileSize(stats.usedBytes)}
            </span>
          </div>

          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, (stats.usedBytes / (1024 * 1024 * 100)) * 100))}%` }}
            />
          </div>

          {/* Sync node indicators */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60">
            <div className="flex items-center gap-1">
              <Laptop className="w-3 h-3 text-zinc-400" />
              <span>PC</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>En vivo</span>
            </div>
            <div className="flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-zinc-400" />
              <span>Móvil</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
