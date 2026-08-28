import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FileProvider } from '../context/FileContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import { FilePreviewModal } from '../components/FilePreviewModal';
import { FileInfoDrawer } from '../components/FileInfoDrawer';
import { FileUploadModal } from '../components/FileUploadModal';

export const metadata: Metadata = {
  title: 'MisArchivos - Sincronización Personal PC y Celular',
  description: 'Sistema personal de sincronización automática de archivos entre computador y celular con Supabase.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MisArchivos',
  },
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-black text-zinc-100 min-h-screen flex flex-col selection:bg-zinc-700 selection:text-white antialiased">
        <FileProvider>
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
        </FileProvider>
      </body>
    </html>
  );
}
