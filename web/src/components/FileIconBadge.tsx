'use client';

import React from 'react';
import { FileType } from '../lib/types';
import {
  Image,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileCode,
  File,
  FileEdit,
} from 'lucide-react';

interface Props {
  type: FileType;
  className?: string;
  iconClassName?: string;
}

export function FileIconBadge({ type, className = '', iconClassName = 'w-6 h-6' }: Props) {
  switch (type) {
    case 'image':
      return (
        <div className={`rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center ${className}`}>
          <Image className={iconClassName} />
        </div>
      );
    case 'pdf':
      return (
        <div className={`rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center ${className}`}>
          <FileText className={iconClassName} />
        </div>
      );
    case 'word':
      return (
        <div className={`rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center ${className}`}>
          <FileEdit className={iconClassName} />
        </div>
      );
    case 'excel':
      return (
        <div className={`rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ${className}`}>
          <FileSpreadsheet className={iconClassName} />
        </div>
      );
    case 'powerpoint':
      return (
        <div className={`rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center ${className}`}>
          <Presentation className={iconClassName} />
        </div>
      );
    case 'text':
      return (
        <div className={`rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center ${className}`}>
          <FileCode className={iconClassName} />
        </div>
      );
    default:
      return (
        <div className={`rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center ${className}`}>
          <File className={iconClassName} />
        </div>
      );
  }
}
