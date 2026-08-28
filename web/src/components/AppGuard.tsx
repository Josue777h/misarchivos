'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LockScreen } from './LockScreen';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { FilePreviewModal } from './FilePreviewModal';
import { FileInfoDrawer } from './FileInfoDrawer';
import { FileUploadModal } from './FileUploadModal';

export function AppGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LockScreen />;
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
