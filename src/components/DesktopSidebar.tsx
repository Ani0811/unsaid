import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Mode, Conversation, ConnectionInfo } from '../types';
import {
  Plus,
  Search,
  MessageSquare,
  Wind,
  Sparkles,
  Clock,
  Trash2,
  Lock,
  Settings,
  Terminal,
  BookOpen,
  PanelLeftClose,
  X,
  RefreshCw
} from 'lucide-react';

interface DesktopSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (convo: Conversation) => void;
  onNewReflection: () => void;
  onSelectMode: (mode: Mode) => void;
  onDeleteConversation: (id: string) => void;
  connectionInfo: ConnectionInfo;
  isTestingConnection?: boolean;
  onTestConnection?: () => void;
  onOpenSettings: () => void;
  onLockApp?: () => void;
  isLockConfigured?: boolean;
  onOpenDocs?: () => void;
  onToggleShell?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  isOpen,
  onToggle,
  conversations,
  activeId,
  onSelectConversation,
  onNewReflection,
  onSelectMode,
  onDeleteConversation,
  connectionInfo,
  isTestingConnection,
  onTestConnection,
  onOpenSettings,
  onLockApp,
  isLockConfigured,
  onOpenDocs,
  onToggleShell
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global shortcut to focus search input (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter(
      (c) =>
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.mode && c.mode.toLowerCase().includes(q)) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  const [todayStart] = useState(() => new Date().setHours(0, 0, 0, 0));

  // Group conversations into Today, Yesterday, Earlier
  const groupedConversations = useMemo(() => {
    const yesterdayStart = todayStart - 86400000;

    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const earlier: Conversation[] = [];

    filteredConversations.forEach((c) => {
      const time = c.updatedAt || c.createdAt || 0;
      if (time >= todayStart) {
        today.push(c);
      } else if (time >= yesterdayStart) {
        yesterday.push(c);
      } else {
        earlier.push(c);
      }
    });

    return { today, yesterday, earlier };
  }, [filteredConversations, todayStart]);

  const getModeIcon = (mode: Mode) => {
    switch (mode) {
      case 'talk':
        return <MessageSquare className="w-3.5 h-3.5 text-amber-400" />;
      case 'unload':
        return <Wind className="w-3.5 h-3.5 text-sky-400" />;
      case 'unsaid':
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const formatRelativeTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      className="w-72 sm:w-80 h-full flex flex-col bg-[#0f1016] border-r border-zinc-800/80 select-none text-zinc-300 shrink-0 z-20"
      aria-label="Reflection Sidebar"
    >
      {/* Sidebar Header & New Button */}
      <div className="p-3 border-b border-zinc-800/70 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-amber-500/20 to-purple-500/20 border border-zinc-700/60 flex items-center justify-center">
              <span className="text-xs">🌿</span>
            </div>
            <span className="text-xs font-semibold text-zinc-200 tracking-tight font-serif-reflect">
              Reflections
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
              {conversations.length}
            </span>
          </div>

          <button
            onClick={onToggle}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition"
            title="Collapse Sidebar (Ctrl+B)"
            aria-label="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Action: New Reflection */}
        <button
          onClick={onNewReflection}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition shadow-sm group"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>New Reflection</span>
          </div>
          <span className="text-[10px] font-mono opacity-60 bg-black/15 px-1.5 py-0.5 rounded">
            Ctrl+N
          </span>
        </button>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reflections (Ctrl+K)..."
            className="w-full bg-[#15161f] border border-zinc-800/90 rounded-lg pl-8 pr-7 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Mode Starters Rail */}
      <div className="px-3 py-2 border-b border-zinc-800/50">
        <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold mb-1.5 px-1">
          Quick Launch Mode
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onSelectMode('talk')}
            className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-[#14161f] hover:bg-zinc-800/80 border border-zinc-800 hover:border-amber-500/30 transition text-center group"
            title="Start Talk Mode"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium text-zinc-300">Talk</span>
          </button>
          <button
            onClick={() => onSelectMode('unload')}
            className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-[#14161f] hover:bg-zinc-800/80 border border-zinc-800 hover:border-sky-500/30 transition text-center group"
            title="Start Unload Mode"
          >
            <Wind className="w-3.5 h-3.5 text-sky-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium text-zinc-300">Unload</span>
          </button>
          <button
            onClick={() => onSelectMode('unsaid')}
            className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-[#14161f] hover:bg-zinc-800/80 border border-zinc-800 hover:border-purple-500/30 transition text-center group"
            title="Start The Unsaid Roleplay"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium text-zinc-300">Unsaid</span>
          </button>
        </div>
      </div>

      {/* Reflections List (Grouped) */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        {filteredConversations.length === 0 ? (
          <div className="py-8 text-center px-4 space-y-2">
            <Clock className="w-6 h-6 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400 font-medium">
              {searchQuery ? 'No reflections match search' : 'No reflections yet'}
            </p>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              {searchQuery
                ? 'Try a different keyword or clear search.'
                : 'Click New Reflection or choose a mode above to start unburdening.'}
            </p>
          </div>
        ) : (
          <>
            {/* Today Group */}
            {groupedConversations.today.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                  Today ({groupedConversations.today.length})
                </div>
                <div className="space-y-0.5">
                  {groupedConversations.today.map((convo) => (
                    <ConversationItem
                      key={convo.id}
                      convo={convo}
                      isActive={convo.id === activeId}
                      onSelect={() => onSelectConversation(convo)}
                      onDelete={() => onDeleteConversation(convo.id)}
                      getIcon={getModeIcon}
                      formatTime={formatRelativeTime}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Yesterday Group */}
            {groupedConversations.yesterday.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                  Yesterday ({groupedConversations.yesterday.length})
                </div>
                <div className="space-y-0.5">
                  {groupedConversations.yesterday.map((convo) => (
                    <ConversationItem
                      key={convo.id}
                      convo={convo}
                      isActive={convo.id === activeId}
                      onSelect={() => onSelectConversation(convo)}
                      onDelete={() => onDeleteConversation(convo.id)}
                      getIcon={getModeIcon}
                      formatTime={formatRelativeTime}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Earlier Group */}
            {groupedConversations.earlier.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                  Earlier ({groupedConversations.earlier.length})
                </div>
                <div className="space-y-0.5">
                  {groupedConversations.earlier.map((convo) => (
                    <ConversationItem
                      key={convo.id}
                      convo={convo}
                      isActive={convo.id === activeId}
                      onSelect={() => onSelectConversation(convo)}
                      onDelete={() => onDeleteConversation(convo.id)}
                      getIcon={getModeIcon}
                      formatTime={formatRelativeTime}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sidebar Bottom Dock */}
      <div className="p-3 border-t border-zinc-800/80 bg-[#0d0e14] space-y-2">
        {/* LM Studio Connection Pill */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#14161f] border border-zinc-800/90 text-[11px]">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                connectionInfo.status === 'connected'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                  : connectionInfo.status === 'checking'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-zinc-600'
              }`}
            />
            <div className="min-w-0">
              <p className="font-mono text-zinc-300 truncate">
                {connectionInfo.status === 'connected'
                  ? connectionInfo.modelName || 'Gemma 2'
                  : 'Offline (Journal Mode)'}
              </p>
              <p className="text-[10px] text-zinc-500">
                {connectionInfo.status === 'connected' ? 'LM Studio :1234' : 'Local-only'}
              </p>
            </div>
          </div>

          {onTestConnection && (
            <button
              onClick={onTestConnection}
              disabled={isTestingConnection}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition"
              title="Test LM Studio connection"
            >
              <RefreshCw className={`w-3 h-3 ${isTestingConnection ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          )}
        </div>

        {/* Desktop Quick Tools Strip */}
        <div className="flex items-center justify-between text-zinc-400 pt-1 px-0.5">
          <div className="flex items-center gap-1">
            {onToggleShell && (
              <button
                onClick={onToggleShell}
                className="p-1.5 rounded-md hover:bg-zinc-800/80 hover:text-amber-300 transition"
                title="Open In-App Terminal Shell"
              >
                <Terminal className="w-3.5 h-3.5" />
              </button>
            )}

            {onOpenDocs && (
              <button
                onClick={onOpenDocs}
                className="p-1.5 rounded-md hover:bg-zinc-800/80 hover:text-amber-300 transition"
                title="Open Documentation Website (website/)"
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>
            )}

            {isLockConfigured && onLockApp && (
              <button
                onClick={onLockApp}
                className="p-1.5 rounded-md hover:bg-amber-500/10 text-amber-400/80 hover:text-amber-300 transition"
                title="Lock Application Room"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md hover:bg-zinc-800/80 hover:text-zinc-200 transition flex items-center gap-1 text-[11px]"
            title="Settings & Privacy"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

interface ConversationItemProps {
  convo: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  getIcon: (mode: Mode) => React.ReactNode;
  formatTime: (ts?: number) => string;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  convo,
  isActive,
  onSelect,
  onDelete,
  getIcon,
  formatTime
}) => {
  const isFromShell = convo.source === 'terminal_shell';

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition-all ${
        isActive
          ? 'bg-amber-500/10 border border-amber-500/30 text-zinc-100 shadow-sm'
          : 'hover:bg-[#161722] text-zinc-400 hover:text-zinc-200 border border-transparent'
      }`}
    >
      <div className="mt-0.5 shrink-0">{getIcon(convo.mode)}</div>

      <div className="flex-1 min-w-0 pr-6">
        <p className="text-xs font-medium truncate leading-tight">
          {convo.title || 'Untitled Reflection'}
        </p>
        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-500">
          <span>{formatTime(convo.updatedAt || convo.createdAt)}</span>
          {isFromShell && (
            <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
              &gt;_ Shell
            </span>
          )}
          <span>&bull;</span>
          <span>{convo.messages.length} msg{convo.messages.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Delete button on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition absolute right-2 top-2"
        title="Delete reflection"
        aria-label="Delete reflection"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
