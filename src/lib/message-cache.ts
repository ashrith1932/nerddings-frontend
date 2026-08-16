const PREFIX = "nerdding.messages.v2.";

function key(conversationId: string) {
  return `${PREFIX}${conversationId}`;
}

export function loadCachedMessages<T>(conversationId: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key(conversationId));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function saveCachedMessages<T>(
  conversationId: string,
  messages: T[],
) {
  if (typeof window === "undefined") return;

  try {
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
