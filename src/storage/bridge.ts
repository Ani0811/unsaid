import type { Conversation } from '../types';
import { loadConversations, saveConversation } from './localStorage';

export interface BridgeSyncResult {
  success: boolean;
  count: number;
  data?: Conversation[];
  error?: string;
}

export interface BridgeStatus {
  online: boolean;
  storageDir?: string;
  storageFile?: string;
  count?: number;
  lastModified?: number;
  connectedClients?: number;
}

let isSyncInProgress = false;

/**
 * Synchronizes local browser reflections with ~/.unsaid/reflections.json on disk.
 * Protected against concurrent execution loops.
 */
export async function syncWithDiskBridge(): Promise<BridgeSyncResult> {
  if (isSyncInProgress) {
    const cached = loadConversations();
    return { success: true, count: cached.length, data: cached };
  }

  isSyncInProgress = true;
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
  } finally {
    isSyncInProgress = false;
  }
}

/**
 * Fetches the current status of the disk bridge and ~/.unsaid storage.
 */
export async function fetchBridgeStatus(): Promise<BridgeStatus> {
  try {
    const res = await fetch('/api/bridge/status');
    if (res.ok) {
      return await res.json();
    }
    return { online: false };
  } catch {
    return { online: false };
  }
}

/**
 * Subscribes to real-time bridge updates via Server-Sent Events (SSE).
 * Only fires when the terminal shell adds a new reflection.
 * No polling loops, no cascading renders.
 */
export function subscribeToBridgeEvents(
  onUpdate: (event: { type: string; count?: number; convo?: Conversation }) => void
): () => void {
  let eventSource: EventSource | null = null;

  try {
    eventSource = new EventSource('/api/bridge/events');

    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'shell_reflection' && payload.convo) {
          // Ingest reflection directly into local storage without re-requesting server
          saveConversation(payload.convo);
          onUpdate({
            type: 'shell_reflection',
            count: payload.count,
            convo: payload.convo
          });
        }
      } catch {}
    };

    eventSource.onerror = () => {
      // Automatic browser reconnect handled by EventSource
    };
  } catch {
    // EventSource fallback
  }

  return () => {
    if (eventSource) {
      eventSource.close();
    }
  };
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

/**
 * Launches a standalone desktop application window via start-desktop.bat
 */
export async function launchDesktopAppWindow(): Promise<boolean> {
  try {
    const res = await fetch('/api/bridge/launch-desktop', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      return !!data.launched;
    }
    return false;
  } catch {
    return false;
  }
}
