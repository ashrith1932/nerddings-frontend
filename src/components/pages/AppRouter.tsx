"use client";

import { useEffect, useState } from "react";
import ProfilePage from "@/components/pages/Profile/ProfilePage";
import ProjectDetailPage from "@/components/pages/Projects/ProjectDetailPage";
import ProjectCreatePage from "@/components/pages/Projects/ProjectCreatePage";
import ActivePost from "@/components/post/ActivePost";
import { SettingsSurface } from "@/components/pages/Settings/SettingsRoutes";
import { LiveHomeRoute, LiveMessagesRoute, LiveNotificationsRoute, LiveChartsRoute, LiveFundraisingRoute, LiveSearchRoute } from "@/components/pages/LiveDataRoutes";
import { ExploreRoute, EventsRoute } from "@/components/pages/DiscoveryRoutes";
import YourNerddingsPage from "@/components/pages/YourNerddings/YourNerddingsPage";
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
  if (path.startsWith("/profile/")) content = <ProfilePage username={slug} />;
  else if (path.startsWith("/project/") && path !== "/project/new") content = <ProjectDetailPage slug={slug} />;
  else if (path === "/project/new") content = <ProjectCreatePage />;
  else if (path.startsWith("/post/")) content = <ActivePost postId={slug} />;
  else if (path.startsWith("/settings")) content = <SettingsSurface />;
  else if (path.startsWith("/explore")) content = <ExploreRoute />;
  else if (path.startsWith("/events")) content = <EventsRoute />;
  else if (path.startsWith("/messages")) content = <LiveMessagesRoute />;
  else if (path.startsWith("/notifications")) content = <LiveNotificationsRoute />;
  else if (path.startsWith("/charts")) content = <LiveChartsRoute />;
  else if (path.startsWith("/fundraising")) content = <LiveFundraisingRoute />;
  else if (path.startsWith("/search")) content = <LiveSearchRoute query={typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("q") ?? ""} />;
  else if (path.startsWith("/nerddings")) content = <YourNerddingsPage />;
  else if (path.startsWith("/documentation")) content = <DocumentationSurface slug={slug || "about"} />;
  else content = <><LiveHomeRoute />{path === "/home" && <FeedUpdatePrompt />}</>;

  return <>{content}{activePostId && path.startsWith("/explore") ? <ActivePost postId={activePostId} onClose={() => setActivePostId(null)} isPanel /> : null}</>;
}
