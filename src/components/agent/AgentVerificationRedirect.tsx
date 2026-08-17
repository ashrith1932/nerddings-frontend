"use client";

import { useEffect } from "react";
import { apiFetch, getAuthToken, getSavedUser, refreshAuthUser } from "@/lib/api";

const AGENT_INTENT_KEY = "nerdding.agentLoginIntent";
const PENDING_STATUSES = new Set(["pending_dns", "pending_review", "rejected"]);

function navigate(path: string, replace = true) {
  if (replace) window.history.replaceState({}, "", path);
  else window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function markAgentIntent() {
  if (window.location.pathname === "/agent/login") {
    window.localStorage.setItem(AGENT_INTENT_KEY, "1");
  }
}

export default function AgentVerificationRedirect() {
  useEffect(() => {
    let cancelled = false;
    let callbackTimer: number | undefined;

    const route = async () => {
      if (cancelled) return;
      const path = window.location.pathname;

      // Agent-login intent must survive the OAuth round trip. The OAuth
      // callback itself is handled by NerddingApp, so wait for its token.
      if (path === "/agent/login") {
        markAgentIntent();
        return;
      }

      const intent = window.localStorage.getItem(AGENT_INTENT_KEY) === "1";
      const token = getAuthToken();
      if (!token) return;

      try {
        const user = await refreshAuthUser();
        if (!user || cancelled) return;

        const verification = await apiFetch<{ data: { status?: string } | null }>("/agent-verification/me");
        const status = verification.data?.status;

        if (intent) {
          if (PENDING_STATUSES.has(status ?? "")) {
            window.localStorage.removeItem(AGENT_INTENT_KEY);
            if (path !== "/agent/verification") navigate("/agent/verification");
            return;
          }

          if (status === "approved" || user.accountType === "agent") {
            window.localStorage.removeItem(AGENT_INTENT_KEY);
            if (path === "/agent/verification" || path === "/auth/callback") navigate("/home");
            return;
          }

          // First-time Agent login: let the existing onboarding screen open,
          // and select Organization / Agent there.
          if (!user.onboardingCompleted && path === "/auth/callback") {
            navigate("/onboarding");
            return;
          }

          if (path === "/auth/callback" || path === "/home") {
            navigate("/onboarding");
            return;
          }
        }

        // A pending Agent application is never allowed into the normal app.
        if (PENDING_STATUSES.has(status ?? "") && path === "/home") {
          navigate("/agent/verification");
          return;
        }

        if (status === "approved" && path === "/agent/verification") {
          window.localStorage.removeItem(AGENT_INTENT_KEY);
          navigate("/home");
        }
      } catch {
        // Keep the current route if the verification service is temporarily unavailable.
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (window.location.pathname !== "/agent/login") return;
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (button) markAgentIntent();
    };

    const handleRoute = () => {
      markAgentIntent();
      void route();
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handleRoute);
    markAgentIntent();

    if (window.location.pathname === "/auth/callback") {
      // NerddingApp saves the OAuth token during callback processing. Polling
      // briefly avoids trusting stale localStorage account information.
      let attempts = 0;
      callbackTimer = window.setInterval(() => {
        attempts += 1;
        if (getAuthToken() || attempts >= 40) {
          if (callbackTimer) window.clearInterval(callbackTimer);
          void route();
        }
      }, 200);
    } else {
      void route();
    }

    return () => {
      cancelled = true;
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handleRoute);
      if (callbackTimer) window.clearInterval(callbackTimer);
    };
  }, []);

  return null;
}
