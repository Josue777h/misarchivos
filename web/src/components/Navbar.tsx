import React from 'react';
import { useFiles } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, HardDrive, X, LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  onNavigate: (view: 'home' | 'files' | 'trash' | 'settings') => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const { searchQuery, setSearchQuery, setIsUploadModalOpen } = useFiles();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full bg-[#09090b]/90 backdrop-blur-xl border-b border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 shrink-0 group cursor-pointer"
        >
          <img
            src="/logo-raw.png"
            alt="MisArchivos"
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-sm mx-2 sm:mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar archivos..."
              className="w-full pl-8.5 pr-8 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 text-white placeholder-zinc-500 transition-all"
              style={{ paddingLeft: '2rem' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-white hover:bg-zinc-100 text-black shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Subir</span>
          </button>

          <div className="flex items-center gap-1 pl-2 border-l border-zinc-800">
            {user?.email && (
              <button
                onClick={() => onNavigate('settings')}
                title={`Cuenta: ${user.email}`}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors max-w-[130px] cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{user.email.split('@')[0]}</span>
              </button>
            )}
            <button
              onClick={() => signOut()}
              title="Cerrar sesión"
              className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
