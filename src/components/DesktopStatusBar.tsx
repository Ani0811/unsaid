import React from 'react';
import type { ConnectionInfo } from '../types';
import { ShieldCheck, HardDrive } from 'lucide-react';

interface DesktopStatusBarProps {
  connectionInfo: ConnectionInfo;
  reflectionsCount: number;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeMode?: string | null;
}

export const DesktopStatusBar: React.FC<DesktopStatusBarProps> = ({
  connectionInfo,
  reflectionsCount,
  isSidebarOpen,
  onToggleSidebar,
  activeMode
}) => {
  const isConnected = connectionInfo.status === 'connected';

  return (
    <footer
      className="h-7 w-full bg-[#090a0e] border-t border-zinc-800/80 px-3 flex items-center justify-between text-[11px] font-mono text-zinc-500 select-none shrink-0 z-30"
      aria-label="Desktop Status Bar"
    >
      {/* Left side: AI Engine & Sidebar Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="hidden sm:flex hover:text-zinc-300 transition items-center gap-1 text-[10px]"
          title="Toggle Sidebar (Ctrl+B)"
        >
          <span>{isSidebarOpen ? '◧ Sidebar Open' : '◫ Sidebar Hidden'}</span>
        </button>

        <span className="hidden sm:inline text-zinc-700">|</span>

        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isConnected
                ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]'
                : connectionInfo.status === 'checking'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-zinc-600'
            }`}
          />
          <span className={`truncate text-[10px] ${isConnected ? 'text-zinc-300' : 'text-zinc-500'}`}>
            {isConnected
              ? `LM Studio (${connectionInfo.modelName || 'Gemma 3 4B'})`
              : 'LM Studio Offline'}
          </span>
        </div>

        {activeMode && (
          <>
            <span className="text-zinc-700 hidden xs:inline">|</span>
            <span className="text-amber-400/80 uppercase text-[10px] hidden xs:inline">
              {activeMode}
            </span>
          </>
        )}
      </div>

      {/* Center: File Bridge */}
      <div className="hidden sm:flex items-center gap-1.5 text-zinc-400 text-[10px]">
        <HardDrive className="w-3 h-3 text-zinc-500" />
        <span>~/.unsaid/reflections.json</span>
        <span className="text-emerald-500/80">&bull; Synced</span>
      </div>

      {/* Right side: Privacy, Count & Shortcuts */}
      <div className="flex items-center gap-3 text-[10px]">
        <div className="flex items-center gap-1 text-emerald-400/80">
          <ShieldCheck className="w-3 h-3" />
          <span>Local Only</span>
        </div>

        <span className="text-zinc-700">|</span>

        <span>{reflectionsCount} Saved</span>

        <span className="hidden md:inline-block text-zinc-600">
          <kbd className="px-1 py-0.2 rounded bg-zinc-800/80 text-zinc-400">Ctrl+N</kbd> New &bull;{' '}
          <kbd className="px-1 py-0.2 rounded bg-zinc-800/80 text-zinc-400">Ctrl+B</kbd> Sidebar
        </span>
      </div>
    </footer>
  );
};
