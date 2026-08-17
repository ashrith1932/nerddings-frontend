"use client";

import { useEffect } from "react";
import { getAuthToken, getSavedUser } from "@/lib/api";

export default function SocialProfileRedirector() {
  useEffect(() => {
    const sync = () => {
      const user = getSavedUser();
      if (getAuthToken() && window.location.pathname === "/") {
        window.history.replaceState({}, "", "/home");
        window.dispatchEvent(new PopStateEvent("popstate"));
        return;
      }
      if (!user?.username) return;
      if (window.location.pathname === "/profile/ashrith.builds" && user.username !== "ashrith.builds") {
        window.history.replaceState({}, "", `/profile/${user.username}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  return null;
}
