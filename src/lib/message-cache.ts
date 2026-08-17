const PREFIX = "nerdding.messages.v2.";

function key(conversationId: string) {
  return `${PREFIX}${conversationId}`;
}

export function loadCachedMessages<T>(conversationId: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key(conversationId));
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      window.localStorage.removeItem(key(conversationId));
      return [];
    }

    return parsed as T[];
  } catch {
    window.localStorage.removeItem(key(conversationId));
    return [];
  }
}

export function saveCachedMessages<T>(conversationId: string, messages: T[]) {
  if (typeof window === "undefined") return;

  try {
    if (!Array.isArray(messages)) return;
    window.localStorage.setItem(
      key(conversationId),
      JSON.stringify(messages.slice(-100)),
    );
  } catch {
    // Cache is only an optimization.
  }
}

export function clearCachedMessages(conversationId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key(conversationId));
}
