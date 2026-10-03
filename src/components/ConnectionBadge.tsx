import React from 'react';
import type { ConnectionInfo } from '../types';
import { RefreshCw, Server, CheckCircle2, AlertCircle } from 'lucide-react';

interface ConnectionBadgeProps {
  info: ConnectionInfo;
  isTesting: boolean;
  onTestConnection: () => void;
  onOpenSettings?: () => void;
  compact?: boolean;
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({
  info,
  isTesting,
  onTestConnection,
  onOpenSettings,
  compact = false
}) => {
  const isConnected = info.status === 'connected';

  if (compact) {
    return (
      <button
        onClick={onOpenSettings}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
          isConnected
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:border-emerald-500/50'
            : 'bg-zinc-900/60 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
        }`}
        title={isConnected ? `Connected to LM Studio (${info.modelName})` : 'LM Studio is offline'}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
          }`}
        />
        <span className="truncate max-w-[120px]">
          {isConnected ? (info.isGemmaDetected ? 'Gemma · LM Studio' : info.modelName || 'Local AI') : 'Offline'}
        </span>
      </button>
    );
  }

  return (
    <div
      className={`rounded-xl p-4 border transition-all duration-200 ${
        isConnected
          ? 'bg-emerald-950/20 border-emerald-500/30 text-zinc-300'
          : 'bg-[#18181f]/80 border-zinc-800 text-zinc-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 p-2 rounded-lg ${
              isConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {isConnected ? <CheckCircle2 className="w-5 h-5" /> : <Server className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-zinc-500'
                }`}
              />
              <h4 className="text-sm font-semibold tracking-wide">
                {isConnected ? '● Local AI connected' : '○ Local AI offline'}
              </h4>
            </div>

            {isConnected ? (
              <p className="text-xs text-emerald-300/80 mt-1 font-mono">
                {info.isGemmaDetected ? 'Gemma · LM Studio' : `${info.modelName || 'Loaded Model'} · LM Studio`}
              </p>
            ) : (
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed max-w-sm">
                Start LM Studio, load your Gemma model, and start the local server on{' '}
                <code className="text-zinc-300 bg-zinc-800/80 px-1 py-0.5 rounded text-[11px]">localhost:1234</code>.
              </p>
            )}

            {info.error && !isConnected && (
              <div className="mt-2 text-xs text-amber-400/90 flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1.5 rounded-md border border-amber-500/20">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{info.error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onTestConnection}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition disabled:opacity-50"
            title="Check LM Studio connection"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Checking...' : 'Test Connection'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
