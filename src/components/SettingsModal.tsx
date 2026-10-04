import React, { useState, useRef } from 'react';
import type { Settings, ConnectionInfo } from '../types';
import {
  isAppLockConfigured,
  setAppLockPin,
  removeAppLockPin,
  getAutoLockMinutes,
  setAutoLockMinutes
} from '../safety/appLock';
import { downloadBackupFile, restoreBackupData } from '../storage/backup';
import {
  X,
  Cpu,
  Shield,
  Info,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Download,
  Upload,
  EyeOff,
  Radio,
  Mic,
  Sparkles,
  Check
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
  onRefreshData?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  connectionInfo,
  isTestingConnection,
  onTestConnection,
  onDeleteAllData,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'voice' | 'security' | 'privacy' | 'about'>('ai');
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Handy Voice Model state
  const [handyData, setHandyData] = useState<{
    installed: boolean;
    selectedModel: string;
    postProcessConnected: boolean;
    postProcessEnabled: boolean;
    downloadedModels: any[];
    recommendedModels: any[];
  } | null>(null);
  const [isUpdatingHandy, setIsUpdatingHandy] = useState(false);
  const [handyNotice, setHandyNotice] = useState<string | null>(null);

  // App Lock local state
  const [hasPin, setHasPin] = useState(isAppLockConfigured);
  const [newPin, setNewPin] = useState('');
  const [pinNotice, setPinNotice] = useState<string | null>(null);
  const [autoLockMin, setAutoLockMin] = useState(getAutoLockMinutes);

  // Restore state
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Handy models when modal opens or voice tab is active
  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/handy/models')
        .then((r) => r.json())
        .then((d) => setHandyData(d))
        .catch(() => {});
    }
  }, [isOpen, activeTab]);

  const handleSelectHandyModel = async (modelId: string) => {
    setIsUpdatingHandy(true);
    try {
      const res = await fetch('/api/handy/select-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId })
      });
      const data = await res.json();
      if (data.success) {
        setHandyData((prev) => (prev ? { ...prev, selectedModel: modelId } : null));
        setHandyNotice('Voice model updated in Handy!');
        setTimeout(() => setHandyNotice(null), 3000);
      }
    } catch {
      setHandyNotice('Failed to update Handy model.');
    } finally {
      setIsUpdatingHandy(false);
    }
  };

  const handleConnectLMStudioToHandy = async () => {
    setIsUpdatingHandy(true);
    try {
      const res = await fetch('/api/handy/connect-lmstudio', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setHandyData((prev) =>
          prev ? { ...prev, postProcessConnected: true, postProcessEnabled: true } : null
        );
        setHandyNotice('Handy connected to LM Studio (google/gemma-3-4b)!');
        setTimeout(() => setHandyNotice(null), 4000);
      }
    } catch {
      setHandyNotice('Failed to connect Handy to LM Studio.');
    } finally {
      setIsUpdatingHandy(false);
    }
  };

  const handleToggleHandy = async () => {
    try {
      await fetch('/api/handy/toggle', { method: 'POST' });
      setHandyNotice('Triggered Handy voice dictation. Speak now!');
      setTimeout(() => setHandyNotice(null), 3500);
    } catch {
      setHandyNotice('Failed to trigger Handy.');
    }
  };

  const handleLaunchHandy = async () => {
    try {
      await fetch('/api/handy/launch', { method: 'POST' });
      setHandyNotice('Handy launched in background.');
      setTimeout(() => setHandyNotice(null), 3000);
    } catch {
      setHandyNotice('Failed to launch Handy.');
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const isConnected = connectionInfo.status === 'connected';

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length < 4) {
      setPinNotice('PIN must be at least 4 digits');
      return;
    }
    await setAppLockPin(newPin.trim());
    setHasPin(true);
    setNewPin('');
    setPinNotice('PIN set successfully. App lock is now active.');
    setTimeout(() => setPinNotice(null), 3000);
  };

  const handleRemovePin = () => {
    removeAppLockPin();
    setHasPin(false);
    setPinNotice('PIN removed. App lock disabled.');
    setTimeout(() => setPinNotice(null), 3000);
  };

  const handleAutoLockChange = (min: number) => {
    setAutoLockMin(min);
    setAutoLockMinutes(min);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = restoreBackupData(content);
      if (res.success) {
        setRestoreNotice(`Restored ${res.count} reflection(s) successfully.`);
        if (onRefreshData) onRefreshData();
      } else {
        setRestoreNotice(`Restore failed: ${res.error || 'Invalid file format'}`);
      }
      setTimeout(() => setRestoreNotice(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-[#121319] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h3 className="font-serif-reflect text-lg font-semibold text-zinc-100">
              Settings, Security & Privacy
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
        <div className="flex border-b border-zinc-800/80 px-6 bg-[#0f1015] overflow-x-auto">
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-2 transition shrink-0 ${
              activeTab === 'ai'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Local AI</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-2 transition shrink-0 ${
              activeTab === 'voice'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Voice & Handy</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-2 transition shrink-0 ${
              activeTab === 'security'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security & Guardrails</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-2 transition shrink-0 ${
              activeTab === 'privacy'
                ? 'border-purple-400 text-purple-300 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Backup & Storage</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 px-3 text-xs font-medium border-b-2 flex items-center gap-2 transition shrink-0 ${
              activeTab === 'about'
                ? 'border-zinc-400 text-zinc-200 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About</span>
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

          {activeTab === 'voice' && (
            <div className="space-y-6">
              {/* Notice */}
              {handyNotice && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{handyNotice}</span>
                  </div>
                </div>
              )}

              {/* Handy App Status */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                    <Radio className="w-4 h-4 text-amber-400" />
                    <span>Handy (Open Source Voice Dictation)</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      handyData?.installed
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {handyData?.installed ? 'Installed & Ready' : 'Not Installed'}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Handy (<code className="font-mono text-zinc-300">cjpais/Handy</code>) runs local Whisper & Parakeet voice models offline with GPU/CPU acceleration.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <span className="text-zinc-500">Global Shortcut:</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-zinc-700 text-amber-300 font-mono text-[11px]">
                      Ctrl + Space
                    </kbd>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={handleToggleHandy}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-medium border border-amber-500/30 transition flex items-center gap-1"
                      title="Trigger Handy dictation"
                    >
                      <Mic className="w-3 h-3" />
                      <span>Test Dictate</span>
                    </button>
                    <button
                      onClick={handleLaunchHandy}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
                      title="Launch Handy"
                    >
                      Launch App
                    </button>
                  </div>
                </div>
              </div>

              {/* Voice Models Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Select Voice Recognition Model</span>
                  </label>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {handyData?.recommendedModels?.length || 0} Models
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {(handyData?.recommendedModels || []).map((m: any) => {
                    const isSelected = handyData?.selectedModel === m.id;

                    return (
                      <div
                        key={m.id}
                        className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20'
                            : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-200">
                              {m.name}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.2 bg-black/30 rounded border border-zinc-800">
                              {m.size_mb} MB
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/30">
                                Active Model
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {m.description}
                          </p>
                        </div>

                        <button
                          disabled={isSelected || isUpdatingHandy}
                          onClick={() => handleSelectHandyModel(m.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                          }`}
                        >
                          {isSelected ? (
                            <span className="flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Selected</span>
                            </span>
                          ) : (
                            'Connect Model'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Connect Handy to LM Studio Gemma */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/5 to-purple-500/5 border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Handy + LM Studio AI Post-Processor</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      handyData?.postProcessConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {handyData?.postProcessConnected ? 'Connected (Gemma 3 4B)' : 'Not Connected'}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  When you dictate with <kbd className="px-1.5 py-0.2 rounded bg-black/40 text-amber-300 font-mono text-[10px]">Ctrl+Shift+Space</kbd>, Handy can automatically send the raw speech transcript to your local LM Studio instance (<code className="font-mono text-zinc-300">google/gemma-3-4b</code>) to reframe racing thoughts into calm reflection.
                </p>

                <button
                  disabled={isUpdatingHandy}
                  onClick={handleConnectLMStudioToHandy}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{handyData?.postProcessConnected ? 'Re-Sync with LM Studio' : 'Connect Handy to LM Studio'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* App Lock PIN Section */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Local App Lock (PIN Protection)</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      hasPin
                        ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10'
                        : 'border-zinc-700 text-zinc-500'
                    }`}
                  >
                    {hasPin ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Require a PIN to view your reflections whenever you step away or reopen the room.
                </p>

                {hasPin ? (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Auto-lock after inactivity:</span>
                      <select
                        value={autoLockMin}
                        onChange={(e) => handleAutoLockChange(parseInt(e.target.value, 10))}
                        className="bg-[#181922] border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-300"
                      >
                        <option value={1}>1 minute</option>
                        <option value={5}>5 minutes</option>
                        <option value={15}>15 minutes</option>
                        <option value={60}>1 hour</option>
                      </select>
                    </div>

                    <button
                      onClick={handleRemovePin}
                      className="text-xs px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-950/20 transition"
                    >
                      Remove PIN
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSetPin} className="flex gap-2 pt-1">
                    <input
                      type="password"
                      maxLength={8}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="Set 4-8 digit PIN"
                      className="bg-[#181922] border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 font-mono tracking-widest focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newPin.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs disabled:opacity-50 transition"
                    >
                      Enable Lock
                    </button>
                  </form>
                )}

                {pinNotice && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{pinNotice}</span>
                  </p>
                )}
              </div>

              {/* PII Masking Section */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                    <EyeOff className="w-4 h-4 text-purple-400" />
                    <span>Identity & PII Masker</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.maskPII ?? false}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, maskPII: e.target.checked })
                    }
                    className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                  />
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Automatically scrubs personal identifiers (emails, phone numbers, and direct ID numbers) into generic placeholders before processing.
                </p>
              </div>

              {/* Prompt Injection & Guardrails Status */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Boundary & Jailbreak Defense</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Active by default. Prevents adversarial prompt injections, system boundary overrides, and clinical diagnosis impersonation.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              {/* Backup & Restore */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Backup & Restore Reflections
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Export all your private reflections and settings as a clean JSON file, or restore a previous archive.
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={downloadBackupFile}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Backup (JSON)</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Restore Backup</span>
                  </button>
                </div>

                {restoreNotice && (
                  <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{restoreNotice}</span>
                  </p>
                )}
              </div>

              {/* Data Purge */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Storage Management
                </h4>
                {showDeleteConfirm ? (
                  <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-3">
                    <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Are you absolutely sure you want to delete all local data?</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      This will erase all past reflections, active sessions, and custom settings stored on this browser.
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
                  The things we hesitate to say out loud are often our most vulnerable thoughts. Sending them to a cloud AI SaaS platform means trusting third-party servers and cloud providers. Unsaid runs open Gemma weights completely offline via LM Studio, keeping every word strictly on your hardware.
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
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white transition shadow-xs"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
