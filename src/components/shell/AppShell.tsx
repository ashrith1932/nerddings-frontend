"use client";

import { Bell, CalendarDays, Compass, Home, Layers3, MessageCircle, MoreHorizontal, Plus, Rocket, Search, Settings, UserRound, X, TrendingUp } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Wordmark } from "@/components/brand/BrandMark";
import { getSavedUser } from "@/lib/api";

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

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function currentIdentity() {
  const saved = getSavedUser();
  return saved
    ? { name: saved.name, username: saved.username, avatarUrl: saved.avatarUrl }
    : { name: "Nerdding visitor", username: "visitor", avatarUrl: undefined };
}

function titleFor(path: string) {
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

export default function AppShell({ path, menuOpen, onToggleMenu, onCloseMenu, children }: { path: string; menuOpen: boolean; onToggleMenu: () => void; onCloseMenu: () => void; children?: React.ReactNode }) {
  const user = currentIdentity();
  const active = path === "/" ? "/home" : path.startsWith("/profile/") ? "/profile" : path.startsWith("/project/") ? "/explore" : path.split("/").slice(0, 2).join("/");

  return (
    <>
      <aside className="sidebar">
        <button className="logo-link" onClick={() => navigate("/home")} aria-label="Nerdding home"><Wordmark /></button>
        <div className="sidebar-label">Workspace</div>
        <nav className="main-nav">
          {primaryNav.map(([label, href, Icon]) => (
            <button key={href} className={`nav-item ${active === href ? "nav-item-active" : ""}`} onClick={() => navigate(href)}><Icon size={18} /><span>{label}</span></button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-label">Personal</div>
        <nav className="main-nav">
          <button className={`nav-item ${active === "/profile" ? "nav-item-active" : ""}`} onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}><UserRound size={18} /><span>Profile</span></button>
          <button className={`nav-item ${active === "/settings" ? "nav-item-active" : ""}`} onClick={() => navigate("/settings")}><Settings size={18} /><span>Settings</span></button>
        </nav>
        <button className="create-button" onClick={onToggleMenu}><span className="create-plus"><Plus size={18} /></span><span>Create</span><kbd>C</kbd></button>
        <div className="sidebar-bottom">
          <div className="status-chip">Live account</div>
          <button className="user-mini" onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}><Avatar user={user as any} size="sm" /><span><strong>{user.name}</strong><small>@{user.username}</small></span><MoreHorizontal size={16} /></button>
        </div>
      </aside>
      <header className="topbar">
        <button className="mobile-menu" onClick={onToggleMenu} aria-label="Open menu"><span>☰</span></button>
        <div className="page-title">{titleFor(path)}</div>
        <div className="header-search"><Search size={17} /><input placeholder="Search people, projects, ideas" onKeyDown={(event) => { if (event.key === "Enter") navigate(`/search?q=${encodeURIComponent(event.currentTarget.value)}`); }} /></div>
        <div className="topbar-actions"><button className="header-create" onClick={onToggleMenu}><Plus size={16} /> Create</button><Avatar user={user as any} size="sm" /></div>
      </header>
      {menuOpen && <div className="create-popover"><div className="create-popover-head"><span className="eyebrow">MAKE SOMETHING</span><button className="icon-btn" onClick={onCloseMenu}><X size={17} /></button></div><button className="create-option" onClick={() => { onCloseMenu(); window.dispatchEvent(new CustomEvent("nerdding:open-composer")); }}><span><strong>Create a post</strong><small>Share a build update or idea</small></span><Plus size={15} /></button><button className="create-option" onClick={() => { onCloseMenu(); navigate("/project/new"); }}><span><strong>Create a project</strong><small>Give your work a home</small></span><Plus size={15} /></button><button className="create-option" onClick={() => { onCloseMenu(); navigate("/events?create=1"); }}><span><strong>Create an event</strong><small>Bring your community together</small></span><Plus size={15} /></button></div>}
      <main className="app-main">
        <div className="page-content">{children}</div>
      </main>
    </>
  );
}
