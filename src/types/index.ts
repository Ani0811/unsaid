export type Mode = 'talk' | 'unload' | 'unsaid';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  safetyFlag?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  mode: Mode;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface LMStudioModel {
  id: string;
  object: string;
  owned_by?: string;
}

export interface Settings {
  baseUrl: string;
  model: string;
  temperature: number;
  useProxy: boolean;
  demoModeFallback: boolean;
}

export type ConnectionStatus = 'checking' | 'connected' | 'offline' | 'error';

export interface ConnectionInfo {
  status: ConnectionStatus;
  modelName: string;
  endpoint: string;
  availableModels: string[];
  error?: string;
  isGemmaDetected?: boolean;
}

export interface SafetyCheckResult {
  isSafe: boolean;
  reason?: 'self_harm_risk' | 'violence_risk';
  guidanceMessage?: string;
}
