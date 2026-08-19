"use client";

import { useEffect, useState } from "react";
import ProfileStandaloneView from "@/components/app/ProfileStandaloneView";
import ProjectDetailSurface from "@/components/app/ProjectDetailSurface";
import ProjectSurface from "@/components/app/ProjectSurface";
import PostDetailSurface from "@/components/app/PostDetailSurface";
import { SettingsSurface } from "@/components/app/NerddingRouteSurfaces";
import { LiveHomeRoute, LiveMessagesRoute, LiveNotificationsRoute, LiveChartsRoute, LiveFundraisingRoute, LiveSearchRoute } from "@/components/app/LiveDataRoutes";
import { ExploreRoute, EventsRoute } from "@/components/app/DiscoveryRoutes";
import DocumentationSurface from "@/components/public/DocumentationSurface";
import FeedUpdatePrompt from "@/components/social/FeedUpdatePrompt";

type Props = { path: string };

export default function AppRouter({ path }: Props) {
  const slug = decodeURIComponent(path.split("/")[2] || "");
  const [activePostId, setActivePostId] = useState<string | null>(null);

  useEffect(() => {
    if (!path.startsWith("/explore")) {
      setActivePostId(null);
      return;
    }
    const onOpen = (event: Event) => {
      const id = (event as CustomEvent<{ postId?: string }>).detail?.postId;
      if (id) setActivePostId(id);
    };
    window.addEventListener("nerdding:open-post", onOpen);
    return () => window.removeEventListener("nerdding:open-post", onOpen);
  }, [path]);

  let content: React.ReactNode;
  if (path.startsWith("/profile/")) content = <ProfileStandaloneView username={slug} />;
  else if (path.startsWith("/project/") && path !== "/project/new") content = <ProjectDetailSurface slug={slug} />;
  else if (path === "/project/new") content = <ProjectSurface />;
  else if (path.startsWith("/post/")) content = <PostDetailSurface postId={slug} />;
  else if (path.startsWith("/settings")) content = <SettingsSurface />;
  else if (path.startsWith("/explore")) content = <ExploreRoute />;
  else if (path.startsWith("/events")) content = <EventsRoute />;
  else if (path.startsWith("/messages")) content = <LiveMessagesRoute />;
  else if (path.startsWith("/notifications")) content = <LiveNotificationsRoute />;
  else if (path.startsWith("/charts")) content = <LiveChartsRoute />;
  else if (path.startsWith("/fundraising")) content = <LiveFundraisingRoute />;
  else if (path.startsWith("/search")) content = <LiveSearchRoute query={typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("q") ?? ""} />;
  else if (path.startsWith("/nerddings")) content = <LiveNotificationsRoute />;
  else if (path.startsWith("/documentation")) content = <DocumentationSurface slug={slug || "about"} />;
  else content = <><LiveHomeRoute />{path === "/home" && <FeedUpdatePrompt />}</>;

  return <>{content}{activePostId && path.startsWith("/explore") ? <PostDetailSurface postId={activePostId} onClose={() => setActivePostId(null)} isPanel /> : null}</>;
}
