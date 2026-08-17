"use client";

import { useEffect } from "react";
import { getAuthToken, getSavedUser, refreshAuthUser } from "@/lib/api";

const LEGACY_OWN_PROFILE_PATHS = new Set([
  "/profile",
  "/profile/ashrith.builds",
  "/profile/undefined",
  "/profile/null",
]);

export default function SocialProfileRedirector() {
  useEffect(() => {
    let cancelled = false;

    const redirectToViewer = async () => {
      if (!getAuthToken()) return;

      // Use the cached authenticated user immediately. This prevents the old
      // hard-coded profile slug from rendering while /auth/me is still loading.
      const cachedUser = getSavedUser();
      const cachedUsername = cachedUser?.username?.trim();
      const path = window.location.pathname;

      if (cachedUsername && LEGACY_OWN_PROFILE_PATHS.has(path)) {
        const target = `/profile/${encodeURIComponent(cachedUsername)}`;
        if (path !== target) {
          window.history.replaceState({}, "", target);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      }

      let user = cachedUser;
      try {
        user = await refreshAuthUser();
      } catch {
        // Keep the cached session for transient API failures.
      }

      if (cancelled || !user?.username) return;

      const currentPath = window.location.pathname;
      if (!LEGACY_OWN_PROFILE_PATHS.has(currentPath)) return;

      const target = `/profile/${encodeURIComponent(user.username)}`;
      if (currentPath !== target) {
        window.history.replaceState({}, "", target);
        window.dispatchEvent(new PopStateEvent("popstate"));
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
