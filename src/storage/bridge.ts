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
 * Also runs a periodic poll check to ensure no reflections are missed.
 */
export function subscribeToBridgeEvents(
  onUpdate: (event: { type: string; count?: number; latest?: Conversation }) => void
): () => void {
  let eventSource: EventSource | null = null;
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  try {
    eventSource = new EventSource('/api/bridge/events');

    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'sync' || payload.type === 'disk_change') {
          // Sync with local storage
          syncWithDiskBridge().then((res) => {
            onUpdate({
              type: payload.type,
              count: res.count,
              latest: payload.latest || res.data?.[0]
            });
          });
        }
      } catch {}
    };

    eventSource.onerror = () => {
      // If SSE errors out, fallback to regular polling
    };
  } catch {
    // EventSource not supported or failed to initialize
  }

  // Periodic fallback check every 4 seconds
  let lastCount = loadConversations().length;
  pollInterval = setInterval(async () => {
    try {
      const status = await fetchBridgeStatus();
      if (status.online && status.count !== undefined && status.count !== lastCount) {
        lastCount = status.count;
        const res = await syncWithDiskBridge();
        onUpdate({
          type: 'poll_sync',
          count: res.count,
          latest: res.data?.[0]
        });
      }
    } catch {}
  }, 4000);

  return () => {
    if (eventSource) eventSource.close();
    if (pollInterval) clearInterval(pollInterval);
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
