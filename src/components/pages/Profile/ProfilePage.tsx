"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Bookmark, Check, Ellipsis, Eye, Github, Heart, MessageCircle, Plus, Search, Send, Settings as SettingsIcon, X } from "lucide-react";
import { Avatar, VerifiedMark } from "@/components/ui/Avatar";
import { getSavedUser } from "@/services/api";
import { amplifyProfilePost, getProfilePost, getProfileSnapshot, getProfileFollowing, toggleProfileFollowing, toggleProfileLike, toggleProfileSave, type ProfilePost, type ProfileProject, type ProfileSnapshot, type ProfileUser } from "@/services/profile";
import MainContentLayoutFix from "@/components/app/MainContentLayoutFix";
import SiteFooter from "@/components/app/SiteFooter";
import "@/components/app/nerdding-route-surfaces.css";

const nav = [
  ["Home", "/home"], ["Explore", "/explore"], ["Top charts", "/charts"], ["Fundraising", "/fundraising"],
  ["Events", "/events"], ["Your Nerddings", "/nerddings"], ["Messages", "/messages"], ["Notifications", "/notifications"],
] as const;

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function initials(name?: string | null) {
  return (name ?? "N").split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function ago(value?: string | null) {
  if (!value) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function UserAvatar({ user, size = 42 }: { user: ProfileUser; size?: number }) {
  return <span className="home-avatar home-avatar-md profile-tab-avatar" style={{ width: size, height: size }}>{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials(user.name)}</span>;
}

function Skeleton() {
  return <div className="profile-page profile-loading"><div className="skeleton-block skeleton-cover" /><div className="skeleton-profile-head"><div className="skeleton-circle" /><div className="skeleton-lines"><i /><i /><i /></div></div><div className="skeleton-stats"><i /><i /><i /><i /></div><div className="skeleton-profile-grid"><div className="skeleton-block large" /><div className="skeleton-block" /></div></div>;
}

function PostCard({ post, user, onOpen }: { post: ProfilePost; user: ProfileUser; onOpen: (id: string) => void }) {
  const [likes, setLikes] = useState(post.likes);
  const [saves, setSaves] = useState(post.saves);
  const [reposts, setReposts] = useState(post.reposts);
  const [busy, setBusy] = useState(false);
  const action = async (kind: "like" | "save" | "amplify") => {
    if (busy) return;
    setBusy(true);
    try {
      if (kind === "like") setLikes((await toggleProfileLike(post.id)).count);
      if (kind === "save") setSaves((await toggleProfileSave(post.id)).count);
      if (kind === "amplify") setReposts((await amplifyProfilePost(post.id)).count);
    } finally { setBusy(false); }
  };
  return <article className="home-post profile-build-card profile-post-row" data-post-id={post.id} onClick={(event) => { if ((event.target as HTMLElement).closest("button,a,.nerdd-quote,video")) return; onOpen(post.id); }}>
    <div className="home-post-head">
      <button className="home-author" onClick={(event) => { event.stopPropagation(); navigate(`/profile/${encodeURIComponent(user.username)}`); }}><UserAvatar user={user} /><span><strong>{user.name}</strong><small>@{user.username} · {ago(post.createdAt)}</small></span></button>
      <button className="home-more" aria-label="Post options" onClick={(event) => event.stopPropagation()}><Ellipsis size={17} /></button>
    </div>
    <div className="home-post-copy">{post.text}</div>
    {post.quotePost?.author ? <article className="nerdd-quote profile-quote-card" role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); onOpen(post.quotePost!.id); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onOpen(post.quotePost!.id); } }}><div className="nerdd-quote-label">QUOTED POST</div><div className="nerdd-quote-head"><span className="nerdd-quote-avatar">{post.quotePost.author.avatarUrl ? <img src={post.quotePost.author.avatarUrl} alt="" /> : initials(post.quotePost.author.name)}</span><span><strong>{post.quotePost.author.name}</strong><small>@{post.quotePost.author.username} · {ago(post.quotePost.createdAt)}</small></span></div><div className="nerdd-quote-text">{post.quotePost.text}</div></article> : null}
    {post.projectName ? <button className="home-project" onClick={(event) => { event.stopPropagation(); window.dispatchEvent(new CustomEvent("nerdding:open-project-panel", { detail: { id: post.projectId, slug: post.projectSlug } })); }}><span><strong>{post.projectName}</strong><small>Project</small></span><ArrowRight size={14} /></button> : null}
    {post.linkUrl ? <a className="home-link" href={post.linkUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>{post.linkUrl.replace(/^https?:\/\//, "")}</a> : null}
    <div className="home-actions"><div className="home-actions-left"><button disabled={busy} onClick={(event) => { event.stopPropagation(); void action("like"); }}><Heart size={16} /><span>{likes}</span></button><button onClick={(event) => { event.stopPropagation(); onOpen(post.id); }}><MessageCircle size={16} /><span>{post.comments}</span></button><button data-action="amplify" disabled={busy} onClick={(event) => { event.stopPropagation(); void action("amplify"); }}><Activity size={16} /><span>{reposts}</span></button></div><div className="home-actions-right"><span className="home-views"><Eye size={14} /> {post.views ?? 0} views</span><button disabled={busy} onClick={(event) => { event.stopPropagation(); void action("save"); }}><Bookmark size={16} /><span>Save {saves}</span></button><button data-action="send" onClick={(event) => event.stopPropagation()}><Send size={16} /><span>Send</span></button></div></div>
  </article>;
}

function ProjectCard({ project, onOpen }: { project: ProfileProject; onOpen: (project: ProfileProject) => void }) {
  return <button className="profile-project-card-modern profile-project-live" onClick={() => onOpen(project)}><div className="profile-project-card-top"><span>{project.stage}</span>{project.github_url ? <Github size={15} /> : null}</div><h3>{project.name}</h3><p>{project.description}</p><small>{project.created_at ? new Date(project.created_at).toLocaleDateString() : ""}</small></button>;
}

function PeopleList({ people }: { people: ProfileSnapshot["followers"] }) {
  return <div className="profile-person-list">{people.map((person) => <button className="profile-person-row" key={person.id} onClick={() => navigate(`/profile/${encodeURIComponent(person.username)}`)}><UserAvatar user={person} size={44} /><span><strong>{person.name}</strong><small>@{person.username}</small>{person.bio ? <em>{person.bio}</em> : null}</span><ArrowRight size={15} /></button>)}</div>;
}

function ActivePost({ postId, onClose, onBack }: { postId: string; onClose: () => void; onBack?: () => void }) {
  const [post, setPost] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { let alive = true; setBusy(true); void getProfilePost(postId).then((value) => { if (alive) setPost(value); }).finally(() => { if (alive) setBusy(false); }); return () => { alive = false; }; }, [postId]);
  if (busy && !post) return <section className="home-active-post"><div className="home-modal"><div className="home-modal-head"><strong>Active post</strong><button onClick={onClose}><X size={17} /></button></div><div className="home-modal-scroll"><div className="profile-tab-skeleton-list"><div className="profile-tab-skeleton-row" /><div className="profile-tab-skeleton-row" /><div className="profile-tab-skeleton-row" /></div></div></div></section>;
  if (!post) return null;
  return <section className="home-active-post"><div className="home-modal"><header className="home-modal-head"><div><small>POST DETAIL</small><h2>Active post</h2></div><div style={{ display: "flex", gap: 6 }}>{onBack ? <button aria-label="Back" onClick={onBack}>←</button> : null}<button aria-label="Close" onClick={onClose}><X size={17} /></button></div></header><div className="home-modal-scroll"><article className="home-modal-content"><div className="home-post-head"><span className="home-author"><span className="home-avatar home-avatar-md">{post.author?.avatarUrl ? <img src={post.author.avatarUrl} alt="" /> : initials(post.author?.name)}</span><span><strong>{post.author?.name}</strong><small>@{post.author?.username}</small></span></span><small>{new Date(post.createdAt).toLocaleString()}</small></div><div className="home-active-text">{post.text}</div>{post.quotePost?.author ? <button className="nerdd-quote profile-quote-card"><div className="nerdd-quote-label">QUOTED POST</div><div className="nerdd-quote-head"><span className="nerdd-quote-avatar">{post.quotePost.author.avatarUrl ? <img src={post.quotePost.author.avatarUrl} alt="" /> : initials(post.quotePost.author.name)}</span><span><strong>{post.quotePost.author.name}</strong><small>@{post.quotePost.author.username}</small></span></div><div className="nerdd-quote-text">{post.quotePost.text}</div></button> : null}<div className="home-actions"><span><Heart size={15}/> {post.likes}</span><span><MessageCircle size={15}/> {post.comments}</span><span><Activity size={15}/> {post.reposts}</span><span><Eye size={15}/> {post.views}</span><span><Bookmark size={15}/> {post.saves}</span></div></article></div></div></section>;
}

export default function ProfileStandaloneView({ username }: { username: string }) {
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"posts" | "projects" | "followers" | "following">("posts");
  const [query, setQuery] = useState("");
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [project, setProject] = useState<ProfileProject | null>(null);
  const [following, setFollowing] = useState(false);
  const saved = getSavedUser();
  const own = saved?.username?.toLowerCase() === username.toLowerCase();

  useEffect(() => { let alive = true; setLoading(true); setError(""); void getProfileSnapshot(username).then((value) => { if (alive) { setSnapshot(value); if (!own) void getProfileFollowing(value.user.id).then(setFollowing).catch(() => undefined); } }).catch((reason) => { if (alive) setError(reason instanceof Error ? reason.message : "Profile could not be loaded"); }).finally(() => { if (alive) setLoading(false); }); return () => { alive = false; }; }, [username]);

  const visible = useMemo(() => {
    if (!snapshot) return [] as any[];
    const q = query.trim().toLowerCase();
    if (tab === "posts") return q ? snapshot.posts.filter((post) => post.text.toLowerCase().includes(q)) : snapshot.posts;
    if (tab === "projects") return q ? snapshot.projects.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q)) : snapshot.projects;
    const people = tab === "followers" ? snapshot.followers : snapshot.following;
    return q ? people.filter((p) => `${p.name} ${p.username} ${p.bio ?? ""}`.toLowerCase().includes(q)) : people;
  }, [snapshot, tab, query]);

  if (loading) return <><MainContentLayoutFix /><div className="app-shell"><main className="app-main"><div className="page-content"><Skeleton /></div></main></div></>;
  if (!snapshot) return <><MainContentLayoutFix /><div className="app-shell"><main className="app-main"><div className="page-content"><div className="empty-state"><strong>Profile could not be loaded.</strong><span>{error}</span></div></div></main></div></>;

  const openPost = (id: string) => { setHistory((current) => activePostId ? [...current, activePostId] : current); setActivePostId(id); };
  const backPost = () => setHistory((current) => { if (!current.length) return current; const next = [...current]; setActivePostId(next.pop()!); return next; });

  return <div className="profile-page">
    <div className="profile-cover"><div className="cover-grid" />{snapshot.user.avatarUrl ? <img className="cover-profile-logo" src={snapshot.user.avatarUrl} alt="Profile logo" /> : null}</div>
    <div className="profile-header"><UserAvatar user={snapshot.user} size={88} /><div className="profile-head-copy"><div className="profile-title-row"><div><h1>{snapshot.user.name} {snapshot.user.accountType === "agent" ? <VerifiedMark /> : null}</h1><p>@{snapshot.user.username}{snapshot.user.location ? ` · ${snapshot.user.location}` : ""}</p></div><div className="profile-actions">{!own ? <button className={following ? "outline-button" : "primary-button"} onClick={() => void toggleProfileFollowing(snapshot.user.id).then(setFollowing)}>{following ? <Check size={14}/> : <Plus size={14}/>} {following ? "Following" : "Follow"}</button> : <button className="outline-button"><SettingsIcon size={14}/> Edit profile</button>}</div></div><p className="profile-bio">{snapshot.user.bio || "Building in public on Nerdding."}</p></div></div>
    <div className="profile-section-tabs"><button className={tab === "posts" ? "active" : ""} onClick={() => setTab("posts")}>Build Notes <b>{snapshot.stats.posts}</b></button><button className={tab === "projects" ? "active" : ""} onClick={() => setTab("projects")}>Projects <b>{snapshot.stats.projects}</b></button><button className={tab === "followers" ? "active" : ""} onClick={() => setTab("followers")}>Followers <b>{snapshot.stats.followers}</b></button><button className={tab === "following" ? "active" : ""} onClick={() => setTab("following")}>Following <b>{snapshot.stats.following}</b></button></div>
    <div className="profile-content-grid"><div className="profile-section-content"><div className="profile-tab-search"><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tab === "posts" ? "Search build notes" : `Search ${tab}`} /></div>{tab === "posts" ? <div className="profile-posts-scroll">{(visible as ProfilePost[]).map((post) => <PostCard key={post.id} post={post} user={snapshot.user} onOpen={openPost}/>)}{visible.length === 0 ? <div className="profile-tab-empty"><strong>No posts found</strong></div> : null}</div> : tab === "projects" ? <div className="profile-tab-grid">{(visible as ProfileProject[]).map((item) => <ProjectCard key={item.id} project={item} onOpen={setProject}/>)}{visible.length === 0 ? <div className="profile-tab-empty"><strong>No projects found</strong></div> : null}</div> : <PeopleList people={visible as ProfileSnapshot["followers"]}/>}</div><aside className="profile-right-rail">{activePostId ? <ActivePost postId={activePostId} onClose={() => { setActivePostId(null); setHistory([]); }} onBack={history.length ? backPost : undefined}/> : null}<aside className="profile-affiliations-rail"><div className="profile-affiliations-rail-head"><div><div className="eyebrow">TRUSTED IDENTITY</div><h3>Affiliations</h3></div><button className="profile-tab-action" onClick={() => undefined}><Plus size={14}/> Add Agent</button></div>{snapshot.affiliations.length ? snapshot.affiliations.map((a) => <div className="profile-affiliation-row" key={a.id}><strong>{a.name}</strong><small>{a.role} · {a.verified ? "Verified" : "Pending"}</small></div>) : <div className="profile-tab-empty"><strong>No affiliations yet</strong><span>Verified affiliations will appear here.</span></div>}</aside></aside></div>
    {project ? <div className="page-content-project-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setProject(null); }}><div className="page-content-project-panel"><button className="page-content-project-close" onClick={() => setProject(null)}><X size={17}/></button><div className="nerdd-proj-page"><div className="nerdd-proj-hero"><small>{project.stage}</small><h1>{project.name}</h1><p>{project.description}</p>{project.github_url ? <a href={project.github_url} target="_blank" rel="noreferrer">View on GitHub ↗</a> : null}</div></div></div></div> : null}
  </div>;
}
