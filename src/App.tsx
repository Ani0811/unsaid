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
import { DesktopSidebar } from './components/DesktopSidebar';
import { DesktopDashboard } from './components/DesktopDashboard';
import { DesktopStatusBar } from './components/DesktopStatusBar';
import { ChatInterface } from './components/ChatInterface';
import { SettingsModal } from './components/SettingsModal';
import { LockScreen } from './components/LockScreen';
import { DocsHub } from './components/DocsHub';
import { TerminalShell } from './components/TerminalShell';
import { syncWithDiskBridge, subscribeToBridgeEvents } from './storage/bridge';
import { AlertCircle, X, Terminal } from 'lucide-react';

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
    updatedAt: now,
    source: 'desktop_app'
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isShellOpen, setIsShellOpen] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [bridgeToast, setBridgeToast] = useState<{ id: string; title: string; convo: Conversation } | null>(null);

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

  // Open an existing conversation
  const handleOpenConversation = useCallback((convo: Conversation) => {
    setActiveConvoId(convo.id);
    setActiveConversationId(convo.id);
    setCurrentMode(convo.mode);
    setMessages(convo.messages);
    setIsShellOpen(false);
    setIsDocsOpen(false);
  }, []);

  // Return to desktop dashboard / new reflection
  const handleNewReflection = useCallback(() => {
    clearActiveConversationId();
    setActiveConvoId(null);
    setCurrentMode(null);
    setMessages([]);
    setIsShellOpen(false);
    setIsDocsOpen(false);
    setConversations(loadConversations());
  }, []);

  const activeConvoIdRef = useRef(activeConvoId);
  useEffect(() => {
    activeConvoIdRef.current = activeConvoId;
  }, [activeConvoId]);

  // Global Keyboard Shortcuts (Ctrl+N, Ctrl+B, Ctrl+K)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      // Ctrl + N: New reflection
      if (isCmdOrCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewReflection();
      }

      // Ctrl + B: Toggle sidebar
      if (isCmdOrCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [handleNewReflection]);

  // Initial connection test on mount & bridge sync with CLI shell
  useEffect(() => {
    let isMounted = true;
    testLMStudioConnection(settings).then((info) => {
      if (isMounted) {
        setConnectionInfo(info);
      }
    });

    // Synchronize reflections with CLI shell (~/.unsaid/reflections.json)
    syncWithDiskBridge().then((res) => {
      if (isMounted && res.success && res.data) {
        setConversations(loadConversations());
      }
    });

    // Subscribe to real-time events from terminal shell
    const unsubscribe = subscribeToBridgeEvents((event) => {
      if (!isMounted) return;
      const updated = loadConversations();
      setConversations(updated);

      if (event.convo && event.convo.id !== activeConvoIdRef.current) {
        setBridgeToast({
          id: event.convo.id,
          title: event.convo.title || 'New Reflection',
          convo: event.convo
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [settings]);

  // Deep-linking via URL query params (?convo=... or ?reflection=...)
  useEffect(() => {
    const handleUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get('convo') || params.get('reflection');
      if (targetId) {
        const list = loadConversations();
        const found = list.find((c) => c.id === targetId);
        if (found) {
          handleOpenConversation(found);
        }
      }
    };

    handleUrlParams();
    window.addEventListener('popstate', handleUrlParams);
    return () => window.removeEventListener('popstate', handleUrlParams);
  }, [handleOpenConversation]);

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
        title: messages.length === 0 ? text.slice(0, 48) : overrideConvo?.title || 'Reflection',
        mode: mode,
        messages: updated,
        createdAt: overrideConvo?.createdAt || Date.now(),
        updatedAt: Date.now(),
        source: 'desktop_app'
      };

      saveConversation(targetConvo);
      setConversations(loadConversations());
      return;
    }

    // 2. Clinical diagnosis / medical advice / boundary guardrails check
    const guardrail = checkPromptGuardrails(text);
    if (!guardrail.passed && guardrail.calmResponse) {
      const guardrailResponse: Message = {
        id: 'guardrail_' + Date.now(),
        role: 'assistant',
        content: guardrail.calmResponse,
        timestamp: Date.now(),
        safetyFlag: true
      };

      const updated = [...messages, userMessage, guardrailResponse];
      setMessages(updated);

      const targetConvo: Conversation = {
        id: convoId,
        title: messages.length === 0 ? text.slice(0, 48) : overrideConvo?.title || 'Reflection',
        mode: mode,
        messages: updated,
        createdAt: overrideConvo?.createdAt || Date.now(),
        updatedAt: Date.now(),
        source: 'desktop_app'
      };

      saveConversation(targetConvo);
      setConversations(loadConversations());
      return;
    }

    // Add user message to UI immediately
    const messagesWithUser = [...messages, userMessage];
    setMessages(messagesWithUser);
    setIsGenerating(true);
    setGlobalError(null);

    // Placeholder assistant message for streaming
    const assistantMessageId = 'msg_' + (Date.now() + 1);
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };

    let currentStreamedText = '';

    try {
      await generateReflection(
        mode,
        messagesWithUser,
        settings,
        (token) => {
          currentStreamedText += token;
          setMessages([...messagesWithUser, { ...initialAssistantMessage, content: currentStreamedText }]);
        }
      );

      // Final save after stream finishes
      const finalAssistantMessage: Message = {
        ...initialAssistantMessage,
        content: currentStreamedText
      };
      const finalMessages = [...messagesWithUser, finalAssistantMessage];
      setMessages(finalMessages);

      const targetConvo: Conversation = {
        id: convoId,
        title:
          messages.length === 0
            ? text.slice(0, 48) + (text.length > 48 ? '...' : '')
            : overrideConvo?.title || 'Reflection',
        mode: mode,
        messages: finalMessages,
        createdAt: overrideConvo?.createdAt || Date.now(),
        updatedAt: Date.now(),
        source: 'desktop_app'
      };

      saveConversation(targetConvo);
      setConversations(loadConversations());
    } catch (err: unknown) {
      console.error('Error during AI generation:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Could not communicate with local LM Studio.';

      setGlobalError(
        `${errorMessage} Ensure LM Studio is running and local server is started on http://localhost:1234.`
      );

      const errorAssistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: `*Unsaid could not reach your local LM Studio engine.* \n\n${errorMessage}\n\nYou can continue writing freely in Journal Mode or check your LM Studio server settings.`,
        timestamp: Date.now()
      };

      const finalMessages = [...messagesWithUser, errorAssistantMessage];
      setMessages(finalMessages);

      const targetConvo: Conversation = {
        id: convoId,
        title: overrideConvo?.title || text.slice(0, 48),
        mode: mode,
        messages: finalMessages,
        createdAt: overrideConvo?.createdAt || Date.now(),
        updatedAt: Date.now(),
        source: 'desktop_app'
      };

      saveConversation(targetConvo);
      setConversations(loadConversations());
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear messages within current reflection
  const handleClearMessages = () => {
    if (!activeConvoId) return;
    setMessages([]);
    const found = conversations.find((c) => c.id === activeConvoId);
    if (found) {
      const updated: Conversation = { ...found, messages: [], updatedAt: Date.now() };
      saveConversation(updated);
      setConversations(loadConversations());
    }
  };

  // Switch mode mid-conversation
  const handleSwitchMode = (newMode: Mode) => {
    setCurrentMode(newMode);
    if (activeConvoId) {
      const found = conversations.find((c) => c.id === activeConvoId);
      if (found) {
        const updated: Conversation = { ...found, mode: newMode, updatedAt: Date.now() };
        saveConversation(updated);
        setConversations(loadConversations());
      }
    }
  };

  // Delete a reflection
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
    handleNewReflection();
  };

  // Save updated settings
  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    runConnectionCheck(newSettings);
  };

  // Active title for breadcrumb
  const activeConvo = conversations.find((c) => c.id === activeConvoId);

  // App is locked behind PIN
  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#0b0c10] text-zinc-100 font-sans select-none">
      {/* Native Desktop Titlebar / Header */}
      <Header
        currentMode={currentMode}
        activeTitle={activeConvo?.title}
        onSelectMode={handleSwitchMode}
        onNewReflection={handleNewReflection}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        historyCount={conversations.length}
        connectionInfo={connectionInfo}
        isTestingConnection={isTestingConnection}
        onTestConnection={() => runConnectionCheck()}
        isLockConfigured={isAppLockConfigured()}
        onLockApp={() => setIsLocked(true)}
        isDocsOpen={isDocsOpen}
        onToggleDocs={() => {
          setIsDocsOpen(!isDocsOpen);
          setIsShellOpen(false);
        }}
        isShellOpen={isShellOpen}
        onToggleShell={() => {
          setIsShellOpen(!isShellOpen);
          setIsDocsOpen(false);
        }}
        onRefreshHistory={() => setConversations(loadConversations())}
      />

      {/* Global Error Banner */}
      {globalError && (
        <div className="max-w-4xl mx-auto w-full px-4 pt-3 shrink-0">
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 flex items-start justify-between gap-3 shadow-md">
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

      {/* Desktop Main Workspace Split View */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Native Desktop Sidebar */}
        <DesktopSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(false)}
          conversations={conversations}
          activeId={activeConvoId}
          onSelectConversation={handleOpenConversation}
          onNewReflection={handleNewReflection}
          onSelectMode={handleSelectMode}
          onDeleteConversation={handleDeleteConversation}
          connectionInfo={connectionInfo}
          isTestingConnection={isTestingConnection}
          onTestConnection={() => runConnectionCheck()}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onLockApp={() => setIsLocked(true)}
          isLockConfigured={isAppLockConfigured()}
          onOpenDocs={() => setIsDocsOpen(true)}
          onToggleShell={() => setIsShellOpen((prev) => !prev)}
        />

        {/* Center Main Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0d0e14]">
          {isShellOpen ? (
            <TerminalShell
              connectionInfo={connectionInfo}
              onExitShell={() => setIsShellOpen(false)}
              onOpenGUI={() => setIsShellOpen(false)}
              onLockApp={() => setIsLocked(true)}
            />
          ) : isDocsOpen ? (
            <DocsHub
              onBackToApp={() => setIsDocsOpen(false)}
              onSelectMode={(mode) => {
                setIsDocsOpen(false);
                handleSelectMode(mode);
              }}
            />
          ) : !currentMode ? (
            <DesktopDashboard
              onSelectMode={handleSelectMode}
              onOpenConversation={handleOpenConversation}
              recentConversations={conversations}
              connectionInfo={connectionInfo}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenDocs={() => setIsDocsOpen(true)}
              onToggleShell={() => setIsShellOpen(true)}
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
      </div>

      {/* Desktop Bottom Status Bar */}
      <DesktopStatusBar
        connectionInfo={connectionInfo}
        reflectionsCount={conversations.length}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        activeMode={currentMode}
      />

      {/* Real-time Bridge Notification Toast */}
      {bridgeToast && (
        <div className="fixed bottom-10 right-6 z-50 flex items-center gap-3 p-3.5 rounded-2xl bg-[#14151f] border border-amber-500/40 shadow-2xl animate-in slide-in-from-bottom-5 duration-200 max-w-sm">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Synced from Terminal Shell
            </p>
            <p className="text-xs text-zinc-200 font-medium truncate">
              {bridgeToast.title}
            </p>
          </div>
          <button
            onClick={() => {
              handleOpenConversation(bridgeToast.convo);
              setBridgeToast(null);
            }}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 transition shadow"
          >
            Open
          </button>
          <button
            onClick={() => setBridgeToast(null)}
            className="p-1 text-zinc-500 hover:text-zinc-300 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
        onRefreshData={() => setConversations(loadConversations())}
      />
    </div>
  );
}

export default App;
