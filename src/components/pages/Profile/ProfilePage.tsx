"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Bookmark, Check, Ellipsis, Eye, Github, Heart, MessageCircle, Plus, Search, Send, Settings as SettingsIcon, Users, X } from "lucide-react";
import { Avatar, VerifiedMark } from "@/components/ui/Avatar";
import { getSavedUser, uploadMedia } from "@/services/api";
import {
  amplifyProfilePost,
  getProfileAgents,
  getProfileFollowing,
  getProfilePost,
  getProfileSnapshot,
  requestProfileAffiliation,
  toggleProfileFollowing,
  toggleProfileLike,
  toggleProfileSave,
  updateProfileSettings,
  type ProfilePost,
  type ProfileProject,
  type ProfileSnapshot,
  type ProfileUser,
} from "@/services/profile";

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
  return <span className="home-avatar home-avatar-md" style={{ width: size, height: size }}>
    {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials(user.name)}
  </span>;
}

function Skeleton() {
  return <div className="profile-page profile-loading">
    <div className="skeleton-block skeleton-cover" />
    <div className="skeleton-profile-head"><div className="skeleton-circle" /><div className="skeleton-lines"><i /><i /><i /></div></div>
    <div className="skeleton-stats"><i /><i /><i /><i /></div>
    <div className="skeleton-profile-grid"><div className="skeleton-block large" /><div className="skeleton-block" /></div>
  </div>;
}

