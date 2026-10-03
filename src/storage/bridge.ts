import type { Conversation } from '../types';
import { loadConversations, saveConversation } from './localStorage';

export interface BridgeSyncResult {
  success: boolean;
  count: number;
  data?: any[];
  error?: string;
}

/**
 * Synchronizes local browser reflections with ~/.unsaid/reflections.json on disk.
 */
export async function syncWithDiskBridge(): Promise<BridgeSyncResult> {
  try {
    const local = loadConversations();
    const res = await fetch('/api/bridge/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(local)
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.data)) {
        // Update local storage with any new terminal reflections
        data.data.forEach((c: Conversation) => {
          if (c && c.id) {
            saveConversation(c);
          }
        });
      }
      return { success: true, count: data.count || local.length, data: data.data };
    }
    return { success: false, count: 0, error: `Bridge returned status ${res.status}` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, count: 0, error: msg };
  }
}

/**
 * Launches an external native Windows Command Prompt / Terminal window running unsaid-shell.bat
 */
export async function launchExternalTerminal(): Promise<boolean> {
  try {
    const res = await fetch('/api/bridge/launch-shell', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      return !!data.launched;
    }
    return false;
  } catch {
    return false;
  }
}
