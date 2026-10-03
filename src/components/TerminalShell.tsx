import React, { useState, useRef, useEffect } from 'react';
import type { Mode, ConnectionInfo } from '../types';
import { generateReflection } from '../ai/client';
import { loadSettings } from '../storage/localStorage';
import { checkSafety } from '../safety/detector';
import { checkPromptGuardrails } from '../safety/guardrails';
import { maskPII } from '../safety/pii';
import { ambientSound, type SoundscapeType } from '../audio/ambient';
import { launchExternalTerminal, syncWithDiskBridge } from '../storage/bridge';
import { Terminal as TerminalIcon, Sparkles, X, ArrowUpRight, ExternalLink, RefreshCw } from 'lucide-react';

interface TerminalShellProps {
  connectionInfo: ConnectionInfo;
  onExitShell: () => void;
  onOpenGUI: () => void;
  onLockApp?: () => void;
}

interface OutputLine {
  id: string;
  type: 'banner' | 'prompt' | 'response' | 'system' | 'error' | 'success';
  content: string;
  prefix?: string;
  timestamp?: number;
}

export const TerminalShell: React.FC<TerminalShellProps> = ({
  connectionInfo,
  onExitShell,
  onOpenGUI,
  onLockApp
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [currentMode, setCurrentMode] = useState<Mode | null>(null);
  const [isReflecting, setIsReflecting] = useState(false);
  const [lines, setLines] = useState<OutputLine[]>(() => [
    {
      id: 'init_1',
      type: 'banner',
      content: `   _   _                 _     _ 
  | | | |_ __  ___  __ _(_) __| |   UNSAID TERMINAL SHELL v1.0
  | | | | '_ \\/ __|/ _\` | |/ _\` |   Local Gemma · LM Studio
  | |_| | | | \\__ \\ (_| | | (_| |   A private terminal for unspoken words.
   \\___/|_| |_|___/\\__,_|_|\\__,_|   Type 'help' for command list.
--------------------------------------------------------------------`
    }
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, isReflecting]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addLine = (type: OutputLine['type'], content: string, prefix?: string) => {
    setLines((prev) => [
      ...prev,
      {
        id: 'line_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        type,
        content,
        prefix,
        timestamp: Date.now()
      }
    ]);
  };

  const handleCommand = async (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    // Add to command history
    setHistory((prev) => [...prev, trimmed]);
    setHistoryIdx(-1);

    const promptLabel = currentMode ? `unsaid:${currentMode}>` : 'unsaid>';
    addLine('prompt', trimmed, promptLabel);

    // If currently inside an active mode (TALK, UNLOAD, UNSAID)
    if (currentMode) {
      if (trimmed === 'exit' || trimmed === 'back' || trimmed === ':q') {
        addLine('system', `Exited ${currentMode.toUpperCase()} mode.`);
        setCurrentMode(null);
        return;
      }

      await executeReflection(currentMode, trimmed);
      return;
    }

    // Root shell commands
    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ').trim();

    switch (cmd) {
      case 'help':
      case '?':
        addLine(
          'system',
          `Available Shell Commands:
  talk [thought]       - Enter TALK mode or say what's on your mind
  unload [dump]        - Enter UNLOAD mode to dump thoughts without fixing
  unsaid [target]      - Enter UNSAID mode to explore unspoken words
  status               - Check LM Studio connection & loaded Gemma models
  sync                 - Synchronize history with ~/.unsaid/reflections.json
  popout / external    - Launch external native Windows Terminal CLI window
  sound [rain|hearth|drone|off] - Control ambient background soundscape
  lock                 - Lock this room with PIN screen
  gui                  - Switch back to Graphical Interface
  clear / cls          - Clear terminal output
  exit                 - Return to Unsaid room`
        );
        break;

      case 'sync': {
        const res = await syncWithDiskBridge();
        if (res.success) {
          addLine('success', `Synced with disk bridge (~/.unsaid): ${res.count} reflections shared.`);
        } else {
          addLine('error', `Sync failed: ${res.error}`);
        }
        break;
      }

      case 'popout':
      case 'external':
      case 'spawn': {
        const ok = await launchExternalTerminal();
        if (ok) {
          addLine('success', 'Launched external native Windows Terminal CLI window.');
        } else {
          addLine('error', 'Could not spawn external terminal window.');
        }
        break;
      }

      case 'status':
        addLine(
          'system',
          `Local AI Connection Status:
  Status: ${connectionInfo.status.toUpperCase()}
  Model: ${connectionInfo.modelName || 'Gemma (Auto-select)'}
  Endpoint: ${connectionInfo.endpoint}
  Available Models: ${connectionInfo.availableModels.join(', ') || 'None reported'}`
        );
        break;

      case 'talk':
        if (args) {
          await executeReflection('talk', args);
        } else {
          setCurrentMode('talk');
          addLine(
            'system',
            `Entered TALK mode. Say what's on your mind.\n(Type 'back' or 'exit' to return to unsaid> prompt)`
          );
        }
        break;

      case 'unload':
        if (args) {
          await executeReflection('unload', args);
        } else {
          setCurrentMode('unload');
          addLine(
            'system',
            `Entered UNLOAD mode. Dump your thoughts freely without problem-solving.\n(Type 'back' to return to unsaid> prompt)`
          );
        }
        break;

      case 'unsaid':
        if (args) {
          await executeReflection('unsaid', args);
        } else {
          setCurrentMode('unsaid');
          addLine(
            'system',
            `Entered UNSAID mode. Explore words you wish you could tell someone.\n(Type 'back' to return to unsaid> prompt)`
          );
        }
        break;

      case 'sound': {
        const soundType = args.toLowerCase() as SoundscapeType;
        if (['rain', 'hearth', 'drone', 'off'].includes(soundType)) {
          ambientSound.play(soundType);
          addLine('success', `Ambient soundscape set to: ${soundType.toUpperCase()}`);
        } else {
          addLine('error', `Usage: sound [rain | hearth | drone | off]`);
        }
        break;
      }

      case 'lock':
        if (onLockApp) {
          onLockApp();
        } else {
          addLine('system', 'App Lock can be configured in Settings.');
        }
        break;

      case 'gui':
        onOpenGUI();
        break;

      case 'clear':
      case 'cls':
        setLines([]);
        break;

      case 'exit':
      case 'quit':
        onExitShell();
        break;

      default:
        addLine('error', `Command not found: "${cmd}". Type "help" for a list of commands.`);
        break;
    }
  };

  const executeReflection = async (mode: Mode, userText: string) => {
    // 1. Safety check
    const safety = checkSafety(userText);
    if (!safety.isSafe) {
      addLine(
        'error',
        `[SAFETY NOTICE] You are not alone, and support is available right now.
Unsaid is an automated reflection tool, not clinical care.
  • US & Canada: Call or text 988 (Free 24/7 Crisis Lifeline)
  • Crisis Text Line: Text HOME to 741741
  • UK: Call 111 (NHS) or 116 123 (Samaritans)
  • International: https://findahelpline.com`
      );
      return;
    }

    // 2. Guardrails check
    const guard = checkPromptGuardrails(userText);
    if (!guard.passed) {
      addLine('system', guard.calmResponse || 'Unsaid operates strictly as a personal reflection space.');
      return;
    }

    // 3. PII masking if set in settings
    const settings = loadSettings();
    const processedText = settings.maskPII ? maskPII(userText).maskedText : userText;

    setIsReflecting(true);
    try {
      const response = await generateReflection(
        mode,
        [{ id: 'msg_' + Date.now(), role: 'user', content: processedText, timestamp: Date.now() }],
        settings
      );
      addLine('response', response, `Unsaid [${mode.toUpperCase()}]:`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLine('error', `Error reaching local Gemma model: ${msg}`);
    } finally {
      setIsReflecting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (history.length > 0 && historyIdx !== -1) {
        const nextIdx = historyIdx + 1;
        if (nextIdx >= history.length) {
          setHistoryIdx(-1);
          setInput('');
        } else {
          setHistoryIdx(nextIdx);
          setInput(history[nextIdx] || '');
        }
      }
    }
  };

  const promptPrefix = currentMode ? `unsaid:${currentMode}>` : 'unsaid>';

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="w-full max-w-5xl mx-auto h-[calc(100vh-80px)] flex flex-col p-3 sm:p-6 font-mono text-xs sm:text-[13px] bg-[#0c0d11] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-4"
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-zinc-400 font-semibold ml-2 flex items-center gap-1.5">
            <TerminalIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>unsaid-shell — gemma@localhost:1234</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              const res = await syncWithDiskBridge();
              if (res.success) {
                addLine('success', `Synced ${res.count} reflections with disk bridge.`);
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] transition"
            title="Sync reflections with ~/.unsaid/reflections.json"
          >
            <RefreshCw className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Sync</span>
          </button>
          <button
            onClick={async () => {
              const ok = await launchExternalTerminal();
              if (ok) {
                addLine('success', 'Spawned external native Windows Terminal CLI window.');
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 text-[11px] transition"
            title="Open standalone external Windows Terminal CLI"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Pop Out CLI</span>
          </button>
          <button
            onClick={onOpenGUI}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] transition"
            title="Switch back to Graphical UI"
          >
            <span>GUI Mode</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
          <button
            onClick={onExitShell}
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition"
            title="Close shell"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 selection:bg-amber-500/30 selection:text-amber-100">
        {lines.map((line) => {
          if (line.type === 'banner') {
            return (
              <pre key={line.id} className="text-amber-400/90 whitespace-pre font-mono leading-tight">
                {line.content}
              </pre>
            );
          }

          if (line.type === 'prompt') {
            return (
              <div key={line.id} className="flex gap-2 text-zinc-200">
                <span className="text-amber-400 font-semibold shrink-0 select-none">
                  {line.prefix || 'unsaid>'}
                </span>
                <span className="text-zinc-100">{line.content}</span>
              </div>
            );
          }

          if (line.type === 'response') {
            return (
              <div key={line.id} className="my-2 p-3.5 rounded-xl bg-[#14151e] border border-zinc-800/80 space-y-1">
                {line.prefix && (
                  <span className="text-purple-300 font-semibold block text-[11px]">
                    {line.prefix}
                  </span>
                )}
                <div className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {line.content}
                </div>
              </div>
            );
          }

          if (line.type === 'error') {
            return (
              <div key={line.id} className="text-rose-400 whitespace-pre-wrap py-1">
                {line.content}
              </div>
            );
          }

          if (line.type === 'success') {
            return (
              <div key={line.id} className="text-emerald-400 whitespace-pre-wrap py-0.5">
                {line.content}
              </div>
            );
          }

          return (
            <div key={line.id} className="text-zinc-400 whitespace-pre-wrap py-0.5 leading-relaxed">
              {line.content}
            </div>
          );
        })}

        {isReflecting && (
          <div className="flex items-center gap-2 text-amber-300/80 py-1">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span className="animate-pulse">Gemma is reflecting...</span>
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Input Line */}
      <div className="pt-2 border-t border-zinc-800/80 shrink-0 flex items-center gap-2">
        <span
          className={`font-semibold shrink-0 select-none ${
            currentMode === 'talk'
              ? 'text-amber-400'
              : currentMode === 'unload'
              ? 'text-sky-400'
              : currentMode === 'unsaid'
              ? 'text-purple-400'
              : 'text-amber-400'
          }`}
        >
          {promptPrefix}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isReflecting}
          placeholder={
            currentMode ? `Type your reflection in ${currentMode.toUpperCase()} mode...` : `Type a command or 'talk', 'unload', 'unsaid'...`
          }
          className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-600 focus:outline-none font-mono"
        />
      </div>
    </div>
  );
};
