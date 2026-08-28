'use client';

import React from 'react';
import { useFiles } from '../context/FileContext';
import { SyncStatusBadge } from './SyncStatusBadge';
import { Search, Plus, HardDrive, X } from 'lucide-react';
import Link from 'next/link';

export function Navbar() {
  const { searchQuery, setSearchQuery, setIsUploadModalOpen } = useFiles();

  return (
    <header className="sticky top-0 z-30 w-full bg-black/85 backdrop-blur-xl border-b border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-white shadow-md group-hover:border-zinc-500 transition-all">
            <HardDrive className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-lg tracking-tight text-white">
              Mis<span className="text-zinc-400">Archivos</span>
            </span>
            <span className="block text-[10px] uppercase font-semibold tracking-wider text-zinc-500 -mt-1">
              Personal Cloud & Sync
            </span>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-2 sm:mx-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o formato..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-zinc-900/90 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-500 text-white placeholder-zinc-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-2 sm:gap-3">
          <SyncStatusBadge />

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-zinc-200 text-black shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Subir archivo</span>
          </button>
        </div>
      </div>
    </header>
  );
}
