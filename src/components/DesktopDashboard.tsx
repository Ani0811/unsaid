import React, { useState, useEffect, useRef } from 'react';
import type { Mode, Conversation, ConnectionInfo } from '../types';
import { InAppSpeechRecognizer } from '../audio/speechRecognition';
import {
  MessageSquare,
  Wind,
  Sparkles,
  ArrowRight,
  Terminal,
  BookOpen,
  ExternalLink,
  Settings,
  Mic,
  MicOff,
  Radio,
  Volume2,
  VolumeX
} from 'lucide-react';
import { voiceAgent, type VoiceAgentState } from '../audio/voiceAgent';

interface DesktopDashboardProps {
  onSelectMode: (mode: Mode, initialStarter?: string) => void;
  onOpenConversation: (convo: Conversation) => void;
  recentConversations: Conversation[];
  connectionInfo: ConnectionInfo;
  onOpenSettings: () => void;
  onOpenDocs?: () => void;
  onToggleShell?: () => void;
}

export const DesktopDashboard: React.FC<DesktopDashboardProps> = ({
  onSelectMode,
  onOpenConversation,
  recentConversations,
  connectionInfo,
  onOpenSettings,
  onOpenDocs,
  onToggleShell
}) => {
  const [scratchText, setScratchText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [handyInstalled, setHandyInstalled] = useState(true);
  const [voiceState, setVoiceState] = useState<VoiceAgentState>({
    isSpeaking: false,
    isPaused: false,
    currentText: null,
    activeId: null
  });
  const recognizerRef = useRef<InAppSpeechRecognizer | null>(null);

  // Subscribe to Voice Agent TTS
  useEffect(() => {
    const unsub = voiceAgent.subscribe((state) => {
      setVoiceState(state);
    });
    return () => {
      unsub();
      voiceAgent.stop();
    };
  }, []);

  // Check Handy local bridge status
  useEffect(() => {
    fetch('/api/handy/status')
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d.installed === 'boolean') {
          setHandyInstalled(d.installed);
        }
      })
      .catch(() => {});
  }, []);

  // Initialize Speech Recognizer
  useEffect(() => {
    const recognizer = new InAppSpeechRecognizer();
    recognizer.setCallbacks(
      (transcribed) => {
        setScratchText((prev) => {
          const separator = prev.trim() ? ' ' : '';
          return prev + separator + transcribed;
        });
      },
      (listening) => setIsListening(listening),
      (err) => console.warn('Speech recognition notice:', err)
    );
    recognizerRef.current = recognizer;

    return () => {
      recognizer.stop();
    };
  }, []);

  const toggleMic = () => {
    if (!recognizerRef.current) return;
    if (isListening) {
      recognizerRef.current.stop();
    } else {
      recognizerRef.current.start();
    }
  };

  const launchHandy = async () => {
    try {
      await fetch('/api/handy/launch', { method: 'POST' });
    } catch (e) {
      console.warn('Could not launch Handy:', e);
    }
  };

  // Format today's date
  const [todayStr] = useState(() =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }).format(Date.now())
  );

  const recentItems = recentConversations.slice(0, 3);

  const handleStartWithMode = (mode: Mode) => {
    if (isListening && recognizerRef.current) {
      recognizerRef.current.stop();
    }
    onSelectMode(mode, scratchText.trim() ? scratchText.trim() : undefined);
    setScratchText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleStartWithMode('talk');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-10 sm:py-10 max-w-5xl mx-auto w-full space-y-8 select-text">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span>&bull;</span>
            <span className="text-amber-400/90">{todayStr}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100 font-serif-reflect">
            Unsaid Desktop
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Local-first AI reflection space. Your words stay on your device.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {connectionInfo.status === 'connected' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              <span className="font-mono">{connectionInfo.modelName || 'Gemma 2'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              <span>Journal Mode (Offline)</span>
            </div>
          )}

          {onOpenDocs ? (
            <button
              onClick={onOpenDocs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 font-medium transition"
              title="Open Documentation & Guides"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Docs</span>
            </button>
          ) : (
            <a
              href="/website/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 font-medium transition"
              title="Open Documentation Website (website/)"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Docs</span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>
          )}

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 font-medium transition"
            title="Settings & Privacy"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Main Composer / Scratchpad */}
      <section className="bg-[#12131b] border border-zinc-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Quick Reflection Composer
            </span>

            {/* Handy Offline Voice Badge */}
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-300"
              title="Handy offline Whisper: Press Ctrl+Space anywhere in Windows to dictate"
            >
              <Radio className="w-3 h-3 text-amber-400" />
              <span>Handy: <kbd className="px-1 bg-black/40 rounded text-amber-200">Ctrl+Space</kbd></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* In-App Mic Push-to-Talk Toggle */}
            <button
              type="button"
              onClick={toggleMic}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                isListening
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-zinc-900 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 border-zinc-800'
              }`}
              title={isListening ? 'Click to stop listening' : 'Dictate with in-app microphone'}
            >
              {isListening ? (
                <MicOff className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Mic className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isListening ? 'Listening...' : 'Voice Dictate'}</span>
            </button>

            <span className="hidden sm:inline text-[11px] text-zinc-500 font-mono">
              Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Ctrl+Enter</kbd> to talk
            </span>
          </div>
        </div>

        {/* Live Listening Banner */}
        {isListening && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 animate-in fade-in duration-200">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span className="font-medium">Listening to your voice... Speak your thoughts freely.</span>
          </div>
        )}

        <textarea
          value={scratchText}
          onChange={(e) => setScratchText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          placeholder="What's on your mind right now? Start typing, press Ctrl+Space for Handy, or click Voice Dictate above..."
          className="w-full bg-[#0a0b0f] border border-zinc-800/90 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition resize-none leading-relaxed"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium mr-1">Start as:</span>

            {/* Talk Button */}
            <button
              onClick={() => handleStartWithMode('talk')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium transition group"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Talk Through It</span>
              <ArrowRight className="w-3 h-3 text-amber-400/60 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Unload Button */}
            <button
              onClick={() => handleStartWithMode('unload')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-medium transition group"
            >
              <Wind className="w-3.5 h-3.5" />
              <span>Just Unload</span>
              <ArrowRight className="w-3 h-3 text-sky-400/60 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* The Unsaid Button */}
            <button
              onClick={() => handleStartWithMode('unsaid')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-medium transition group"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Roleplay Unsaid</span>
              <ArrowRight className="w-3 h-3 text-purple-400/60 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {scratchText.trim() && (
            <button
              onClick={() => setScratchText('')}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* Mode Tiles */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
            Reflection Frameworks
          </h2>
          <span className="text-[11px] text-zinc-500">Pick a dedicated space</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Mode 1: Talk */}
          <div
            onClick={() => onSelectMode('talk')}
            className="group cursor-pointer p-4 rounded-xl bg-[#12131a] hover:bg-[#161822] border border-zinc-800/80 hover:border-amber-500/40 transition-all space-y-2 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono text-zinc-500">MODE 01</span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-amber-300 transition">
                Talk Through It
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                A calm, guided conversation. Gemma asks thoughtful questions and listens without unsolicited advice.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 group-hover:text-amber-400">
              <span>Enter room</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Mode 2: Unload */}
          <div
            onClick={() => onSelectMode('unload')}
            className="group cursor-pointer p-4 rounded-xl bg-[#12131a] hover:bg-[#161822] border border-zinc-800/80 hover:border-sky-500/40 transition-all space-y-2 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Wind className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono text-zinc-500">MODE 02</span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-sky-300 transition">
                Just Unload
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                Dump raw thoughts without expectations. Minimalist witness, zero pressure, free emotional discharge.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 group-hover:text-sky-400">
              <span>Enter room</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Mode 3: The Unsaid */}
          <div
            onClick={() => onSelectMode('unsaid')}
            className="group cursor-pointer p-4 rounded-xl bg-[#12131a] hover:bg-[#161822] border border-zinc-800/80 hover:border-purple-500/40 transition-all space-y-2 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono text-zinc-500">MODE 03</span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-purple-300 transition">
                The Unsaid (Roleplay)
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                Practice difficult conversations safely. Rehearse saying what matters before facing the person.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 group-hover:text-purple-400">
              <span>Enter room</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      {recentItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Recent Reflections
            </h2>
            <span className="text-[11px] text-zinc-500">Resume from sidebar or below</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentItems.map((convo) => {
              const lastAiMessage = [...convo.messages].reverse().find(
                (m) => m.role === 'assistant'
              );
              const isSpeakingThis =
                voiceState.isSpeaking && voiceState.activeId === convo.id;

              return (
                <div
                  key={convo.id}
                  onClick={() => onOpenConversation(convo)}
                  className={`group cursor-pointer p-3.5 rounded-xl bg-[#111218] hover:bg-[#151620] border transition space-y-2 ${
                    isSpeakingThis
                      ? 'border-amber-500/50 ring-1 ring-amber-500/20'
                      : 'border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-mono text-[10px] uppercase text-amber-400/80">
                      {convo.mode}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {convo.messages.length} messages
                    </span>
                  </div>

                  <p className="text-xs font-medium text-zinc-200 truncate group-hover:text-amber-200 transition">
                    {convo.title || 'Untitled Reflection'}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50 text-[10px] text-zinc-500">
                    <span>{new Date(convo.updatedAt || convo.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      {lastAiMessage && voiceAgent.isSupported() && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            voiceAgent.speak(convo.id, lastAiMessage.content);
                          }}
                          className={`p-1 rounded transition ${
                            isSpeakingThis
                              ? 'text-amber-400 bg-amber-500/20'
                              : 'text-zinc-500 hover:text-amber-300'
                          }`}
                          title={isSpeakingThis ? 'Stop voice reading' : 'Voice Agent: Read reflection aloud'}
                        >
                          {isSpeakingThis ? (
                            <VolumeX className="w-3 h-3 animate-pulse" />
                          ) : (
                            <Volume2 className="w-3 h-3" />
                          )}
                        </button>
                      )}
                      <span className="group-hover:text-zinc-300 transition">Resume &rarr;</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Desktop Tools, Voice & CLI Bridge Footer Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Handy Offline Voice Card */}
        <div className="p-4 rounded-xl bg-[#0f1016] border border-zinc-800/80 flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
              <Radio className="w-4 h-4 text-amber-400" />
              <span>Voice Agent & Handy Dictation</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Whisper speech-to-text with <kbd className="px-1 bg-black/40 rounded text-amber-200">Ctrl+Space</kbd> via Handy, plus soothing TTS voice agent playback.
            </p>
          </div>
          {handyInstalled && (
            <button
              onClick={launchHandy}
              className="w-fit px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700/80 transition"
              title="Launch Handy voice app in background"
            >
              Launch Handy
            </button>
          )}
        </div>

        {/* Terminal Shell Bridge Card */}
        <div className="p-4 rounded-xl bg-[#0f1016] border border-zinc-800/80 flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>Unsaid CLI Shell</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Run <code className="font-mono text-zinc-300">npm run shell</code> in your terminal. Real-time disk sync.
            </p>
          </div>
          {onToggleShell && (
            <button
              onClick={onToggleShell}
              className="w-fit px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700/80 transition"
            >
              Open Shell
            </button>
          )}
        </div>

        {/* Documentation Card */}
        <div className="p-4 rounded-xl bg-[#0f1016] border border-zinc-800/80 flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Docs & Guides (website/)</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Complete setup guide, Gemma 3 4B prompts, Handy voice & guardrails.
            </p>
          </div>
          <a
            href="/website/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700/80 transition"
          >
            <span>View Docs</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </a>
        </div>
      </section>
    </div>
  );
};
