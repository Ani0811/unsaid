import React, { useState } from 'react';
import type { Conversation } from '../types';
import { MODES } from '../modes';
import {
  X,
  Clock,
  Trash2,
  ArrowUpRight,
  MessageSquare,
  AlertTriangle,
  Terminal,
  Laptop,
  RefreshCw
} from 'lucide-react';
import { syncWithDiskBridge, launchExternalTerminal } from '../storage/bridge';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (convo: Conversation) => void;
  onDeleteConversation: (id: string) => void;
  onDeleteAllData: () => void;
  onRefreshConversations?: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelectConversation,
  onDeleteConversation,
  onDeleteAllData,
  onRefreshConversations
}) => {
  const [showConfirmAll, setShowConfirmAll] = useState(false);
  const [filterSource, setFilterSource] = useState<'all' | 'desktop' | 'shell'>('all');
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const shellCount = conversations.filter((c) => c.source === 'terminal_shell').length;
  const desktopCount = conversations.length - shellCount;

  const filtered = conversations.filter((c) => {
    if (filterSource === 'shell') return c.source === 'terminal_shell';
    if (filterSource === 'desktop') return c.source !== 'terminal_shell';
    return true;
  });

  const handleSyncDisk = async () => {
    setIsSyncing(true);
    try {
      await syncWithDiskBridge();
      onRefreshConversations?.();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLaunchShell = async () => {
    await launchExternalTerminal();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-full max-w-md bg-[#111217] border-l border-zinc-800 h-full flex flex-col z-10 shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h3 className="font-medium text-sm text-zinc-200">Reflections History</h3>
            <span className="text-xs text-zinc-500 font-mono">({conversations.length})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSyncDisk}
              disabled={isSyncing}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 transition"
              title="Sync with disk bridge (~/.unsaid)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={handleLaunchShell}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 transition"
              title="Launch external Windows Terminal Shell"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 border-b border-zinc-800/60 bg-[#0e0f14] flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilterSource('all')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
              filterSource === 'all'
                ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            All ({conversations.length})
          </button>
          <button
            onClick={() => setFilterSource('desktop')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
              filterSource === 'desktop'
                ? 'bg-zinc-800 text-sky-200 font-semibold border border-sky-500/30'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Laptop className="w-3 h-3" />
            Desktop ({desktopCount})
          </button>
          <button
            onClick={() => setFilterSource('shell')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
              filterSource === 'shell'
                ? 'bg-amber-500/20 text-amber-200 font-semibold border border-amber-500/40'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Terminal className="w-3 h-3 text-amber-400" />
            CLI Shell ({shellCount})
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
              <MessageSquare className="w-8 h-8 text-zinc-600" />
              <p className="text-xs">
                {conversations.length === 0
                  ? 'No reflections saved yet.'
                  : `No ${filterSource === 'shell' ? 'CLI shell' : 'desktop'} reflections.`}
              </p>
              <p className="text-[11px] text-zinc-600">
                Reflections made in either the desktop app or terminal shell sync here automatically.
              </p>
            </div>
          ) : (
            filtered.map((convo) => {
              const modeConfig = MODES[convo.mode];
              const isActive = convo.id === activeId;
              const isShell = convo.source === 'terminal_shell';
              const formattedDate = new Date(convo.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={convo.id}
                  className={`group relative rounded-xl border p-3 transition text-left flex flex-col gap-1.5 ${
                    isActive
                      ? 'bg-zinc-800/70 border-zinc-600 text-zinc-200'
                      : 'bg-[#16171f] border-zinc-800/80 hover:border-zinc-700 hover:bg-[#1a1c26] text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${modeConfig.badgeColor}`}
                      >
                        {modeConfig.name}
                      </span>
                      {isShell ? (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300 flex items-center gap-1">
                          <Terminal className="w-2.5 h-2.5 text-amber-400" />
                          Shell
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border border-zinc-700/60 bg-zinc-800/60 text-zinc-400 flex items-center gap-1">
                          <Laptop className="w-2.5 h-2.5 text-zinc-400" />
                          App
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">{formattedDate}</span>
                  </div>

                  <button
                    onClick={() => {
                      onSelectConversation(convo);
                      onClose();
                    }}
                    className="text-left group-hover:text-zinc-200 transition focus:outline-none"
                  >
                    <h4 className="text-xs font-medium text-zinc-200 line-clamp-1 flex items-center justify-between">
                      <span>{convo.title}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-zinc-400" />
                    </h4>
                    <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1 leading-relaxed">
                      {convo.messages[convo.messages.length - 1]?.content || 'Empty reflection'}
                    </p>
                  </button>

                  {/* Delete individual reflection */}
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(convo.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition rounded"
                      title="Delete this reflection"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Clear All Data */}
        <div className="p-4 border-t border-zinc-800/80 bg-[#0e0f14]">
          {showConfirmAll ? (
            <div className="space-y-2 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs">
              <div className="flex items-center gap-1.5 text-rose-300 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Delete all local reflections?</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                This will permanently delete all stored conversations from your browser storage and disk.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setShowConfirmAll(false)}
                  className="px-2.5 py-1 text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteAllData();
                    setShowConfirmAll(false);
                    onClose();
                  }}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium"
                >
                  Yes, delete all
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmAll(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-zinc-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-lg border border-zinc-800 hover:border-rose-500/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete all local data</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
