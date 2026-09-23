/** Safe localStorage helpers for non-sensitive UI preferences only. Never store secrets/tokens. */
const PREFIX = "sentineltwin:";

export function getStoredValue<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setStoredValue<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode, quota) -- fail silently, it's only a UI preference */
  }
}
