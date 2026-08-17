"use client";

import { useEffect } from "react";
import { getSavedUser } from "@/lib/api";
import "./agent-route-shield.css";

const AGENT_INTENT_KEY = "nerdding.agentLoginIntent";
const PENDING = new Set(["pending_dns", "pending_review", "rejected"]);

export default function AgentRouteShield() {
  const saved = getSavedUser();
  const pathname = typeof window === "undefined" ? "" : window.location.pathname;
  const pending = Boolean(saved && saved.accountType !== "agent" && saved.agentVerificationStatus && PENDING.has(saved.agentVerificationStatus));
  const intentWithoutStatus = Boolean(saved && saved.accountType !== "agent" && typeof window !== "undefined" && window.localStorage.getItem(AGENT_INTENT_KEY) === "1" && !saved.agentVerificationStatus);
  const shouldShield = Boolean(saved && (pending || intentWithoutStatus) && !pathname.startsWith("/agent/verification"));

  useEffect(() => {
    if (!shouldShield) return;
    window.history.replaceState({}, "", pending ? "/agent/verification" : "/onboarding");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [shouldShield, pending]);

  if (!shouldShield) return null;

  return <div className="agent-route-shield"><div className="agent-route-shield-card"><div className="eyebrow">AGENT ACCESS</div><h2>{pending ? "Verification required." : "Preparing Agent onboarding."}</h2><p>{pending ? "Your Agent account cannot enter the home feed until domain verification and team approval are complete." : "Your Agent login is being prepared. You will not enter the home feed until verification is complete."}</p><div className="agent-route-shield-skeleton" /></div></div>;
}
