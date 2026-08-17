"use client";

import { useEffect } from "react";
import { apiFetch, getAuthToken } from "@/lib/api";

export default function LiveNavCounts() {
  useEffect(() => {
    const refresh = async () => {
      const status = document.querySelector<HTMLElement>(".status-chip");
      if (status) status.style.display = "none";
      if (!getAuthToken()) return;
      const [notificationsResult, messagesResult] = await Promise.allSettled([
        apiFetch<any>("/notifications"),
        apiFetch<any>("/social/messages/unread-count"),
      ]);
      const notificationsUnread = notificationsResult.status === "fulfilled" ? Number(notificationsResult.value.unreadCount ?? 0) : 0;
      const messagesUnread = messagesResult.status === "fulfilled" ? Number(messagesResult.value.data?.unreadCount ?? 0) + Number(messagesResult.value.data?.pendingRequests ?? 0) : 0;
      for (const button of Array.from(document.querySelectorAll<HTMLElement>(".nav-item"))) {
        const label = button.querySelector("span")?.textContent?.trim();
        const count = label === "Notifications" ? notificationsUnread : label === "Messages" ? messagesUnread : null;
        if (count == null) continue;
        let badge = button.querySelector<HTMLElement>("b");
        if (!badge) {
          badge = document.createElement("b");
          button.appendChild(badge);
        }
        badge.textContent = count > 99 ? "99+" : String(count);
        badge.style.display = count > 0 ? "inline-flex" : "none";
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(timer);
  }, []);
  return null;
}
