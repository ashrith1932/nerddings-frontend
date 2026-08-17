"use client";

import { useEffect } from "react";
import { getAuthToken, getSavedUser, refreshAuthUser } from "@/lib/api";

export default function SocialProfileRedirector() {
  useEffect(() => {
    let cancelled = false;

    const redirectToViewer = async () => {
      if (!getAuthToken()) return;

      let user = getSavedUser();
      try {
        user = await refreshAuthUser();
      } catch {
        // Keep the cached session for transient API failures.
      }

      if (cancelled || !user?.username) return;

      const path = window.location.pathname;
      const isOwnProfileRoute =
        path === "/profile" ||
        path === "/profile/ashrith.builds" ||
        path === "/profile/undefined" ||
        path === "/profile/null";

      if (isOwnProfileRoute) {
        const target = `/profile/${encodeURIComponent(user.username)}`;
        if (window.location.pathname !== target) {
          window.history.replaceState({}, "", target);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      }
    };

    if (window.location.pathname === "/" && getAuthToken()) {
      window.history.replaceState({}, "", "/home");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }

    void redirectToViewer();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
