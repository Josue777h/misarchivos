import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { NetlifyRemover } from './components/NetlifyRemover';
import { FilePreviewModal } from './components/FilePreviewModal';
import { FileInfoDrawer } from './components/FileInfoDrawer';
import { FileUploadModal } from './components/FileUploadModal';
import { HomeView } from './views/HomeView';
import { FilesView } from './views/FilesView';
import { TrashView } from './views/TrashView';
import { SettingsView } from './views/SettingsView';
import { Loader2 } from 'lucide-react';
import { FileType } from './lib/types';
import { useFiles } from './context/FileContext';

export function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const { setSelectedCategory } = useFiles();
  const [activeView, setActiveView] = useState<'home' | 'files' | 'trash' | 'settings'>('home');

  const handleNavigate = (view: 'home' | 'files' | 'trash' | 'settings', category?: FileType | 'all') => {
    if (category) {
      setSelectedCategory(category);
    }
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
        <span className="text-xs text-zinc-500 font-medium tracking-wide">Cargando MisArchivos...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <NetlifyRemover />
        <AuthScreen />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col selection:bg-zinc-700 selection:text-white antialiased">
      <NetlifyRemover />
      <Navbar onNavigate={handleNavigate} />
      
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar activeView={activeView} onNavigate={handleNavigate} />
        
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-full overflow-hidden pb-24 md:pb-8">
          {activeView === 'home' && <HomeView onNavigate={handleNavigate} />}
          {activeView === 'files' && <FilesView />}
          {activeView === 'trash' && <TrashView />}
          {activeView === 'settings' && <SettingsView onNavigate={handleNavigate} />}
        </main>
      </div>

      <MobileNav activeView={activeView} onNavigate={handleNavigate} />
      <FilePreviewModal />
      <FileInfoDrawer />
      <FileUploadModal />
    </div>
  );
}

export default App;
