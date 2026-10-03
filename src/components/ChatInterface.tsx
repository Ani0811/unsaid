import React, { useState, useRef, useEffect } from 'react';
import type { Mode, Message, ConnectionInfo } from '../types';
import { MODES } from '../modes';
import { SafetyBanner } from './SafetyBanner';
import { LetterStudio } from './LetterStudio';
import {
  Send,
  Trash2,
  Download,
  Copy,
  Check,
  Sparkles,
  User,
  ShieldCheck,
  AlertCircle,
  FileText
} from 'lucide-react';

interface ChatInterfaceProps {
  mode: Mode;
  messages: Message[];
  isGenerating: boolean;
  onSendMessage: (content: string) => void;
  onClearMessages: () => void;
  onSwitchMode: (newMode: Mode) => void;
  connectionInfo: ConnectionInfo;
  onOpenSettings: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  mode,
  messages,
  isGenerating,
  onSendMessage,
  onClearMessages,
  onSwitchMode,
  connectionInfo,
  onOpenSettings
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isLetterStudioOpen, setIsLetterStudioOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const modeConfig = MODES[mode];

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    onSendMessage(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = () => {
    if (messages.length === 0) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const content = `# Unsaid Reflection (${modeConfig.name} Mode)\nDate: ${new Date().toLocaleString()}\n\n` +
      messages
        .map(
          (m) =>
            `### ${m.role === 'user' ? 'You' : 'Unsaid (Gemma)'} [${new Date(m.timestamp).toLocaleTimeString()}]\n\n${m.content}\n\n---`
        )
        .join('\n\n');

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unsaid-${mode}-${dateStr}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] max-w-4xl mx-auto w-full px-3 sm:px-6">
      {/* Mode Header & Subtitle */}
      <div className="py-4 border-b border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border ${modeConfig.badgeColor}`}
            >
              {modeConfig.name}
            </span>
            <span className="text-sm font-medium text-zinc-200">
              {modeConfig.tagline}
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
            {modeConfig.description}
          </p>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          {/* Mode switcher pills */}
          <div className="flex items-center bg-zinc-900/90 p-0.5 rounded-lg border border-zinc-800 mr-2">
            {(Object.keys(MODES) as Mode[]).map((mKey) => (
              <button
                key={mKey}
                onClick={() => onSwitchMode(mKey)}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition ${
                  mode === mKey
                    ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title={`Switch to ${MODES[mKey].name} mode`}
              >
                {MODES[mKey].name}
              </button>
            ))}
          </div>

          {/* Letter Studio trigger in UNSAID mode */}
          {mode === 'unsaid' && (
            <button
              onClick={() => setIsLetterStudioOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-purple-300 bg-purple-950/30 hover:bg-purple-950/50 border border-purple-500/30 transition mr-1"
              title="Open Unsent Letter Draft Studio"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Letter Studio</span>
            </button>
          )}

          {messages.length > 0 && (
            <>
              <button
                onClick={handleExport}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-zinc-800/80 transition"
                title="Export reflection as Markdown"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowClearConfirm(true)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-300 hover:bg-rose-950/30 border border-zinc-800/80 transition"
                title="Clear current reflection"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Clear Confirmation Modal / Bar */}
      {showClearConfirm && (
        <div className="my-2 p-3 rounded-xl bg-zinc-900 border border-rose-500/30 flex items-center justify-between gap-3 text-xs text-zinc-300">
          <span>Are you sure you want to clear this reflection?</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-2.5 py-1 rounded-md text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClearMessages();
                setShowClearConfirm(false);
              }}
              className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12 px-4 space-y-6">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${modeConfig.badgeColor}`}
            >
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif-reflect text-2xl font-medium text-zinc-200">
                {modeConfig.tagline}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                {mode === 'talk' &&
                  'Start speaking freely. The local AI will listen and reflect without jumping into problem-solving.'}
                {mode === 'unload' &&
                  'Write out everything buzzing in your head. No structure needed, no solutions enforced.'}
                {mode === 'unsaid' &&
                  'Explore what you wish you could tell someone. Organize your truth without assuming their thoughts.'}
              </p>
            </div>

            {/* Prompt Starters */}
            <div className="w-full space-y-2 pt-2">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold block">
                Or begin with a starter:
              </span>
              <div className="flex flex-col gap-2">
                {modeConfig.starters.map((starter, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(starter);
                      textareaRef.current?.focus();
                    }}
                    className="text-left text-xs p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/60 text-zinc-300 transition leading-relaxed"
                  >
                    “{starter}”
                  </button>
                ))}
              </div>
            </div>

            {/* Offline notice if LM Studio is offline */}
            {connectionInfo.status !== 'connected' && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <p>
                  LM Studio is currently offline. You can start LM Studio with Gemma, or adjust endpoints in{' '}
                  <button
                    onClick={onOpenSettings}
                    className="underline font-medium hover:text-amber-100"
                  >
                    Settings
                  </button>
                  .
                </p>
              </div>
            )}
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === 'user';
            const isSafetyMessage = message.safetyFlag;

            if (isSafetyMessage) {
              return <SafetyBanner key={message.id} />;
            }

            return (
              <div
                key={message.id}
                className={`flex gap-3 text-sm ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-amber-300/80" />
                  </div>
                )}

                <div
                  className={`relative group max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 leading-relaxed transition ${
                    isUser
                      ? 'bg-zinc-800/90 text-zinc-100 border border-zinc-700/60 rounded-tr-sm'
                      : 'bg-[#15161c] text-zinc-200 border border-zinc-800 rounded-tl-sm shadow-xs'
                  }`}
                >
                  {/* Sender label and timestamp */}
                  <div className="flex items-center justify-between gap-3 text-[11px] text-zinc-500 mb-1.5">
                    <span className="font-medium text-zinc-400">
                      {isUser ? 'You' : 'Unsaid (Local Gemma)'}
                    </span>
                    <span>
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Message body */}
                  <div className="whitespace-pre-wrap font-sans text-sm sm:text-[14.5px] leading-relaxed select-text">
                    {message.content}
                  </div>

                  {/* Copy message button */}
                  <button
                    onClick={() => handleCopy(message.id, message.content)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
                    title="Copy text"
                  >
                    {copiedId === message.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-zinc-800/70 border border-zinc-700/40 flex items-center justify-center text-zinc-400 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Generating indicator */}
        {isGenerating && (
          <div className="flex gap-3 text-sm justify-start">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-amber-300/80 animate-spin" />
            </div>
            <div className="bg-[#15161c] text-zinc-400 border border-zinc-800 rounded-2xl rounded-tl-sm p-4 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400/80 animate-pulse" />
              <span>Gemma is reflecting...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="py-4 border-t border-zinc-800/80 shrink-0 space-y-2">
        <div className="relative rounded-2xl bg-[#14151b] border border-zinc-800 focus-within:border-zinc-600 transition shadow-inner">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={modeConfig.placeholder}
            disabled={isGenerating}
            className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 text-sm px-4 pt-3.5 pb-12 rounded-2xl resize-none focus:outline-none leading-relaxed"
          />

          <div className="absolute bottom-2.5 left-4 right-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
              <span className="hidden sm:inline">Stored only in your browser</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[11px] text-zinc-500">
                Shift + Enter for new line
              </span>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isGenerating}
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 transition shadow-xs"
                title="Send message (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Letter Studio Modal */}
      <LetterStudio
        isOpen={isLetterStudioOpen}
        onClose={() => setIsLetterStudioOpen(false)}
        messages={messages}
      />
    </div>
  );
};
