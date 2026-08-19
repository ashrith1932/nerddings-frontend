"use client";

import { useEffect, useState } from "react";
import ProfilePage from "@/components/pages/Profile/ProfilePage";
import ProjectDetailPage from "@/components/pages/Projects/ProjectDetailPage";
import ProjectCreatePage from "@/components/pages/Projects/ProjectCreatePage";
import ActivePost from "@/components/post/ActivePost";
import { SettingsSurface } from "@/components/pages/Settings/SettingsRoutes";
import HomePage from "@/components/pages/Home";
import ExplorePage from "@/components/pages/Explore";
import ChartsPage from "@/components/pages/Charts";
import FundraisingPage from "@/components/pages/Fundraising";
import EventsPage from "@/components/pages/Events";
import MessagesPage from "@/components/pages/Messages";
import NotificationsPage from "@/components/pages/Notifications";
import YourNerddingsPage from "@/components/pages/YourNerddings/YourNerddingsPage";
import DocumentationSurface from "@/components/public/DocumentationSurface";
import FeedUpdatePrompt from "@/components/social/FeedUpdatePrompt";
import SearchPage from "@/components/pages/Search";

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
  else if (path.startsWith("/explore")) content = <ExplorePage />;
  else if (path.startsWith("/events")) content = <EventsPage />;
  else if (path.startsWith("/messages")) content = <MessagesPage />;
  else if (path.startsWith("/notifications")) content = <NotificationsPage />;
  else if (path.startsWith("/charts")) content = <ChartsPage />;
  else if (path.startsWith("/fundraising")) content = <FundraisingPage />;
  else if (path.startsWith("/search")) content = <SearchPage query={typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("q") ?? ""} />;
  else if (path.startsWith("/nerddings")) content = <YourNerddingsPage />;
  else if (path.startsWith("/documentation")) content = <DocumentationSurface slug={slug || "about"} />;
  else content = <><HomePage />{path === "/home" && <FeedUpdatePrompt />}</>;

  return <>{content}{activePostId && path.startsWith("/explore") ? <ActivePost postId={activePostId} onClose={() => setActivePostId(null)} isPanel /> : null}</>;
}
