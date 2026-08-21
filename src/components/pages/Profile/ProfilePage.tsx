"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Bookmark, Check, Ellipsis, Eye, Heart, MessageCircle, Plus, Search, Send, Settings as SettingsIcon, X } from "lucide-react";
import { Avatar, VerifiedMark, ProjectMark } from "@/components/ui/Avatar";
import { getSavedUser } from "@/services/api";
import { amplifyProfilePost, getProfilePost, getProfileSnapshot, getProfileFollowing, toggleProfileFollowing, toggleProfileLike, toggleProfileSave, getProfileAgents, requestProfileAffiliation, type ProfilePost, type ProfileProject, type ProfileSnapshot, type ProfileUser } from "@/services/profile";
import ActivePost from "@/components/post/ActivePost";
import ProjectPreviewInline from "@/components/projects/ProjectPreviewInline";
import "@/components/profile/profile-polish.css";


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
  const avatarSize = size > 60 ? "xl" : size > 40 ? "md" : "sm";
  return <Avatar user={{ name: user.name, avatarUrl: user.avatarUrl }} size={avatarSize} />;
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
      <button className="home-author" onClick={(event) => { event.stopPropagation(); navigate(`/profile/${encodeURIComponent(user.username)}`); }}><UserAvatar user={user} /><span><strong>{user.name} {user.accountType === "agent" && <VerifiedMark />}</strong><small>@{user.username} · {ago(post.createdAt)}</small></span></button>
      <button className="home-more" aria-label="Post options" onClick={(event) => event.stopPropagation()}><Ellipsis size={17} /></button>
    </div>
    <div className="home-post-copy">{post.text}</div>
    {post.quotePost?.author ? <article className="nerdd-quote profile-quote-card" role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); onOpen(post.quotePost!.id); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onOpen(post.quotePost!.id); } }}><div className="nerdd-quote-label">QUOTED POST</div><div className="nerdd-quote-head"><span className="nerdd-quote-avatar">{post.quotePost.author.avatarUrl ? <img src={post.quotePost.author.avatarUrl} alt="" /> : initials(post.quotePost.author.name)}</span><span><strong>{post.quotePost.author.name} {post.quotePost.author.accountType === "agent" && <VerifiedMark />}</strong><small>@{post.quotePost.author.username} · {ago(post.quotePost.createdAt)}</small></span></div><div className="nerdd-quote-text">{post.quotePost.text}</div></article> : null}
    {post.projectName ? <button className="home-project" onClick={(event) => { event.stopPropagation(); window.dispatchEvent(new CustomEvent("nerdding:open-project-inline", { detail: { id: post.projectId, slug: post.projectSlug } })); }}><span><strong>{post.projectName}</strong><small>Project</small></span><ArrowRight size={14} /></button> : null}
    {post.linkUrl ? <a className="home-link" href={post.linkUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>{post.linkUrl.replace(/^https?:\/\//, "")}</a> : null}
    <div className="home-actions"><div className="home-actions-left"><button disabled={busy} onClick={(event) => { event.stopPropagation(); void action("like"); }}><Heart size={16} /><span>{likes}</span></button><button onClick={(event) => { event.stopPropagation(); onOpen(post.id); }}><MessageCircle size={16} /><span>{post.comments}</span></button><button data-action="amplify" disabled={busy} onClick={(event) => { event.stopPropagation(); void action("amplify"); }}><Activity size={16} /><span>{reposts}</span></button></div><div className="home-actions-right"><span className="home-views"><Eye size={14} /> {post.views ?? 0} views</span><button disabled={busy} onClick={(event) => { event.stopPropagation(); void action("save"); }}><Bookmark size={16} /><span>Save {saves}</span></button><button data-action="send" onClick={(event) => event.stopPropagation()}><Send size={16} /><span>Send</span></button></div></div>
  </article>;
}

function ProjectCard({ project }: { project: ProfileProject }) {
  const openProject = () => window.dispatchEvent(new CustomEvent("nerdding:open-project-inline", { detail: { slug: project.slug, id: project.id } }));
  return (
    <button className="profile-project-route" onClick={openProject}>
      <div className="profile-project-art">
        <ProjectMark project={{ name: project.name, icon: "🚀", accent: "#e4572e" }} size="sm" />
        <span className="stage-pill">{project.stage}</span>
      </div>
      <div className="profile-project-copy">
        <h3>{project.name}</h3>
        <p>{project.description || "No description provided."}</p>
        <div>
          <span>Created {project.created_at ? new Date(project.created_at).toLocaleDateString() : "—"}</span>
        </div>
      </div>
    </button>
  );
}

function PeopleList({ people }: { people: ProfileSnapshot["followers"] }) {
  return <div className="profile-person-list">{people.map((person) => <button className="profile-person-row" key={person.id} onClick={() => navigate(`/profile/${encodeURIComponent(person.username)}`)}><UserAvatar user={person} size={44} /><span><strong>{person.name} {person.accountType === "agent" && <VerifiedMark />}</strong><small>@{person.username}</small>{person.bio ? <em>{person.bio}</em> : null}</span><ArrowRight size={15} /></button>)}</div>;
}



export default function ProfileStandaloneView({ username }: { username: string }) {
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"posts" | "projects" | "followers" | "following">("posts");
  const [query, setQuery] = useState("");
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [activeProjectSlug, setActiveProjectSlug] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const saved = getSavedUser();
  const own = saved?.username?.toLowerCase() === username.toLowerCase();

  const [showAddAgent, setShowAddAgent] = useState(false);
  const [agentsList, setAgentsList] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [submittingAgent, setSubmittingAgent] = useState(false);
  const [agentError, setAgentError] = useState("");

  const openAddAgent = async () => {
    setShowAddAgent(true);
    setAgentError("");
    try {
      const list = await getProfileAgents();
      setAgentsList(list);
      setSelectedAgentId("");
    } catch (e) {
      setAgentError("Could not load agents list.");
    }
  };

  const submitAffiliation = async () => {
    if (!selectedAgentId || !userRole.trim() || submittingAgent) return;
    setSubmittingAgent(true);
    setAgentError("");
    try {
      await requestProfileAffiliation(selectedAgentId, userRole.trim());
      setShowAddAgent(false);
      setUserRole("");
      const fresh = await getProfileSnapshot(username);
      setSnapshot(fresh);
    } catch (e) {
      setAgentError(e instanceof Error ? e.message : "Failed to submit request.");
    } finally {
      setSubmittingAgent(false);
    }
  };

  useEffect(() => { let alive = true; setLoading(true); setError(""); void getProfileSnapshot(username).then((value) => { if (alive) { setSnapshot(value); if (!own) void getProfileFollowing(value.user.id).then(setFollowing).catch(() => undefined); } }).catch((reason) => { if (alive) setError(reason instanceof Error ? reason.message : "Profile could not be loaded"); }).finally(() => { if (alive) setLoading(false); }); return () => { alive = false; }; }, [username]);
  
  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ postId?: string }>).detail;
      if (detail?.postId) { setActivePostId(detail.postId); setActiveProjectSlug(null); }
    };
    const onProj = (event: Event) => {
      const slug = (event as CustomEvent<{ slug?: string }>).detail?.slug;
      if (slug) { setActiveProjectSlug(slug); }
    };
    window.addEventListener("nerdding:open-profile-post", onOpen);
    window.addEventListener("nerdding:open-project-inline", onProj);
    return () => { window.removeEventListener("nerdding:open-profile-post", onOpen); window.removeEventListener("nerdding:open-project-inline", onProj); };
  }, []);
  const visible = useMemo(() => {
    if (!snapshot) return [] as any[];
    const q = query.trim().toLowerCase();
    if (tab === "posts") return q ? snapshot.posts.filter((post) => post.text.toLowerCase().includes(q)) : snapshot.posts;
    if (tab === "projects") return q ? snapshot.projects.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q)) : snapshot.projects;
    const people = tab === "followers" ? snapshot.followers : snapshot.following;
    return q ? people.filter((p) => `${p.name} ${p.username} ${p.bio ?? ""}`.toLowerCase().includes(q)) : people;
  }, [snapshot, tab, query]);

  if (loading) return <div className="profile-loading"><div className="skeleton-block skeleton-cover" /><div className="skeleton-profile-head"><div className="skeleton-circle" /><div className="skeleton-lines"><i /><i /><i /></div></div><div className="skeleton-stats"><i /><i /><i /><i /></div><div className="skeleton-profile-grid"><div className="skeleton-block large" /><div className="skeleton-block" /></div></div>;
  if (!snapshot) return <div className="empty-state"><strong>Profile could not be loaded.</strong><span>{error}</span></div>;


  const openPost = (id: string) => setActivePostId(id);

  return <div className="profile-page">
    <div className="profile-cover"><div className="cover-grid" />{snapshot.user.avatarUrl ? <img className="cover-profile-logo" src={snapshot.user.avatarUrl} alt="Profile logo" /> : null}</div>
    <div className="profile-header"><UserAvatar user={snapshot.user} size={88} /><div className="profile-head-copy"><div className="profile-title-row"><div><h1>{snapshot.user.name} {snapshot.user.accountType === "agent" ? <VerifiedMark /> : null}</h1><p>@{snapshot.user.username}{snapshot.user.location ? ` · ${snapshot.user.location}` : ""}</p></div><div className="profile-actions">{!own ? <button className={following ? "outline-button" : "primary-button"} onClick={() => void toggleProfileFollowing(snapshot.user.id).then(setFollowing)}>{following ? <Check size={14}/> : <Plus size={14}/>} {following ? "Following" : "Follow"}</button> : <button className="outline-button"><SettingsIcon size={14}/> Edit profile</button>}</div></div><p className="profile-bio">{snapshot.user.bio || "Building in public on Nerdding."}</p></div></div>
    <div className="profile-section-tabs"><button className={tab === "posts" ? "active" : ""} onClick={() => setTab("posts")}>Build Notes <b>{snapshot.stats.posts}</b></button><button className={tab === "projects" ? "active" : ""} onClick={() => setTab("projects")}>Projects <b>{snapshot.stats.projects}</b></button><button className={tab === "followers" ? "active" : ""} onClick={() => setTab("followers")}>Followers <b>{snapshot.stats.followers}</b></button><button className={tab === "following" ? "active" : ""} onClick={() => setTab("following")}>Following <b>{snapshot.stats.following}</b></button></div>
    <div className="profile-content-grid"><div className="profile-section-content"><div className="profile-tab-search"><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tab === "posts" ? "Search build notes" : `Search ${tab}`} /></div>{tab === "posts" ? <div className="profile-posts-scroll">{(visible as ProfilePost[]).map((post) => <PostCard key={post.id} post={post} user={snapshot.user} onOpen={openPost}/>)}{visible.length === 0 ? <div className="profile-tab-empty"><strong>No posts found</strong></div> : null}</div> : tab === "projects" ? <div className="profile-tab-grid">{(visible as ProfileProject[]).map((item) => <ProjectCard key={item.id} project={item}/>)}{visible.length === 0 ? <div className="profile-tab-empty"><strong>No projects found</strong></div> : null}</div> : <PeopleList people={visible as ProfileSnapshot["followers"]}/>}</div><aside className="profile-right-rail">{activeProjectSlug ? <ProjectPreviewInline slug={activeProjectSlug} onClose={() => setActiveProjectSlug(null)} onOpenFull={() => { setActiveProjectSlug(null); navigate(`/project/${encodeURIComponent(activeProjectSlug)}`); }} /> : activePostId ? <ActivePost key={activePostId} postId={activePostId} onClose={() => setActivePostId(null)} isPanel /> : <aside className="profile-affiliations-rail"><div className="profile-affiliations-rail-head"><div><div className="eyebrow">TRUSTED IDENTITY</div><h3>Affiliations</h3></div>{own && <button className="profile-tab-action" onClick={openAddAgent}><Plus size={14}/> Add Agent</button>}</div>{snapshot.affiliations.length ? (
            <div className="profile-affiliation-list">
              {snapshot.affiliations.map((a) => (
                <div className="profile-affiliation-modern" key={a.id}>
                  <strong style={{ display: "block", fontSize: "12px" }}>{a.name} {a.accountType === "agent" && <VerifiedMark />}</strong>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "10px", lineHeight: 1.4 }}>
                    {a.role} · <span style={{ fontWeight: 600, color: a.verified ? "var(--green)" : "var(--accent)" }}>{a.verified ? "Verified" : "Pending"}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="profile-tab-empty">
              <strong>No affiliations yet</strong>
              <span>Verified affiliations will appear here.</span>
            </div>
          )}</aside>}</aside></div>
    {showAddAgent && (
      <div className="profile-action-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowAddAgent(false); }}>
        <div className="profile-action-modal" style={{ width: "min(460px, 95vw)", height: "auto", maxHeight: "min(500px, 90vh)" }}>
          <header>
            <div>
              <small>TRUSTED IDENTITY</small>
              <h2>Add Affiliation</h2>
            </div>
            <button className="profile-action-modal-close" onClick={() => setShowAddAgent(false)} aria-label="Close modal"><X size={16} /></button>
          </header>
          <p className="cover-editor-help" style={{ margin: "0 0 16px" }}>
            Request an affiliation with a verified Agent. When approved, it will be listed publicly on your profile.
          </p>

          <div className="profile-action-field">
            <span>Select Agent</span>
            {agentsList.length === 0 ? (
              <div style={{ fontSize: "12px", color: "var(--muted)", padding: "10px", border: "1px dashed var(--line)", borderRadius: "8px", textAlign: "center" }}>
                No verified agents found on the network.
              </div>
            ) : (
              <select
                value={selectedAgentId}
                onChange={e => setSelectedAgentId(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 11px", border: "1px solid var(--line)", borderRadius: "9px", background: "var(--paper)", color: "var(--ink)", outline: "none" }}
              >
                <option value="">-- Choose verified agent --</option>
                {agentsList.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                ))}
              </select>
            )}
          </div>

          <div className="profile-action-field" style={{ marginTop: "14px" }}>
            <span>Your Role</span>
            <input
              value={userRole}
              onChange={e => setUserRole(e.target.value)}
              placeholder="e.g. Lead Core Developer, Advisor, Auditor"
            />
          </div>

          {agentError && (
            <div className="profile-inline-error">
              {agentError}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "16px", marginTop: "20px" }}>
            <button className="outline-button" onClick={() => setShowAddAgent(false)}>Cancel</button>
            <button
              className="primary-button"
              disabled={!selectedAgentId || !userRole.trim() || submittingAgent}
              onClick={() => void submitAffiliation()}
            >
              {submittingAgent ? "Submitting..." : "Send Request"}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>;
}
