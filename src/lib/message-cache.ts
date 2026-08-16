const PREFIX =
  "nerdding.messages.v1.";

function key(conversationId: string) {
  return `${PREFIX}${conversationId}`;
}

export function loadCachedMessages<T>(
  conversationId: string,
): T[] {
  if (
    typeof window === "undefined"
  ) {
    return [];
  }

  try {
    const raw =
      window.localStorage.getItem(
        key(conversationId),
      );

    if (!raw) {
      return [];
    }

    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export function saveCachedMessages<T>(
  conversationId: string,
  messages: T[],
) {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  try {
    // Keep the most recent 100 messages.
    const recent =
      messages.slice(-100);

    window.localStorage.setItem(
      key(conversationId),
      JSON.stringify(recent),
    );
  } catch {
    // Cache failure should never break chat.
  }
}

export function clearCachedMessages(
  conversationId: string,
) {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  window.localStorage.removeItem(
    key(conversationId),
  );
}