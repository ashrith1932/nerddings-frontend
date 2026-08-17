"use client";

import { useEffect } from "react";
import { apiFetch, getAuthToken, refreshAuthUser } from "@/lib/api";

const AGENT_INTENT_KEY = "nerdding.agentLoginIntent";
const PENDING_STATUSES = new Set(["pending_dns", "pending_review", "rejected"]);

function navigate(path: string, replace = true) {
  if (replace) window.history.replaceState({}, "", path);
  else window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function markAgentIntent() {
  if (window.location.pathname === "/agent/login") window.localStorage.setItem(AGENT_INTENT_KEY, "1");
}

function selectAgentOnOnboarding() {
  const button = Array.from(document.querySelectorAll("button")).find((item) => item.textContent?.replace(/\s+/g, " ").trim() === "Organization / Agent") as HTMLButtonElement | undefined;
  if (button) button.click();
  return Boolean(button);
}

export default function AgentVerificationRedirect() {
  useEffect(() => {
    let cancelled = false;
    let callbackTimer: number | undefined;
    let onboardingTimer: number | undefined;

    const route = async () => {
      if (cancelled) return;
      const path = window.location.pathname;
      if (path === "/agent/login") {
        markAgentIntent();
        return;
      }

      const intent = window.localStorage.getItem(AGENT_INTENT_KEY) === "1";
      if (!getAuthToken()) return;

      try {
        const user = await refreshAuthUser();
        if (!user || cancelled) return;

        let status: string | undefined;
        try {
          const verification = await apiFetch<{ data: { status?: string } | null }>("/agent-verification/me");
          status = verification.data?.status;
        } catch {
          // A first-time Agent login has no verification request yet.
        }

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

          if (path === "/auth/callback" || path === "/home") {
            navigate("/onboarding");
            return;
          }

          if (path === "/onboarding") {
            let attempts = 0;
            onboardingTimer = window.setInterval(() => {
              attempts += 1;
              if (selectAgentOnOnboarding() || attempts >= 20) {
                if (onboardingTimer) window.clearInterval(onboardingTimer);
              }
            }, 150);
          }
        }

        if (PENDING_STATUSES.has(status ?? "") && path === "/home") {
          navigate("/agent/verification");
          return;
        }

        if (status === "approved" && path === "/agent/verification") {
          window.localStorage.removeItem(AGENT_INTENT_KEY);
          navigate("/home");
        }
      } catch {
        // Keep the current route if the auth service is temporarily unavailable.
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (window.location.pathname !== "/agent/login") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("button")) markAgentIntent();
    };
    const handleRoute = () => { markAgentIntent(); void route(); };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handleRoute);
    markAgentIntent();

    if (window.location.pathname === "/auth/callback") {
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
      if (onboardingTimer) window.clearInterval(onboardingTimer);
    };
  }, []);

  return null;
}
