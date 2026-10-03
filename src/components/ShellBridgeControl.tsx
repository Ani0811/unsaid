import React, { useState, useEffect } from 'react';
import {
  Terminal,
  ExternalLink,
  RefreshCw,
  Folder,
  CheckCircle2,
  Command,
  Monitor,
  X
} from 'lucide-react';
import {
  fetchBridgeStatus,
  syncWithDiskBridge,
  launchExternalTerminal,
  type BridgeStatus
} from '../storage/bridge';

interface ShellBridgeControlProps {
  onToggleInAppShell: () => void;
  isInAppShellOpen: boolean;
  onRefreshData?: () => void;
}

export const ShellBridgeControl: React.FC<ShellBridgeControlProps> = ({
  onToggleInAppShell,
  isInAppShellOpen,
  onRefreshData
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<BridgeStatus>({ online: false });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSpawning, setIsSpawning] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const loadStatus = async () => {
    const s = await fetchBridgeStatus();
    setStatus(s);
  };

  useEffect(() => {
    let isMounted = true;
    fetchBridgeStatus().then((s) => {
      if (isMounted) setStatus(s);
    });
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncWithDiskBridge();
      if (res.success) {
        setSyncFeedback(`Synced ${res.count} reflections with disk.`);
        onRefreshData?.();
      } else {
        setSyncFeedback(`Sync note: ${res.error || 'Check server'}`);
      }
      await loadStatus();
    } catch {
      setSyncFeedback('Sync failed');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleLaunchExternal = async () => {
    setIsSpawning(true);
    try {
      const ok = await launchExternalTerminal();
      if (ok) {
        setSyncFeedback('Launched native Windows shell window.');
      } else {
        setSyncFeedback('Could not launch window. Run "unsaid-shell.bat" directly.');
      }
    } catch {
      setSyncFeedback('Failed to spawn terminal process.');
    } finally {
      setIsSpawning(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  return (
    <div className="relative">
      {/* Header Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
          isOpen
            ? 'bg-amber-500/20 border-amber-500/40 text-amber-200 shadow-sm'
            : isInAppShellOpen
            ? 'bg-zinc-800 border-amber-500/30 text-amber-300'
            : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
        }`}
        title="Terminal Shell & Disk Bridge Status"
        aria-label="Shell Bridge"
      >
        <Terminal className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">Shell</span>
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            status.online
              ? 'bg-emerald-400 animate-pulse'
              : 'bg-zinc-500'
          }`}
          title={status.online ? 'Disk Bridge active' : 'Bridge offline'}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#12131a] border border-zinc-800/90 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                    Terminal Shell Bridge
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border ${
                        status.online
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {status.online ? 'LINKED' : 'OFFLINE'}
                    </span>
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    Bidirectional sync with native CLI & local disk
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Storage Info Card */}
            <div className="mt-3 p-2.5 rounded-xl bg-[#161722] border border-zinc-800/70 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                  <Folder className="w-3.5 h-3.5 text-amber-400/80" />
                  Shared Disk File:
                </span>
                <span className="font-mono text-[10px] text-emerald-400">
                  ~/.unsaid/reflections.json
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-500 text-[10px] font-mono">
                <span>Stored reflections: {status.count ?? 0}</span>
                <span>Real-time SSE: Active</span>
              </div>
            </div>

            {/* Feedback alert */}
            {syncFeedback && (
              <div className="mt-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-3 space-y-1.5">
              {/* Launch Native Windows Terminal */}
              <button
                onClick={handleLaunchExternal}
                disabled={isSpawning}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-750 text-zinc-200 border border-zinc-700/80 text-xs font-medium transition group"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Launch External Windows Shell</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                  unsaid-shell.bat
                </span>
              </button>

              {/* In-app terminal toggle */}
              <button
                onClick={() => {
                  onToggleInAppShell();
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition ${
                  isInAppShellOpen
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                    : 'bg-zinc-900/80 hover:bg-zinc-850 text-zinc-300 border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isInAppShellOpen ? 'Exit In-App Shell' : 'Open In-App Terminal View'}</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Overlay</span>
              </button>

              {/* Force sync */}
              <button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-[11px] transition"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Disk Reflections Now'}</span>
              </button>
            </div>

            {/* CLI Shell Commands Cheat sheet */}
            <div className="mt-3 pt-2.5 border-t border-zinc-800/70">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                  <Command className="w-3 h-3 text-amber-400" />
                  CLI Shell Commands:
                </span>
                <span className="text-[9px] text-zinc-500 font-mono">npm run shell</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-zinc-400">
                <div className="p-1 rounded bg-black/30 border border-zinc-900">
                  <span className="text-amber-300 font-bold">talk</span> [thought]
                </div>
                <div className="p-1 rounded bg-black/30 border border-zinc-900">
                  <span className="text-sky-300 font-bold">unload</span> [dump]
                </div>
                <div className="p-1 rounded bg-black/30 border border-zinc-900">
                  <span className="text-purple-300 font-bold">unsaid</span> [words]
                </div>
                <div className="p-1 rounded bg-black/30 border border-zinc-900">
                  <span className="text-emerald-300 font-bold">app</span> (opens GUI)
                </div>
              </div>
              <p className="mt-1.5 text-[9px] text-zinc-500 text-center">
                Reflections made in either the shell or app sync automatically.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
