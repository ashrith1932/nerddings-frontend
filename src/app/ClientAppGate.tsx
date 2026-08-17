"use client";

import { useEffect, useState } from "react";
import { NerddingApp } from "@/components/layout/NerddingApp";
import ReliableSocialEnhancer from "@/components/social/ReliableSocialEnhancer";
import SocialProfileRedirector from "@/components/social/SocialProfileRedirector";
import LiveNavCounts from "@/components/social/LiveNavCounts";
import AgentVerificationGate2 from "@/components/agent/AgentVerificationGate2";
import AgentVerificationRedirect from "@/components/agent/AgentVerificationRedirect";
import AgentRouteShield from "@/components/agent/AgentRouteShield";
import AgentLoginLink from "@/components/agent/AgentLoginLink";
import AgentPendingNotice from "@/components/agent/AgentPendingNotice";
import ProfileEditorOverlay from "@/components/profile/ProfileEditorOverlay";

const MESSAGE_CACHE_PREFIX = "nerdding.messages.v2.";

function repairMessageCache() {
  if (typeof window === "undefined") return;

  const remove: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(MESSAGE_CACHE_PREFIX)) continue;

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) remove.push(key);
    } catch {
      remove.push(key);
    }
  }

  for (const key of remove) window.localStorage.removeItem(key);
}

function AppSkeleton() {
  return (
    <div className="client-app-skeleton" aria-hidden="true">
      <aside className="client-app-skeleton-sidebar">
        <div className="client-app-skeleton-logo" />
        {Array.from({ length: 8 }, (_, index) => (
          <div className="client-app-skeleton-nav" key={index} />
        ))}
      </aside>
      <main className="client-app-skeleton-main">
        <div className="client-app-skeleton-topbar" />
        <div className="client-app-skeleton-content">
          <div className="client-app-skeleton-card large" />
          <div className="client-app-skeleton-card" />
          <div className="client-app-skeleton-card" />
        </div>
      </main>
    </div>
  );
}

export default function ClientAppGate() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    repairMessageCache();
    setReady(true);
  }, []);

  if (!ready) return <AppSkeleton />;

  return (
    <>
      <NerddingApp />
      <AgentRouteShield />
      <ReliableSocialEnhancer />
      <SocialProfileRedirector />
      <LiveNavCounts />
      <AgentVerificationGate2 />
      <AgentVerificationRedirect />
      <AgentLoginLink />
      <AgentPendingNotice />
      <ProfileEditorOverlay />
    </>
  );
}
