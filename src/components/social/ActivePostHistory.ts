"use client";

type Scope = "home" | "profile";

const stacks: Record<Scope, string[]> = {
  home: [],
  profile: [],
};

export function recordActivePostOpen(scope: Scope, currentId: string | null, nextId: string) {
  if (!nextId || currentId === nextId) return;
  if (currentId) stacks[scope].push(currentId);
}

export function clearActivePostHistory(scope: Scope) {
  stacks[scope] = [];
}

export function goBackActivePost(scope: Scope, currentId: string, onEmpty: () => void) {
  const history = stacks[scope];
  while (history.length && history[history.length - 1] === currentId) history.pop();
  const previousId = history.pop();
  if (!previousId) {
    onEmpty();
    return;
  }
  const eventName = scope === "home" ? "nerdding:open-post" : "nerdding:open-profile-post";
  window.dispatchEvent(new CustomEvent(eventName, { detail: { postId: previousId, fromHistory: true } }));
}
