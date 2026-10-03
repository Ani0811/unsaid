const PIN_HASH_KEY = 'unsaid_pin_hash_v1';
const AUTO_LOCK_KEY = 'unsaid_autolock_minutes_v1';

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin.trim() + '_unsaid_salt');
  const buffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function isAppLockConfigured(): boolean {
  try {
    return !!localStorage.getItem(PIN_HASH_KEY);
  } catch {
    return false;
  }
}

export async function setAppLockPin(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  localStorage.setItem(PIN_HASH_KEY, hash);
}

export function removeAppLockPin(): void {
  localStorage.removeItem(PIN_HASH_KEY);
}

export async function verifyAppLockPin(inputPin: string): Promise<boolean> {
  const storedHash = localStorage.getItem(PIN_HASH_KEY);
  if (!storedHash) return true;
  const testHash = await hashPin(inputPin);
  return testHash === storedHash;
}

export function getAutoLockMinutes(): number {
  try {
    const raw = localStorage.getItem(AUTO_LOCK_KEY);
    return raw ? parseInt(raw, 10) : 5;
  } catch {
    return 5;
  }
}

export function setAutoLockMinutes(minutes: number): void {
  localStorage.setItem(AUTO_LOCK_KEY, minutes.toString());
}