/**
 * Profile Build Notes use the same visual structure and interaction model as
 * the main home feed, while retaining the profile-specific API mutations.
 */
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
    } finally {
      setBusy(false);
    }
  };

  return <article
    className="home-post"
    data-post-id={post.id}
    onClick={(event) => {
      if ((event.target as HTMLElement).closest("button,a,input,.nerdd-quote,video")) return;
      onOpen(post.id);
    }}
  >
    <div className="home-post-head">
      <button className="home-author" onClick={(event) => { event.stopPropagation(); navigate(`/profile/${encodeURIComponent(user.username)}`); }}>
        <UserAvatar user={user} />
        <span><strong>{user.name}</strong><small>@{user.username} · {ago(post.createdAt)}</small></span>
      </button>
      <button className="home-more" aria-label="Post options" onClick={(event) => event.stopPropagation()}><Ellipsis size={17} /></button>
    </div>
    <div className="home-post-copy">{post.text}</div>
    {post.quotePost?.author ? <article
      className="nerdd-quote"
      data-quote-post-id={post.quotePost.id}
      role="button"
      tabIndex={0}
      onClick={(event) => { event.stopPropagation(); onOpen(post.quotePost!.id); }}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onOpen(post.quotePost!.id); } }}
    >
      <div className="nerdd-quote-label">QUOTED POST</div>
      <div className="nerdd-quote-head"><span className="nerdd-quote-avatar">{post.quotePost.author.avatarUrl ? <img src={post.quotePost.author.avatarUrl} alt="" /> : initials(post.quotePost.author.name)}</span><span><strong>{post.quotePost.author.name}</strong><small>@{post.quotePost.author.username} · {ago(post.quotePost.createdAt)}</small></span></div>
      <div className="nerdd-quote-text">{post.quotePost.text}</div>
    </article> : null}
    {post.media?.length ? <div className={`home-media home-media-${Math.min(post.media.length, 4)}`}>{post.media.slice(0, 4).map((media, index) => media.publicUrl ? (media.mimeType?.startsWith("video/") ? <video key={index} src={media.publicUrl} controls onClick={(event) => event.stopPropagation()} /> : <img key={index} src={media.publicUrl} alt="" loading="lazy" onClick={(event) => event.stopPropagation()} />) : null)}</div> : null}
    {post.projectName ? <button className="home-project" onClick={(event) => { event.stopPropagation(); window.dispatchEvent(new CustomEvent("nerdding:open-project-panel", { detail: { id: post.projectId, slug: post.projectSlug } })); }}><span><strong>{post.projectName}</strong><small>Project</small></span><ArrowRight size={14} /></button> : null}
    {post.linkUrl ? <a className="home-link" href={post.linkUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>{post.linkUrl.replace(/^https?:\/\//, "")}</a> : null}
    <div className="home-actions">
      <div className="home-actions-left">
        <button disabled={busy} onClick={(event) => { event.stopPropagation(); void action("like"); }}><Heart size={16} /><span>{likes}</span></button>
        <button onClick={(event) => { event.stopPropagation(); onOpen(post.id); }}><MessageCircle size={16} /><span>{post.comments}</span></button>
        <button data-action="amplify" disabled={busy} onClick={(event) => { event.stopPropagation(); void action("amplify"); }}><Activity size={16} /><span>{reposts}</span></button>
      </div>
      <div className="home-actions-right">
        <span className="home-views"><Eye size={14} /> {post.views ?? 0} views</span>
        <button disabled={busy} onClick={(event) => { event.stopPropagation(); void action("save"); }}><Bookmark size={16} /><span>Save</span></button>
        <button data-action="send" onClick={(event) => { event.stopPropagation(); void navigator.clipboard?.writeText(`${window.location.origin}/post/${post.id}`); }}><Send size={16} /><span>Send</span></button>
      </div>
    </div>
  </article>;
}

function ProjectCard({ project, onOpen }: { project: ProfileProject; onOpen: (project: ProfileProject) => void }) {
  return <button className="profile-project-card-modern profile-project-live" onClick={() => onOpen(project)}>
    <div className="profile-project-card-top"><span>{project.stage}</span>{project.github_url ? <Github size={15} /> : null}</div>
    <h3>{project.name}</h3><p>{project.description}</p><small>{project.created_at ? new Date(project.created_at).toLocaleDateString() : ""}</small>
  </button>;
}

function PeopleList({ people }: { people: ProfileSnapshot["followers"] }) {
  return <div className="profile-person-list">{people.map((person) => <button className="profile-person-row" key={person.id} onClick={() => navigate(`/profile/${encodeURIComponent(person.username)}`)}>
    <UserAvatar user={person} size={44} /><span><strong>{person.name}</strong><small>@{person.username}</small>{person.bio ? <em>{person.bio}</em> : null}</span><ArrowRight size={15} />
  </button>)}</div>;
}

function ActivePost({ postId, onClose, onBack, onOpenQuote }: { postId: string; onClose: () => void; onBack?: () => void; onOpenQuote: (id: string) => void }) {
  const [post, setPost] = useState<any>(null);
  const [busy, setBusy] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setBusy(true); setPost(null);
    void getProfilePost(postId).then((value) => { if (alive) setPost(value); }).finally(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [postId]);

  const action = async (kind: "like" | "save" | "amplify") => {
    if (!post || actionBusy) return;
    setActionBusy(true);
    try {
      if (kind === "like") { const result = await toggleProfileLike(post.id); setPost((value: any) => ({ ...value, likes: result.count })); }
      if (kind === "save") { const result = await toggleProfileSave(post.id); setPost((value: any) => ({ ...value, saves: result.count })); }
      if (kind === "amplify") { const result = await amplifyProfilePost(post.id); setPost((value: any) => ({ ...value, reposts: result.count })); }
    } finally { setActionBusy(false); }
  };

  if (busy && !post) return <section className="profile-active-post"><div className="home-active-post"><div className="home-modal"><header className="home-modal-head"><div><small>POST DETAIL</small><h2>Active post</h2></div><button aria-label="Close" onClick={onClose}><X size={17} /></button></header><div className="home-modal-scroll"><Skeleton /></div></div></div></section>;
  if (!post) return null;

  return <section className="profile-active-post"><div className="home-active-post"><div className="home-modal">
    <header className="home-modal-head"><div><small>POST DETAIL</small><h2>Active post</h2></div><div className="home-active-post-head-actions">{onBack ? <button aria-label="Back" onClick={onBack}>←</button> : null}<button aria-label="Close" onClick={onClose}><X size={17} /></button></div></header>
    <div className="home-modal-scroll"><article className="home-modal-content">
      <div className="home-post-head"><button className="home-author" onClick={() => navigate(`/profile/${encodeURIComponent(post.author?.username ?? "")}`)}><span className="home-avatar home-avatar-md">{post.author?.avatarUrl ? <img src={post.author.avatarUrl} alt="" /> : initials(post.author?.name)}</span><span><strong>{post.author?.name}</strong><small>@{post.author?.username} · {post.createdAt ? ago(post.createdAt) : ""}</small></span></button></div>
      <div className="home-modal-text">{post.text}</div>
      {post.quotePost?.author ? <article className="nerdd-quote" data-quote-post-id={post.quotePost.id} role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); onOpenQuote(post.quotePost.id); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpenQuote(post.quotePost.id); } }}><div className="nerdd-quote-label">QUOTED POST</div><div className="nerdd-quote-head"><span className="nerdd-quote-avatar">{post.quotePost.author.avatarUrl ? <img src={post.quotePost.author.avatarUrl} alt="" /> : initials(post.quotePost.author.name)}</span><span><strong>{post.quotePost.author.name}</strong><small>@{post.quotePost.author.username} · {ago(post.quotePost.createdAt)}</small></span></div><div className="nerdd-quote-text">{post.quotePost.text}</div></article> : null}
      {post.media?.length ? <div className={`home-media home-media-${Math.min(post.media.length, 4)}`}>{post.media.slice(0, 4).map((media: any, index: number) => media.publicUrl ? (media.mimeType?.startsWith("video/") ? <video key={index} src={media.publicUrl} controls /> : <img key={index} src={media.publicUrl} alt="" />) : null)}</div> : null}
      {post.project ? <div className="home-project"><span><strong>{post.project.name}</strong><small>{post.project.stage ?? "Project"} · {post.project.description ?? ""}</small></span></div> : null}
      <div className="home-actions"><div className="home-actions-left"><button disabled={actionBusy} onClick={() => void action("like")}><Heart size={15} /><span>{post.likes ?? 0}</span></button><button onClick={() => onOpenQuote(post.id)}><MessageCircle size={15} /><span>{post.comments ?? 0}</span></button><button data-action="amplify" disabled={actionBusy} onClick={() => void action("amplify")}><Activity size={15} /><span>{post.reposts ?? 0}</span></button></div><div className="home-actions-right"><span className="home-views"><Eye size={14} /> {post.views ?? 0} views</span><button disabled={actionBusy} onClick={() => void action("save")}><Bookmark size={15} /><span>Save</span></button><button data-action="send" onClick={() => void navigator.clipboard?.writeText(`${window.location.origin}/post/${post.id}`)}><Send size={15} /><span>Send</span></button></div></div>
    </article></div></div></div></section>;
}

