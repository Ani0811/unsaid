import React, { useState } from 'react';
import type { Settings, ConnectionInfo } from '../types';
import {
  X,
  Cpu,
  Shield,
  Info,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
  connectionInfo: ConnectionInfo;
  isTestingConnection: boolean;
  onTestConnection: () => void;
  onDeleteAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  connectionInfo,
  isTestingConnection,
  onTestConnection,
  onDeleteAllData
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'privacy' | 'about'>('ai');
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const isConnected = connectionInfo.status === 'connected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-[#121319] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h3 className="font-serif-reflect text-lg font-semibold text-zinc-100">
              Settings & Privacy
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800/80 px-6 bg-[#0f1015]">
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
              activeTab === 'ai'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Local AI (LM Studio)</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
              activeTab === 'privacy'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy & Storage</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
              activeTab === 'about'
                ? 'border-purple-400 text-purple-300 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About Unsaid</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-zinc-300">
          {activeTab === 'ai' && (
            <div className="space-y-5">
              {/* Connection Status Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                  isConnected
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isConnected ? 'bg-emerald-400' : 'bg-zinc-500'
                    }`}
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">
                      {isConnected ? '● Local AI connected' : '○ Local AI offline'}
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {isConnected
                        ? `Gemma · LM Studio (${connectionInfo.modelName || 'Ready'})`
                        : 'Start LM Studio and start the local server on port 1234'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onTestConnection}
                  disabled={isTestingConnection}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                  <span>Test Connection</span>
                </button>
              </div>

              {/* Base URL Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  LM Studio Base URL
                </label>
                <input
                  type="text"
                  value={localSettings.baseUrl}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, baseUrl: e.target.value })
                  }
                  placeholder="http://localhost:1234/v1"
                  className="w-full bg-[#181922] border border-zinc-800 focus:border-zinc-600 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none"
                />
                <p className="text-[11px] text-zinc-500">
                  Default LM Studio OpenAI-compatible endpoint is{' '}
                  <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-400">
                    http://localhost:1234/v1
                  </code>
                </p>
              </div>

              {/* Model selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">
                    Gemma Model Identifier
                  </label>
                  {connectionInfo.availableModels.length > 0 && (
                    <span className="text-[11px] text-emerald-400 font-mono">
                      {connectionInfo.availableModels.length} models detected
                    </span>
                  )}
                </div>

                {connectionInfo.availableModels.length > 0 ? (
                  <select
                    value={localSettings.model}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, model: e.target.value })
                    }
                    className="w-full bg-[#181922] border border-zinc-800 focus:border-zinc-600 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none"
                  >
                    <option value="">-- Auto-select loaded model --</option>
                    {connectionInfo.availableModels.map((m) => (
                      <option key={m} value={m}>
                        {m} {m.toLowerCase().includes('gemma') ? '★ (Gemma)' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={localSettings.model}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, model: e.target.value })
                    }
                    placeholder="e.g. gemma-2-2b-it or gemma-2-9b-it"
                    className="w-full bg-[#181922] border border-zinc-800 focus:border-zinc-600 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none"
                  />
                )}
                <p className="text-[11px] text-zinc-500">
                  Recommended: <code className="text-zinc-400">gemma-2-2b-it</code>, <code className="text-zinc-400">gemma-2-9b-it</code>, or <code className="text-zinc-400">gemma-3-1b-it</code>.
                </p>
              </div>

              {/* Temperature */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-zinc-300">
                    Reflection Temperature
                  </label>
                  <span className="text-zinc-400 font-mono">{localSettings.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={localSettings.temperature}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      temperature: parseFloat(e.target.value)
                    })
                  }
                  className="w-full accent-amber-400"
                />
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>More grounded (0.2)</span>
                  <span>More exploratory (1.0)</span>
                </div>
              </div>

              {/* Proxy toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div>
                  <span className="text-xs font-medium text-zinc-200 block">
                    Use Vite Dev Proxy
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Forwards local requests to avoid browser CORS restrictions.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.useProxy}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, useProxy: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                />
              </div>

              {/* Demo Mode Fallback toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div>
                  <span className="text-xs font-medium text-zinc-200 block">
                    Offline Preview Simulator
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    Generates calm simulated reflections when LM Studio is not active.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.demoModeFallback}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, demoModeFallback: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-zinc-300 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-emerald-300">
                  <Shield className="w-4 h-4" />
                  <span>Private by design. Your reflections stay on this device.</span>
                </div>
                <p className="leading-relaxed text-zinc-400">
                  Unsaid does not require an account, has zero analytics or telemetry, and connects only to your local LM Studio instance on your computer. Your conversations are saved locally in your browser’s <code className="text-zinc-300">localStorage</code>.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Storage Management
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  You can purge all conversation history and stored preferences at any time.
                </p>

                {showDeleteConfirm ? (
                  <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-3">
                    <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Are you absolutely sure you want to delete all local data?</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      This will erase all past reflections, active sessions, and custom settings stored on this browser. This cannot be undone.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onDeleteAllData();
                          setShowDeleteConfirm(false);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 shadow-xs"
                      >
                        Yes, permanently delete all
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete all local data</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4 text-xs leading-relaxed text-zinc-400">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <h4 className="font-serif-reflect text-base font-semibold text-zinc-100">
                  Unsaid
                </h4>
                <p className="text-zinc-300 italic">
                  “A private place for the things you don't know how to say out loud.”
                </p>
                <p>
                  Built for the <strong>Hacktoberfest 2026 Weekend Challenge: “Build for a Friend.”</strong>
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-zinc-200">Why Local AI?</h5>
                <p>
                  The things we hesitate to say out loud are often our most vulnerable thoughts. Sending them to a cloud AI SaaS platform means trusting third-party servers, training pipelines, and data brokers. Unsaid runs an open Gemma model completely offline via LM Studio, keeping every word strictly on your hardware.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-zinc-200">Important Positioning & Boundaries</h5>
                <p>
                  Unsaid is <strong>not</strong> an AI therapist, counselor, psychologist, medical application, or diagnostic system. It does not provide psychological classifications or pretend to know what someone else secretly thinks. It is a calm, reflective space to organize your own perspective.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800/80 bg-[#0e0f14] flex items-center justify-between">
          <div>
            {savedNotice && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Settings saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition"
            >
              Close
            </button>
            {activeTab === 'ai' && (
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white transition shadow-xs"
              >
                Save Settings
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
