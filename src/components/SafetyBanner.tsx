import React from 'react';
import { HeartHandshake, ExternalLink, ShieldAlert, X } from 'lucide-react';

interface SafetyBannerProps {
  onDismiss?: () => void;
}

export const SafetyBanner: React.FC<SafetyBannerProps> = ({ onDismiss }) => {
  return (
    <div className="my-4 rounded-xl border border-rose-500/40 bg-gradient-to-b from-rose-950/30 to-[#141014] p-5 text-zinc-200 shadow-lg relative">
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg transition"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-lg bg-rose-500/15 text-rose-300 shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-3 pr-4">
          <div>
            <h3 className="text-base font-semibold text-rose-100 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-rose-400" />
              You are not alone, and help is available right now
            </h3>
            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
              Unsaid is an automated personal reflection tool, not crisis or medical care. Because your life and well-being are what matter most, please step away from anything harmful and connect with a person or counselor who can support you this very moment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-rose-500/20 text-xs">
              <span className="font-semibold text-rose-300 block mb-0.5">United States & Canada</span>
              <p className="text-zinc-300">
                Call or text <strong className="text-rose-200 text-sm font-mono">988</strong> (24/7 Lifeline)
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-rose-500/20 text-xs">
              <span className="font-semibold text-rose-300 block mb-0.5">Crisis Text Line (Free 24/7)</span>
              <p className="text-zinc-300">
                Text <strong className="text-rose-200 text-sm font-mono">HOME</strong> to <strong className="text-rose-200 font-mono">741741</strong>
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-rose-500/20 text-xs">
              <span className="font-semibold text-rose-300 block mb-0.5">United Kingdom</span>
              <p className="text-zinc-300">
                Call <strong className="text-rose-200 font-mono">111</strong> (NHS) or <strong className="text-rose-200 font-mono">116 123</strong> (Samaritans)
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-rose-500/20 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-rose-300 block mb-0.5">International Help</span>
                <p className="text-zinc-300">Find free local helplines worldwide</p>
              </div>
              <a
                href="https://findahelpline.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-rose-300 hover:text-rose-100 underline decoration-rose-400/50 shrink-0 ml-2"
              >
                <span>Browse</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400 bg-black/30 px-3 py-2 rounded-lg border border-zinc-800">
            <strong>Immediate recommendation:</strong> Step away into a safe environment, take a slow breath, and reach out to a trusted friend, family member, or local emergency services.
          </div>
        </div>
      </div>
    </div>
  );
};