export default function ProfilePage({ username }: { username: string }) {
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [following, setFollowing] = useState(false);
  const [cover, setCover] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [crop, setCrop] = useState(false);
  const [picker, setPicker] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [agentQuery, setAgentQuery] = useState("");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"posts" | "projects" | "followers" | "following">("posts");
  const [query, setQuery] = useState("");
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [project, setProject] = useState<ProfileProject | null>(null);
  const saved = getSavedUser();
  const own = saved?.username?.toLowerCase() === username.toLowerCase();

  const load = async () => {
    setLoading(true); setError("");
    try {
      const data = await getProfileSnapshot(username);
      setSnapshot(data);
      setCover(data.user.coverUrl ?? null); setLogo(data.user.profileLogoUrl ?? null); setX(data.user.coverPositionX ?? 50); setY(data.user.coverPositionY ?? 50);
      if (!own) setFollowing(await getProfileFollowing(data.user.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Profile could not be loaded");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [username]);
  useEffect(() => { if (!picker) return; void getProfileAgents().then(setAgents).catch(() => setAgents([])); }, [picker]);

  const visible = useMemo(() => {
    if (!snapshot) return [] as any[];
    const q = query.trim().toLowerCase();
    if (tab === "posts") return q ? snapshot.posts.filter((post) => post.text.toLowerCase().includes(q)) : snapshot.posts;
    if (tab === "projects") return q ? snapshot.projects.filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(q)) : snapshot.projects;
    const people = tab === "followers" ? snapshot.followers : snapshot.following;
    return q ? people.filter((person) => `${person.name} ${person.username} ${person.bio ?? ""}`.toLowerCase().includes(q)) : people;
  }, [snapshot, tab, query]);

  const saveProfile = async (patch: Record<string, unknown>) => {
    setBusy(true);
    try { await updateProfileSettings(patch); await load(); setCrop(false); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Profile could not be updated"); }
    finally { setBusy(false); }
  };

  const upload = (field: "coverUrl" | "profileLogoUrl", file?: File) => {
    if (!file) return;
    void (async () => {
      setBusy(true);
      try { const result = await uploadMedia(file); if (field === "coverUrl") { setCover(result.publicUrl); setCrop(true); } else { setLogo(result.publicUrl); await updateProfileSettings({ profileLogoUrl: result.publicUrl }); await load(); } }
      catch (reason) { setError(reason instanceof Error ? reason.message : "Upload failed"); }
      finally { setBusy(false); }
    })();
  };

  const openPost = (id: string) => { setHistory((current) => activePostId ? [...current, activePostId] : current); setActivePostId(id); };
  const backPost = () => setHistory((current) => { if (!current.length) return current; const next = [...current]; setActivePostId(next.pop()!); return next; });
  const closePost = () => { setActivePostId(null); setHistory([]); };
  const follow = async () => { if (!snapshot) return; try { setFollowing(await toggleProfileFollowing(snapshot.user.id)); } catch (reason) { setError(reason instanceof Error ? reason.message : "Follow failed"); } };
  const requestAffiliation = async (agentId: string) => { if (!role.trim()) return; try { await requestProfileAffiliation(agentId, role.trim()); setPicker(false); setRole(""); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Affiliation request failed"); } };

  if (loading) return <Skeleton />;
  if (!snapshot) return <div className="profile-page"><div className="empty-state"><strong>Profile could not be loaded.</strong><span>{error}</span><button className="outline-button" onClick={() => void load()}>Try again</button></div></div>;

  const user = snapshot.user;
  const filteredAgents = agents.filter((agent) => `${agent.name} ${agent.slug}`.toLowerCase().includes(agentQuery.toLowerCase()));

  return <div className="profile-page">
    <div className="profile-cover">
      {cover ? <img className="profile-cover-image" src={cover} alt="Profile banner" style={{ objectPosition: `${x}% ${y}%` }} /> : <div className="cover-grid" />}
      <div className="cover-overlay" />
      {logo ? <img className="cover-profile-logo" src={logo} alt="Profile logo" /> : <div className="cover-symbol" aria-hidden="true" />}
      {own ? <div className="profile-cover-actions"><label className="cover-action"><input type="file" accept="image/*" onChange={(event) => upload("coverUrl", event.target.files?.[0])} />Change banner</label><label className="cover-action"><input type="file" accept="image/*" onChange={(event) => upload("profileLogoUrl", event.target.files?.[0])} />Add logo</label></div> : null}
    </div>

    <div className="profile-header">
      <Avatar user={{ ...user, initials: initials(user.name) } as any} size="xl" />
      <div className="profile-head-copy">
        <div className="profile-title-row"><div><h1>{user.name}{user.checkmarkType || user.accountType === "agent" ? <VerifiedMark /> : null}</h1><p>@{user.username}{user.location ? ` · ${user.location}` : ""}</p></div>
          <div className="profile-actions">{own ? <button className="outline-button" onClick={() => setCrop(true)}><SettingsIcon size={14} /> Edit banner</button> : <button className={following ? "outline-button" : "primary-button"} onClick={() => void follow()}>{following ? <Check size={14} /> : <Plus size={14} />} {following ? "Following" : "Follow"}</button>}<button className="outline-button"><Ellipsis size={16} /></button></div>
        </div>
        <p className="profile-bio">{user.bio || "Building in public on Nerdding."}</p>
        <div className="role-pills"><span>{user.accountType === "agent" ? "Agent" : "Builder"}</span>{snapshot.affiliations.map((item) => <span key={item.id}>{item.name} · {item.role}</span>)}</div>
      </div>
    </div>

    <div className="profile-section-tabs" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <button className={tab === "posts" ? "active" : ""} onClick={() => setTab("posts")}>Build Notes <b>{snapshot.stats.posts}</b></button>
      <button className={tab === "projects" ? "active" : ""} onClick={() => setTab("projects")}>Projects <b>{snapshot.stats.projects}</b></button>
      <button className={tab === "followers" ? "active" : ""} onClick={() => setTab("followers")}>Followers <b>{snapshot.stats.followers}</b></button>
      <button className={tab === "following" ? "active" : ""} onClick={() => setTab("following")}>Following <b>{snapshot.stats.following}</b></button>
    </div>

    <div className="profile-content-grid">
      <div className="profile-section-content">
        <div className="profile-tab-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tab === "posts" ? "Search build notes" : `Search ${tab}`} /></div>
        <div className="profile-posts-scroll">
          {tab === "posts" ? visible.map((post) => <PostCard key={post.id} post={post as ProfilePost} user={user} onOpen={openPost} />) : null}
          {tab === "projects" ? <div className="profile-tab-grid">{visible.map((item) => <ProjectCard key={item.id} project={item as ProfileProject} onOpen={setProject} />)}</div> : null}
          {tab === "followers" || tab === "following" ? <PeopleList people={visible as ProfileSnapshot["followers"]} /> : null}
          {visible.length === 0 ? <div className="profile-tab-empty"><Users size={20} /><strong>Nothing here yet</strong><span>New activity will appear in this section.</span></div> : null}
        </div>
      </div>

      <aside className="profile-right-rail">
        {activePostId ? <ActivePost postId={activePostId} onClose={closePost} onBack={history.length ? backPost : undefined} onOpenQuote={openPost} /> : null}
        <aside className="profile-affiliations-rail"><div className="profile-affiliations-rail-head"><div><div className="eyebrow">TRUSTED IDENTITY</div><h3>Affiliations</h3></div>{own ? <button className="profile-tab-action" onClick={() => setPicker(true)}><Plus size={14} /> Add Agent</button> : null}</div>
          {snapshot.affiliations.length ? snapshot.affiliations.map((item) => <div className="profile-affiliation-row" key={item.id}><span className="profile-affiliation-dot"><Check size={11} /></span><span><strong>{item.name}</strong><small>{item.role} · {item.verified ? "Verified" : "Pending"}</small></span></div>) : <div className="profile-tab-empty"><Users size={20} /><strong>No affiliations yet</strong><span>Verified affiliations will appear here.</span></div>}
        </aside>
      </aside>
    </div>

    {error ? <div className="profile-inline-error">{error}</div> : null}

    {project ? <div className="page-content-project-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setProject(null); }}><div className="page-content-project-panel"><button className="page-content-project-close" aria-label="Close project" onClick={() => setProject(null)}><X size={17} /></button><div className="nerdd-proj-page"><div className="nerdd-proj-hero"><small>{project.stage}</small><h1>{project.name}</h1><p>{project.description}</p>{project.github_url ? <a href={project.github_url} target="_blank" rel="noreferrer">View on GitHub ↗</a> : null}</div></div></div></div> : null}

    {crop ? <div className="modal-backdrop"><div className="cover-editor-modal"><div className="modal-head"><div><div className="eyebrow">PROFILE BANNER</div><h2>Crop your banner to fit</h2></div><button className="icon-btn" onClick={() => setCrop(false)}><X size={18} /></button></div><p className="cover-editor-help">Adjust the position so the important part of your uploaded banner stays visible.</p><div className="cover-editor-preview">{cover ? <img src={cover} alt="Crop preview" style={{ objectPosition: `${x}% ${y}%` }} /> : <div className="cover-grid" />}</div><label>Horizontal position<input type="range" min="0" max="100" value={x} onChange={(event) => setX(Number(event.target.value))} /></label><label>Vertical position<input type="range" min="0" max="100" value={y} onChange={(event) => setY(Number(event.target.value))} /></label><div className="modal-foot"><span>{busy ? "Saving…" : "Preview"}</span><button className="primary-button" disabled={busy || !cover} onClick={() => void saveProfile({ coverUrl: cover, coverPositionX: x, coverPositionY: y })}>Save banner <Check size={14} /></button></div></div></div> : null}

    {picker ? <div className="modal-backdrop"><div className="affiliation-modal"><div className="modal-head"><div><div className="eyebrow">TRUSTED IDENTITY</div><h2>Request an Agent affiliation</h2></div><button className="icon-btn" onClick={() => setPicker(false)}><X size={18} /></button></div><input value={agentQuery} onChange={(event) => setAgentQuery(event.target.value)} placeholder="Search verified Agents" /><input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Your role" />{filteredAgents.map((agent) => <button className="affiliation-picker-row" key={agent.id} onClick={() => void requestAffiliation(agent.id)}><span className="org-badge">{agent.name?.slice(0, 1) ?? "A"}</span><span><strong>{agent.name}</strong><small>{agent.type} · Verified Agent</small></span><ArrowRight size={14} /></button>)}</div></div> : null}
  </div>;
}
