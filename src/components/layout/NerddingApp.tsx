"use client";

import { useEffect, useState } from "react";
import { Bell, CalendarDays, Compass, Home, Layers3, MessageCircle, MoreHorizontal, Plus, Rocket, Search, Settings, TrendingUp, UserRound, X } from "lucide-react";
import { Avatar, VerifiedMark } from "@/components/ui/Avatar";
import { Wordmark } from "@/components/brand/BrandMark";
import { Toast } from "@/components/ui/Toast";
import { apiFetch, getAuthToken, getSavedUser } from "@/lib/api";
import ProfilePage from "@/components/app/ProfilePage";
import ProjectDetailSurface from "@/components/app/ProjectDetailSurface";
import PostDetailSurface from "@/components/app/PostDetailSurface";
import ProjectSurface from "@/components/app/ProjectSurface";
import { SettingsSurface } from "@/components/app/NerddingRouteSurfaces";
import { LiveHomeRoute, LiveMessagesRoute, LiveNotificationsRoute, LiveChartsRoute, LiveFundraisingRoute, LiveSearchRoute } from "@/components/app/LiveDataRoutes";
import { ExploreRoute, EventsRoute } from "@/components/app/DiscoveryRoutes";
import DocumentationSurface from "@/components/public/DocumentationSurface";
import SiteFooter from "@/components/app/SiteFooter";
import MainContentLayoutFix from "@/components/app/MainContentLayoutFix";
import RouteVisualFixLayer from "@/components/app/RouteVisualFixLayer";
import HashtagEnhancer from "@/components/social/HashtagEnhancer";
import FeedUpdatePrompt from "@/components/social/FeedUpdatePrompt";
import AgentVerificationGate2 from "@/components/agent/AgentVerificationGate2";
import AgentVerificationRedirect from "@/components/agent/AgentVerificationRedirect";
import AgentRouteShield from "@/components/agent/AgentRouteShield";
import AgentLoginLink from "@/components/agent/AgentLoginLink";
import AgentPendingNotice from "@/components/agent/AgentPendingNotice";
import NerddingInteractionLayer from "@/components/app/NerddingInteractionLayer";
import NerddingProjectInteractionLayer from "@/components/app/NerddingProjectInteractionLayer";
import "@/components/app/nerdding-route-surfaces.css";

const MESSAGE_CACHE_PREFIX = "nerdding.messages.v2.";

function repairMessageCache() {
  if (typeof window === "undefined") return;
  const remove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key?.startsWith(MESSAGE_CACHE_PREFIX)) continue;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw || !Array.isArray(JSON.parse(raw))) remove.push(key);
    } catch {
      remove.push(key);
    }
  }
  remove.forEach((key) => window.localStorage.removeItem(key));
}

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

const primaryNav = [
  ["Home", "/home", Home],
  ["Explore", "/explore", Compass],
  ["Top charts", "/charts", TrendingUp],
  ["Fundraising", "/fundraising", Rocket],
  ["Events", "/events", CalendarDays],
  ["Your Nerddings", "/nerddings", Layers3],
  ["Messages", "/messages", MessageCircle],
  ["Notifications", "/notifications", Bell],
] as const;

function currentIdentity() {
  const saved = getSavedUser();
  return saved
    ? { id: saved.id, name: saved.name, username: saved.username, avatarUrl: saved.avatarUrl, initials: saved.name.slice(0, 2).toUpperCase(), role: saved.accountType === "agent" ? "Agent" : "Builder", verified: saved.accountType === "agent" }
    : { id: "visitor", name: "Nerdding visitor", username: "visitor", avatarUrl: undefined, initials: "N", role: "Visitor", verified: false };
}

