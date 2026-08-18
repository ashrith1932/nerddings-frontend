"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, Github, Heart, MessageCircle, Activity, Bookmark, Users, Plus, Search, X } from "lucide-react";
import { apiFetch, getSavedUser } from "@/lib/api";

type Person = { id: string; name: string; username: string; avatarUrl?: string | null; accountType?: string; bio?: string | null };
type Project = { id: string; name: string; slug: string; description: string; stage: string; github_url?: string | null; created_at?: string | null };
type Build = { id: string; authorId: string; text: string; createdAt: string; projectId?: string | null; projectName?: string | null; projectSlug?: string | null; agentName?: string | null; agentSlug?: string | null; linkUrl?: string | null; likes: number; comments: number; reposts: number; saves: number };
type Affiliation = { id: string; name: string; slug: string; type: string; verified: boolean; role: string; timeline?: Array<{ id: string; role: string; eventType: string; createdAt: string }> };
type ProfileResponse = { data: { user: { id: string; name: string; username: string; avatarUrl?: string | null }; stats: { followers: number; following: number; projects: number; posts: number }; projects: Project[]; posts: Build[]; buildHistory?: Build[]; followers?: Person[]; following?: Person[]; affiliations: Affiliation[] } };
type Agent = { id: string; name: string; slug: string; type: string; verified: boolean };

type Tab = "builds" | "projects" | "followers" | "following" | "affiliations";

const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";
const formatTime = (value?: string | null) => value ? new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "";
const nav = (path: string) => { window.history.pushState({}, "", path); window.dispatchEvent(new PopStateEvent("popstate")); };

function openExistingPostComposer() {
  const createButton = document.querySelector<HTMLButtonElement>(".create-button, .header-create");
  if (!createButton) {
    nav("/home");
    return;
  }
  createButton.click();
  window.setTimeout(() => {
    const createPost = Array.from(document.querySelectorAll<HTMLButtonElement>(".create-option"))
      .find((button) => button.textContent?.toLowerCase().includes("create a post"));
    createPost?.click();
  }, 0);
}

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

function AddAgentModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { apiFetch<{ data: Agent[] }>("/social/affiliations/agents").then(r => setAgents(r.data ?? [])).catch(() => setAgents([])); }, []);
  const filtered = agents.filter(agent => `${agent.name} ${agent.slug}`.toLowerCase().includes(query.toLowerCase()));
  const selectAgent = async (agentId: string) => {
    if (!role.trim()) { setError("Add your role before sending the request."); return; }
    setBusy(true); setError("");
    try {
      await apiFetch("/social/affiliations/requests", { method: "POST", body: JSON.stringify({ agentId, role: role.trim() }) });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Affiliation request could not be sent.");
    } finally { setBusy(false); }
  };
  return <div className="profile-action-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="profile-action-modal">
      <header><div><div className="eyebrow">TRUSTED IDENTITY</div><h2>Add an agent</h2><p>Request a verified affiliation for your profile.</p></div><button className="profile-action-modal-close" onClick={onClose} aria-label="Close"><X size={17} /></button></header>
      <label className="profile-action-field"><span>Search verified agents</span><div className="profile-action-input"><Search size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search agent name or username" autoFocus /></div></label>
      <label className="profile-action-field"><span>Your role</span><input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Builder, Researcher, Founder" /></label>
      {error && <p className="profile-action-error">{error}</p>}
      <div className="profile-action-results">{filtered.length ? filtered.map(agent => <button key={agent.id} disabled={busy} className="profile-action-agent" onClick={() => void selectAgent(agent.id)}><span className="profile-action-agent-badge">{agent.name.slice(0, 1)}</span><span><strong>{agent.name}</strong><small>@{agent.slug} · {agent.type}</small></span><ArrowUpRight size={14} /></button>) : <span className="profile-action-empty">No verified agents found.</span>}</div>
    </div>
  </div>;
}

