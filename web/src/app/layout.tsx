import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { FileProvider } from '../context/FileContext';
import { AppGuard } from '../components/AppGuard';
import { NetlifyRemover } from '../components/NetlifyRemover';

export const metadata: Metadata = {
  title: 'MisArchivos - Sincronización Personal PC y Celular',
  description: 'Sistema personal de sincronización automática de archivos entre computador y celular con Supabase.',
  manifest: '/manifest.json',
  other: {
    'netlify-disable-drawer': 'true',
  },
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
        <NetlifyRemover />
        <AuthProvider>
          <FileProvider>
            <AppGuard>{children}</AppGuard>
          </FileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
