"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ArrowUpRight, Bookmark, Check, Ellipsis, Eye, Github, Heart, MessageCircle, Plus, Search, Send, Users, X } from "lucide-react";
import { apiFetch, getSavedUser } from "@/lib/api";
import PostDetailSurface from "@/components/app/PostDetailSurface";
import "../profile/profile-polish.css";

type Tab = "posts" | "projects" | "followers" | "following";
type User = { id: string; name: string; username: string; avatarUrl?: string | null; bio?: string | null; accountType?: string };
type Affiliation = { id: string; name: string; slug: string; type: string; verified: boolean; role: string; status?: string };
type Summary = { user: User; stats: { posts: number; projects: number; followers: number; following: number }; affiliations: Affiliation[] };
type Media = { publicUrl: string | null; mimeType: string };
type QuotePost = { id: string; author: User; text: string; createdAt: string; linkUrl?: string | null; media?: Media[]; likes?: number; comments?: number; reposts?: number; saves?: number; views?: number };
type Build = { id: string; authorId: string; text: string; createdAt: string; projectId?: string | null; projectName?: string | null; projectSlug?: string | null; linkUrl?: string | null; quotePostId?: string | null; quotePost?: QuotePost | null; media?: Media[]; likes: number; comments: number; reposts: number; saves: number; views?: number };
type Project = { id: string; name: string; slug: string; description: string; stage: string; github_url?: string | null; created_at?: string | null };
type Person = User & { createdAt?: string };
type Cursor = { createdAt: string; id: string };
type Page<T> = { items: T[]; hasMore: boolean; nextCursor: Cursor | null };
type Cache = { items: unknown[]; cursor: Cursor | null; hasMore: boolean; loading: boolean; error: string; query: string };

