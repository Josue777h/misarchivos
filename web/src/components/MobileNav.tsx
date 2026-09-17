import React from 'react';
import { Home, Folder, Trash2, Plus, Settings } from 'lucide-react';
import { useFiles } from '../context/FileContext';

interface MobileNavProps {
  activeView: 'home' | 'files' | 'trash' | 'settings';
  onNavigate: (view: 'home' | 'files' | 'trash' | 'settings') => void;
}

export function MobileNav({ activeView, onNavigate }: MobileNavProps) {
  const { setIsUploadModalOpen, stats } = useFiles();

  const links: ({ id: 'home' | 'files' | 'trash' | 'settings'; label: string; icon: any; count?: number } | { isAction: true })[] = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'files', label: 'Archivos', icon: Folder, count: stats.totalFiles },
    { isAction: true },
    { id: 'trash', label: 'Papelera', icon: Trash2, count: stats.trashCount },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-t border-zinc-800 pb-safe">
      <nav className="flex items-center justify-around px-2 h-16 max-w-lg mx-auto">
        {links.map((item, index) => {
          if ('isAction' in item) {
            return (
              <button
                key="action-upload"
                onClick={() => setIsUploadModalOpen(true)}
                className="relative -top-3 w-12 h-12 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-xl shadow-white/10 active:scale-95 transition-transform cursor-pointer"
                aria-label="Subir archivo"
              >
                <Plus className="w-6 h-6" />
              </button>
            );
          }

          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors relative cursor-pointer ${
                isActive
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'scale-110 text-white' : 'text-zinc-500'} transition-transform`} />
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] bg-zinc-800 text-white border border-zinc-700 rounded-full text-[9px] flex items-center justify-center px-1 font-bold">
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
