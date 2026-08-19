"use client";

import { useEffect, useState } from "react";
import { Toast } from "@/components/ui/Toast";
import HashtagEnhancer from "@/components/social/HashtagEnhancer";
import NerddingInteractionRuntime from "@/components/runtime/NerddingInteractionRuntime";
import HomeProjectRuntime from "@/components/runtime/HomeProjectRuntime";
import RouteVisualRuntime from "@/components/runtime/RouteVisualRuntime";
import CheckmarkRuntime from "@/components/runtime/CheckmarkRuntime";
import AgentRouteShield from "@/components/agent/AgentRouteShield";
import AgentVerificationGate2 from "@/components/agent/AgentVerificationGate2";
import AgentVerificationRedirect from "@/components/agent/AgentVerificationRedirect";
import AgentLoginLink from "@/components/agent/AgentLoginLink";
import AgentPendingNotice from "@/components/agent/AgentPendingNotice";
import { getAuthToken } from "@/services/api";
import { getNavigationCounts } from "@/services/navigation";

const MESSAGE_CACHE_PREFIX = "nerdding.messages.v2.";

function repairMessageCache() {
  if (typeof window === "undefined") return;
  const remove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key?.startsWith(MESSAGE_CACHE_PREFIX)) continue;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw || !Array.isArray(JSON.parse(raw))) remove.push(key);
    } catch {
      remove.push(key);
    }
  }
  remove.forEach((key) => window.localStorage.removeItem(key));
}

export default function AppRuntime({ path }: { path: string }) {
  const [toast, setToast] = useState("");

  useEffect(() => {
    repairMessageCache();
    const onToast = (event: Event) => {
      const message = (event as CustomEvent<string>).detail;
      if (message) setToast(message);
    };
    const onComposer = () => setToast("Use the Create menu to publish a live update.");
    window.addEventListener("nerdding:toast", onToast);
    window.addEventListener("nerdding:open-composer", onComposer);
    return () => {
      window.removeEventListener("nerdding:toast", onToast);
      window.removeEventListener("nerdding:open-composer", onComposer);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    document.body.dataset.appRoute = path;
    return () => { delete document.body.dataset.appRoute; };
  }, [path]);

  useEffect(() => {
    const refreshBadges = async () => {
      if (!getAuthToken()) return;
      try {
        const { notifications, messages } = await getNavigationCounts();
        document.querySelectorAll<HTMLElement>(".nav-item").forEach((item) => {
          const label = item.querySelector("span")?.textContent?.trim();
          const count = label === "Messages" ? messages : label === "Notifications" ? notifications : 0;
          let badge = item.querySelector<HTMLElement>("b");
          if (count <= 0) { badge?.remove(); return; }
          if (!badge) { badge = document.createElement("b"); item.appendChild(badge); }
          badge.textContent = count > 99 ? "99+" : String(count);
        });
      } catch {
        // Navigation remains usable when badge requests fail.
      }
    };
    void refreshBadges();
    const timer = window.setInterval(() => void refreshBadges(), 15000);
    return () => window.clearInterval(timer);
  }, [path]);

  return <>
    <RouteVisualRuntime path={path} />
    <CheckmarkRuntime />
    <NerddingInteractionRuntime />
    {path === "/" || path.startsWith("/home") ? <HomeProjectRuntime /> : null}
    {path === "/" || path.startsWith("/home") || path.startsWith("/explore") ? <HashtagEnhancer /> : null}
    <AgentRouteShield />
    <AgentVerificationGate2 />
    <AgentVerificationRedirect />
    <AgentLoginLink />
    <AgentPendingNotice />
    {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
  </>;
}
