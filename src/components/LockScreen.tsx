import React, { useState } from 'react';
import { verifyAppLockPin } from '../safety/appLock';
import { Lock, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setIsVerifying(true);
    setError(false);

    try {
      const isValid = await verifyAppLockPin(pin);
      if (isValid) {
        onUnlock();
      } else {
        setError(true);
        setPin('');
      }
    } catch {
      setError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0e12] p-4">
      {/* Ambient background */}
      <div className="absolute inset-0 ambient-glow opacity-80" />

      <div className="relative w-full max-w-sm rounded-2xl bg-[#13141a] border border-zinc-800 p-8 shadow-2xl text-center space-y-6">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300">
          <Lock className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="font-serif-reflect text-2xl font-semibold text-zinc-100 flex items-center justify-center gap-2">
            <span>Unsaid</span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </h2>
          <p className="text-xs text-zinc-400">
            This space is locked. Enter your PIN to continue your reflections.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full text-center tracking-[0.4em] font-mono text-xl bg-[#1a1b24] border border-zinc-700/80 focus:border-amber-400/80 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Incorrect PIN. Please try again.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!pin.trim() || isVerifying}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs disabled:opacity-50 transition shadow-xs"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isVerifying ? 'Unlocking...' : 'Unlock Room'}</span>
          </button>
        </form>

        <p className="text-[11px] text-zinc-500">
          PIN is stored as a SHA-256 hash strictly inside your local browser.
        </p>
      </div>
    </div>
  );
};
