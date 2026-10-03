import { useState, useEffect, useCallback, useRef } from 'react';
import type { Mode, Message, Conversation, Settings, ConnectionInfo } from './types';
import { MODES } from './modes';
import {
  loadSettings,
  saveSettings,
  loadConversations,
  saveConversation,
  deleteConversation,
  getActiveConversationId,
  setActiveConversationId,
  clearActiveConversationId,
  deleteAllData
} from './storage/localStorage';
import { testLMStudioConnection, generateReflection } from './ai/client';
import { checkSafety } from './safety/detector';
import { checkPromptGuardrails } from './safety/guardrails';
import { maskPII } from './safety/pii';
import { isAppLockConfigured, getAutoLockMinutes } from './safety/appLock';
import { Header } from './components/Header';
import { Landing } from './components/Landing';
import { ChatInterface } from './components/ChatInterface';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SettingsModal } from './components/SettingsModal';
import { LockScreen } from './components/LockScreen';
import { DocsHub } from './components/DocsHub';
import { AlertCircle, X } from 'lucide-react';

function createUniqueId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function createConversation(selectedMode: Mode, initialStarter?: string): Conversation {
  const now = Date.now();
  const modeConfig = MODES[selectedMode];
  return {
    id: createUniqueId('convo'),
    title: initialStarter ? initialStarter.slice(0, 48) + '...' : `New ${modeConfig.name} Reflection`,
    mode: selectedMode,
    messages: [],
    createdAt: now,
    updatedAt: now
  };
}

