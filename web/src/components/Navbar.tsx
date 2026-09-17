import React from 'react';
import { useFiles } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';
import { SyncStatusBadge } from './SyncStatusBadge';
import { Search, Plus, HardDrive, X, LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  onNavigate: (view: 'home' | 'files' | 'trash' | 'settings') => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const { searchQuery, setSearchQuery, setIsUploadModalOpen } = useFiles();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full bg-black/85 backdrop-blur-xl border-b border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand / Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 shrink-0 group text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-white shadow-md group-hover:border-zinc-500 transition-all">
            <HardDrive className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-lg tracking-tight text-white">
              Mis<span className="text-zinc-400">Archivos</span>
            </span>
          </div>
        </button>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-1 sm:mx-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar archivos..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-zinc-900/90 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-500 text-white placeholder-zinc-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="hidden sm:block">
            <SyncStatusBadge />
          </div>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-zinc-200 text-black shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Subir</span>
          </button>

          {/* User Account / Logout */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-zinc-800/80">
            {user?.email && (
              <button
                onClick={() => onNavigate('settings')}
                title={`Conectado como ${user.email}`}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors max-w-[140px] cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{user.email.split('@')[0]}</span>
              </button>
            )}

            <button
              onClick={() => signOut()}
              title="Cerrar sesión"
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-rose-400 active:scale-95 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
