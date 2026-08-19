"use client";

import { Bell, CalendarDays, Compass, Home, Layers3, MessageCircle, MoreHorizontal, Plus, Rocket, Settings, TrendingUp, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Wordmark } from "@/components/brand/BrandMark";
import { getSavedUser } from "@/services/api";

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

export default function Sidebar({ path, onCreate }: { path: string; onCreate: () => void }) {
  const saved = getSavedUser();
  const user = saved ? { name: saved.name, username: saved.username, avatarUrl: saved.avatarUrl } : { name: "Nerdding visitor", username: "visitor", avatarUrl: undefined };
  const active = path === "/" ? "/home" : path.startsWith("/profile/") ? "/profile" : path.startsWith("/project/") ? "/explore" : path.split("/").slice(0, 2).join("/");

  return <aside className="sidebar">
    <button className="logo-link" onClick={() => navigate("/home")} aria-label="Nerdding home"><Wordmark /></button>
    <div className="sidebar-label">Workspace</div>
    <nav className="main-nav">
      {primaryNav.map(([label, href, Icon]) => <button key={href} className={`nav-item ${active === href ? "nav-item-active" : ""}`} onClick={() => navigate(href)}><Icon size={18} /><span>{label}</span></button>)}
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
      <button className="user-mini" onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}><Avatar user={user as any} size="sm" /><span><strong>{user.name}</strong><small>@{user.username}</small></span><MoreHorizontal size={16} /></button>
    </div>
  </aside>;
}