export function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);

  const [activeConvoId, setActiveConvoId] = useState<string | null>(() => getActiveConversationId());
  const [currentMode, setCurrentMode] = useState<Mode | null>(() => {
    const activeId = getActiveConversationId();
    if (!activeId) return null;
    const found = loadConversations().find((c) => c.id === activeId);
    return found ? found.mode : null;
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    const activeId = getActiveConversationId();
    if (!activeId) return [];
    const found = loadConversations().find((c) => c.id === activeId);
    return found ? found.messages : [];
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // App Lock state
  const [isLocked, setIsLocked] = useState<boolean>(() => isAppLockConfigured());
  const autoLockTimerRef = useRef<number | null>(null);

  // Connection testing state
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    status: 'checking',
    modelName: settings.model || 'Gemma',
    endpoint: settings.baseUrl,
    availableModels: []
  });

  // Test connection to LM Studio
  const runConnectionCheck = useCallback(
    async (customSettings?: Settings) => {
      setIsTestingConnection(true);
      try {
        const info = await testLMStudioConnection(customSettings || settings);
        setConnectionInfo(info);
      } catch (err) {
        console.warn('Connection check failed:', err);
      } finally {
        setIsTestingConnection(false);
      }
    },
    [settings]
  );

  // Initial connection test on mount
  useEffect(() => {
    let isMounted = true;
    testLMStudioConnection(settings).then((info) => {
      if (isMounted) {
        setConnectionInfo(info);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [settings]);

  // Auto-lock inactivity listener
  useEffect(() => {
    if (!isAppLockConfigured()) return;

    const resetTimer = () => {
      if (autoLockTimerRef.current) {
        window.clearTimeout(autoLockTimerRef.current);
      }
      const timeoutMs = getAutoLockMinutes() * 60 * 1000;
      autoLockTimerRef.current = window.setTimeout(() => {
        setIsLocked(true);
      }, timeoutMs);
    };

    resetTimer();
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);

    return () => {
      if (autoLockTimerRef.current) {
        window.clearTimeout(autoLockTimerRef.current);
      }
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, []);

  // Handle Mode Selection / Starting a Reflection
  const handleSelectMode = (selectedMode: Mode, initialStarter?: string) => {
    const newConvo = createConversation(selectedMode, initialStarter);

    setActiveConvoId(newConvo.id);
    setActiveConversationId(newConvo.id);
    setCurrentMode(selectedMode);
    setMessages([]);
    saveConversation(newConvo);
    setConversations(loadConversations());

    if (initialStarter) {
      handleSendMessage(initialStarter, newConvo);
    }
  };

  // Open an existing conversation
  const handleOpenConversation = (convo: Conversation) => {
    setActiveConvoId(convo.id);
    setActiveConversationId(convo.id);
    setCurrentMode(convo.mode);
    setMessages(convo.messages);
  };

  // Return to landing screen
  const handleNewReflection = () => {
    clearActiveConversationId();
    setActiveConvoId(null);
    setCurrentMode(null);
    setMessages([]);
    setConversations(loadConversations());
  };

  // Send message
  const handleSendMessage = async (rawText: string, overrideConvo?: Conversation) => {
    const convoId = overrideConvo?.id || activeConvoId;
    const mode = overrideConvo?.mode || currentMode || 'talk';

    if (!rawText.trim() || !convoId) return;

    // Apply PII masking if enabled
    const text = settings.maskPII ? maskPII(rawText).maskedText : rawText.trim();

    // 1. Imminent crisis / self-harm safety check
    const safety = checkSafety(text);

    const userMessage: Message = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    if (!safety.isSafe) {
      // Immediate safety response: halt regular generation
      const safetyResponse: Message = {
        id: 'safety_' + Date.now(),
        role: 'assistant',
        content: safety.guidanceMessage || '',
        timestamp: Date.now(),
        safetyFlag: true
      };

      const updated = [...messages, userMessage, safetyResponse];
      setMessages(updated);

      const targetConvo: Conversation = {
        id: convoId,
        title: messages.length === 0 ? text.slice(0, 40) + '...' : overrideConvo?.title || 'Reflection',
        mode,
        messages: updated,
        createdAt: overrideConvo?.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      saveConversation(targetConvo);
      setConversations(loadConversations());
      return;
    }

    // 2. Prompt injection & clinical boundary guardrail check
    const guardrail = checkPromptGuardrails(text);
    if (!guardrail.passed) {
      const guardrailResponse: Message = {
        id: 'guard_' + Date.now(),
        role: 'assistant',
        content: guardrail.calmResponse || 'Unsaid operates strictly as a personal reflection space.',
        timestamp: Date.now()
      };

      const updated = [...messages, userMessage, guardrailResponse];
      setMessages(updated);

      const targetConvo: Conversation = {
        id: convoId,
        title: messages.length === 0 ? text.slice(0, 40) + '...' : overrideConvo?.title || 'Reflection',
        mode,
        messages: updated,
        createdAt: overrideConvo?.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      saveConversation(targetConvo);
      setConversations(loadConversations());
      return;
    }

    // Normal safe flow
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Save user message immediately
    const firstTitle = messages.length === 0 ? text.slice(0, 45) + '...' : overrideConvo?.title || 'Reflection';
    const interimConvo: Conversation = {
      id: convoId,
      title: firstTitle,
      mode,
      messages: updatedMessages,
      createdAt: overrideConvo?.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    saveConversation(interimConvo);
    setConversations(loadConversations());

    setIsGenerating(true);
    setGlobalError(null);

    // Streaming placeholder assistant message
    const assistantMsgId = 'asst_' + Date.now();
    let accumulatedContent = '';

    try {
      await generateReflection(
        mode,
        updatedMessages,
        settings,
        (chunk) => {
          accumulatedContent = chunk;
          setMessages([...updatedMessages, {
            id: assistantMsgId,
            role: 'assistant',
            content: accumulatedContent,
            timestamp: Date.now()
          }]);
        }
      );

      const finalMessages: Message[] = [
        ...updatedMessages,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: accumulatedContent,
          timestamp: Date.now()
        }
      ];

      setMessages(finalMessages);

      const finalConvo: Conversation = {
        id: convoId,
        title: firstTitle,
        mode,
        messages: finalMessages,
        createdAt: overrideConvo?.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      saveConversation(finalConvo);
      setConversations(loadConversations());
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setGlobalError(errMsg);
      // Revert to messages before empty failed response
      setMessages(updatedMessages);
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear messages in active reflection
  const handleClearMessages = () => {
    if (!activeConvoId || !currentMode) return;
    const clearedConvo: Conversation = {
      id: activeConvoId,
      title: `Cleared ${MODES[currentMode].name} Reflection`,
      mode: currentMode,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setMessages([]);
    saveConversation(clearedConvo);
    setConversations(loadConversations());
  };

  // Switch mode of active reflection
  const handleSwitchMode = (newMode: Mode) => {
    if (!activeConvoId) {
      handleSelectMode(newMode);
      return;
    }
    setCurrentMode(newMode);
    const existing = conversations.find((c) => c.id === activeConvoId);
    if (existing) {
      const updated: Conversation = {
        ...existing,
        mode: newMode,
        updatedAt: Date.now()
      };
      saveConversation(updated);
      setConversations(loadConversations());
    }
  };

  // Delete single conversation
  const handleDeleteConversation = (id: string) => {
    deleteConversation(id);
    const updated = loadConversations();
    setConversations(updated);
    if (activeConvoId === id) {
      handleNewReflection();
    }
  };

  // Delete all data
  const handleDeleteAllData = () => {
    deleteAllData();
    setConversations([]);
    setActiveConvoId(null);
    setCurrentMode(null);
    setMessages([]);
    setSettings(loadSettings());
    runConnectionCheck();
  };

  // Save Settings from modal
  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    runConnectionCheck(newSettings);
  };

  // Refresh data from backup import
  const handleRefreshData = () => {
    setConversations(loadConversations());
    setSettings(loadSettings());
    const activeId = getActiveConversationId();
    if (activeId) {
      const found = loadConversations().find((c) => c.id === activeId);
      if (found) {
        setMessages(found.messages);
      }
    }
  };

  // Ambient glow selector
  const ambientClass = currentMode
    ? MODES[currentMode]?.glowClass || 'ambient-glow'
    : 'ambient-glow';

  // If App Lock is active
  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className={`min-h-screen flex flex-col bg-[#0d0e12] text-[#e2e1e8] transition-all duration-700 ${ambientClass}`}>
      {/* Top Header */}
      <Header
        currentMode={currentMode}
        onSelectMode={handleSwitchMode}
        onNewReflection={handleNewReflection}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        historyCount={conversations.length}
        connectionInfo={connectionInfo}
        isTestingConnection={isTestingConnection}
        onTestConnection={() => runConnectionCheck()}
        isLockConfigured={isAppLockConfigured()}
        onLockApp={() => setIsLocked(true)}
        isDocsOpen={isDocsOpen}
        onToggleDocs={() => setIsDocsOpen(!isDocsOpen)}
      />

      {/* Global Error Banner */}
      {globalError && (
        <div className="max-w-4xl mx-auto w-full px-4 pt-4">
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 flex items-start justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-100">Notice from Unsaid</p>
                <p className="text-amber-200/90 leading-relaxed">{globalError}</p>
              </div>
            </div>
            <button
              onClick={() => setGlobalError(null)}
              className="p-1 rounded-md text-amber-400 hover:text-amber-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">
        {isDocsOpen ? (
          <DocsHub
            onBackToApp={() => setIsDocsOpen(false)}
            onSelectMode={(mode) => {
              setIsDocsOpen(false);
              handleSelectMode(mode);
            }}
          />
        ) : !currentMode ? (
          <Landing
            onSelectMode={handleSelectMode}
            onOpenConversation={handleOpenConversation}
            recentConversations={conversations}
            connectionInfo={connectionInfo}
            isTestingConnection={isTestingConnection}
            onTestConnection={() => runConnectionCheck()}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenDocs={() => setIsDocsOpen(true)}
          />
        ) : (
          <ChatInterface
            mode={currentMode}
            messages={messages}
            isGenerating={isGenerating}
            onSendMessage={(content) => handleSendMessage(content)}
            onClearMessages={handleClearMessages}
            onSwitchMode={handleSwitchMode}
            connectionInfo={connectionInfo}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
      </main>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        conversations={conversations}
        activeId={activeConvoId}
        onSelectConversation={handleOpenConversation}
        onDeleteConversation={handleDeleteConversation}
        onDeleteAllData={handleDeleteAllData}
      />

      {/* Settings & Privacy Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        connectionInfo={connectionInfo}
        isTestingConnection={isTestingConnection}
        onTestConnection={() => runConnectionCheck()}
        onDeleteAllData={handleDeleteAllData}
        onRefreshData={handleRefreshData}
      />
    </div>
  );
}

export default App;
