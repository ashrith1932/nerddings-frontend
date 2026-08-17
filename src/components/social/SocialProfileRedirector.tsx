"use client";

import { useCallback, useEffect } from "react";
import { getAuthToken, getSavedUser, refreshAuthUser } from "@/lib/api";

const LEGACY_OWN_PROFILE_PATHS = new Set([
  "/profile",
  "/profile/ashrith.builds",
  "/profile/undefined",
  "/profile/null",
]);

function getProfileTarget() {
  const username = getSavedUser()?.username?.trim();
  return username ? `/profile/${encodeURIComponent(username)}` : null;
}

export default function SocialProfileRedirector() {
  const redirectToViewer = useCallback(async () => {
    if (!getAuthToken()) return;

    const path = window.location.pathname;
    if (!LEGACY_OWN_PROFILE_PATHS.has(path)) return;

    const cachedTarget = getProfileTarget();
    if (cachedTarget && path !== cachedTarget) {
      window.dispatchEvent(new CustomEvent("nerdding:route-loading"));
      window.history.replaceState({}, "", cachedTarget);
      window.dispatchEvent(new PopStateEvent("popstate"));
      return;
    }

    try {
      const user = await refreshAuthUser();
      if (!user?.username) return;
      const target = `/profile/${encodeURIComponent(user.username)}`;
      if (window.location.pathname !== target) {
        window.dispatchEvent(new CustomEvent("nerdding:route-loading"));
        window.history.replaceState({}, "", target);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    } catch {
      // Keep the existing page if authentication cannot be refreshed.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const goToOwnProfile = (event?: Event) => {
      if (cancelled || !getAuthToken()) return;
      const target = getProfileTarget();
      if (!target) return;

      if (event) {
        event.preventDefault();
        event.stopPropagation();
        if ("stopImmediatePropagation" in event) {
          (event as Event & { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.();
        }
      }

      window.dispatchEvent(new CustomEvent("nerdding:route-loading"));
      window.history.pushState({}, "", target);
      window.dispatchEvent(new PopStateEvent("popstate"));
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button") as HTMLButtonElement | null;
      if (!button) return;

      const text = button.textContent?.replace(/\s+/g, " ").trim();
      if (text === "Profile") goToOwnProfile(event);
    };

    const handleRoute = () => {
      if (!cancelled) void redirectToViewer();
    };

    if (window.location.pathname === "/" && getAuthToken()) {
      window.dispatchEvent(new CustomEvent("nerdding:route-loading"));
      window.history.replaceState({}, "", "/home");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handleRoute);
    handleRoute();

    return () => {
      cancelled = true;
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handleRoute);
    };
  }, [redirectToViewer]);

  return null;
}
