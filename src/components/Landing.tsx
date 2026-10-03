import React, { useMemo } from 'react';
import type { Mode, ConnectionInfo, Conversation } from '../types';
import { MODES } from '../modes';
import { ConnectionBadge } from './ConnectionBadge';
import { ShieldCheck, MessageSquare, Feather, Sparkles, ArrowRight, Clock, HelpCircle, BookOpen } from 'lucide-react';

interface LandingProps {
  onSelectMode: (mode: Mode, initialStarter?: string) => void;
  onOpenConversation: (convo: Conversation) => void;
  recentConversations: Conversation[];
  connectionInfo: ConnectionInfo;
  isTestingConnection: boolean;
  onTestConnection: () => void;
  onOpenSettings: () => void;
  onOpenDocs?: () => void;
}

export const Landing: React.FC<LandingProps> = ({
  onSelectMode,
  onOpenConversation,
  recentConversations,
  connectionInfo,
  isTestingConnection,
  onTestConnection,
  onOpenSettings,
  onOpenDocs
}) => {
  const displayConversations = useMemo(
    () => recentConversations.slice(0, 4),
    [recentConversations]
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16 space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Private by design. Your reflections stay on this device.</span>
        </div>

        <h1 className="font-serif-reflect text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-zinc-100 max-w-2xl mx-auto leading-[1.15]">
          Some things are easier to say here first.
        </h1>

        <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          A private, local-first space to talk, unload, and explore the things you haven't said out loud.
        </p>

        {/* LM Studio Connection status card */}
        <div className="max-w-md mx-auto pt-2">
          <ConnectionBadge
            info={connectionInfo}
            isTesting={isTestingConnection}
            onTestConnection={onTestConnection}
            onOpenSettings={onOpenSettings}
          />
        </div>
      </section>

      {/* Core Three Modes Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
            Choose a reflection mode
          </h2>
          <span className="text-xs text-zinc-500">Local Gemma inference</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* TALK Mode */}
          <button
            onClick={() => onSelectMode('talk')}
            className="group flex flex-col text-left p-6 rounded-2xl bg-[#14151b] border border-zinc-800/90 hover:border-amber-500/40 hover:bg-[#181922] transition-all duration-300 relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 mb-4 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>

            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-amber-400/90 tracking-wide font-semibold">
                  MODE 01
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="font-serif-reflect text-2xl font-semibold text-zinc-100">
                TALK
              </h3>
            </div>

            <p className="text-sm font-medium text-amber-200/80 mb-2">
              Say what's on your mind.
            </p>

            <p className="text-xs text-zinc-400 leading-relaxed grow">
              A normal conversational space to think out loud. A gentle listener that asks thoughtful questions without giving unsolicited advice.
            </p>

            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center gap-1.5 text-[11px] text-zinc-500 group-hover:text-zinc-400">
              <span>Open conversation</span>
            </div>
          </button>

          {/* UNLOAD Mode */}
          <button
            onClick={() => onSelectMode('unload')}
            className="group flex flex-col text-left p-6 rounded-2xl bg-[#14151b] border border-zinc-800/90 hover:border-sky-500/40 hover:bg-[#181922] transition-all duration-300 relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-300 mb-4 group-hover:scale-105 transition-transform">
              <Feather className="w-5 h-5" />
            </div>

            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-sky-400/90 tracking-wide font-semibold">
                  MODE 02
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-sky-300 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="font-serif-reflect text-2xl font-semibold text-zinc-100">
                UNLOAD
              </h3>
            </div>

            <p className="text-sm font-medium text-sky-200/80 mb-2">
              Get it out without needing to solve it.
            </p>

            <p className="text-xs text-zinc-400 leading-relaxed grow">
              Dump messy thoughts, chaotic feelings, or mental overload. No fixing, no giant action checklists—just a quiet place to put it down.
            </p>

            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center gap-1.5 text-[11px] text-zinc-500 group-hover:text-zinc-400">
              <span>Brain dump & release</span>
            </div>
          </button>

          {/* UNSAID Mode */}
          <button
            onClick={() => onSelectMode('unsaid')}
            className="group flex flex-col text-left p-6 rounded-2xl bg-[#14151b] border border-zinc-800/90 hover:border-purple-500/40 hover:bg-[#181922] transition-all duration-300 relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 mb-4 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>

            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-purple-400/90 tracking-wide font-semibold">
                  MODE 03
                </span>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="font-serif-reflect text-2xl font-semibold text-zinc-100">
                UNSAID
              </h3>
            </div>

            <p className="text-sm font-medium text-purple-200/80 mb-2">
              Explore what you wish you could say.
            </p>

            <p className="text-xs text-zinc-400 leading-relaxed grow">
              Explore words you wish you could tell someone. Organize what you want understood, and separate known facts from assumptions without guessing their mind.
            </p>

            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center gap-1.5 text-[11px] text-zinc-500 group-hover:text-zinc-400">
              <span>Distinctive reflection</span>
            </div>
          </button>
        </div>
      </section>

      {/* Recent Reflections section (if any exist) */}
      {recentConversations.length > 0 && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Recent reflections
            </h3>
            <span className="text-xs text-zinc-500">Saved in browser storage</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayConversations.map((convo) => {
              const modeConfig = MODES[convo.mode];
              const dateStr = new Date(convo.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <button
                  key={convo.id}
                  onClick={() => onOpenConversation(convo)}
                  className="flex flex-col text-left p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 transition text-zinc-300"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${modeConfig.badgeColor}`}
                    >
                      {modeConfig.name}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">{dateStr}</span>
                  </div>
                  <h4 className="text-sm font-medium text-zinc-200 line-clamp-1">{convo.title}</h4>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {convo.messages[convo.messages.length - 1]?.content || 'Empty reflection'}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Documentation Portal Card */}
      <section className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-950/20 via-[#14151e] to-purple-950/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Interactive Documentation & Architecture Guide</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Explore step-by-step LM Studio guides, Gemma model selection, the Three Modes breakdown, and local security specifications.
          </p>
        </div>
        {onOpenDocs && (
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white transition shrink-0 shadow-xs"
          >
            <span>Read Documentation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </section>

      {/* Positioning & Clarity Notice */}
      <section className="rounded-2xl border border-zinc-800/70 bg-[#121318]/60 p-5 text-xs text-zinc-400 space-y-2">
        <div className="flex items-center gap-2 text-zinc-300 font-medium">
          <HelpCircle className="w-4 h-4 text-amber-400/80" />
          <span>About this space</span>
        </div>
        <p className="leading-relaxed">
          <strong>Unsaid</strong> is a personal reflection tool powered by an open <strong>Gemma</strong> model running locally through <strong>LM Studio</strong>. It is not an AI therapist, counselor, medical application, or diagnostic system. Your prompts and reflections are kept strictly on your own device and are never sent to external cloud servers.
        </p>
      </section>
    </div>
  );
};
