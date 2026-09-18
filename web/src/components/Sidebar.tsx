import React from 'react';
import { Home, Folder, Trash2, Settings, HardDrive } from 'lucide-react';
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
    { id: 'files', label: 'Mis Archivos', icon: Folder, count: stats.totalFiles },
    { id: 'trash', label: 'Papelera', icon: Trash2, count: stats.trashCount },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  const usedPct = Math.min(100, Math.max(2, (stats.usedBytes / (1024 * 1024 * 100)) * 100));

  return (
    <aside className="hidden md:flex flex-col w-56 border-r border-zinc-800/50 bg-[#0c0c0e] p-3 shrink-0 min-h-[calc(100vh-3.5rem)]">
      <nav className="space-y-0.5 flex-1 pt-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-semibold ${
                  isActive ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-900 text-zinc-500'
                }`}>
                  {item.count > 999 ? '999+' : item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Storage widget */}
      <div className="mt-auto pt-3 border-t border-zinc-800/50">
        <div className="px-3 py-2.5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="flex items-center gap-1.5 font-medium text-zinc-400">
              <HardDrive className="w-3.5 h-3.5" />
              Almacenamiento
            </span>
            <span className="font-mono text-zinc-500">{formatFileSize(stats.usedBytes)}</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-400 rounded-full transition-all duration-700"
              style={{ width: `${usedPct}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
