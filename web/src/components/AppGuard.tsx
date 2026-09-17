'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthScreen } from './AuthScreen';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { FilePreviewModal } from './FilePreviewModal';
import { FileInfoDrawer } from './FileInfoDrawer';
import { FileUploadModal } from './FileUploadModal';
import { Loader2 } from 'lucide-react';

export function AppGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 text-white animate-spin" />
        <span className="text-xs text-zinc-500 font-medium tracking-wide">Cargando MisArchivos...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <>
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar />
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-full overflow-hidden pb-24 md:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
      <FilePreviewModal />
      <FileInfoDrawer />
      <FileUploadModal />
    </>
  );
}
