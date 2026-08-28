'use client';

import React from 'react';
import { useFiles } from '../../context/FileContext';
import { getCategoriesMetadata, formatFileSize } from '../../lib/file-helpers';
import { Layers, ArrowRight, HardDrive } from 'lucide-react';
import Link from 'next/link';

export default function CategoriesPage() {
  const { files } = useFiles();
  const categories = getCategoriesMetadata(files);
  const totalActiveFiles = files.filter((f) => !f.isTrash).length;
  const totalSize = files.filter((f) => !f.isTrash).reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-zinc-300" />
            <span>Categorías Automáticas</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Tus archivos clasificados automáticamente según su tipo
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-zinc-900 px-3.5 py-2 rounded-2xl border border-zinc-800 font-mono text-zinc-300">
          <HardDrive className="w-4 h-4 text-zinc-400" />
          <span>{totalActiveFiles} archivos ({formatFileSize(totalSize)})</span>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const categoryFiles = files.filter((f) => !f.isTrash && f.type === cat.type);
          const percentOfStorage = totalSize > 0 ? (cat.sizeBytes / totalSize) * 100 : 0;

          return (
            <div
              key={cat.type}
              className="bg-zinc-900/90 rounded-3xl p-5 border border-zinc-800 shadow-md hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl bg-zinc-950 border border-zinc-800 shadow-inner`}>
                    {cat.type === 'image' && '📷'}
                    {cat.type === 'pdf' && '📄'}
                    {cat.type === 'word' && '📝'}
                    {cat.type === 'excel' && '📊'}
                    {cat.type === 'powerpoint' && '📽️'}
                    {cat.type === 'text' && '💻'}
                    {cat.type === 'other' && '📦'}
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-bold text-white">
                      {cat.count}
                    </span>
                    <span className="block text-[11px] text-zinc-400">
                      {cat.count === 1 ? 'archivo' : 'archivos'}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-white text-base">
                  {cat.title}
                </h3>

                <p className="text-xs text-zinc-400 font-mono mt-1">
                  Extensiones: {cat.extensions.join(', ').toUpperCase()}
                </p>

                {/* Progress bar of space */}
                <div className="mt-4 pt-3 border-t border-zinc-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-zinc-400">Espacio usado</span>
                    <span className="font-mono font-semibold text-zinc-200">
                      {formatFileSize(cat.sizeBytes)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full"
                      style={{ width: `${percentOfStorage}%` }}
                    />
                  </div>
                </div>

                {/* File preview snippets */}
                {categoryFiles.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {categoryFiles.slice(0, 2).map((file) => (
                      <div
                        key={file.id}
                        className="text-[11px] text-zinc-300 truncate bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800/80 font-mono"
                      >
                        • {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <Link
                href={`/files?category=${cat.type}`}
                className="mt-5 inline-flex items-center justify-between w-full px-4 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-bold transition-colors"
              >
                <span>Explorar {cat.title}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
