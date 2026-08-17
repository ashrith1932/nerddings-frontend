"use client";

import { useEffect } from "react";
import { getSavedUser } from "@/lib/api";

export default function SocialProfileRedirector() {
  useEffect(() => {
    const user = getSavedUser();
    if (!user?.username) return;
    if (window.location.pathname === "/profile/ashrith.builds" && user.username !== "ashrith.builds") {
      window.history.replaceState({}, "", `/profile/${user.username}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, []);
  return null;
}
