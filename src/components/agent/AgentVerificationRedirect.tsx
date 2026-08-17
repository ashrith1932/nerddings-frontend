"use client";

import { useEffect } from "react";
import { apiFetch, getAuthToken, getSavedUser, refreshAuthUser } from "@/lib/api";

export default function AgentVerificationRedirect() {
  useEffect(() => {
    if (!getAuthToken()) return;
    const sync = async () => {
      const path = window.location.pathname;
      if (path === "/auth/callback") return;
      const saved = getSavedUser();
      if (!saved || saved.accountType === "agent") return;
      try {
        const response = await apiFetch<{ data: { status?: string } | null }>("/agent-verification/me");
        const status = response.data?.status;
        if ((status === "pending_dns" || status === "pending_review") && path === "/home") {
          window.history.replaceState({}, "", "/agent/verification");
          window.dispatchEvent(new PopStateEvent("popstate"));
          return;
        }
        if (status === "approved" && path === "/agent/verification") {
          await refreshAuthUser();
          window.history.replaceState({}, "", "/home");
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      } catch {
        // Keep the current page if the status check is temporarily unavailable.
      }
    };
    void sync();
  }, []);
  return null;
}
