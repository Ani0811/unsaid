import type { Conversation, Settings } from '../types';

const STORAGE_CONVERSATIONS_KEY = 'unsaid_conversations_v1';
const STORAGE_ACTIVE_ID_KEY = 'unsaid_active_id_v1';
const STORAGE_SETTINGS_KEY = 'unsaid_settings_v1';

export const DEFAULT_SETTINGS: Settings = {
  baseUrl: (import.meta.env.VITE_LM_STUDIO_BASE_URL as string) || 'http://localhost:1234/v1',
  model: (import.meta.env.VITE_LM_STUDIO_MODEL as string) || 'google/gemma-3-4b',
  temperature: 0.7,
  useProxy: true, // Uses Vite's /api/lmstudio proxy to prevent CORS issues if browser blocks localhost
  demoModeFallback: false
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('Failed to parse settings from localStorage:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_CONVERSATIONS_KEY);
    if (!raw) return [];
    const list: Conversation[] = JSON.parse(raw);
    return Array.isArray(list) ? list.sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch (err) {
    console.warn('Failed to load conversations from localStorage:', err);
    return [];
  }
}

export function saveConversation(convo: Conversation): void {
  try {
    const existing = loadConversations();
    const index = existing.findIndex((c) => c.id === convo.id);
    let updated: Conversation[];

    if (index >= 0) {
      updated = [...existing];
      updated[index] = { ...convo, updatedAt: Date.now() };
    } else {
      updated = [{ ...convo, updatedAt: Date.now() }, ...existing];
    }

    localStorage.setItem(STORAGE_CONVERSATIONS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save conversation:', err);
  }
}

export function deleteConversation(id: string): void {
  try {
    const existing = loadConversations();
    const updated = existing.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_CONVERSATIONS_KEY, JSON.stringify(updated));

    if (getActiveConversationId() === id) {
      clearActiveConversationId();
    }
  } catch (err) {
    console.error('Failed to delete conversation:', err);
  }
}

export function getActiveConversationId(): string | null {
  try {
    return localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
  } catch {
    return null;
  }
}

export function setActiveConversationId(id: string): void {
  try {
    localStorage.setItem(STORAGE_ACTIVE_ID_KEY, id);
  } catch {
    // ignore
  }
}

export function clearActiveConversationId(): void {
  try {
    localStorage.removeItem(STORAGE_ACTIVE_ID_KEY);
  } catch {
    // ignore
  }
}

/**
 * Completely purges all stored conversations, active conversation pointer, and cached settings.
 */
export function deleteAllData(): void {
  try {
    localStorage.removeItem(STORAGE_CONVERSATIONS_KEY);
    localStorage.removeItem(STORAGE_ACTIVE_ID_KEY);
    localStorage.removeItem(STORAGE_SETTINGS_KEY);
  } catch (err) {
    console.error('Failed to delete all data:', err);
  }
}
