"use client";

import { useEffect, useState } from "react";
import { NerddingApp } from "@/components/layout/NerddingApp";
import SocialExperience from "@/components/social/SocialExperience";
import AgentExperience from "@/components/social/AgentExperience";

const socialRoutes = ["/home", "/explore", "/charts", "/messages", "/profile", "/project"];

export default function Page() {
  const [path, setPath] = useState("");
  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  if (!path) return <div style={{ minHeight: "100vh", background: "#f7f4ee" }} />;
  if (path.startsWith("/agent/")) return <AgentExperience slug={decodeURIComponent(path.split("/")[2] || "")} />;
  if (socialRoutes.some((route) => path === route || path.startsWith(`${route}/`))) return <SocialExperience />;
  return <NerddingApp />;
}
