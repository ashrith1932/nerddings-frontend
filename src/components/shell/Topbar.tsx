"use client";

import { Plus, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { getSavedUser } from "@/services/api";

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
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

export default function Topbar({ path, onMenu }: { path: string; onMenu: () => void }) {
  const saved = getSavedUser();
  const user = saved ? { name: saved.name, username: saved.username, avatarUrl: saved.avatarUrl } : { name: "Nerdding visitor", username: "visitor", avatarUrl: undefined };
  return <header className="topbar">
    <button className="mobile-menu" onClick={onMenu} aria-label="Open menu"><span>☰</span></button>
    <div className="page-title">{titleFor(path)}</div>
    <div className="header-search"><Search size={17} /><input placeholder="Search people, projects, ideas" onKeyDown={(event) => { if (event.key === "Enter") navigate(`/search?q=${encodeURIComponent(event.currentTarget.value)}`); }} /></div>
    <div className="topbar-actions"><button className="header-create" onClick={onMenu}><Plus size={16} /> Create</button><Avatar user={user as any} size="sm" /></div>
  </header>;
}
