"use client";

import { useCallback, useEffect } from "react";
import { getAuthToken, getSavedUser, refreshAuthUser } from "@/lib/api";

const LEGACY_OWN_PROFILE_PATHS = new Set([
  "/profile",
  "/profile/ashrith.builds",
  "/profile/undefined",
  "/profile/null",
]);

export default function SocialProfileRedirector() {
  const redirectToViewer = useCallback(async () => {
    if (!getAuthToken()) return;

    const path = window.location.pathname;
    if (!LEGACY_OWN_PROFILE_PATHS.has(path)) return;

    const cachedUser = getSavedUser();
    const cachedUsername = cachedUser?.username?.trim();

    if (cachedUsername) {
      const target = `/profile/${encodeURIComponent(cachedUsername)}`;
      if (path !== target) {
        window.history.replaceState({}, "", target);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
      return;
    }

    try {
      const user = await refreshAuthUser();
      if (!user?.username) return;
      const target = `/profile/${encodeURIComponent(user.username)}`;
      if (window.location.pathname !== target) {
        window.history.replaceState({}, "", target);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    } catch {
      // Leave the route alone if authentication cannot be refreshed.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const handleRoute = () => {
      if (!cancelled) void redirectToViewer();
    };

    if (window.location.pathname === "/" && getAuthToken()) {
      window.history.replaceState({}, "", "/home");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }

    handleRoute();
    window.addEventListener("popstate", handleRoute);

    return () => {
      cancelled = true;
      window.removeEventListener("popstate", handleRoute);
    };
  }, [redirectToViewer]);

  return null;
}
