"use client";

import { useState } from "react";
import { Bell, CalendarDays, Compass, Home, Layers3, MessageCircle, MoreHorizontal, Plus, Rocket, Search, Settings, TrendingUp, UserRound, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Wordmark } from "@/components/brand/BrandMark";
import { getSavedUser } from "@/lib/api";
import ProfileStandaloneView from "@/components/app/ProfileStandaloneView";
import MainContentLayoutFix from "@/components/app/MainContentLayoutFix";
import SiteFooter from "@/components/app/SiteFooter";

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
    ? { id: saved.id, name: saved.name, username: saved.username, avatarUrl: saved.avatarUrl, initials: saved.name.slice(0, 2).toUpperCase() }
    : { id: "visitor", name: "Nerdding visitor", username: "visitor", avatarUrl: undefined, initials: "N" };
}

export default function ProfileRouteOnly({ username }: { username: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const user = currentIdentity();
  const active = "/profile";

  return (
    <>
      <MainContentLayoutFix />
      <div className="app-shell">
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
            <button className="nav-item nav-item-active" onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}><UserRound size={18} /><span>Profile</span></button>
            <button className="nav-item" onClick={() => navigate("/settings")}><Settings size={18} /><span>Settings</span></button>
          </nav>
          <button className="create-button" onClick={() => setMenuOpen((value) => !value)}><span className="create-plus"><Plus size={18} /></span><span>Create</span><kbd>C</kbd></button>
          <div className="sidebar-bottom">
            <div className="status-chip">Live account</div>
            <button className="user-mini" onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}><Avatar user={user as any} size="sm" /><span><strong>{user.name}</strong><small>@{user.username}</small></span><MoreHorizontal size={16} /></button>
          </div>
        </aside>
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen((value) => !value)} aria-label="Open menu"><span>☰</span></button>
          <div className="page-title">Profile</div>
          <div className="header-search"><Search size={17} /><input placeholder="Search people, projects, ideas" onKeyDown={(e) => { if (e.key === "Enter") navigate(`/search?q=${encodeURIComponent((e.currentTarget as HTMLInputElement).value)}`); }} /></div>
          <div className="topbar-actions"><button className="header-create" onClick={() => navigate(`/home`)}><Plus size={16} /> Create</button><Avatar user={user as any} size="sm" /></div>
        </header>
        {menuOpen && <div className="create-popover"><div className="create-popover-head"><span className="eyebrow">MAKE SOMETHING</span><button className="icon-btn" onClick={() => setMenuOpen(false)}><X size={17} /></button></div><button className="create-option" onClick={() => { setMenuOpen(false); navigate("/home"); }}><span><strong>Create a post</strong><small>Share a build update or idea</small></span><Plus size={15} /></button><button className="create-option" onClick={() => { setMenuOpen(false); navigate("/project/new"); }}><span><strong>Create a project</strong><small>Give your work a home</small></span><Plus size={15} /></button><button className="create-option" onClick={() => { setMenuOpen(false); navigate("/events?create=1"); }}><span><strong>Create an event</strong><small>Bring your community together</small></span><Plus size={15} /></button></div>}
        <main className="app-main">
          <div className="page-content"><ProfileStandaloneView username={username} /></div>
          <SiteFooter />
        </main>
      </div>
    </>
  );
}
