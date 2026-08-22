"use client";

import { useEffect, useState } from "react";
import ProfilePage from "@/components/pages/Profile/ProfilePage";
import ProjectDetailPage from "@/components/pages/Projects/ProjectDetailPage";
import ProjectCreatePage from "@/components/pages/Projects/ProjectCreatePage";
import ActivePost from "@/components/post/ActivePost";
import SettingsPage from "@/components/pages/Settings";
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
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [backgroundPath, setBackgroundPath] = useState("/home");

  useEffect(() => {
    if (!path.startsWith("/project/")) {
      setBackgroundPath(path);
    }
  }, [path]);

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

  const isProjectNew = path === "/project/new";
  const isProjectDetail = path.startsWith("/project/") && path !== "/project/new";
  const currentPath = (isProjectNew || isProjectDetail) ? backgroundPath : path;
  const routeSlug = decodeURIComponent(currentPath.split("/")[2] || "");
  const projectSlug = isProjectDetail ? decodeURIComponent(path.split("/")[2] || "") : "";

  let content: React.ReactNode;
  if (currentPath.startsWith("/profile/")) content = <ProfilePage username={routeSlug} />;
  else if (currentPath.startsWith("/post/")) content = <ActivePost id={routeSlug} />;
  else if (currentPath.startsWith("/settings")) content = <SettingsPage />;
  else if (currentPath.startsWith("/explore")) content = <ExplorePage />;
  else if (currentPath.startsWith("/events")) content = <EventsPage />;
  else if (currentPath.startsWith("/messages")) content = <MessagesPage />;
  else if (currentPath.startsWith("/notifications")) content = <NotificationsPage />;
  else if (currentPath.startsWith("/charts")) content = <ChartsPage />;
  else if (currentPath.startsWith("/fundraising")) content = <FundraisingPage />;
  else if (currentPath.startsWith("/search")) content = <SearchPage query={typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("q") ?? ""} />;
  else if (currentPath.startsWith("/nerddings")) content = <YourNerddingsPage />;
  else if (currentPath.startsWith("/documentation")) content = <DocumentationSurface slug={routeSlug || "about"} />;
  else content = <><HomePage />{currentPath === "/home" && <FeedUpdatePrompt />}</>;

  const handleCloseProject = () => {
    if (typeof window !== "undefined") {
      if (window.history.state && window.history.length > 1) {
        window.history.back();
      } else {
        window.history.pushState({}, "", backgroundPath);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    }
  };

  return (
    <>
      {content}
      {isProjectDetail && <ProjectDetailPage slug={projectSlug} onClose={handleCloseProject} />}
      {isProjectNew && <ProjectCreatePage onClose={handleCloseProject} />}
      {activePostId && currentPath.startsWith("/explore") ? <ActivePost id={activePostId} onClose={() => setActivePostId(null)} isPanel={true} /> : null}
    </>
  );
}