function LoginlessShell({ path, onCreate, onMenu, menuOpen, onCloseMenu }: { path: string; onCreate: () => void; onMenu: () => void; menuOpen: boolean; onCloseMenu: () => void }) {
  const user = currentIdentity();
  const active = path === "/" ? "/home" : path.startsWith("/profile/") ? "/profile" : path.startsWith("/project/") ? "/explore" : path.split("/").slice(0, 2).join("/");
  return (
    <>
      <aside className="sidebar">
        <button className="logo-link" onClick={() => navigate("/home")} aria-label="Nerdding home">
          <Wordmark />
        </button>
        <div className="sidebar-label">Workspace</div>
        <nav className="main-nav">
          {primaryNav.map(([label, href, Icon]) => (
            <button key={href} className={`nav-item ${active === href ? "nav-item-active" : ""}`} onClick={() => navigate(href)}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-label">Personal</div>
        <nav className="main-nav">
          <button className={`nav-item ${active === "/profile" ? "nav-item-active" : ""}`} onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}><UserRound size={18} /><span>Profile</span></button>
          <button className={`nav-item ${active === "/settings" ? "nav-item-active" : ""}`} onClick={() => navigate("/settings")}><Settings size={18} /><span>Settings</span></button>
        </nav>
        <button className="create-button" onClick={onCreate}><span className="create-plus"><Plus size={18} /></span><span>Create</span><kbd>C</kbd></button>
        <div className="sidebar-bottom">
          <div className="status-chip">Live account</div>
          <button className="user-mini" onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}>
            <Avatar user={user as any} size="sm" />
            <span><strong>{user.name}</strong><small>@{user.username}</small></span>
            <MoreHorizontal size={16} />
          </button>
        </div>
      </aside>
      <header className="topbar">
        <button className="mobile-menu" onClick={onMenu} aria-label="Open menu"><span>☰</span></button>
        <div className="page-title">{getTitle(path)}</div>
        <div className="header-search"><Search size={17} /><input placeholder="Search people, projects, ideas" onKeyDown={(e) => { if (e.key === "Enter") navigate(`/search?q=${encodeURIComponent((e.currentTarget as HTMLInputElement).value)}`); }} /></div>
        <div className="topbar-actions">
          <button className="header-create" onClick={onCreate}><Plus size={16} /> Create</button>
          <Avatar user={user as any} size="sm" />
        </div>
      </header>
      {menuOpen && (
        <div className="create-popover">
          <div className="create-popover-head"><span className="eyebrow">MAKE SOMETHING</span><button className="icon-btn" onClick={onCloseMenu}><X size={17} /></button></div>
          <button className="create-option" onClick={() => { onCloseMenu(); window.dispatchEvent(new CustomEvent("nerdding:open-composer")); }}><span><strong>Create a post</strong><small>Share a build update or idea</small></span><Plus size={15} /></button>
          <button className="create-option" onClick={() => { onCloseMenu(); navigate("/project/new"); }}><span><strong>Create a project</strong><small>Give your work a home</small></span><Plus size={15} /></button>
          <button className="create-option" onClick={() => { onCloseMenu(); navigate("/events?create=1"); }}><span><strong>Create an event</strong><small>Bring your community together</small></span><Plus size={15} /></button>
        </div>
      )}
    </>
  );
}

function getTitle(path: string) {
  if (path.startsWith("/profile")) return "Profile";
  if (path.startsWith("/project")) return "Project";
  if (path.startsWith("/home") || path === "/") return "Home";
  if (path.startsWith("/explore")) return "Explore";
  if (path.startsWith("/charts")) return "Top charts";
  if (path.startsWith("/fundraising")) return "Fundraising";
  if (path.startsWith("/events")) return "Events";
  if (path.startsWith("/messages")) return "Messages";
  if (path.startsWith("/notifications")) return "Notifications";
  if (path.startsWith("/settings")) return "Settings";
  if (path.startsWith("/search")) return "Search";
  if (path.startsWith("/nerddings")) return "Your Nerddings";
  return "Nerdding";
}

export function NerddingApp() {
  const [path, setPath] = useState(() => (typeof window === "undefined" ? "/home" : window.location.pathname));
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    repairMessageCache();
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    document.body.dataset.appRoute = path;
    return () => { delete document.body.dataset.appRoute; };
  }, [path]);

  /* Standalone post routing uses NerddingApp's detail surface.
     Home owns its active panel internally through HomeFeedSurface, so do not
     attach the global open-post listener there. Explore continues using the
     existing external panel until it gets its own local state owner. */
  useEffect(() => {
    if (!path.startsWith("/explore")) return;
    const onOpenPost = (event: Event) => {
      const detail = (event as CustomEvent<{ postId?: string }>).detail;
      if (detail?.postId) setActivePostId(detail.postId);
    };
    window.addEventListener("nerdding:open-post", onOpenPost);
    return () => window.removeEventListener("nerdding:open-post", onOpenPost);
  }, [path]);

  useEffect(() => {
    const refreshBadges = async () => {
      const token = getAuthToken();
      if (!token) return;
      try {
        const [notifications, messages] = await Promise.allSettled([
          apiFetch<any>("/notifications"),
          apiFetch<any>("/social/messages/unread-count"),
        ]);
        const notificationCount = notifications.status === "fulfilled" ? Number(notifications.value?.unreadCount ?? notifications.value?.data?.unreadCount ?? 0) : 0;
        const messageCount = messages.status === "fulfilled" ? Number(messages.value?.data?.unreadCount ?? 0) + Number(messages.value?.data?.pendingRequests ?? 0) : 0;
        document.querySelectorAll<HTMLElement>(".nav-item").forEach((item) => {
          const label = item.querySelector("span")?.textContent?.trim();
          const count = label === "Messages" ? messageCount : label === "Notifications" ? notificationCount : 0;
          let badge = item.querySelector<HTMLElement>("b");
          if (count <= 0) { badge?.remove(); return; }
          if (!badge) { badge = document.createElement("b"); item.appendChild(badge); }
          badge.textContent = count > 99 ? "99+" : String(count);
        });
      } catch {
        // Keep navigation usable even when counts fail.
      }
    };
    void refreshBadges();
    const timer = window.setInterval(() => void refreshBadges(), 15000);
    return () => window.clearInterval(timer);
  }, [path]);

  useEffect(() => {
    const onOpenComposer = () => setToast("Use the Create menu to publish a live update.");
    window.addEventListener("nerdding:open-composer", onOpenComposer);
    return () => window.removeEventListener("nerdding:open-composer", onOpenComposer);
  }, []);

  useEffect(() => {
    const onToast = (event: Event) => {
      const message = (event as CustomEvent<string>).detail;
      if (message) setToast(message);
    };
    window.addEventListener("nerdding:toast", onToast);
    return () => window.removeEventListener("nerdding:toast", onToast);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  let content: React.ReactNode;
  const slug = decodeURIComponent(path.split("/")[2] || "");
  if (path.startsWith("/profile/")) content = <ProfilePage username={slug} />;
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

  const showExplorePanel = Boolean(activePostId && path.startsWith("/explore"));

  return (
    <>
      <MainContentLayoutFix />
      <RouteVisualFixLayer />
      <div className="app-shell">
        <LoginlessShell path={path} onCreate={() => setMenuOpen((value) => !value)} onMenu={() => setMenuOpen((value) => !value)} menuOpen={menuOpen} onCloseMenu={() => setMenuOpen(false)} />
        <main className="app-main">
          <div className="page-content">{content}</div>
          {showExplorePanel && <PostDetailSurface postId={activePostId!} onClose={() => setActivePostId(null)} isPanel />}
          <SiteFooter />
        </main>
      </div>
      <NerddingInteractionLayer />
      <NerddingProjectInteractionLayer />
      <HashtagEnhancer />
      <AgentRouteShield />
      <AgentVerificationGate2 />
      <AgentVerificationRedirect />
      <AgentLoginLink />
      <AgentPendingNotice />
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </>
  );
}

export default NerddingApp;
