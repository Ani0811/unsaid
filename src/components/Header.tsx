import React from 'react';
import type { Mode, ConnectionInfo } from '../types';
import { MODES } from '../modes';
import { Shield, Clock, Settings as SettingsIcon, PlusCircle, Sparkles, Lock, BookOpen } from 'lucide-react';
import { ConnectionBadge } from './ConnectionBadge';
import { SoundscapeControl } from './SoundscapeControl';
import { ShellBridgeControl } from './ShellBridgeControl';

interface HeaderProps {
  currentMode: Mode | null;
  onSelectMode: (mode: Mode) => void;
  onNewReflection: () => void;
  onOpenHistory: () => void;
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
  onSelectMode,
  onNewReflection,
  onOpenHistory,
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
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-[#0d0e12]/85 border-b border-zinc-800/80 px-4 sm:px-8 py-3 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={onNewReflection}
            className="flex items-center gap-2.5 text-left group transition focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600/30 via-purple-600/30 to-sky-600/30 border border-zinc-700/60 flex items-center justify-center shadow-inner group-hover:border-zinc-500 transition">
              <Sparkles className="w-4 h-4 text-amber-200/90 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="font-serif-reflect text-lg font-semibold tracking-wide text-zinc-100 group-hover:text-amber-200 transition">
                Unsaid
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] text-zinc-500 font-mono tracking-tight">
                local-first
              </span>
            </div>
          </button>

          {/* Privacy badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400">
            <Shield className="w-3 h-3 text-emerald-400/80" />
            <span>Reflections stay on this device</span>
          </div>
        </div>

        {/* Mode Navigation Tabs (visible when in reflection or mode selected) */}
        {!isDocsOpen && !isShellOpen && currentMode && (
          <nav className="hidden lg:flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
            {(Object.keys(MODES) as Mode[]).map((modeKey) => {
              const config = MODES[modeKey];
              const isActive = currentMode === modeKey;
              return (
                <button
                  key={modeKey}
                  onClick={() => onSelectMode(modeKey)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
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

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Shell & Disk Bridge Control */}
          <ShellBridgeControl
            onToggleInAppShell={onToggleShell}
            isInAppShellOpen={isShellOpen}
            onRefreshData={onRefreshHistory}
          />

          {/* Docs / Guide Toggle Button */}
          <button
            onClick={onToggleDocs}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              isDocsOpen
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-200 font-semibold'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
            }`}
            title={isDocsOpen ? 'Return to Room' : 'Open Documentation & Guides'}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{isDocsOpen ? 'Room' : 'Docs'}</span>
          </button>

          {/* Ambient Soundscape Controller */}
          <SoundscapeControl />

          {/* Compact Connection Badge */}
          <ConnectionBadge
            compact
            info={connectionInfo}
            isTesting={isTestingConnection}
            onTestConnection={onTestConnection}
            onOpenSettings={onOpenSettings}
          />

          {/* Lock App Button (if PIN set) */}
          {isLockConfigured && (
            <button
              onClick={onLockApp}
              className="p-1.5 rounded-lg text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 transition"
              title="Lock this room"
              aria-label="Lock App"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          {/* New reflection button if in a conversation */}
          {currentMode && !isDocsOpen && !isShellOpen && (
            <button
              onClick={onNewReflection}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition"
              title="Start a new reflection"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">New</span>
            </button>
          )}

          {/* History drawer button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition relative"
            title="Open past reflections"
          >
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-300 font-mono">
                {historyCount}
              </span>
            )}
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-transparent hover:border-zinc-700 transition"
            title="Settings & Privacy"
            aria-label="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
