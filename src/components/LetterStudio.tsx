import React, { useState } from 'react';
import type { Message } from '../types';
import { X, Copy, Check, Download, Flame, Eye, Sparkles } from 'lucide-react';

interface LetterStudioProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
}

export const LetterStudio: React.FC<LetterStudioProps> = ({ isOpen, onClose, messages }) => {
  // Generate initial draft from messages
  const userThoughts = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join('\n\n');

  const [recipient, setRecipient] = useState('Someone who mattered');
  const [letterBody, setLetterBody] = useState(
    userThoughts ||
      'I wanted to write this because keeping it in my head was taking up too much room.\n\nThere are things that happened that I never found the right words for. I don\'t need you to fix it or agree with me, but I needed to be honest with myself about how much it impacted me.'
  );
  const [facts, setFacts] = useState('We stopped talking after what happened in autumn.');
  const [assumptions, setAssumptions] = useState('Assuming you never cared or that it was easy for you to move on.');
  const [copied, setCopied] = useState(false);
  const [burned, setBurned] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    const fullText = `Dear ${recipient},\n\n${letterBody}\n\n---\nPerspective Check:\n• Known Fact: ${facts}\n• Assumption/Uncertainty: ${assumptions}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const fullText = `Dear ${recipient},\n\n${letterBody}\n\n---\nPerspective Check:\n• Known Fact: ${facts}\n• Assumption/Uncertainty: ${assumptions}\n\n(Drafted privately with Unsaid)`;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unsent-letter-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBurn = () => {
    setBurned(true);
    setTimeout(() => {
      setBurned(false);
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Studio Window */}
      <div
        className={`relative w-full max-w-2xl bg-[#13141b] border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col z-10 max-h-[92vh] overflow-hidden transition-all duration-700 ${
          burned ? 'scale-95 opacity-0 brightness-150 filter blur-xs' : ''
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#101117]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-reflect text-base font-semibold text-zinc-100">
                Unsaid Letter & Perspective Studio
              </h3>
              <p className="text-[11px] text-zinc-400">
                Turn your reflection into an unsent letter. Decide what belongs to you, and what belongs to them.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Recipient */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400">Dear / Addressed to:</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. My old friend, Mom, My boss, etc."
              className="w-full bg-[#181923] border border-zinc-800 focus:border-purple-500/50 rounded-xl px-3.5 py-2 text-zinc-200 text-xs font-serif-reflect italic focus:outline-none"
            />
          </div>

          {/* Letter Body */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-zinc-400">
                The Words (Unsent draft)
              </label>
              <span className="text-[11px] text-zinc-500">You never have to send this</span>
            </div>
            <textarea
              rows={7}
              value={letterBody}
              onChange={(e) => setLetterBody(e.target.value)}
              placeholder="Write the honest words here..."
              className="w-full bg-[#181923] border border-zinc-800 focus:border-purple-500/50 rounded-xl p-3.5 text-zinc-200 text-xs leading-relaxed focus:outline-none resize-none font-serif-reflect"
            />
          </div>

          {/* Perspective Check: Facts vs Assumptions */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              <span>Perspective & Reality Check</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 block font-medium">
                  What I know for sure (Observed Facts)
                </label>
                <textarea
                  rows={2}
                  value={facts}
                  onChange={(e) => setFacts(e.target.value)}
                  placeholder="Concrete things said or done..."
                  className="w-full bg-[#14151e] border border-zinc-800 rounded-lg p-2 text-zinc-300 text-[11px] focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 block font-medium">
                  What I am assuming (Their mind / intent)
                </label>
                <textarea
                  rows={2}
                  value={assumptions}
                  onChange={(e) => setAssumptions(e.target.value)}
                  placeholder="What I fear they think or felt..."
                  className="w-full bg-[#14151e] border border-zinc-800 rounded-lg p-2 text-zinc-300 text-[11px] focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-[#101117] flex items-center justify-between">
          <button
            onClick={handleBurn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-rose-400 hover:text-rose-200 hover:bg-rose-950/30 border border-rose-500/20 transition"
            title="Perform a symbolic release (clear draft and close)"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Burn / Release</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Text</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
