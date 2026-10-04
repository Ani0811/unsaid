import React from 'react';
import type { Mode, ConnectionInfo } from '../types';
import { MODES } from '../modes';
import {
  Settings as SettingsIcon,
  Lock,
  BookOpen,
  PanelLeft,
  PanelLeftClose,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { ConnectionBadge } from './ConnectionBadge';
import { SoundscapeControl } from './SoundscapeControl';
import { ShellBridgeControl } from './ShellBridgeControl';

interface HeaderProps {
  currentMode: Mode | null;
  activeTitle?: string;
  onSelectMode: (mode: Mode) => void;
  onNewReflection: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  historyCount: number;
  connectionInfo: ConnectionInfo;
  isTestingConnection: boolean;
  onTestConnection: () => void;
  isLockConfigured: boolean;
  onLockApp: () => void;
  isDocsOpen: boolean;
  onToggleDocs: () => void;
  isShellOpen: boolean;
  onToggleShell: () => void;
  onRefreshHistory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  activeTitle,
  onSelectMode,
  onNewReflection,
  isSidebarOpen,
  onToggleSidebar,
  onOpenSettings,
  historyCount,
  connectionInfo,
  isTestingConnection,
  onTestConnection,
  isLockConfigured,
  onLockApp,
  isDocsOpen,
  onToggleDocs,
  isShellOpen,
  onToggleShell,
  onRefreshHistory
}) => {
  return (
    <header className="h-12 w-full select-none bg-[#0c0d12] border-b border-zinc-800/80 px-3 sm:px-4 flex items-center justify-between shrink-0 z-30">
      {/* Left side: Sidebar Toggle & Breadcrumbs */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onToggleSidebar}
          className={`p-1.5 rounded-lg border transition ${
            isSidebarOpen
              ? 'bg-zinc-800/80 border-zinc-700/80 text-zinc-200'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
          title="Toggle Sidebar (Ctrl+B)"
          aria-label="Toggle Sidebar"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4 text-amber-400" />
          ) : (
            <PanelLeft className="w-4 h-4 text-zinc-400" />
          )}
        </button>

        {/* Brand / Titlebar Identity */}
        <button
          onClick={onNewReflection}
          className="flex items-center gap-2 text-left group transition focus:outline-none shrink-0"
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-amber-600/30 via-purple-600/30 to-sky-600/30 border border-zinc-700/60 flex items-center justify-center shadow-inner group-hover:border-zinc-500 transition">
            <span className="text-xs">🌿</span>
          </div>
          <span className="font-serif-reflect text-sm font-semibold tracking-wide text-zinc-200 group-hover:text-amber-200 transition">
            Unsaid
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono text-zinc-400 bg-zinc-800/80 border border-zinc-700/60">
            App {historyCount > 0 ? `• ${historyCount}` : ''}
          </span>
        </button>

        {/* Breadcrumb if active reflection */}
        {currentMode && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400 min-w-0">
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <span className="font-medium text-amber-400/90 shrink-0 capitalize">
              {currentMode}
            </span>
            {activeTitle && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <span className="text-zinc-300 truncate max-w-[200px]">
                  {activeTitle}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Center: Mode Segmented Control (when in reflection) */}
      {!isDocsOpen && !isShellOpen && currentMode && (
        <nav className="hidden lg:flex items-center gap-1 bg-[#14151e] p-1 rounded-xl border border-zinc-800/80">
          {(Object.keys(MODES) as Mode[]).map((modeKey) => {
            const config = MODES[modeKey];
            const isActive = currentMode === modeKey;
            return (
              <button
                key={modeKey}
                onClick={() => onSelectMode(modeKey)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? `${config.accentBg} shadow-sm font-semibold`
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {config.name}
              </button>
            );
          })}
        </nav>
      )}

      {/* Right side: Native Desktop Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Terminal Shell Bridge Control */}
        <ShellBridgeControl
          onToggleInAppShell={onToggleShell}
          isInAppShellOpen={isShellOpen}
          onRefreshData={onRefreshHistory}
        />

        {/* Ambient Soundscape Controller */}
        <SoundscapeControl />

        {/* Documentation Toggle & Website Link */}
        <div className="flex items-center rounded-lg bg-zinc-900 border border-zinc-800 p-0.5">
          <button
            onClick={onToggleDocs}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition ${
              isDocsOpen ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-zinc-300 hover:text-zinc-100'
            }`}
            title="Toggle Docs Hub"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{isDocsOpen ? 'Room' : 'Docs'}</span>
          </button>
          <a
            href="/website/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            title="Open Documentation Website (website/index.html)"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Connection Badge */}
        <ConnectionBadge
          compact
          info={connectionInfo}
          isTesting={isTestingConnection}
          onTestConnection={onTestConnection}
          onOpenSettings={onOpenSettings}
        />

        {/* App Lock (if configured) */}
        {isLockConfigured && (
          <button
            onClick={onLockApp}
            className="p-1.5 rounded-lg text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 transition"
            title="Lock application room"
            aria-label="Lock App"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition"
          title="Application Settings"
          aria-label="Settings"
        >
          <SettingsIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