const emptyCache = (): Cache => ({ items: [], cursor: null, hasMore: true, loading: false, error: "", query: "" });
const nav = (path: string) => { window.history.pushState({}, "", path); window.dispatchEvent(new PopStateEvent("popstate")); };
const openCreatePost = () => window.dispatchEvent(new CustomEvent("nerdding:open-create-post"));
const openProfilePost = (postId: string) => window.dispatchEvent(new CustomEvent("nerdding:open-profile-post", { detail: { postId } }));
const ago = (value?: string | null) => { if (!value) return ""; const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); if (seconds < 60) return "now"; if (seconds < 3600) return `${Math.floor(seconds / 60)}m`; if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`; return `${Math.floor(seconds / 86400)}d`; };
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";
const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

function Avatar({ user, size = 42 }: { user: User; size?: number }) {
  return <span className="home-avatar home-avatar-md profile-tab-avatar" style={{ width: size, height: size }}>{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials(user.name)}</span>;
}

function LoadingRows({ kind }: { kind: Tab }) {
  return <div className={`profile-tab-skeleton-list profile-skeleton-${kind}`}>{Array.from({ length: 3 }, (_, index) => <div className="profile-tab-skeleton-row" key={index}><i /><span /><b /><em /></div>)}</div>;
}

function QuoteCard({ quote }: { quote: QuotePost }) {
  const open = () => openProfilePost(quote.id);
  return <article className="nerdd-quote" role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); open(); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); open(); } }}>
    <div className="nerdd-quote-label">QUOTED POST</div>
    <div className="nerdd-quote-head"><span className="nerdd-quote-avatar">{quote.author.avatarUrl ? <img src={quote.author.avatarUrl} alt="" /> : initials(quote.author.name)}</span><span><strong>{quote.author.name}</strong><small>@{quote.author.username} · {ago(quote.createdAt)}</small></span></div>
    <div className="nerdd-quote-text">{quote.text}</div>
    {quote.media?.length ? <div className="nerdd-quote-media">{quote.media.slice(0, 4).map((media, index) => media.publicUrl ? (media.mimeType.startsWith("video/") ? <video key={index} src={media.publicUrl} controls onClick={(event) => event.stopPropagation()} /> : <img key={index} src={media.publicUrl} alt="" loading="lazy" />) : null)}</div> : null}
  </article>;
}

function BuildCard({ build, user }: { build: Build; user: User }) {
  return <article className="home-post" data-post-id={build.id} onClick={() => openProfilePost(build.id)}>
    <div className="home-post-head">
      <button className="home-author" onClick={(event) => { event.stopPropagation(); nav(`/profile/${encodeURIComponent(user.username)}`); }}>
        <Avatar user={user} />
        <span><strong>{user.name}</strong><small>@{user.username} · {ago(build.createdAt)}</small></span>
      </button>
      <button className="home-more" aria-label="Post options" onClick={(event) => event.stopPropagation()}><Ellipsis size={17} /></button>
    </div>
    <div className="home-post-copy">{build.text}</div>
    {build.quotePost ? <QuoteCard quote={build.quotePost} /> : null}
    {build.media?.length ? <div className={`home-media home-media-${Math.min(build.media.length, 4)}`}>{build.media.slice(0, 4).map((media, index) => media.publicUrl ? (media.mimeType.startsWith("video/") ? <video key={index} src={media.publicUrl} controls onClick={(event) => event.stopPropagation()} /> : <img key={index} src={media.publicUrl} alt="" loading="lazy" />) : null)}</div> : null}
    {build.projectName && <button className="home-project" onClick={(event) => { event.stopPropagation(); if (build.projectSlug) nav(`/project/${encodeURIComponent(build.projectSlug)}`); }}><span><strong>{build.projectName}</strong><small>Project</small></span></button>}
    {build.linkUrl && <a href={build.linkUrl} target="_blank" rel="noreferrer" className="home-link" onClick={(event) => event.stopPropagation()}>{build.linkUrl.replace(/^https?:\/\//, "")}</a>}
    <div className="home-actions">
      <div className="home-actions-left"><button onClick={(event) => event.stopPropagation()}><Heart size={16} /><span>{build.likes}</span></button><button onClick={(event) => { event.stopPropagation(); openProfilePost(build.id); }}><MessageCircle size={16} /><span>{build.comments}</span></button><button data-action="amplify" onClick={(event) => event.stopPropagation()}><Activity size={16} /><span>{build.reposts}</span></button></div>
      <div className="home-actions-right"><span className="home-views"><Eye size={14} /> {build.views ?? 0} views</span><button aria-label="Save post" onClick={(event) => event.stopPropagation()}><Bookmark size={16} /><span>Save</span></button><button data-action="send" aria-label="Send post" onClick={(event) => event.stopPropagation()}><Send size={16} /><span>Send</span></button></div>
    </div>
  </article>;
}

function ProjectCard({ project }: { project: Project }) { return <button className="profile-project-card-modern" onClick={() => nav(`/project/${encodeURIComponent(project.slug)}`)}><div className="profile-project-card-top"><span>{project.stage}</span>{project.github_url && <Github size={15} />}</div><h3>{project.name}</h3><p>{project.description}</p><small>{date(project.created_at)}</small></button>; }
function PersonRow({ person }: { person: Person }) { return <button className="profile-person-row" onClick={() => nav(`/profile/${encodeURIComponent(person.username)}`)}><Avatar user={person} /><span><strong>{person.name}</strong><small>@{person.username}</small>{person.bio && <em>{person.bio}</em>}</span><ArrowUpRight size={15} /></button>; }

function AddAgentModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [agents, setAgents] = useState<User[]>([]); const [query, setQuery] = useState(""); const [role, setRole] = useState(""); const [selected, setSelected] = useState<User | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { apiFetch<{ data: User[] }>("/social/affiliations/agents").then((response) => setAgents(response.data ?? [])).catch(() => setAgents([])); }, []);
  const filtered = agents.filter((agent) => `${agent.name} ${agent.username}`.toLowerCase().includes(query.toLowerCase()));
  const submit = async () => { if (!selected || !role.trim()) { setError("Select an agent and enter your qualification."); return; } setBusy(true); setError(""); try { await apiFetch("/social/affiliations/requests", { method: "POST", body: JSON.stringify({ agentId: selected.id, role: role.trim() }) }); onDone(); } catch (value) { setError(value instanceof Error ? value.message : "Request could not be sent."); } finally { setBusy(false); } };
  return <div className="profile-action-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="profile-action-modal"><header><div><div className="eyebrow">TRUSTED IDENTITY</div><h2>Add an agent</h2></div><button className="profile-action-modal-close" onClick={onClose} aria-label="Close"><X size={17} /></button></header>{selected ? <div className="profile-selected-agent"><Avatar user={selected} /><strong>{selected.name}</strong><small>@{selected.username}</small><button onClick={() => setSelected(null)}>Change</button></div> : <><label className="profile-action-field"><span>Search agents</span><div className="profile-action-input"><Search size={15} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search agent name or username" /></div></label><div className="profile-action-results">{filtered.map((agent) => <button className="profile-action-agent" key={agent.id} onClick={() => setSelected(agent)}><Avatar user={agent} /><span><strong>{agent.name}</strong><small>@{agent.username}</small></span></button>)}</div></>}{selected && <><label className="profile-action-field"><span>What do you do / qualification?</span><input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Founder, Developer, Contributor..." /></label><p className="profile-action-help">The agent must approve this affiliation before it becomes public.</p><button className="profile-tab-action" disabled={busy} onClick={() => void submit()}>{busy ? "Sending..." : "Send verification request"}</button></>}{error && <p className="profile-action-error">{error}</p>}</div></div>;
}

const profileCss = `
/* Profile is intentionally independent from the generic route-surface system. */
.nerdding-enhanced-route:has(.profile-section-tabs-wrap),
.nerdding-enhanced-route.full-width:has(.profile-section-tabs-wrap),
.nerdding-feed-column:has(.profile-section-tabs-wrap),
.nerdd-route-surface:has(.profile-section-tabs-wrap){
  position:static!important;inset:auto!important;z-index:auto!important;display:block!important;width:100%!important;max-width:none!important;min-width:0!important;min-height:0!important;height:auto!important;overflow:visible!important;padding:0!important;margin:0!important;background:transparent!important;
}
.profile-view:has(.profile-section-tabs-wrap){max-width:1320px!important;width:100%!important;margin:0 auto!important;}
.profile-cover.profile-content-shell{position:static!important;display:block!important;min-height:0!important;height:auto!important;overflow:visible!important;width:100%!important;max-width:1320px!important;margin:26px auto 0!important;padding:0!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;color:var(--ink)!important;}
.profile-cover.profile-content-shell .profile-section-tabs{width:100%!important;}
.profile-cover.profile-content-shell .profile-content-grid{width:100%!important;max-width:1320px!important;margin:18px auto 0!important;}
.profile-active-post{display:block!important;position:static!important;inset:auto!important;grid-column:auto!important;grid-row:auto!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;overflow:hidden!important;border:1px solid var(--line,#ddd6cc)!important;border-radius:12px!important;background:var(--card,#fff)!important;box-shadow:0 5px 18px rgba(31,27,24,.05)!important;animation:profile-panel-in .3s ease-out}
.profile-active-post .post-detail-panel{display:block!important;position:static!important;inset:auto!important;float:none!important;width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;max-height:none!important;box-sizing:border-box!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important}
.profile-active-post .post-detail-panel-header{height:60px!important;min-height:60px!important;box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:space-between!important;padding:0 15px!important;border-bottom:1px solid var(--line,#ddd6cc)!important;background:var(--card,#fff)!important;position:sticky!important;top:0!important;z-index:2!important}
.profile-active-post .post-detail-panel-header>div span,.profile-active-post .post-detail-panel-label{font-size:8px!important;letter-spacing:.14em!important;color:#978d84!important;font-weight:800!important}
.profile-active-post .post-detail-panel-header h2{font-size:17px!important;margin:3px 0 0!important;color:var(--ink,#201c19)!important}
.profile-active-post .post-detail-panel-close{width:32px!important;height:32px!important;border:1px solid var(--line,#ddd6cc)!important;background:none!important;color:#8e847a!important;border-radius:50%!important;display:grid!important;place-items:center!important;cursor:pointer!important}
.profile-active-post .post-detail-panel-inner{display:block!important;position:static!important;inset:auto!important;width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;max-height:calc(min(70vh,760px) - 60px)!important;box-sizing:border-box!important;overflow-y:auto!important;overscroll-behavior:contain!important;padding:14px!important;margin:0!important}
.profile-active-post .post-detail-card,.profile-active-post .post-detail-comments{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;margin-top:0!important}
.profile-active-post .post-detail-card{padding:12px!important;border:1px solid var(--line,#ddd6cc)!important;border-radius:10px!important;background:var(--card,#fff)!important;box-shadow:none!important}
.profile-active-post .post-detail-comments{margin-top:14px!important}
.profile-post-detail-slot{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;}
.profile-post-detail-slot:empty{display:none!important;}
.profile-right-rail{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:14px!important;align-self:start!important;width:100%!important;min-width:0!important;}
.profile-right-rail>.profile-affiliations-rail{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;}

.profile-section-content{min-width:0!important;width:100%!important}
@keyframes profile-panel-in{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
@media(max-width:920px){.profile-cover.profile-content-shell{max-width:100%!important;margin-top:18px!important}.profile-cover.profile-content-shell .profile-content-grid{grid-template-columns:minmax(0,1fr)!important;column-gap:0!important;gap:16px!important}.profile-active-post .post-detail-panel-inner{max-height:none!important}}
`;

export default function ProfileSectionTabs({ username }: { username: string }) {
  const [summary, setSummary] = useState<Summary | null>(null); const [tab, setTab] = useState<Tab>("posts"); const [query, setQuery] = useState(""); const [caches, setCaches] = useState<Record<Tab, Cache>>({ posts: emptyCache(), projects: emptyCache(), followers: emptyCache(), following: emptyCache() }); const [summaryLoading, setSummaryLoading] = useState(true); const [summaryError, setSummaryError] = useState(""); const [addAgentOpen, setAddAgentOpen] = useState(false); const [activePostId, setActivePostId] = useState<string | null>(null); const sentinel = useRef<HTMLDivElement | null>(null); const cache = caches[tab];
  const loadSummary = async () => { setSummaryLoading(true); try { const response = await apiFetch<{ data: Summary }>(`/social/users/${encodeURIComponent(username)}/profile-summary`); setSummary(response.data); setSummaryError(""); } catch (value) { setSummaryError(value instanceof Error ? value.message : "Profile could not be loaded."); } finally { setSummaryLoading(false); } };
  useEffect(() => { void loadSummary(); setTab("posts"); setQuery(""); setActivePostId(null); setCaches({ posts: emptyCache(), projects: emptyCache(), followers: emptyCache(), following: emptyCache() }); }, [username]);
  useEffect(() => { const onOpen = (event: Event) => { const id = (event as CustomEvent<{ postId?: string }>).detail?.postId; if (id && window.location.pathname.startsWith("/profile/")) setActivePostId(String(id)); }; window.addEventListener("nerdding:open-profile-post", onOpen as EventListener); return () => window.removeEventListener("nerdding:open-profile-post", onOpen as EventListener); }, []);
  const loadPage = async (kind: Tab, reset = false) => { const current = caches[kind]; if (current.loading || (!current.hasMore && !reset)) return; const nextQuery = reset ? query : current.query; setCaches((value) => ({ ...value, [kind]: { ...value[kind], loading: true, error: "", ...(reset ? { items: [], cursor: null, hasMore: true, query: nextQuery } : {}) } })); try { const params = new URLSearchParams({ type: kind, limit: "15" }); if (nextQuery.trim()) params.set("q", nextQuery.trim()); if (!reset && current.cursor) { params.set("cursorCreatedAt", current.cursor.createdAt); params.set("cursorId", current.cursor.id); } const response = await apiFetch<{ data: Page<Build | Project | Person> }>(`/social/users/${encodeURIComponent(username)}/profile-items?${params}`); setCaches((value) => { const previous = reset ? [] : value[kind].items; const merged = [...previous, ...response.data.items].filter((item, index, list) => list.findIndex((candidate) => (candidate as { id: string }).id === (item as { id: string }).id) === index); return { ...value, [kind]: { items: merged, cursor: response.data.nextCursor, hasMore: response.data.hasMore, loading: false, error: "", query: nextQuery } }; }); } catch (value) { setCaches((state) => ({ ...state, [kind]: { ...state[kind], loading: false, error: value instanceof Error ? value.message : "Could not load this section." } })); } };
  useEffect(() => { void loadPage(tab, true); }, [tab, query]);
  useEffect(() => { const node = sentinel.current; if (!node) return; const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) void loadPage(tab); }, { rootMargin: "360px" }); observer.observe(node); return () => observer.disconnect(); }, [tab, cache.cursor, cache.hasMore, cache.loading]);
  const count = (kind: Tab) => summaryLoading ? null : summary?.stats[kind] ?? 0; const own = getSavedUser()?.username?.toLowerCase() === username.toLowerCase();
  const renderContent = () => { if (cache.loading && cache.items.length === 0) return <LoadingRows kind={tab} />; if (cache.error && cache.items.length === 0) return <div className="profile-tab-empty profile-tabs-error"><Activity size={20} /><strong>Could not load this section</strong><span>{cache.error}</span><button className="profile-tab-action" onClick={() => void loadPage(tab, true)}>Try again</button></div>; if (!cache.items.length) return <div className="profile-tab-empty"><Users size={20} /><strong>{tab === "posts" ? "No build notes yet" : tab === "projects" ? "No projects yet" : tab === "followers" ? "No followers yet" : "Not following anyone yet"}</strong></div>; return <>{tab === "posts" ? (cache.items as Build[]).map((item) => <BuildCard key={item.id} build={item} user={summary!.user} />) : tab === "projects" ? (cache.items as Project[]).map((item) => <ProjectCard key={item.id} project={item} />) : (cache.items as Person[]).map((item) => <PersonRow key={item.id} person={item} />)}{cache.loading && <div className="profile-tab-loading-more"><i /> Loading more...</div>}<div ref={sentinel} className="profile-tab-sentinel" />{!cache.hasMore && <div className="profile-tab-end">You are all caught up.</div>}</>; };
  return <section className="profile-section-tabs-wrap"><style>{profileCss}</style>
    <div className="profile-cover profile-content-shell">
      <nav className="profile-section-tabs" aria-label="Profile sections">{([["posts", "Build Notes"], ["projects", "Projects"], ["followers", "Followers"], ["following", "Following"]] as const).map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><span>{label}</span>{count(id) === null ? <i className="profile-count-loader" aria-label="Loading count" /> : <b>{count(id)}</b>}</button>)}</nav>
      <div className="profile-content-grid">
        <div className="profile-section-content"><div className="profile-tab-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${tab === "posts" ? "build notes" : tab}`} /></div>{tab === "posts" && own && <ActionBar onClick={openCreatePost} />}{summaryError && !summary && <div className="profile-tab-empty profile-tabs-error"><strong>{summaryError}</strong></div>}{summary && renderContent()}</div>
        <div className="profile-right-rail">
          <div className="profile-post-detail-slot" aria-live="polite">{activePostId ? <section className="profile-active-post" role="dialog" aria-label="Active post"><PostDetailSurface postId={activePostId} onClose={() => setActivePostId(null)} isPanel={true} /></section> : null}</div>
          <aside className="profile-affiliations-rail"><div className="profile-affiliations-rail-head"><div><div className="eyebrow">TRUSTED IDENTITY</div><h3>Affiliations</h3></div>{own && <button className="profile-tab-action" onClick={() => setAddAgentOpen(true)}><Plus size={14} /> Add Agent</button>}</div>{summary?.affiliations.length ? summary.affiliations.map((aff) => <article className="profile-affiliation-modern" key={aff.id}><div className="profile-affiliation-top"><div className="profile-affiliation-name"><span className="profile-affiliation-badge">{aff.name.slice(0, 1)}</span><span><strong>{aff.name}</strong><small>@{aff.slug}</small></span></div>{aff.verified && <span className="profile-verified-pill"><Check size={12} /> Verified</span>}</div><p>{aff.role} · {aff.type}</p></article>) : <div className="profile-tab-empty"><Users size={20} /><strong>No affiliations yet</strong><span>Verified affiliations will appear here.</span></div>}</aside>
        </div>
      </div>
    </div>
    {addAgentOpen && <AddAgentModal onClose={() => setAddAgentOpen(false)} onDone={() => { setAddAgentOpen(false); void loadSummary(); }} />}
  </section>;
}

function ActionBar({ onClick }: { onClick: () => void }) { return <div className="profile-tab-actionbar"><div className="profile-tab-action-copy"><span className="profile-tab-action-eyebrow">BUILD IN PUBLIC</span><strong>Keep your build log moving.</strong><small>Share progress, experiments and shipped work as posts.</small></div><button className="profile-tab-action" onClick={onClick}><Plus size={15} /> Post a Build</button></div>; }
