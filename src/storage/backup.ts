import type { Conversation, Settings } from '../types';
import { loadConversations, loadSettings, saveSettings } from './localStorage';

export interface UnsaidBackup {
  version: string;
  exportedAt: number;
  conversations: Conversation[];
  settings: Settings;
}

export function exportBackupData(): string {
  const backup: UnsaidBackup = {
    version: '1.0',
    exportedAt: Date.now(),
    conversations: loadConversations(),
    settings: loadSettings()
  };
  return JSON.stringify(backup, null, 2);
}

export function downloadBackupFile(): void {
  const json = exportBackupData();
  const dateStr = new Date().toISOString().slice(0, 10);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `unsaid-backup-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function restoreBackupData(jsonString: string): { success: boolean; count: number; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !Array.isArray(data.conversations)) {
      return { success: false, count: 0, error: 'Invalid backup format: missing conversations array.' };
    }

    const existing = loadConversations();
    const existingIds = new Set(existing.map((c) => c.id));
    const merged = [...existing];

    let addedCount = 0;
    for (const c of data.conversations) {
      if (c && c.id && !existingIds.has(c.id)) {
        merged.push(c);
        existingIds.add(c.id);
        addedCount++;
      }
    }

    localStorage.setItem('unsaid_conversations_v1', JSON.stringify(merged));

    if (data.settings && typeof data.settings === 'object') {
      saveSettings(data.settings);
    }

    return { success: true, count: addedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, count: 0, error: msg };
  }
}
