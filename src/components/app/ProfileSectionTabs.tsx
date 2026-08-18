"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, Github, Heart, MessageCircle, Activity, Bookmark, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Person = { id: string; name: string; username: string; avatarUrl?: string | null; accountType?: string; bio?: string | null };
type Project = { id: string; name: string; slug: string; description: string; stage: string; github_url?: string | null; created_at?: string | null };
type Build = { id: string; authorId: string; text: string; createdAt: string; projectId?: string | null; projectName?: string | null; projectSlug?: string | null; agentName?: string | null; agentSlug?: string | null; linkUrl?: string | null; likes: number; comments: number; reposts: number; saves: number };
type Affiliation = { id: string; name: string; slug: string; type: string; verified: boolean; role: string; timeline?: Array<{ id: string; role: string; eventType: string; createdAt: string }> };
type ProfileResponse = { data: { user: { id: string; name: string; username: string; avatarUrl?: string | null }; stats: { followers: number; following: number; projects: number; posts: number }; projects: Project[]; posts: Build[]; buildHistory?: Build[]; followers?: Person[]; following?: Person[]; affiliations: Affiliation[] } };

type Tab = "builds" | "projects" | "followers" | "following" | "affiliations";

const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";
const formatTime = (value?: string | null) => value ? new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "";
const nav = (path: string) => { window.history.pushState({}, "", path); window.dispatchEvent(new PopStateEvent("popstate")); };

function Avatar({ person, size = 42 }: { person: Person | { name: string; username?: string; avatarUrl?: string | null }; size?: number }) {
  const initials = (person.name || "N").split(/\s+/).filter(Boolean).map(p => p[0]).join("").slice(0, 2).toUpperCase();
  return <span className="profile-tab-avatar" style={{ width: size, height: size }}>{person.avatarUrl ? <img src={person.avatarUrl} alt="" /> : initials}</span>;
}

function BuildCard({ build, user }: { build: Build; user: ProfileResponse["data"]["user"] }) {
  return <article className="profile-build-card" onClick={() => nav(`/post/${encodeURIComponent(build.id)}`)}>
    <header className="profile-build-head">
      <div className="profile-build-author"><Avatar person={{ name: user.name, username: user.username, avatarUrl: user.avatarUrl }} size={40} /><div><strong>{user.name}</strong><small>@{user.username}</small></div></div>
      <time dateTime={build.createdAt}><b>{formatDate(build.createdAt)}</b><span>{formatTime(build.createdAt)}</span></time>
    </header>
    <p className="profile-build-text">{build.text}</p>
    <div className="profile-build-tags">{build.projectName && <span>{build.projectName}</span>}{build.agentName && <span>{build.agentName}</span>}</div>
    {build.linkUrl && <a href={build.linkUrl} target="_blank" rel="noreferrer" className="profile-build-link" onClick={e => e.stopPropagation()}>{build.linkUrl.replace(/^https?:\/\//, "")}</a>}
    <footer className="profile-build-actions">
      <span><Heart size={15} /> {build.likes}</span><span><MessageCircle size={15} /> {build.comments}</span><span><Activity size={15} /> {build.reposts}</span><span className="profile-build-spacer" /><span className="profile-build-muted"><Bookmark size={15} /> {build.saves}</span>
    </footer>
  </article>;
}

export default function ProfileSectionTabs({ username }: { username: string }) {
  const [data, setData] = useState<ProfileResponse["data"] | null>(null);
  const [tab, setTab] = useState<Tab>("builds");
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; setLoading(true); apiFetch<ProfileResponse>(`/social/users/${encodeURIComponent(username)}/profile-live`).then(r => { if (active) setData(r.data); }).catch(() => { if (active) setData(null); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [username]);
  const builds = useMemo(() => (data?.posts ?? []).slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [data]);
  if (!data) return loading ? <div className="profile-tabs-loading"><span /></div> : null;
  const people = tab === "followers" ? (data.followers ?? []) : (data.following ?? []);
  return <section className="profile-section-tabs-wrap">
    <nav className="profile-section-tabs" aria-label="Profile sections">
      {([ ["builds", "Builds", data.stats.posts], ["projects", "Projects", data.stats.projects], ["followers", "Followers", data.stats.followers], ["following", "Following", data.stats.following], ["affiliations", "Affiliations", data.affiliations.length] ] as const).map(([id, label, count]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><span>{label}</span><b>{count}</b></button>)}
    </nav>
    <div className="profile-section-content">
      {tab === "builds" && <div className="profile-builds-list">{builds.length ? builds.map(build => <BuildCard key={build.id} build={build} user={data.user} />) : <div className="profile-tab-empty"><Activity size={20} /><strong>No builds yet</strong><span>Build updates will appear here like a feed.</span></div>}</div>}
      {tab === "projects" && <div className="profile-projects-grid">{data.projects.map(project => <button key={project.id} className="profile-project-card-modern" onClick={() => nav(`/project/${encodeURIComponent(project.slug)}`)}><div className="profile-project-card-top"><span>{project.stage}</span>{project.github_url && <Github size={15} />}</div><h3>{project.name}</h3><p>{project.description}</p><small>{project.created_at ? `Created ${formatDate(project.created_at)}` : "Nerdding project"}</small></button>)}</div>}
      {(tab === "followers" || tab === "following") && <div className="profile-people-list">{people.length ? people.map(person => <div className="profile-person-row" key={person.id}><button className="profile-person-main" onClick={() => nav(`/profile/${encodeURIComponent(person.username)}`)}><Avatar person={person} size={42} /><span><strong>{person.name}</strong><small>@{person.username}</small>{person.bio && <em>{person.bio}</em>}</span></button><button className="profile-person-arrow" onClick={() => nav(`/profile/${encodeURIComponent(person.username)}`)}><ArrowUpRight size={15} /></button></div>) : <div className="profile-tab-empty"><Users size={20} /><strong>{tab === "followers" ? "No followers yet" : "Not following anyone yet"}</strong><span>People will appear here when the relationship exists.</span></div>}</div>}
      {tab === "affiliations" && <div className="profile-affiliation-list">{data.affiliations.length ? data.affiliations.map(aff => <article className="profile-affiliation-modern" key={aff.id}><div className="profile-affiliation-top"><div><div className="profile-affiliation-name"><span className="profile-affiliation-badge">{aff.name.slice(0, 1)}</span><span><strong>{aff.name}</strong><small>@{aff.slug}</small></span></div></div>{aff.verified && <span className="profile-verified-pill"><Check size={12} /> Verified</span>}</div><p>{aff.role} · {aff.type}</p>{aff.timeline?.length ? <div className="profile-affiliation-timeline">{aff.timeline.map(item => <div key={item.id}><i /><span><strong>{item.role}</strong><small>{item.eventType} · {formatDate(item.createdAt)}</small></span></div>)}</div> : null}</article>) : <div className="profile-tab-empty"><Users size={20} /><strong>No affiliations yet</strong><span>Verified agent affiliations will appear here.</span></div>}</div>}
    </div>
  </section>;
}
