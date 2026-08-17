"use client";

import { useEffect, useState } from "react";
import SocialEnhancer from "./SocialEnhancer";
import HomeFeedSurface from "./HomeFeedSurface";
import "./social-live-polish.css";

export default function ReliableSocialEnhancer() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [version, setVersion] = useState(0);
  const [path, setPath] = useState(() => (typeof window === "undefined" ? "/" : window.location.pathname));

  useEffect(() => {
    let current: HTMLElement | null = null;
    const sync = () => {
      const next = document.querySelector<HTMLElement>(".page-content");
      if (next && next !== current) {
        current = next;
        setHost(next);
        setVersion((value) => value + 1);
      } else if (!next && current) {
        current = null;
        setHost(null);
      }
      setPath(window.location.pathname);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", sync);
    };
  }, []);

  useEffect(() => {
    const refreshCounts = async () => {
      const status = document.querySelector<HTMLElement>(".status-chip");
      if (status) status.style.display = "none";
      for (const badge of Array.from(document.querySelectorAll<HTMLElement>(".nav-item b"))) badge.style.display = "none";
      if (!document.querySelector(".nav-item")) return;
      const token = window.localStorage.getItem("nerdding_auth_token");
      if (!token) return;
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";
        const headers = { Authorization: `Bearer ${token}` };
        const [notifications, messages] = await Promise.allSettled([
          fetch(`${base}/notifications`, { headers }).then((r) => r.ok ? r.json() : null),
          fetch(`${base}/social/messages/unread-count`, { headers }).then((r) => r.ok ? r.json() : null),
        ]);
        const notificationCount = notifications.status === "fulfilled" ? Number(notifications.value?.unreadCount ?? notifications.value?.data?.unreadCount ?? 0) : 0;
        const messageCount = messages.status === "fulfilled" ? Number(messages.value?.data?.unreadCount ?? messages.value?.unreadCount ?? 0) + Number(messages.value?.data?.pendingRequests ?? 0) : 0;
        for (const button of Array.from(document.querySelectorAll<HTMLElement>(".nav-item"))) {
          const label = button.querySelector("span")?.textContent?.trim();
          if (label !== "Messages" && label !== "Notifications") continue;
          const count = label === "Messages" ? messageCount : notificationCount;
          const badge = button.querySelector<HTMLElement>("b");
          if (count <= 0) { if (badge) badge.remove(); }
          else if (badge) { badge.textContent = count > 99 ? "99+" : String(count); badge.style.display = "inline-flex"; }
          else { const next = document.createElement("b"); next.textContent = count > 99 ? "99+" : String(count); next.style.display = "inline-flex"; button.appendChild(next); }
        }
      } catch {
        // Keep navigation usable if count endpoints are temporarily unavailable.
      }
    };
    void refreshCounts();
    const timer = window.setInterval(() => void refreshCounts(), 15000);
    return () => window.clearInterval(timer);
  }, [path, version]);

  if (!host || path === "/agent/login" || path.startsWith("/agent/verification")) return null;
  if (path === "/home") return <HomeFeedSurface key={`home-${version}`} />;
  return <SocialEnhancer key={version} />;
}
