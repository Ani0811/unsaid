import React, { useState } from 'react';
import {
  BookOpen,
  Cpu,
  MessageSquare,
  Sparkles,
  Shield,
  Lock,
  Terminal,
  HelpCircle,
  HeartHandshake,
  ArrowRight,
  Copy,
  Check,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface DocsHubProps {
  onBackToApp: () => void;
  onSelectMode: (mode: 'talk' | 'unload' | 'unsaid') => void;
}

type DocSection =
  | 'overview'
  | 'modes'
  | 'lmstudio'
  | 'letter-studio'
  | 'security'
  | 'desktop'
  | 'troubleshooting';

export const DocsHub: React.FC<DocsHubProps> = ({ onBackToApp, onSelectMode }) => {
  const [activeSection, setActiveSection] = useState<DocSection>('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const navItems = [
    { id: 'overview' as DocSection, title: 'Overview & Philosophy', icon: BookOpen },
    { id: 'modes' as DocSection, title: 'The Three Modes', icon: MessageSquare },
    { id: 'lmstudio' as DocSection, title: 'LM Studio & Gemma Setup', icon: Cpu },
    { id: 'letter-studio' as DocSection, title: 'Letter & Perspective Studio', icon: Sparkles },
    { id: 'security' as DocSection, title: 'Security & App Lock', icon: Lock },
    { id: 'desktop' as DocSection, title: 'Desktop Shell Runner', icon: Terminal },
    { id: 'troubleshooting' as DocSection, title: 'FAQ & Troubleshooting', icon: HelpCircle }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Breadcrumb & Return Banner */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-zinc-800/80">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <button
            onClick={onBackToApp}
            className="hover:text-zinc-200 transition font-medium"
          >
            Unsaid Room
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-zinc-200 font-semibold">Documentation & Architecture</span>
        </div>

        <button
          onClick={onBackToApp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white transition shadow-xs"
        >
          <span>Open Reflection Room</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-1 space-y-1">
          <div className="pb-3 text-xs uppercase tracking-wider text-zinc-500 font-semibold px-3">
            Documentation Index
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition text-left ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-200 border border-amber-500/20 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
                <span>{item.title}</span>
              </button>
            );
          })}

          <div className="pt-6 px-3">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 space-y-1.5">
              <span className="font-semibold text-zinc-300 block">Local-First Assurance</span>
              <p className="leading-relaxed">
                No third-party trackers, no cloud analytics, zero external API calls. Everything documented here runs entirely on your local hardware.
              </p>
            </div>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="lg:col-span-3 space-y-8 text-zinc-300 text-sm leading-relaxed">
          {/* SECTION 1: OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-amber-400/90 tracking-wide font-semibold block mb-1">
                  PHILOSOPHY & CONCEPT
                </span>
                <h1 className="font-serif-reflect text-3xl sm:text-4xl font-semibold text-zinc-100">
                  What is Unsaid?
                </h1>
                <p className="text-base text-zinc-400 mt-2 font-serif-reflect italic">
                  “A private place for the things you don't know how to say out loud.”
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#14151c] border border-zinc-800 space-y-3">
                <h3 className="font-semibold text-zinc-200 text-sm">Built for Hacktoberfest 2026: “Build for a Friend”</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Every friend carries thoughts they cannot readily express: conversations they wish had gone differently, heavy mental clutter that feels exhausting to explain, or vulnerable words they aren't ready to speak aloud.
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Most people avoid typing vulnerable thoughts into cloud AI chatbots because of privacy concerns, training data scraping, and corporate data retention. Unsaid solves this by marrying a warm, distraction-free digital room with <strong>local offline inference</strong> powered by open Gemma weights via LM Studio.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-zinc-200 text-base">The Non-Clinical Manifesto</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                    <span className="text-rose-400 font-semibold block">What Unsaid is NOT</span>
                    <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                      <li>Not an AI therapist or psychologist</li>
                      <li>Not a diagnostic or medical application</li>
                      <li>Not a simulator of someone else's secret thoughts</li>
                      <li>Not a prescription or 5-step life coach</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                    <span className="text-emerald-400 font-semibold block">What Unsaid IS</span>
                    <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                      <li>A gentle, quiet sounding board</li>
                      <li>A place to dump thoughts without judgment</li>
                      <li>A laboratory to organize what you wish you could say</li>
                      <li>100% private to your own physical machine</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: MODES */}
          {activeSection === 'modes' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-sky-400/90 tracking-wide font-semibold block mb-1">
                  CORE REFLECTION ENGINES
                </span>
                <h1 className="font-serif-reflect text-3xl font-semibold text-zinc-100">
                  The Three Core Modes
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Each mode utilizes tailored system prompts designed specifically around healthy boundaries and user autonomy.
                </p>
              </div>

              <div className="space-y-4">
                {/* TALK */}
                <div className="p-5 rounded-2xl bg-[#14151c] border border-amber-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300">
                        MODE 01
                      </span>
                      <h3 className="font-serif-reflect text-lg font-semibold text-zinc-100">TALK</h3>
                    </div>
                    <button
                      onClick={() => onSelectMode('talk')}
                      className="text-xs text-amber-400 hover:text-amber-200 flex items-center gap-1"
                    >
                      <span>Try TALK</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-amber-200/90 italic">“Say what's on your mind.”</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Designed for active dialogue. Unsaid acts as a gentle, grounded listener. It validates how you feel, gently reflects key nuances, and asks at most one or two open-ended questions to help untangle your thoughts. It explicitly avoids clinical jargon like “you are suffering from burnout” and instead uses natural conversational warmth like “It sounds like this has been weighing heavily on you.”
                  </p>
                </div>

                {/* UNLOAD */}
                <div className="p-5 rounded-2xl bg-[#14151c] border border-sky-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-sky-500/10 border border-sky-500/30 text-sky-300">
                        MODE 02
                      </span>
                      <h3 className="font-serif-reflect text-lg font-semibold text-zinc-100">UNLOAD</h3>
                    </div>
                    <button
                      onClick={() => onSelectMode('unload')}
                      className="text-xs text-sky-400 hover:text-sky-200 flex items-center gap-1"
                    >
                      <span>Try UNLOAD</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-sky-200/90 italic">“Get it out without needing to solve it.”</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    A safe holding container for mental clutter, brain dumps, and raw frustration. When you type in UNLOAD mode, the AI strictly suppresses unsolicited advice lists, action items, and fixing behavior. It acknowledges the emotional themes and reminds you that you are free to leave the thoughts here to rest.
                  </p>
                </div>

                {/* UNSAID */}
                <div className="p-5 rounded-2xl bg-[#14151c] border border-purple-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300">
                        MODE 03
                      </span>
                      <h3 className="font-serif-reflect text-lg font-semibold text-zinc-100">UNSAID</h3>
                    </div>
                    <button
                      onClick={() => onSelectMode('unsaid')}
                      className="text-xs text-purple-400 hover:text-purple-200 flex items-center gap-1"
                    >
                      <span>Try UNSAID</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-purple-200/90 italic">“Explore what you wish you could say.”</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    The distinctive reflection engine for words left unspoken to a friend, family member, or coworker. It helps organize your truth, turn messy hurt into clear statements, and separate observable facts from mind-reading. <strong>Critical Rule:</strong> The model is strictly prohibited from claiming to know what the other person secretly thinks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: LM STUDIO & GEMMA */}
          {activeSection === 'lmstudio' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-emerald-400/90 tracking-wide font-semibold block mb-1">
                  OFFLINE ENGINE SETUP
                </span>
                <h1 className="font-serif-reflect text-3xl font-semibold text-zinc-100">
                  LM Studio & Gemma Integration
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Unsaid connects to LM Studio via its standard OpenAI-compatible local server.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <h4 className="font-semibold text-zinc-200 text-xs">Step 1: Download & Run LM Studio</h4>
                  <p className="text-xs text-zinc-400">
                    Download LM Studio free from{' '}
                    <a
                      href="https://lmstudio.ai"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-300 hover:underline inline-flex items-center gap-1"
                    >
                      lmstudio.ai <ExternalLink className="w-3 h-3" />
                    </a>
                    . Available for Windows, macOS, and Linux.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <h4 className="font-semibold text-zinc-200 text-xs">Step 2: Load an Open Gemma Model</h4>
                  <p className="text-xs text-zinc-400">
                    In LM Studio’s Search tab, search for <strong>Gemma 2</strong> or <strong>Gemma 3</strong>. Recommended models:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800 text-zinc-300">
                      <span className="text-amber-300 font-semibold block">gemma-2-2b-it (Recommended)</span>
                      <span className="text-zinc-500 text-[11px]">Fast, fits in &lt;3GB RAM, great reflection tone</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800 text-zinc-300">
                      <span className="text-purple-300 font-semibold block">gemma-2-9b-it (High Fidelity)</span>
                      <span className="text-zinc-500 text-[11px]">Deeper nuanced reasoning, requires ~6GB VRAM</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <h4 className="font-semibold text-zinc-200 text-xs">Step 3: Start Local Server</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Click the <strong>Local Server</strong> icon in LM Studio’s left sidebar (<code className="text-amber-200 bg-zinc-800 px-1 py-0.5 rounded">&lt;-&gt;</code>). Select your downloaded Gemma model at the top, and click <strong>Start Server</strong>.
                  </p>
                  <div className="relative p-3 rounded-lg bg-black/50 border border-zinc-800 font-mono text-xs text-zinc-300">
                    <pre>Default Endpoint: http://localhost:1234/v1</pre>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200 space-y-1.5">
                  <span className="font-semibold block">Built-in Dev Proxy</span>
                  <p className="text-zinc-400 leading-relaxed">
                    Unsaid includes an automatic Vite dev proxy (<code className="text-zinc-300">/api/lmstudio</code>) so browser CORS restrictions will never block requests to <code className="text-zinc-300">http://localhost:1234</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: LETTER STUDIO */}
          {activeSection === 'letter-studio' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-purple-400/90 tracking-wide font-semibold block mb-1">
                  DISTINCTIVE FEATURE
                </span>
                <h1 className="font-serif-reflect text-3xl font-semibold text-zinc-100">
                  Unsaid Letter & Perspective Studio
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  How Unsaid helps you transform messy rumination into a structured, compassionate unsent letter.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  In <strong>UNSAID</strong> mode, click the <strong>Letter Studio</strong> button at any time. The studio synthesizes what you have explored into three distinct components:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 rounded-xl bg-[#161720] border border-zinc-800 space-y-1.5">
                    <span className="font-semibold text-purple-300 block">1. Addressed Recipient</span>
                    <p className="text-zinc-400 leading-relaxed">
                      Explicitly name who the words are intended for (e.g. “My old friend”, “Mom”, “My former manager”).
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#161720] border border-zinc-800 space-y-1.5">
                    <span className="font-semibold text-purple-300 block">2. The Unsent Draft</span>
                    <p className="text-zinc-400 leading-relaxed">
                      An authentic, honest expression of how you were affected—free of passive aggression or demands.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#161720] border border-zinc-800 space-y-1.5">
                    <span className="font-semibold text-purple-300 block">3. Reality Check</span>
                    <p className="text-zinc-400 leading-relaxed">
                      Separates what you observed as cold facts from what you are assuming about their internal motives.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs text-zinc-300 space-y-2">
                  <span className="font-semibold text-rose-300 block">The Symbolic “Burn / Release” Action</span>
                  <p className="text-zinc-400 leading-relaxed">
                    Deciding <em>not</em> to send words can be as empowering as saying them. The Letter Studio includes a symbolic release button that gently dissolves the draft, giving you closure without causing unnecessary real-world fallout.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: SECURITY & APP LOCK */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-amber-400/90 tracking-wide font-semibold block mb-1">
                  PRIVACY ARCHITECTURE
                </span>
                <h1 className="font-serif-reflect text-3xl font-semibold text-zinc-100">
                  Security Guardrails & App Lock
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  How Unsaid ensures complete local data privacy and enforces non-clinical boundaries.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#14151c] border border-zinc-800 space-y-2">
                  <h4 className="font-semibold text-zinc-200 text-xs flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Local App Lock (PIN Protection)</span>
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Set a 4 to 8 digit PIN in <strong>Settings → Security & Guardrails</strong>. When configured, your reflections are obscured with an immediate Lock Screen. You can lock your room on demand using the lock button in the header, or rely on auto-lock inactivity timeouts (1 min to 1 hour).
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Security implementation: Hashed locally using SHA-256 via the browser’s native Web Crypto API with custom salt.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#14151c] border border-zinc-800 space-y-2">
                  <h4 className="font-semibold text-zinc-200 text-xs flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Prompt Injection & Jailbreak Defense</span>
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Unsaid inspects all prompts for adversarial patterns attempting to bypass system rules or demand medical/psychological diagnoses. If detected, Unsaid halts generation and returns a calm non-clinical grounding message.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#14151c] border border-zinc-800 space-y-2">
                  <h4 className="font-semibold text-zinc-200 text-xs flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-rose-400" />
                    <span>Crisis & Self-Harm Safety Layer</span>
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    If text indicates imminent suicidal intent or self-harm, normal conversation is halted immediately and an actionable crisis support banner is displayed with 24/7 free helplines (988 US/CA, Crisis Text Line 741741, UK NHS 111, and findahelpline.com).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: DESKTOP SHELL */}
          {activeSection === 'desktop' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-sky-400/90 tracking-wide font-semibold block mb-1">
                  NATIVE EXPERIENCE
                </span>
                <h1 className="font-serif-reflect text-3xl font-semibold text-zinc-100">
                  Desktop Shell Runner
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Run Unsaid as a standalone Windows desktop app with zero electron bloat.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <h4 className="font-semibold text-zinc-200 text-xs">Option 1: One-Click Desktop Batch Launcher</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Double-click <code className="text-amber-300">start-desktop.bat</code> in the repository root or run:
                  </p>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/60 border border-zinc-800 font-mono text-xs text-zinc-200">
                    <code>npm run desktop</code>
                    <button
                      onClick={() => copyToClipboard('npm run desktop', 'cmd_desktop')}
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      {copiedCode === 'cmd_desktop' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    This automatically checks if the local server is running, boots it in the background, and opens a chromeless native window with custom dimensions (`1140x840`).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <h4 className="font-semibold text-zinc-200 text-xs">Option 2: PowerShell Runner</h4>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/60 border border-zinc-800 font-mono text-xs text-zinc-200">
                    <code>powershell -ExecutionPolicy Bypass -File .\desktop-app.ps1</code>
                    <button
                      onClick={() => copyToClipboard('powershell -ExecutionPolicy Bypass -File .\\desktop-app.ps1', 'cmd_ps1')}
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      {copiedCode === 'cmd_ps1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <h4 className="font-semibold text-zinc-200 text-xs">Option 3: Electron Packaging</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    The project includes <code className="text-purple-300">desktop/main.cjs</code> configured for standard Electron app distributions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: FAQ & TROUBLESHOOTING */}
          {activeSection === 'troubleshooting' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-zinc-500 tracking-wide font-semibold block mb-1">
                  SUPPORT & ANSWERS
                </span>
                <h1 className="font-serif-reflect text-3xl font-semibold text-zinc-100">
                  FAQ & Troubleshooting
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Answers to common questions and quick fixes for local setup.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
                  <h4 className="text-xs font-semibold text-zinc-200">Q: Does Unsaid work if I don't have LM Studio running?</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Yes! You can enable the <strong>Offline Preview Simulator</strong> in Settings. This lets you test the exact three modes, UI transitions, soundscapes, and letter studio immediately with realistic simulated reflections.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
                  <h4 className="text-xs font-semibold text-zinc-200">Q: Why did we choose LM Studio instead of Ollama or cloud APIs?</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    LM Studio provides a clean GUI with an OpenAI-compatible local server and native hardware acceleration on consumer PCs. Open Gemma models can run directly on consumer laptops with zero subscription fees and zero cloud latency.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
                  <h4 className="text-xs font-semibold text-zinc-200">Q: How do I export or migrate my reflections?</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Inside any active conversation, click the Download icon to export as formatted Markdown (<code className="text-zinc-300">.md</code>). To migrate all reflections and settings, open <strong>Settings → Backup & Storage</strong> and click <strong>Export Backup (JSON)</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
                  <h4 className="text-xs font-semibold text-zinc-200">Q: Can anyone access my reflections?</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Conversations are stored only inside your browser’s local storage. They are never sent to external servers. For physical device security, enable the <strong>PIN App Lock</strong> in Settings so no one walking by can view your room.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