export default function ProfileSectionTabs({ username }: { username: string }) {
  const [data, setData] = useState<ProfileResponse["data"] | null>(null);
  const [tab, setTab] = useState<Tab>("builds");
  const [loading, setLoading] = useState(true);
  const [addAgentOpen, setAddAgentOpen] = useState(false);
  useEffect(() => { let active = true; setLoading(true); apiFetch<ProfileResponse>(`/social/users/${encodeURIComponent(username)}/profile-live`).then(r => { if (active) setData(r.data); }).catch(() => { if (active) setData(null); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [username]);
  const builds = useMemo(() => (data?.posts ?? []).slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [data]);
  if (!data) return loading ? <div className="profile-tabs-loading"><span /></div> : null;
  const people = tab === "followers" ? (data.followers ?? []) : (data.following ?? []);
  const own = getSavedUser()?.username?.toLowerCase() === username.toLowerCase();
  return <section className="profile-section-tabs-wrap">
    <nav className="profile-section-tabs" aria-label="Profile sections">
      {([ ["builds", "Builds", data.stats.posts], ["projects", "Projects", data.stats.projects], ["followers", "Followers", data.stats.followers], ["following", "Following", data.stats.following], ["affiliations", "Affiliations", data.affiliations.length] ] as const).map(([id, label, count]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><span>{label}</span><b>{count}</b></button>)}
    </nav>
    <div className="profile-section-content">
      {tab === "builds" && <>
        {own && <div className="profile-tab-actionbar"><div><span className="eyebrow">BUILD IN PUBLIC</span><strong>Keep your build log moving.</strong></div><button className="primary-button profile-tab-action" onClick={openExistingPostComposer}><Plus size={15} /> Post a Build</button></div>}
        <div className="profile-builds-list">{builds.length ? builds.map(build => <BuildCard key={build.id} build={build} user={data.user} />) : <div className="profile-tab-empty"><Activity size={20} /><strong>No builds yet</strong><span>Build updates will appear here like a feed.</span></div>}</div>
      </>}
      {tab === "projects" && <>
        {own && <div className="profile-tab-actionbar"><div><span className="eyebrow">PROJECTS</span><strong>Give your next idea a home.</strong></div><button className="primary-button profile-tab-action" onClick={() => nav("/project/new")}><Plus size={15} /> Post a Project</button></div>}
        <div className="profile-projects-grid">{data.projects.map(project => <button key={project.id} className="profile-project-card-modern" onClick={() => nav(`/project/${encodeURIComponent(project.slug)}`)}><div className="profile-project-card-top"><span>{project.stage}</span>{project.github_url && <Github size={15} />}</div><h3>{project.name}</h3><p>{project.description}</p><small>{project.created_at ? `Created ${formatDate(project.created_at)}` : "Nerdding project"}</small></button>)}</div>
      </>}
      {(tab === "followers" || tab === "following") && <div className="profile-people-list">{people.length ? people.map(person => <div className="profile-person-row" key={person.id}><button className="profile-person-main" onClick={() => nav(`/profile/${encodeURIComponent(person.username)}`)}><Avatar person={person} size={42} /><span><strong>{person.name}</strong><small>@{person.username}</small>{person.bio && <em>{person.bio}</em>}</span></button><button className="profile-person-arrow" onClick={() => nav(`/profile/${encodeURIComponent(person.username)}`)}><ArrowUpRight size={15} /></button></div>) : <div className="profile-tab-empty"><Users size={20} /><strong>{tab === "followers" ? "No followers yet" : "Not following anyone yet"}</strong><span>People will appear here when the relationship exists.</span></div>}</div>}
      {tab === "affiliations" && <>
        {own && <div className="profile-tab-actionbar"><div><span className="eyebrow">AFFILIATIONS</span><strong>Show the organizations you work with.</strong></div><button className="primary-button profile-tab-action" onClick={() => setAddAgentOpen(true)}><Plus size={15} /> Add an Agent</button></div>}
        <div className="profile-affiliation-list">{data.affiliations.length ? data.affiliations.map(aff => <article className="profile-affiliation-modern" key={aff.id}><div className="profile-affiliation-top"><div><div className="profile-affiliation-name"><span className="profile-affiliation-badge">{aff.name.slice(0, 1)}</span><span><strong>{aff.name}</strong><small>@{aff.slug}</small></span></div></div>{aff.verified && <span className="profile-verified-pill"><Check size={12} /> Verified</span>}</div><p>{aff.role} · {aff.type}</p>{aff.timeline?.length ? <div className="profile-affiliation-timeline">{aff.timeline.map(item => <div key={item.id}><i /><span><strong>{item.role}</strong><small>{item.eventType} · {formatDate(item.createdAt)}</small></span></div>)}</div> : null}</article>) : <div className="profile-tab-empty"><Users size={20} /><strong>No affiliations yet</strong><span>Verified agent affiliations will appear here.</span></div>}</div>
      </>}
    </div>
    {addAgentOpen && <AddAgentModal onClose={() => setAddAgentOpen(false)} onDone={() => { setAddAgentOpen(false); setLoading(true); apiFetch<ProfileResponse>(`/social/users/${encodeURIComponent(username)}/profile-live`).then(r => setData(r.data)).finally(() => setLoading(false)); }} />}
  </section>;
}
