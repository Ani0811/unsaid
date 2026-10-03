import React, { useState } from 'react';
import type { Conversation } from '../types';
import { MODES } from '../modes';
import { X, Clock, Trash2, ArrowUpRight, MessageSquare, AlertTriangle } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (convo: Conversation) => void;
  onDeleteConversation: (id: string) => void;
  onDeleteAllData: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelectConversation,
  onDeleteConversation,
  onDeleteAllData
}) => {
  const [showConfirmAll, setShowConfirmAll] = useState(false);

  if (!isOpen) return null;

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

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {conversations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
              <MessageSquare className="w-8 h-8 text-zinc-600" />
              <p className="text-xs">No reflections saved yet.</p>
              <p className="text-[11px] text-zinc-600">
                Your conversations are saved automatically to this device.
              </p>
            </div>
          ) : (
            conversations.map((convo) => {
              const modeConfig = MODES[convo.mode];
              const isActive = convo.id === activeId;
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
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${modeConfig.badgeColor}`}
                    >
                      {modeConfig.name}
                    </span>
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
                This will permanently delete all stored conversations from your browser storage.
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
