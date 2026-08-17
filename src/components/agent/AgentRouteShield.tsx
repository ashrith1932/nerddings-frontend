"use client";

import { useEffect } from "react";
import { getSavedUser } from "@/lib/api";
import "./agent-route-shield.css";

const AGENT_INTENT_KEY = "nerdding.agentLoginIntent";
const BLOCKED = new Set(["pending_dns", "pending_review", "rejected"]);

export default function AgentRouteShield() {
  const saved = getSavedUser();
  const pathname = typeof window === "undefined" ? "" : window.location.pathname;
  const blockedAgent = Boolean(saved?.accountType === "agent" && saved.agentVerificationStatus && BLOCKED.has(saved.agentVerificationStatus));
  const intentWithoutStatus = Boolean(saved && typeof window !== "undefined" && window.localStorage.getItem(AGENT_INTENT_KEY) === "1" && saved.accountType === "agent" && !saved.agentVerificationStatus);
  const shouldShield = Boolean(saved && (blockedAgent || intentWithoutStatus) && !pathname.startsWith("/agent/verification"));

  useEffect(() => {
    if (!shouldShield) return;
    window.history.replaceState({}, "", "/agent/verification");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [shouldShield]);

  if (!shouldShield) return null;
  return <div className="agent-route-shield"><div className="agent-route-shield-card"><div className="eyebrow">AGENT ACCESS</div><h2>Verification required.</h2><p>Your Agent account cannot enter the home feed until domain verification and team approval are complete.</p><div className="agent-route-shield-skeleton" /></div></div>;
}
