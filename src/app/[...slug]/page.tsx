"use client";

import { usePathname } from "next/navigation";
import NewSocialApp from "@/components/social/NewSocialApp";
import AgentExperience from "@/components/social/AgentExperience";

export default function CatchAllPage() {
  const pathname = usePathname();
  if (pathname.startsWith("/agent/")) return <AgentExperience slug={decodeURIComponent(pathname.split("/")[2] || "")} />;
  return <NewSocialApp />;
}
