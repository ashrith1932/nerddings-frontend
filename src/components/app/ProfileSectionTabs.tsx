"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ArrowUpRight, Bookmark, Check, Ellipsis, Eye, Github, Heart, MessageCircle, Plus, Search, Send, Users } from "lucide-react";
import { apiFetch, getSavedUser } from "@/lib/api";
import PostDetailSurface from "@/components/app/PostDetailSurface";

type Tab = "posts" | "projects" | "followers" | "following";
type User = { id: string; name: string; username: string; avatarUrl?: string | null; bio?: string | null; accountType?: string };
type Media = { publicUrl: string | null; mimeType: string };
type QuotePost = { id: string; author: User; text: string; createdAt: string; media?: Media[]; linkUrl?: string | null };
type Build = { id: string; authorId: string; text: string; createdAt: string; projectId?: string | null; projectName?: string | null; projectSlug?: string | null; linkUrl?: string | null; quotePostId?: string | null; quotePost?: QuotePost | null; media?: Media[]; likes: number; comments: number; reposts: number; saves: number; views?: number };
type Project = { id: string; name: string; slug: string; description: string; stage: string; github_url?: string | null; created_at?: string | null };
type Person = User & { createdAt?: string };
type Cursor = { createdAt: string; id: string };
type ProfileSummary = { user: User; stats: { posts: number; projects: number; followers: number; following: number }; affiliations: Array<{ id: string; name: string; slug: string; type: string; verified: boolean; role: string }> };

type Cache = { items: any[]; cursor: Cursor | null; hasMore: boolean; loading: boolean; error: string };
const emptyCache = (): Cache => ({ items: [], cursor: null, hasMore: true, loading: false, error: "" });
const ago = (value?: string | null) => { if (!value) return ""; const s = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); if (s < 60) return "now"; if (s < 3600) return `${Math.floor(s / 60)}m`; if (s < 86400) return `${Math.floor(s / 3600)}h`; return `${Math.floor(s / 86400)}d`; };
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";
const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const emitPost = (postId: string) => window.dispatchEvent(new CustomEvent("nerdding:open-profile-post", { detail: { postId } }));
const emitProject = (project: { id: string; slug: string }) => window.dispatchEvent(new CustomEvent("nerdding:open-project-panel", { detail: project }));

function Avatar({ user, size = 42 }: { user: User; size?: number }) {
  return <span className="home-avatar home-avatar-md profile-tab-avatar" style={{ width: size, height: size }}>{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials(user.name)}</span>;
}

function SkeletonList({ kind }: { kind: Tab }) {
  return <div className={`profile-tab-skeleton-list profile-skeleton-${kind}`} aria-busy="true">{Array.from({ length: 5 }, (_, i) => <div className="profile-tab-skeleton-row" key={i}><i /><span /><b /><em /></div>)}</div>;
}

function QuoteCard({ quote }: { quote: QuotePost }) {
  return <article className="nerdd-quote profile-quote-card" role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); emitPost(quote.id); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); emitPost(quote.id); } }}><div className="nerdd-quote-label">QUOTED POST</div><div className="nerdd-quote-head"><span className="nerdd-quote-avatar">{quote.author.avatarUrl ? <img src={quote.author.avatarUrl} alt="" /> : initials(quote.author.name)}</span><span><strong>{quote.author.name}</strong><small>@{quote.author.username} · {ago(quote.createdAt)}</small></span></div><div className="nerdd-quote-text">{quote.text}</div>{quote.media?.length ? <div className="nerdd-quote-media">{quote.media.slice(0, 4).map((m, i) => m.publicUrl ? (m.mimeType.startsWith("video/") ? <video key={i} src={m.publicUrl} controls onClick={(e) => e.stopPropagation()} /> : <img key={i} src={m.publicUrl} alt="" loading="lazy" />) : null)}</div> : null}</article>;
}

