"use client";

type Scope = "home" | "profile";
type HistoryState = { currentId: string | null; stack: string[]; skipNext: boolean };

const keyFor = (scope: Scope) => `nerdding.active-post-history.${scope}`;

function read(scope: Scope): HistoryState {
  if (typeof window === "undefined") return { currentId: null, stack: [], skipNext: false };
  try {
    const raw = sessionStorage.getItem(keyFor(scope));
    if (raw) return JSON.parse(raw) as HistoryState;
  } catch {}
  return { currentId: null, stack: [], skipNext: false };
}

function write(scope: Scope, state: HistoryState) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(keyFor(scope), JSON.stringify(state));
}

export function enterActivePost(scope: Scope, postId: string) {
  const state = read(scope);
  if (state.skipNext) {
    state.skipNext = false;
    state.currentId = postId;
    write(scope, state);
    return;
  }
  if (state.currentId && state.currentId !== postId) state.stack.push(state.currentId);
  state.currentId = postId;
  write(scope, state);
}

export function clearActivePostHistory(scope: Scope) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(keyFor(scope));
}

export function backActivePost(scope: Scope, currentId: string, onEmpty: () => void) {
  const state = read(scope);
  state.currentId = currentId;
  const previousId = state.stack.pop();
  if (!previousId) {
    clearActivePostHistory(scope);
    onEmpty();
    return;
  }
  state.currentId = previousId;
  state.skipNext = true;
  write(scope, state);
  const eventName = scope === "home" ? "nerdding:open-post" : "nerdding:open-profile-post";
  window.dispatchEvent(new CustomEvent(eventName, { detail: { postId: previousId, fromHistory: true } }));
}