function BuildCard({ build, user }: { build: Build; user: User }) {
  const [likes, setLikes] = useState(build.likes); const [saves, setSaves] = useState(build.saves); const [reposts, setReposts] = useState(build.reposts); const [liked, setLiked] = useState(false); const [saved, setSaved] = useState(false); const [busy, setBusy] = useState<string | null>(null);
  const action = async (kind: "like" | "save" | "repost") => { if (busy) return; setBusy(kind); try { const response = await apiFetch<{ data: { active: boolean; count?: number } }>(`/posts/${encodeURIComponent(build.id)}/${kind}`, { method: "POST" }); const active = Boolean(response.data.active); if (kind === "like") { setLiked(active); setLikes((n) => Math.max(0, n + (active ? 1 : -1))); } else if (kind === "save") { setSaved(active); setSaves((n) => Math.max(0, n + (active ? 1 : -1))); } else { setReposts(typeof response.data.count === "number" ? response.data.count : reposts + 1); } } catch {} finally { setBusy(null); } };
  return <article className="home-post profile-post-row" data-post-id={build.id} onClick={(event) => { if ((event.target as HTMLElement).closest("button,a,.nerdd-quote,video")) return; emitPost(build.id); }}>
    <div className="home-post-head"><button className="home-author" onClick={(event) => { event.stopPropagation(); window.history.pushState({}, "", `/profile/${encodeURIComponent(user.username)}`); window.dispatchEvent(new PopStateEvent("popstate")); }}><Avatar user={user} /><span><strong>{user.name}</strong><small>@{user.username} · {ago(build.createdAt)}</small></span></button><button className="home-more" aria-label="Post options" onClick={(e) => e.stopPropagation()}><Ellipsis size={17} /></button></div>
    <div className="home-post-copy">{build.text}</div>
    {build.quotePost ? <QuoteCard quote={build.quotePost} /> : null}
    {build.media?.length ? <div className={`home-media home-media-${Math.min(build.media.length, 4)}`}>{build.media.slice(0, 4).map((m, i) => m.publicUrl ? (m.mimeType.startsWith("video/") ? <video key={i} src={m.publicUrl} controls onClick={(e) => e.stopPropagation()} /> : <img key={i} src={m.publicUrl} alt="" loading="lazy" onClick={(e) => e.stopPropagation()} />) : null)}</div> : null}
    {build.projectName ? <button className="home-project" onClick={(e) => { e.stopPropagation(); if (build.projectSlug && build.projectId) emitProject({ slug: build.projectSlug, id: build.projectId }); }}><span><strong>{build.projectName}</strong><small>Project</small></span><ArrowUpRight size={14} /></button> : null}
    {build.linkUrl ? <a className="home-link" href={build.linkUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{build.linkUrl.replace(/^https?:\/\//, "")}</a> : null}
    <div className="home-actions"><div className="home-actions-left"><button className={liked ? "active" : ""} onClick={(e) => { e.stopPropagation(); void action("like"); }} disabled={busy !== null}><Heart size={16} fill={liked ? "currentColor" : "none"} /><span>{likes}</span></button><button onClick={(e) => { e.stopPropagation(); emitPost(build.id); }}><MessageCircle size={16} /><span>{build.comments}</span></button><button data-action="amplify" className="" onClick={(e) => { e.stopPropagation(); void action("repost"); }} disabled={busy !== null}><Activity size={16} /><span>{reposts}</span></button></div><div className="home-actions-right"><span className="home-views"><Eye size={14} /> {build.views ?? 0} views</span><button className={saved ? "active" : ""} aria-label="Save post" onClick={(e) => { e.stopPropagation(); void action("save"); }} disabled={busy !== null}><Bookmark size={16} fill={saved ? "currentColor" : "none"} /><span>Save</span></button><button data-action="send" aria-label="Send post" onClick={(e) => e.stopPropagation()}><Send size={16} /><span>Send</span></button></div></div>
  </article>;
}

function ProjectCard({ project }: { project: Project }) {
  return <button className="profile-project-card-modern profile-project-live" onClick={() => emitProject({ id: project.id, slug: project.slug })}><div className="profile-project-card-top"><span>{project.stage}</span>{project.github_url ? <Github size={15} /> : null}</div><h3>{project.name}</h3><p>{project.description}</p><small>{date(project.created_at)}</small></button>;
}

function PersonRow({ person }: { person: Person }) {
  return <button className="profile-person-row" onClick={() => { window.history.pushState({}, "", `/profile/${encodeURIComponent(person.username)}`); window.dispatchEvent(new PopStateEvent("popstate")); }}><Avatar user={person} size={44} /><span><strong>{person.name}</strong><small>@{person.username}</small>{person.bio ? <em>{person.bio}</em> : null}</span><ArrowUpRight size={15} /></button>;
}

export default function ProfileSectionTabs({ username, profileUser, profileStats, profileAffiliations }: { username: string; profileUser?: User; profileStats?: ProfileSummary["stats"]; profileAffiliations?: ProfileSummary["affiliations"] }) {
  const initialSummary: ProfileSummary | null = profileUser ? { user: profileUser, stats: profileStats ?? { posts: 0, projects: 0, followers: 0, following: 0 }, affiliations: profileAffiliations ?? [] } : null;
  const [summary, setSummary] = useState<ProfileSummary | null>(initialSummary); const [tab, setTab] = useState<Tab>("posts"); const [query, setQuery] = useState(""); const [caches, setCaches] = useState<Record<Tab, Cache>>({ posts: emptyCache(), projects: emptyCache(), followers: emptyCache(), following: emptyCache() }); const [activePostId, setActivePostId] = useState<string | null>(null); const scrollRef = useRef<HTMLDivElement | null>(null);
  const user = profileUser ?? summary?.user; const current = caches[tab]; const own = Boolean(user?.username && getSavedUser()?.username?.toLowerCase() === user.username.toLowerCase());

  const loadSummary = async () => {
    if (profileUser) {
      setSummary({ user: profileUser, stats: profileStats ?? { posts: 0, projects: 0, followers: 0, following: 0 }, affiliations: profileAffiliations ?? [] });
      return;
    }
    try {
      const response = await apiFetch<{ data: Partial<ProfileSummary> | null }>(`/social/users/${encodeURIComponent(username)}/profile-summary`);
      if (response.data?.user) setSummary({ user: response.data.user, stats: response.data.stats ?? { posts: 0, projects: 0, followers: 0, following: 0 }, affiliations: Array.isArray(response.data.affiliations) ? response.data.affiliations : [] });
      else setSummary(null);
    } catch {
      try {
        const response = await apiFetch<{ data: any }>(`/social/users/${encodeURIComponent(username)}/profile-live`);
        if (response.data?.user) setSummary({ user: response.data.user, stats: response.data.stats ?? { posts: 0, projects: 0, followers: 0, following: 0 }, affiliations: Array.isArray(response.data.affiliations) ? response.data.affiliations : [] });
        else setSummary(null);
      } catch {
        setSummary(null);
      }
    }
  };

  useEffect(() => { void loadSummary(); setTab("posts"); setQuery(""); setActivePostId(null); setCaches({ posts: emptyCache(), projects: emptyCache(), followers: emptyCache(), following: emptyCache() }); }, [username, profileUser?.id]);
  useEffect(() => { const onOpen = (event: Event) => { const id = (event as CustomEvent<{ postId?: string }>).detail?.postId; if (id) setActivePostId(id); }; window.addEventListener("nerdding:open-profile-post", onOpen); return () => window.removeEventListener("nerdding:open-profile-post", onOpen); }, []);

  const loadPage = async (kind: Tab, reset: boolean) => {
    const cached = caches[kind]; if (cached.loading || (!reset && !cached.hasMore) || !user?.id) return;
    setCaches((state) => ({ ...state, [kind]: { ...state[kind], loading: true, error: "", items: reset ? [] : state[kind].items, cursor: reset ? null : state[kind].cursor, hasMore: reset ? true : state[kind].hasMore } }));
    try {
      const params = new URLSearchParams({ type: kind, limit: "15" }); if (query.trim()) params.set("q", query.trim()); if (!reset && cached.cursor) { params.set("cursorCreatedAt", cached.cursor.createdAt); params.set("cursorId", cached.cursor.id); }
      const response = await apiFetch<{ data?: { items?: any[]; hasMore?: boolean; nextCursor?: Cursor | null } | null }>(`/social/users/${encodeURIComponent(username)}/profile-items?${params}`);
      const payload = response.data;
      const rawItems = Array.isArray(payload?.items) ? payload.items : [];
      const items = rawItems.filter((item) => item && typeof item.id === "string").map((item) => {
        if (kind !== "posts") return item;
        const quote = item.quotePost && item.quotePost.author && item.quotePost.id ? item.quotePost : null;
        return { ...item, text: typeof item.text === "string" ? item.text : "", quotePost: quote };
      });
      setCaches((state) => ({ ...state, [kind]: { items: reset ? items : [...state[kind].items, ...items], cursor: payload?.nextCursor ?? null, hasMore: Boolean(payload?.hasMore), loading: false, error: "" } }));
    } catch (error) {
      setCaches((state) => ({ ...state, [kind]: { ...state[kind], loading: false, error: error instanceof Error ? error.message : "Unable to load this section" } }));
    }
  };
  useEffect(() => { if (user?.id) void loadPage(tab, true); }, [tab, query, username, user?.id]);
  useEffect(() => { const node = scrollRef.current; if (!node || !user?.id) return; const sentinel = node.querySelector<HTMLElement>("[data-profile-tab-sentinel]"); if (!sentinel) return; const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) void loadPage(tab, false); }, { root: node, rootMargin: "300px" }); observer.observe(sentinel); return () => observer.disconnect(); }, [tab, current.items.length, current.cursor, current.hasMore, user?.id]);

  useEffect(() => { const style = document.createElement("style"); style.dataset.profileTabs = "true"; style.textContent = `
    .profile-tabs-v3{font-family:'Space Grotesk',sans-serif}.profile-tabs-v3 .profile-section-tabs{display:flex;gap:22px;border-bottom:1px solid #e5ded6}.profile-tabs-v3 .profile-tab-btn{border:0;background:none;padding:11px 0 12px;color:#8c827a;font:600 12px 'Space Grotesk',sans-serif;cursor:pointer;position:relative}.profile-tabs-v3 .profile-tab-btn.active{color:#201c19}.profile-tabs-v3 .profile-tab-btn.active:after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:3px;background:#201c19;border-radius:8px}.profile-tabs-v3 .profile-tab-btn b{margin-left:5px;font-size:9px;color:#a0948b}.profile-tabs-v3 .profile-content-grid{display:grid!important;grid-template-columns:minmax(0,1fr) 360px!important;gap:24px!important;align-items:start!important;margin-top:18px!important}.profile-tabs-v3 .profile-section-content{min-width:0!important}.profile-tabs-v3 .profile-posts-scroll-v3{max-height:calc(100dvh - 280px);overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-gutter:stable;padding-right:5px}.profile-tabs-v3 .profile-tab-search{display:flex;align-items:center;gap:8px;border:1px solid #ddd6cc;border-radius:10px;background:#fffdf9;padding:9px 11px;margin-bottom:12px}.profile-tabs-v3 .profile-tab-search input{border:0;outline:0;background:transparent;flex:1;font:12px 'Space Grotesk',sans-serif;min-width:0}.profile-tabs-v3 .profile-tab-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.profile-tabs-v3 .profile-project-card-modern{display:block;width:100%;border:1px solid #ded7cf;border-radius:14px;background:#fffdf9;padding:14px;text-align:left;color:#201c19;cursor:pointer}.profile-tabs-v3 .profile-project-card-modern:hover{border-color:#c8bfb6;box-shadow:0 12px 25px rgba(31,27,24,.06);transform:translateY(-1px)}.profile-tabs-v3 .profile-project-card-top{display:flex;justify-content:space-between;color:#8e847a;font-size:9px}.profile-tabs-v3 .profile-project-card-modern h3{margin:10px 0 5px;font-size:14px}.profile-tabs-v3 .profile-project-card-modern p{margin:0;color:#80766e;font:10px/1.5 'DM Sans',sans-serif}.profile-tabs-v3 .profile-project-card-modern small{display:block;margin-top:10px;color:#a0968d;font-size:9px}.profile-tabs-v3 .profile-person-list{display:grid;gap:8px}.profile-tabs-v3 .profile-person-row{width:100%;display:flex;align-items:center;gap:11px;border:1px solid #e1dad2;border-radius:12px;background:#fffdf9;padding:10px;text-align:left;color:#201c19;cursor:pointer}.profile-tabs-v3 .profile-person-row span{display:flex;flex-direction:column;min-width:0;flex:1}.profile-tabs-v3 .profile-person-row strong{font-size:11px}.profile-tabs-v3 .profile-person-row small{font-size:9px;color:#938980;margin-top:2px}.profile-tabs-v3 .profile-person-row em{font-style:normal;font-size:9px;color:#a0968d;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.profile-tabs-v3 .profile-tab-skeleton-list{display:grid;gap:10px}.profile-tabs-v3 .profile-tab-skeleton-row{height:118px;border:1px solid #e7e0d6;border-radius:14px;background:linear-gradient(90deg,#fffdf9 25%,#f0ebe4 37%,#fffdf9 63%);background-size:400% 100%;animation:profileShimmer 1.2s ease-in-out infinite}.profile-tabs-v3 .profile-skeleton-projects .profile-tab-skeleton-row{height:145px}.profile-tabs-v3 .profile-skeleton-followers .profile-tab-skeleton-row,.profile-tabs-v3 .profile-skeleton-following .profile-tab-skeleton-row{height:72px}.profile-tabs-v3 .profile-empty-box{border:1px dashed #d9d2c9;border-radius:14px;background:#fffdf9;padding:42px 20px;text-align:center;color:#948a81}.profile-tabs-v3 .profile-empty-box strong{display:block;color:#332e29;margin-top:8px}.profile-tabs-v3 .profile-empty-box span{display:block;font-size:10px;margin-top:4px}.profile-tabs-v3 .profile-tab-sentinel{height:2px}@keyframes profileShimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}@media(max-width:920px){.profile-tabs-v3 .profile-content-grid{grid-template-columns:1fr!important}.profile-tabs-v3 .profile-posts-scroll-v3{max-height:none;overflow:visible}.profile-tabs-v3 .profile-tab-grid{grid-template-columns:1fr}}
  `; document.head.appendChild(style); return () => style.remove(); }, []);

  const counts = summary?.stats ?? { posts: 0, projects: 0, followers: 0, following: 0 };
  const affiliations = summary?.affiliations ?? [];
  const content = current.loading && current.items.length === 0 ? <SkeletonList kind={tab} /> : current.error && current.items.length === 0 ? <div className="profile-empty-box"><Activity size={22} /><strong>Could not load this section</strong><span>{current.error}</span><button className="profile-tab-action" onClick={() => void loadPage(tab, true)}>Try again</button></div> : !current.items.length ? <div className="profile-empty-box"><Users size={22} /><strong>{tab === "posts" ? "No build notes yet" : tab === "projects" ? "No projects yet" : tab === "followers" ? "No followers yet" : "Not following anyone yet"}</strong><span>New activity will appear here when it exists.</span></div> : tab === "posts" && user ? current.items.map((item: Build) => <BuildCard key={item.id} build={item} user={user} />) : tab === "projects" ? <div className="profile-tab-grid">{current.items.map((item: Project) => <ProjectCard key={item.id} project={item} />)}</div> : <div className="profile-person-list">{current.items.map((item: Person) => <PersonRow key={item.id} person={item} />)}</div>;

  return <section className="profile-section-tabs-wrap profile-tabs-v3"><nav className="profile-section-tabs" aria-label="Profile sections">{([["posts", "Build Notes"], ["projects", "Projects"], ["followers", "Followers"], ["following", "Following"]] as const).map(([id, label]) => <button key={id} className={`profile-tab-btn ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}><span>{label}</span><b>{Number(counts[id] ?? 0)}</b></button>)}</nav><div className="profile-content-grid"><div className="profile-section-content"><div className="profile-tab-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${tab === "posts" ? "build notes" : tab}`} /></div><div ref={scrollRef} className="profile-posts-scroll-v3">{content}<div data-profile-tab-sentinel="true" className="profile-tab-sentinel" /></div></div><div className="profile-right-rail"><div className="profile-post-detail-slot">{activePostId ? <PostDetailSurface postId={activePostId} onClose={() => setActivePostId(null)} isPanel /> : null}</div><aside className="profile-affiliations-rail"><div className="profile-affiliations-rail-head"><div><div className="eyebrow">TRUSTED IDENTITY</div><h3>Affiliations</h3></div></div>{affiliations.length ? affiliations.map((a) => <article className="profile-affiliation-modern" key={a.id}><div className="profile-affiliation-top"><div className="profile-affiliation-name"><span className="profile-affiliation-badge">{a.name.slice(0, 1)}</span><span><strong>{a.name}</strong><small>@{a.slug}</small></span></div>{a.verified ? <span className="profile-verified-pill"><Check size={12} /> Verified</span> : null}</div><p>{a.role} · {a.type}</p></article>) : <div className="profile-empty-box"><Users size={20} /><strong>No affiliations yet</strong><span>Verified affiliations will appear here.</span></div>}</aside></div></div></section>;
}
