"use client";
import MessagesPanel from "@/components/messages/MessagesPanel";
import PublicAboutSection from "@/components/public/PublicAboutSection";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Compass,
  ExternalLink,
  Filter,
  Flame,
  Github,
  Heart,
  Home,
  Layers3,
  Link2,
  ListFilter,
  LockKeyhole,
  Menu,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Plus,
  Rocket,
  Search,
  Send,
  Settings,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
  UserRound,
  Users,
  X,
  Zap,
  Sun,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BrandMark, Wordmark } from "@/components/brand/BrandMark";
import { Avatar, ProjectMark, VerifiedMark } from "@/components/ui/Avatar";
import { Toast } from "@/components/ui/Toast";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { apiFetch, clearAuthSession, getAuthToken, getSavedUser, saveAuthSession, startOAuth, uploadMedia, type ApiFundraising, type ApiUser } from "@/lib/api";
import {
  charts,
  conversations,
  currentUser as seededCurrentUser,
  events,
  notifications,
  projects,
  searchResults,
  trendingPosts,
  users,
  type Post,
  type Project,
  type User,
} from "@/lib/mock-data";

function viewerUser(): User {
  const saved = getSavedUser();
  if (saved) return { ...seededCurrentUser, id: saved.id, name: saved.name, username: saved.username, avatarUrl: saved.avatarUrl, role: saved.accountType === "agent" ? "Agent" : "Builder", roles: [saved.accountType === "agent" ? "Agent" : "Builder"], initials: saved.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(), verified: saved.accountType === "agent" };
  return { id: "public", name: "Nerdding visitor", username: "visitor", role: "Visitor", roles: ["Visitor"], bio: "", initials: "N", color: "#736d65", location: "", followers: "0" };
}

const currentUser = viewerUser();

type IconType = typeof Home;

const navItems: { label: string; href: string; icon: IconType; badge?: string }[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Top charts", href: "/charts", icon: TrendingUp },
  { label: "Fundraising", href: "/fundraising", icon: Rocket },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Your Nerddings", href: "/nerddings", icon: Layers3 },
  { label: "Messages", href: "/messages", icon: MessageCircle, badge: "2" },
  { label: "Notifications", href: "/notifications", icon: Bell, badge: "4" },
];

function navigate(href: string) {
  window.history.pushState({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function requireSession(onToast: (message: string) => void) {
  if (getAuthToken()) return true;
  onToast("Sign in to continue");
  window.dispatchEvent(new CustomEvent("nerdding:auth-required"));
  return false;
}

function LogoLink() {
  return <button className="logo-link" onClick={() => navigate("/home")}><Wordmark /></button>;
}

function Sidebar({ active, onCreate }: { active: string; onCreate: () => void }) {
  const signedIn = Boolean(getAuthToken());
  return (
    <aside className="sidebar">
      <LogoLink />
      <div className="sidebar-label">Workspace</div>
      <nav className="main-nav" aria-label="Primary navigation">
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const selected = active === href;
          return <button key={label} className={`nav-item ${selected ? "nav-item-active" : ""}`} onClick={() => navigate(href)}><Icon size={18} strokeWidth={selected ? 2.5 : 1.8} /><span>{label}</span>{badge && <b>{badge}</b>}</button>;
        })}
      </nav>
      <div className="sidebar-divider" />
      <div className="sidebar-label">Personal</div>
      <nav className="main-nav">
        <button className={`nav-item ${active === "/profile/ashrith.builds" ? "nav-item-active" : ""}`} onClick={() => navigate("/profile/ashrith.builds")}><UserRound size={18} /><span>Profile</span></button>
        <button className="nav-item" onClick={() => navigate("/settings")}><Settings size={18} /><span>Settings</span></button>
      </nav>
      <button className="create-button" onClick={onCreate}><span className="create-plus"><Plus size={18} /></span><span>Create</span><kbd>C</kbd></button>
      <div className="sidebar-bottom">
       <div className="status-chip"><span className="pulse-dot" />{signedIn ? "Live account" : "Public view"}</div>
         <button className="user-mini" onClick={() => navigate(signedIn ? `/profile/${currentUser.username}` : "/login")}><Avatar user={currentUser} size="sm" online={signedIn} /><span><strong>{signedIn ? currentUser.name : "Join Nerdding"}</strong><small>{signedIn ? `@${currentUser.username}` : "Sign in to interact"}</small></span><MoreHorizontal size={16} /></button>
      </div>
    </aside>
  );
}

function MobileNav({ active, onCreate }: { active: string; onCreate: () => void }) {
  const items = navItems.slice(0, 4);
  return <nav className="mobile-nav" aria-label="Mobile navigation">{items.map(({ label, href, icon: Icon }) => <button key={href} onClick={() => navigate(href)} className={active === href ? "mobile-active" : ""}><Icon size={19} /><span>{label === "Top charts" ? "Charts" : label}</span></button>)}<button className="mobile-create" onClick={onCreate}><Plus size={19} /></button><button onClick={() => navigate(getAuthToken() ? `/profile/${currentUser.username}` : "/login")} className={active.includes("profile") ? "mobile-active" : ""}><UserRound size={19} /><span>{getAuthToken() ? "You" : "Sign in"}</span></button></nav>;
}

function Header({ title, onCreate, onMenu, onSearch, theme, onToggleTheme }: { title: string; onCreate: () => void; onMenu: () => void; onSearch: (value: string) => void; theme: "light" | "dark"; onToggleTheme: () => void }) {
  return <header className="topbar"><button className="mobile-menu" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button><div className="page-title">{title}</div><div className="header-search"><Search size={17} /><input onChange={(e) => onSearch(e.target.value)} placeholder="Search people, projects, ideas" aria-label="Search" /><span className="search-shortcut">⌘ K</span></div><div className="topbar-actions"><button className="icon-btn header-icon" onClick={onToggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</button><button className="icon-btn header-icon" onClick={() => navigate("/notifications")} aria-label="Notifications"><Bell size={19} /><i /></button><button className="header-create" onClick={onCreate}><Plus size={16} /> Create</button><Avatar user={currentUser} size="sm" /></div></header>;
}

function RightRail() {
  return <aside className="right-rail"><div className="rail-card signal-card"><div className="signal-orb"><Sparkles size={17} /></div><div><strong>Build signal</strong><p>Meaningful work from the live Nerdding feed will appear here.</p></div></div><div className="rail-card"><div className="rail-heading"><span>Discover</span><button className="text-button" onClick={() => navigate("/explore")}>Explore <ArrowUpRight size={13} /></button></div><p className="empty-rail-copy">Once builders publish, ranked people and projects will appear here based on real activity.</p></div><div className="rail-card quick-links"><div className="rail-heading"><span>Quick links</span></div><button onClick={() => navigate("/fundraising")}><BriefcaseBusiness size={15} /> Fundraising directory <ArrowUpRight size={13} /></button><button onClick={() => navigate("/events")}><CalendarDays size={15} /> Events this week <ArrowUpRight size={13} /></button><button onClick={() => navigate("/nerddings")}><Bookmark size={15} /> Saved for later <ArrowUpRight size={13} /></button></div><div className="rail-footer">© 2026 Nerdding <LegalLinks /></div></aside>;
}

function UserIdentity({ user, compact = false }: { user: User; compact?: boolean }) {
  return <div className={`user-identity ${compact ? "identity-compact" : ""}`}><Avatar user={user} size={compact ? "sm" : "md"} /><span><strong>{user.name} {user.verified && <VerifiedMark />}</strong><small>@{user.username} · {user.role}</small>{user.affiliation && !compact && <em><span className="mini-org-mark" />{user.affiliation}</em>}</span></div>;
}

function PostCard({ post, onToast }: { post: Post; onToast: (message: string) => void }) {
  const [liked, setLiked] = useState(post.liked ?? false);
  const [saved, setSaved] = useState(post.saved ?? false);
  const [reposted, setReposted] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [comment, setComment] = useState("");
  const [commentOpen, setCommentOpen] = useState(false);
  return <article className="post-card">
    <div className="post-header"><UserIdentity user={post.author} /><div className="post-header-right"><span className="post-time">{post.time}</span><button className="icon-btn icon-btn-quiet" onClick={() => setShowMore(!showMore)} aria-label="More options"><MoreHorizontal size={18} /></button>{showMore && <div className="more-menu"><button onClick={() => onToast("Post link copied")}>Copy link</button><button onClick={() => onToast("Thanks — we’ll review this report")}>Report post</button></div>}</div></div>
    <div className="post-type"><span className={`type-dot type-${post.type.toLowerCase().replace(" ", "-")}`} />{post.type}<span className="type-divider">·</span><span className="post-public"><Users size={12} /> Everyone</span></div>
    <p className="post-copy">{post.text}</p>
    {post.project && <button className="post-project" onClick={() => navigate(`/project/${post.project?.slug}`)}><ProjectMark project={post.project} /><span className="project-copy"><strong>{post.project.name}</strong><small>{post.project.stage} · {post.project.category}</small><em>{post.project.description}</em></span><ArrowUpRight size={17} /></button>}
    {post.proof && <div className="proof-strip"><span className="proof-icon"><Check size={13} /></span><span><small>Proof of work</small><strong>{post.proof}</strong></span><ExternalLink size={14} /></div>}
    <div className="post-stats"><span>{liked ? post.likes + 1 : post.likes} likes</span><span>{post.comments} comments</span><span>{post.reposts + (reposted ? 1 : 0)} nerddings</span></div>
    <div className="post-actions"><button className={liked ? "action-liked" : ""} onClick={() => setLiked(!liked)}><Heart size={17} fill={liked ? "currentColor" : "none"} /> Like</button><button className={commentOpen ? "action-active" : ""} onClick={() => setCommentOpen(!commentOpen)}><MessageCircle size={17} /> Comment</button><button className={reposted ? "action-active" : ""} onClick={() => { setReposted(!reposted); onToast(reposted ? "Nerdd removed" : "Nerdded to your network"); }}><Activity size={17} /> Nerdd</button><button className={saved ? "action-active" : ""} onClick={() => { setSaved(!saved); onToast(saved ? "Removed from saved" : "Saved for later"); }}><Bookmark size={17} fill={saved ? "currentColor" : "none"} /> Save</button><button onClick={() => onToast("Share options opened")}><Share2 size={17} /></button></div>
    {commentOpen && <div className="comment-box"><Avatar user={currentUser} size="xs" /><input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a thoughtful comment…" onKeyDown={(e) => { if (e.key === "Enter" && comment.trim()) { onToast("Comment posted"); setComment(""); } }} /><button disabled={!comment.trim()} onClick={() => { onToast("Comment posted"); setComment(""); }}><Send size={15} /></button></div>}
  </article>;
}

function SocialPostCard({ post, onToast }: { post: Post; onToast: (message: string) => void }) {
  const [liked, setLiked] = useState(post.liked ?? false);
  const [saved, setSaved] = useState(post.saved ?? false);
  const [reposted, setReposted] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [comment, setComment] = useState("");
  const [commentOpen, setCommentOpen] = useState(false);
  const runAction = async (action: "like" | "save" | "repost") => {
    if (!requireSession(onToast)) return;
    if (action === "like") setLiked((value) => !value);
    if (action === "save") setSaved((value) => !value);
    if (action === "repost") setReposted((value) => !value);
    try {
      const response = await apiFetch<{ data: { active: boolean } }>(`/posts/${post.id}/${action}`, { method: "POST" });
      if (action === "like") setLiked(response.data.active);
      if (action === "save") setSaved(response.data.active);
      if (action === "repost") setReposted(response.data.active);
    } catch (error) { onToast(error instanceof Error ? error.message : "That action could not be saved"); }
  };
  const submitComment = async () => {
    if (!comment.trim() || !requireSession(onToast)) return;
    try {
      await apiFetch(`/posts/${post.id}/comments`, { method: "POST", body: JSON.stringify({ body: comment.trim() }) });
      onToast("Comment posted"); setComment("");
    } catch (error) { onToast(error instanceof Error ? error.message : "Comment could not be posted"); }
  };
  return <article className="post-card social-post-card">
    <div className="social-post-header"><UserIdentity user={post.author} /><div className="post-header-right"><span className="post-time">{post.time}</span><button className="icon-btn icon-btn-quiet" onClick={() => setShowMore(!showMore)} aria-label="More options"><MoreHorizontal size={18} /></button>{showMore && <div className="more-menu"><button onClick={() => onToast("Post link copied")}>Copy link</button><button onClick={() => onToast("Thanks — we’ll review this report")}>Report post</button></div>}</div></div>
    <div className="social-post-kind"><span className={`type-dot type-${post.type.toLowerCase().replace(" ", "-")}`} />{post.type}<span>·</span><span>Following</span></div>
    <p className="social-post-copy">{post.text}</p>
    {post.media?.filter((media) => media.publicUrl).length ? <div className={`social-post-media media-count-${Math.min(post.media.filter((media) => media.publicUrl).length, 4)}`}>{post.media.filter((media) => media.publicUrl).map((media, index) => media.mimeType.startsWith("video/") ? <video key={`${media.publicUrl}-${index}`} src={media.publicUrl ?? undefined} controls preload="metadata" /> : <img key={`${media.publicUrl}-${index}`} src={media.publicUrl ?? undefined} alt="Post attachment" loading="lazy" />)}</div> : null}
    {post.project && <button className="social-project" onClick={() => navigate(`/project/${post.project?.slug}`)}><ProjectMark project={post.project} size="sm" /><span><strong>{post.project.name}</strong><small>{post.project.stage} · {post.project.category}</small></span><ArrowUpRight size={15} /></button>}
    {post.proof && <button className="social-proof" onClick={() => onToast("Proof link copied")}><span className="proof-icon"><Check size={12} /></span><span><small>Proof of work</small><strong>{post.proof}</strong></span><ExternalLink size={13} /></button>}
    <div className="social-actions"><button className={liked ? "action-liked" : ""} onClick={() => void runAction("like")}><Heart size={17} fill={liked ? "currentColor" : "none"} /><span>{liked ? post.likes + 1 : post.likes}</span></button><button className={commentOpen ? "action-active" : ""} onClick={() => setCommentOpen(!commentOpen)}><MessageCircle size={17} /><span>{post.comments}</span></button><button className={reposted ? "action-active" : ""} onClick={() => void runAction("repost")}><Activity size={17} /><span>{post.reposts + (reposted ? 1 : 0)}</span></button><button className={saved ? "action-active" : ""} onClick={() => void runAction("save")} aria-label="Save post"><Bookmark size={17} fill={saved ? "currentColor" : "none"} /></button><button onClick={async () => { if (navigator.share) await navigator.share({ title: "Nerdding post", text: post.text, url: window.location.href }); else { await navigator.clipboard?.writeText(window.location.href); onToast("Post link copied"); } }} aria-label="Share post"><Share2 size={17} /></button></div>
    {commentOpen && <div className="comment-box"><Avatar user={currentUser} size="xs" /><input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a thoughtful comment…" onKeyDown={(e) => { if (e.key === "Enter") void submitComment(); }} /><button disabled={!comment.trim()} onClick={() => void submitComment()}><Send size={15} /></button></div>}
  </article>;
}

function Composer({ onClose, onPost, onToast }: { onClose: () => void; onPost: (text: string, media: { path: string; publicUrl: string; mimeType: string }[]) => Promise<void>; onToast: (message: string) => void }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);
  const publish = async () => {
    if (!requireSession(onToast) || !text.trim()) return;
    try { setPublishing(true); const media = []; for (const file of files) media.push(await uploadMedia(file)); await onPost(text.trim(), media); onClose(); }
    catch (error) { onToast(error instanceof Error ? error.message : "Unable to publish update"); }
    finally { setPublishing(false); }
  };
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="composer-modal"><div className="modal-head"><div><div className="eyebrow">Share your progress</div><h2>Create a post</h2></div><button className="icon-btn" onClick={onClose}><X size={18} /></button></div><div className="composer-author"><Avatar user={currentUser} size="sm" /><div><strong>{currentUser.name}</strong><span>Posting to your network <ChevronDown size={13} /></span></div></div><textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="What are you building, learning, or shipping?" maxLength={5000} /><div className="composer-tools"><label className="composer-upload"><input type="file" accept="image/*,video/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 10))} /><Link2 size={17} /> Add photos or video {files.length > 0 && <small>{files.length} attached</small>}</label><button type="button" onClick={() => onToast("Choose a project from your profile after publishing") }><Rocket size={17} /> Attach project</button><button type="button" onClick={() => onToast("Add a milestone from your project build log") }><Sparkles size={17} /> Add milestone</button></div><div className="modal-foot"><span>{text.length}/5000</span><button className="primary-button" disabled={!text.trim() || publishing} onClick={() => void publish()}>{publishing ? "Uploading…" : "Publish update"} <ArrowUpRight size={15} /></button></div></div></div>;
}

function HomeView({ onCreate, onToast, posts, onPost }: { onCreate: () => void; onToast: (message: string) => void; posts: Post[]; onPost: (text: string, media: { path: string; publicUrl: string; mimeType: string }[]) => Promise<void> }) {
  const [tab, setTab] = useState("All updates");
  const visible = tab === "Proof of work" ? posts.filter((post) => post.proof) : posts;
  const isGuest = currentUser.id === "public";
  return <div className="view home-view"><div className="feed-column">{isGuest ? (
    <div className="welcome-card guest-welcome-card" style={{ background: "linear-gradient(135deg, var(--ink) 0%, #2b231d 100%)", minHeight: "320px", display: "flex", flexDirection: "column", padding: "32px", borderRadius: "14px", color: "var(--cream)", marginBottom: "27px", border: "1px solid var(--line)" }}><div style={{ maxWidth: "680px" }}><span className="eyebrow" style={{ color: "var(--accent)", fontWeight: 600 }}>WELCOME TO NERDDING</span><h1 style={{ fontFamily: "Space Grotesk", fontSize: "32px", fontWeight: 700, margin: "12px 0", lineHeight: 1.1 }}>The social media platform for people <i>building the future</i>.</h1><p style={{ color: "#d5cdc4", fontSize: "14px", lineHeight: 1.6, margin: "0 0 20px" }}>Nerdding brings together founders, builders, researchers, and startups in a trusted ecosystem. Discover people for what they build and accomplish, document your projects, and verify affiliations with official agents (startups, companies, VCs, and universities).</p><div style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}><h3 style={{ fontSize: "12px", fontFamily: "Space Grotesk", textTransform: "uppercase", letterSpacing: "0.05em", color: "white", margin: "0 0 6px", display: "flex", alignItems: "center", gap: "6px" }}><LockKeyhole size={14} style={{ color: "var(--accent)" }} /> Secure OAuth Onboarding</h3><p style={{ color: "#bdaea0", fontSize: "11px", lineHeight: 1.5, margin: 0 }}>We utilize Google and GitHub OAuth to establish verified profiles and ensure network trust. By signing in, we retrieve your verified email address and public profile details (name and avatar) to initialize your account. No passwords are created or stored.</p></div><div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}><button className="primary-button" style={{ background: "var(--accent)", color: "white", padding: "11px 18px" }} onClick={() => navigate("/login")}>Get started / Sign in <ArrowRight size={15} /></button><button className="outline-button" style={{ color: "var(--cream)", borderColor: "rgba(255, 255, 255, 0.2)", background: "transparent" }} onClick={() => { setTab("All updates"); onToast("Browsing feed as visitor"); }}>Browse public feed</button><div style={{ marginLeft: "auto", display: "flex", gap: "8px", fontSize: "11px", color: "#a0958a" }} className="guest-links"><button onClick={() => navigate("/privacy")} style={{ color: "inherit", background: "none", border: 0, textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</button><span>·</span><button onClick={() => navigate("/terms")} style={{ color: "inherit", background: "none", border: 0, textDecoration: "underline", cursor: "pointer" }}>Terms of Service</button></div></div></div></div>
  ) : (
    <div className="welcome-card"><div className="welcome-copy"><span className="eyebrow">LIVE NERDDING FEED</span><h1>Make something<br /><i>worth finding.</i></h1><p>A focused feed for the people building the future — one thoughtful update at a time.</p><button className="welcome-cta" onClick={onCreate}>Share what you’re building <ArrowUpRight size={15} /></button></div><div className="welcome-art"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-mark"><BrandMark size={106} inverted /></div><span className="art-label art-label-top">build · prove</span><span className="art-label art-label-bottom">connect · grow</span></div></div>
  )}<div className="feed-toolbar"><div className="feed-tabs"><button className={tab === "All updates" ? "tab-active" : ""} onClick={() => setTab("All updates")}>All updates</button><button className={tab === "Proof of work" ? "tab-active" : ""} onClick={() => setTab("Proof of work")}>Proof of work <span>✦</span></button></div><button className="filter-button"><ListFilter size={15} /> Curated <ChevronDown size={14} /></button></div><div className="composer-inline"><Avatar user={currentUser} size="sm" /><button onClick={onCreate}>Share a build update…</button><button className="composer-add" onClick={onCreate}><Plus size={18} /></button></div>{visible.length ? visible.map((post) => <SocialPostCard post={post} key={post.id} onToast={onToast} />) : <div className="empty-state"><Sparkles size={20} /><strong>No updates yet.</strong><span>When builders publish from the live backend, their work will appear here.</span></div>}</div><RightRail /></div>;
}

function ExploreView() {
  return <div className="view"><div className="view-intro"><div><div className="eyebrow">DISCOVER THE WORK</div><h1>Find what’s <i>next.</i></h1><p>People, projects, organizations and ideas with momentum.</p></div><button className="outline-button"><Filter size={15} /> Filters</button></div><div className="explore-grid"><div className="feature-project"><div className="feature-project-head"><span className="feature-kicker">PROJECT OF THE WEEK</span><span className="feature-arrow"><ArrowUpRight size={18} /></span></div><div className="feature-visual"><div className="feature-shape shape-a" /><div className="feature-shape shape-b" /><div className="feature-visual-copy"><span>FIELDNOTE</span><strong>Small farms.<br />Better signals.</strong></div></div><div className="feature-project-body"><div><h3>Fieldnote</h3><p>Climate intelligence that gives every small farm a clearer next move.</p></div><button className="primary-button" onClick={() => navigate("/project/fieldnote")}>View project <ArrowUpRight size={14} /></button></div></div><div className="explore-side"><div className="mini-section"><SectionHeading eyebrow="MEET THE BUILDERS" title="Rising this week" action="All builders" />{users.slice(1, 4).map((user, i) => <button className="builder-row" key={user.id} onClick={() => navigate(`/profile/${user.username}`)}><span className="rank">0{i + 1}</span><Avatar user={user} size="md" /><span><strong>{user.name} {user.verified && <VerifiedMark />}</strong><small>{user.role}</small></span><span className="row-arrow">↗</span></button>)}</div><div className="mini-section tech-section"><SectionHeading eyebrow="FOLLOW YOUR CURIOSITY" title="Explore by signal" /><div className="topic-grid">{["Artificial intelligence", "Climate", "Open source", "Fintech", "Developer tools", "Future of work"].map((topic) => <button key={topic} onClick={() => navigate("/search")}>{topic}<ArrowUpRight size={13} /></button>)}</div></div></div></div><SectionHeading eyebrow="PROJECTS WITH MOMENTUM" title="Worth a closer look" action="View all" /><div className="project-grid">{projects.map((project) => <ProjectCard project={project} key={project.id} />)}</div></div>;
}

function ProjectCard({ project }: { project: Project }) {
  return <button className="project-card" onClick={() => navigate(`/project/${project.slug}`)}><div className="project-card-top" style={{ background: `${project.accent}18` }}><ProjectMark project={project} size="lg" /><span>{project.stage}<ArrowUpRight size={14} /></span></div><div className="project-card-body"><div className="card-title-line"><h3>{project.name}</h3><span className="tiny-verified"><Check size={11} /></span></div><p>{project.description}</p><div className="project-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="project-card-foot"><span><Avatar user={users.find((u) => u.name === project.owner) ?? currentUser} size="xs" /> {project.owner.split(" ")[0]}</span><small>{project.stats}</small></div></div></button>;
}

function ChartsView() {
  const [chart, setChart] = useState("Rising builders");
  return <div className="view"><div className="view-intro charts-intro"><div><div className="eyebrow">SIGNALS OVER STATUS</div><h1>Top <i>charts.</i></h1><p>Ranked by proof of work, meaningful momentum and consistency.</p></div><div className="date-select"><CalendarDays size={15} /> This week <ChevronDown size={14} /></div></div><div className="chart-tabs">{["Rising builders", "Top projects", "Trending startups"].map((name) => <button className={chart === name ? "chart-tab-active" : ""} key={name} onClick={() => setChart(name)}>{name}<span>{name === "Rising builders" ? "People" : name === "Top projects" ? "Work" : "Agents"}</span></button>)}</div><div className="chart-panel"><div className="chart-panel-head"><div><span className="eyebrow">{chart === "Rising builders" ? "RISING BUILDERS" : chart.toUpperCase()}</span><h2>Who’s making moves</h2></div><div className="chart-legend"><span><i className="legend-orange" /> Proof of work</span><span><i className="legend-gray" /> Meaningful engagement</span></div></div>{chart === "Rising builders" ? charts.builders.map((user, i) => <div className={`chart-row ${i === 0 ? "chart-row-top" : ""}`} key={user.id}><span className="chart-rank">{String(i + 1).padStart(2, "0")}</span><Avatar user={user} size={i === 0 ? "lg" : "md"} /><div className="chart-name"><strong>{user.name} {user.verified && <VerifiedMark />}</strong><span>{user.role} · {user.location}</span></div><div className="chart-bar"><i style={{ width: `${92 - i * 16}%` }} /><span>{92 - i * 16}</span></div><button className="chart-follow" onClick={() => navigate(`/profile/${user.username}`)}>{i === 0 ? "Following" : "View profile"}</button></div>) : projects.map((project, i) => <div className="chart-row" key={project.id}><span className="chart-rank">{String(i + 1).padStart(2, "0")}</span><ProjectMark project={project} size="md" /><div className="chart-name"><strong>{project.name}</strong><span>{project.category} · {project.stage}</span></div><div className="chart-bar"><i style={{ width: `${88 - i * 15}%`, background: project.accent }} /><span>{88 - i * 15}</span></div><button className="chart-follow" onClick={() => navigate(`/project/${project.slug}`)}>View project</button></div>)}</div><div className="chart-note"><Sparkles size={17} /><p><strong>How charts work.</strong> Nerdding weighs proof of work, project visits, saves and collaboration signals more heavily than follower count.</p><button className="text-button">Learn more <ArrowUpRight size={13} /></button></div></div>;
}

function TrendingCard({ item, featured = false, onToast }: { item: (typeof trendingPosts)[number]; featured?: boolean; onToast: (message: string) => void }) {
  const save = async () => { if (!requireSession(onToast)) return; try { await apiFetch(`/posts/${item.id}/save`, { method: "POST" }); onToast("Saved for later"); } catch (error) { onToast(error instanceof Error ? error.message : "Unable to save story"); } };
  const share = async () => { if (navigator.share) await navigator.share({ title: item.headline, text: item.summary, url: window.location.href }); else { await navigator.clipboard?.writeText(window.location.href); onToast("Story link copied"); } };
  return <article className={`trending-card ${featured ? "trending-card-featured" : ""}`}><div className="trending-card-top" style={{ background: item.accent }}><span className="trending-kind"><Flame size={13} /> {item.kind}</span><span>{item.time}</span><div className="trending-spark"><span /><span /><span /><span /><span /></div></div><div className="trending-card-body"><div className="trending-topic">{item.topic}</div><h3>{item.headline}</h3><p>{item.summary}</p><div className="trending-byline"><Avatar user={item.author} size="sm" /><span><strong>{item.author.name}</strong><small>{item.author.role} · {item.time}</small></span><ArrowUpRight size={15} /></div><div className="trending-actions"><span><Heart size={14} /> {item.reactions}</span><span><MessageCircle size={14} /> {item.comments}</span><button onClick={() => void save()} aria-label="Save trending story"><Bookmark size={14} /></button><button onClick={() => void share()} aria-label="Share trending story"><Share2 size={14} /></button></div></div></article>;
}

function ExploreViewNew({ onToast }: { onToast: (message: string) => void }) {
  const [mode, setMode] = useState("Trending now");
  const [stories, setStories] = useState<Array<{ id: string; text: string; topic?: string; kind?: string; createdAt: string; author?: { name: string; username: string; accountType: string } }>>([]);
  useEffect(() => { apiFetch<{ data: Array<{ id: string; text: string; topic?: string; kind?: string; createdAt: string; author?: { name: string; username: string; accountType: string } }> }>("/explore").then((response) => setStories(response.data)).catch(() => setStories([])); }, []);
  return <div className="view explore-view-new"><div className="view-intro"><div><div className="eyebrow">DISCOVER THE CONVERSATION</div><h1>What’s <i>moving.</i></h1><p>Explore ranked stories from the live Nerdding backend.</p></div><button className="outline-button" onClick={() => onToast("Explore filters are coming from the live ranking service") }><Filter size={15} /> Filters</button></div><div className="explore-modebar"><div className="explore-modes">{["Trending now", "For your interests", "People you follow"].map((item) => <button key={item} className={mode === item ? "mode-active" : ""} onClick={() => setMode(item)}>{item}{item === "Trending now" && <span className="mode-live">LIVE</span>}</button>)}</div><span className="explore-updated"><Activity size={13} /> Live ranking</span></div><div className="explore-layout-new"><main className="explore-feed-new"><div className="explore-section-label"><span className="eyebrow">{mode === "Trending now" ? "HOT IN NERDDING" : mode.toUpperCase()}</span><span>Ranked by meaningful activity</span></div>{stories.length ? <div className="trending-grid">{stories.map((story) => <article className="trending-card" key={story.id}><div className="trending-card-top"><span><Flame size={13} /> {story.kind ?? "Build story"}</span><span>{new Date(story.createdAt).toLocaleDateString()}</span></div><div className="trending-card-body"><div className="trending-topic">{story.topic ?? "BUILD"}</div><h3>{story.text}</h3><div className="trending-byline"><Avatar user={story.author ? { name: story.author.name, initials: story.author.name.slice(0, 2).toUpperCase(), color: currentUser.color } : currentUser} size="sm" /><span><strong>{story.author?.name ?? "Nerdding member"}</strong><small>{story.author?.accountType === "agent" ? "Agent" : "Builder"}</small></span></div><div className="trending-actions"><span><Activity size={14} /> Ranked</span><button onClick={() => { if (requireSession(onToast)) onToast("Story saved"); }} aria-label="Save story"><Bookmark size={14} /></button></div></div></article>)}</div> : <div className="empty-state"><Sparkles size={20} /><strong>No trending stories yet.</strong><span>As people publish and engage, Explore will rank the live conversation here.</span></div>}</main><aside className="explore-discover-rail"><div className="discover-card"><div className="rail-heading"><span>How Explore works</span><Sparkles size={15} /></div><p className="empty-rail-copy">Freshness, meaningful replies, saves, proof of work and trust shape discovery. Raw follower count is only a small signal.</p></div><div className="discover-note"><Sparkles size={15} /><p><strong>Live data only.</strong> This page does not use a prefilled demo identity or browser-seeded stories.</p></div></aside></div></div>;
  return <div className="view explore-view-new"><div className="view-intro"><div><div className="eyebrow">DISCOVER THE CONVERSATION</div><h1>What’s <i>moving.</i></h1><p>Trending stories, build notes and ideas people are gathering around right now.</p></div><button className="outline-button" onClick={() => onToast("Explore filters: topic, format, stage and time window") }><Filter size={15} /> Filters</button></div><div className="explore-modebar"><div className="explore-modes">{["Trending now", "For your interests", "People you follow"].map((item) => <button key={item} className={mode === item ? "mode-active" : ""} onClick={() => setMode(item)}>{item}{item === "Trending now" && <span className="mode-live">LIVE</span>}</button>)}</div><span className="explore-updated"><Activity size={13} /> Updated a minute ago</span></div><div className="explore-layout-new"><main className="explore-feed-new"><div className="explore-section-label"><span className="eyebrow">HOT IN NERDDING</span><span>Based on meaningful reads, saves and replies</span></div><TrendingCard item={trendingPosts[0]} featured onToast={onToast} /><div className="trending-grid">{trendingPosts.slice(1).map((item) => <TrendingCard item={item} key={item.id} onToast={onToast} />)}</div><div className="explore-for-you"><SectionHeading eyebrow="FOR YOUR INTERESTS" title={mode === "For your interests" ? "Picked for your curiosity" : "Because you follow AI & climate"} action="Refresh" /><div className="interest-stream">{projects.slice(0, 2).map((project) => <button className="interest-project" key={project.id} onClick={() => navigate(`/project/${project.slug}`)}><ProjectMark project={project} size="sm" /><span><strong>{project.name}</strong><small>{project.category} · {project.stage}</small><em>{project.description}</em></span><ArrowUpRight size={15} /></button>)}</div></div></main><aside className="explore-discover-rail"><div className="discover-card"><div className="rail-heading"><span>What people are into</span><Sparkles size={15} /></div>{["AI agents", "Climate tech", "Solo founders", "Open source", "Product craft"].map((topic, index) => <button className="topic-row" key={topic} onClick={() => navigate("/search")}><span>0{index + 1}</span><strong>{topic}</strong><small>{["2.4k", "1.8k", "930", "812", "644"][index]} posts</small><ArrowUpRight size={13} /></button>)}</div><div className="discover-card"><div className="rail-heading"><span>People to follow</span><button className="text-button" onClick={() => navigate("/charts")}>See all <ArrowUpRight size={13} /></button></div>{users.slice(1, 4).map((user) => <button className="discover-person" key={user.id} onClick={() => navigate(`/profile/${user.username}`)}><Avatar user={user} size="sm" /><span><strong>{user.name}</strong><small>{user.role}</small></span><span className="follow-plus"><Plus size={14} /></span></button>)}</div><div className="discover-note"><Sparkles size={15} /><p><strong>Explore is a little different here.</strong> It favors the work people are reading and discussing, not just the loudest posts.</p></div></aside></div></div>;
}

function ChartMiniSection({ eyebrow, title, action, children, className = "" }: { eyebrow: string; title: string; action: string; children: React.ReactNode; className?: string }) {
  return <section className={`chart-mini-section ${className}`}><div className="chart-mini-head"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2></div><button className="text-button">{action} <ArrowUpRight size={13} /></button></div>{children}</section>;
}

function ChartsViewNew() {
  const [builders, setBuilders] = useState<Array<{ id: string; name: string; username: string; score: number; accountType: string }>>([]);
  useEffect(() => { apiFetch<{ data: { risingBuilders: Array<{ id: string; name: string; username: string; score: number; accountType: string }> } }>("/charts").then((response) => setBuilders(response.data.risingBuilders)).catch(() => setBuilders([])); }, []);
  return <div className="view charts-view-new"><div className="view-intro charts-intro"><div><div className="eyebrow">SIGNALS OVER STATUS</div><h1>Top <i>charts.</i></h1><p>Ranked by proof of work, meaningful momentum and collaboration.</p></div><div className="date-select"><CalendarDays size={15} /> Live window <ChevronDown size={14} /></div></div><div className="chart-panel"><div className="chart-panel-head"><div><span className="eyebrow">RISING BUILDERS</span><h2>Who’s making moves</h2></div><div className="chart-legend"><span><i className="legend-orange" /> Proof of work</span><span><i className="legend-gray" /> Meaningful engagement</span></div></div>{builders.length ? builders.map((builder, index) => <div className="chart-row" key={builder.id}><span className="chart-rank">{String(index + 1).padStart(2, "0")}</span><Avatar user={{ name: builder.name, initials: builder.name.slice(0, 2).toUpperCase(), color: currentUser.color }} size="md" /><div className="chart-name"><strong>{builder.name}</strong><span>{builder.accountType === "agent" ? "Agent" : "Builder"}</span></div><div className="chart-bar"><i style={{ width: `${Math.max(8, Math.min(100, builder.score))}%` }} /><span>{Math.round(builder.score)}</span></div><button className="chart-follow" onClick={() => navigate(`/profile/${builder.username}`)}>View profile</button></div>) : <div className="empty-state"><TrendingUp size={20} /><strong>No chart entries yet.</strong><span>Charts will update from real posts, saves, replies and collaboration signals.</span></div>}</div><div className="chart-note"><Sparkles size={17} /><p><strong>How charts work.</strong> Nerdding uses a low-cost weighted score: proof of work, meaningful engagement, consistency, collaboration and freshness, with spam penalties.</p></div></div>;
  return <div className="view charts-view-new"><div className="view-intro charts-intro"><div><div className="eyebrow">SIGNALS OVER STATUS</div><h1>Top <i>charts.</i></h1><p>Several ways to notice the people and projects building with momentum.</p></div><div className="date-select"><CalendarDays size={15} /> This week <ChevronDown size={14} /></div></div><div className="chart-summary-row"><div><TrendingUp size={17} /><span><strong>+28%</strong> more build notes this week</span></div><div><Bookmark size={17} /><span><strong>6.4k</strong> meaningful saves</span></div><div><Users size={17} /><span><strong>412</strong> new collaborations</span></div><div><Sparkles size={17} /><span><strong>24</strong> verified projects rising</span></div></div><div className="charts-grid-new"><ChartMiniSection eyebrow="PEOPLE" title="Rising builders" action="View all"><div className="mini-chart-list">{charts.builders.slice(0, 3).map((user, index) => <button className="mini-chart-row" key={user.id} onClick={() => navigate(`/profile/${user.username}`)}><span className="mini-rank">0{index + 1}</span><Avatar user={user} size="sm" /><span><strong>{user.name} {user.verified && <VerifiedMark />}</strong><small>{user.role}</small></span><em>↗ {18 - index * 4}</em></button>)}</div></ChartMiniSection><ChartMiniSection eyebrow="PROJECTS" title="Most saved work" action="Explore"><div className="mini-chart-list">{projects.slice(0, 3).map((project, index) => <button className="mini-chart-row" key={project.id} onClick={() => navigate(`/project/${project.slug}`)}><span className="mini-rank">0{index + 1}</span><ProjectMark project={project} size="sm" /><span><strong>{project.name}</strong><small>{project.category} · {project.stage}</small></span><em>{project.stats}</em></button>)}</div></ChartMiniSection><ChartMiniSection eyebrow="STARTUPS" title="Trending startups" action="See directory" className="chart-mini-featured"><div className="startup-chart-lead"><ProjectMark project={projects[3]} size="lg" /><div><span className="stage-pill">Fundraising</span><h3>Kora</h3><p>Payment rails for the people building across borders.</p></div><span className="chart-score">94</span></div><div className="startup-chart-foot"><span><Flame size={13} /> 1.7k people exploring</span><button onClick={() => navigate("/project/kora")}>View startup <ArrowUpRight size={13} /></button></div></ChartMiniSection><ChartMiniSection eyebrow="COMMUNITIES" title="Active communities" action="Discover"><div className="mini-chart-list">{charts.communities.map((community, index) => <button className="mini-chart-row" key={community} onClick={() => navigate("/explore")}><span className="community-mark">{community.charAt(0)}</span><span><strong>{community}</strong><small>{["AI · 284 active this week", "Hyderabad · 126 active this week", "Climate · 94 active this week", "Open source · 82 active this week"][index]}</small></span><em>↗</em></button>)}</div></ChartMiniSection><ChartMiniSection eyebrow="CONSISTENCY" title="Most consistent builders" action="View all" className="chart-mini-wide"><div className="consistency-list">{users.slice(1, 5).map((user, index) => <button key={user.id} onClick={() => navigate(`/profile/${user.username}`)}><Avatar user={user} size="sm" /><span><strong>{user.name}</strong><small>{user.role}</small></span><div className="consistency-dots">{[0, 1, 2, 3, 4, 5, 6].map((dot) => <i key={dot} className={dot <= 6 - index ? "dot-on" : ""} />)}</div><em>{7 - index} wk streak</em></button>)}</div></ChartMiniSection></div><div className="chart-note"><Sparkles size={17} /><p><strong>How charts work.</strong> Nerdding weighs proof of work, project visits, saves and collaboration signals more heavily than follower count.</p><button className="text-button">Learn more <ArrowUpRight size={13} /></button></div></div>;
}

function FundraisingView() {
  return <div className="view"><div className="view-intro"><div><div className="eyebrow">CAPITAL WITH CONTEXT</div><h1>Fundraising, <i>with signal.</i></h1><p>Discover startups by what they’re building — not just who they know.</p></div><button className="primary-button"><Plus size={15} /> Add your startup</button></div><div className="fundraising-filter"><div className="search-filter"><Search size={15} /><input placeholder="Search startups or sectors" /></div>{["All stages", "Any industry", "Any location"].map((filter) => <button key={filter}>{filter}<ChevronDown size={14} /></button>)}<span className="filter-result">24 startups</span></div><div className="fundraising-layout"><div className="startup-list">{projects.filter((project) => project.stage === "Fundraising" || project.stage === "Growing" || project.stage === "MVP").map((project, i) => <button className="startup-card" key={project.id} onClick={() => navigate(`/project/${project.slug}`)}><div className="startup-card-head"><ProjectMark project={project} size="lg" /><span className="stage-pill">{project.stage}</span></div><h3>{project.name}</h3><p>{project.description}</p><div className="startup-meta"><span>{project.category}</span><span>·</span><span>{project.location}</span></div><div className="startup-bottom"><span><strong>{project.id === "kora" ? "$450k" : project.id === "fieldnote" ? "$1.2m ARR" : "Seed round"}</strong><small>{project.id === "kora" ? "seeking" : "traction"}</small></span><span className="startup-link">View thesis <ArrowUpRight size={13} /></span></div></button>)}</div><div className="investor-note"><div className="note-icon"><BriefcaseBusiness size={18} /></div><h3>Are you building?</h3><p>Make your startup discoverable to the right investors, collaborators and early believers.</p><button className="outline-button">Create fundraising profile <ArrowUpRight size={14} /></button><div className="note-trust"><Check size={14} /> You control who can discover you</div></div></div></div>;
}

function FundraisingViewNew({ onToast }: { onToast: (message: string) => void }) {
  const [liveCampaigns, setLiveCampaigns] = useState<ApiFundraising[]>([]);
  const [loadError, setLoadError] = useState("");
  useEffect(() => { apiFetch<{ data: ApiFundraising[] }>("/fundraisings").then((response) => setLiveCampaigns(response.data)).catch((error) => setLoadError(error instanceof Error ? error.message : "Campaigns could not be loaded")); }, []);
  const fundableProjects = liveCampaigns.map((campaign) => { const project = projects.find((item) => item.name.toLowerCase() === campaign.startupName.toLowerCase()) ?? { id: campaign.id, name: campaign.startupName, slug: campaign.startupName.toLowerCase().replace(/[^a-z0-9]+/g, "-"), description: `A verified ${campaign.industry} startup raising a thoughtful round.`, stage: "Fundraising", category: campaign.industry, accent: "#e4572e", icon: campaign.startupName.charAt(0).toUpperCase(), stats: `${campaign.investorCount} investors`, tags: [campaign.industry], owner: "Verified Agent", location: "India" }; return { ...project, fundraising: { stage: campaign.stage, targetAmount: campaign.targetAmount, raisedAmount: campaign.raisedAmount, currency: campaign.currency, investorCount: campaign.investorCount } }; });
  const formatMoney = (value: number, currency: string) => currency === "INR" ? `₹${(value / 100000).toFixed(1)}L` : `$${(value / 1000).toFixed(0)}k`;
  return <div className="view fundraising-view-new"><div className="view-intro"><div><div className="eyebrow">AGENT-LED CAPITAL</div><h1>Fundraising, <i>with signal.</i></h1><p>Discover verified startup fundraising profiles with clear progress, traction and context.</p></div><button className="outline-button agent-only-button" disabled title="Only verified Agents can create fundraising profiles"><LockKeyhole size={15} /> Agents only</button></div><div className="agent-rule-banner"><div className="agent-rule-icon"><LockKeyhole size={16} /></div><div><strong>Fundraising profiles are published by verified Agents.</strong><p>Users can discover, save and express investor interest. Only an organization with a verified Agent profile can create or update a fundraising campaign.</p></div><button className="text-button" onClick={() => onToast("Agent verification is handled after domain and organization review")}>How verification works <ArrowUpRight size={13} /></button></div>{loadError && <div className="empty-state"><strong>Live campaign data is unavailable.</strong><span>{loadError}</span></div>}<div className="fundraising-filter"><div className="search-filter"><Search size={15} /><input placeholder="Search startups or sectors" /></div>{["All stages", "Any industry", "Any location"].map((filter) => <button key={filter} onClick={() => onToast(`${filter} filter selected`)}>{filter}<ChevronDown size={14} /></button>)}<span className="filter-result">{fundableProjects.length} verified campaigns</span></div><div className="fundraising-layout"><div className="startup-list">{fundableProjects.map((project) => { const funding = project.fundraising!; const progress = Math.min(100, Math.round((funding.raisedAmount / funding.targetAmount) * 100)); return <button className="startup-card fundraising-card" key={project.id} onClick={() => navigate(`/project/${project.slug}`)}><div className="startup-card-head"><ProjectMark project={project} size="lg" /><span className="stage-pill">{funding.stage}</span></div><div className="fundraising-card-title"><div><h3>{project.name}</h3><span className="verified-campaign"><Check size={11} /> Verified Agent campaign</span></div><ArrowUpRight size={15} /></div><p>{project.description}</p><div className="startup-meta"><span>{project.category}</span><span>·</span><span>{project.location}</span><span>·</span><span>{funding.investorCount} investors</span></div><div className="funding-progress-label"><span>Raised <strong>{formatMoney(funding.raisedAmount, funding.currency)}</strong></span><span>Target {formatMoney(funding.targetAmount, funding.currency)}</span></div><div className="funding-progress"><i style={{ width: `${progress}%`, background: project.accent }} /></div><div className="startup-bottom"><span><strong>{progress}% funded</strong><small>{funding.targetAmount - funding.raisedAmount > 0 ? `${formatMoney(funding.targetAmount - funding.raisedAmount, funding.currency)} still open` : "Target reached"}</small></span><span className="startup-link">View campaign <ArrowUpRight size={13} /></span></div></button>; })}</div><div className="investor-note agent-note"><div className="note-icon"><BriefcaseBusiness size={18} /></div><h3>Building a round?</h3><p>Verified Agents can publish a fundraising profile, update progress and choose whether the campaign is public or investors-only.</p><button className="outline-button" onClick={() => navigate("/register")}><LockKeyhole size={14} /> Register as an Agent</button><div className="note-trust"><Check size={14} /> Investor discovery is opt-in</div></div></div></div>;
}

function EventsView() {
  return <div className="view"><div className="view-intro"><div><div className="eyebrow">MEET THE ECOSYSTEM</div><h1>Make it <i>real.</i></h1><p>Hackathons, workshops and rooms full of people trying things.</p></div><button className="primary-button"><Plus size={15} /> Create event</button></div><div className="event-controls"><div className="event-tabs"><button className="tab-active">For you</button><button>Online</button><button>Nearby</button></div><button className="outline-button"><CalendarDays size={15} /> This month <ChevronDown size={14} /></button></div><div className="event-list">{events.map((event) => <div className="event-card" key={event.id}><div className="event-date" style={{ background: `${event.color}16`, color: event.color }}><strong>{event.date}</strong><span>{event.month}</span></div><div className="event-info"><div className="event-kicker">{event.type} <span>·</span> {event.organizer}</div><h3>{event.title}</h3><p><CalendarDays size={14} /> {event.location}</p><small><Users size={14} /> {event.people}</small></div><button className="event-save icon-btn" aria-label="Save event"><Bookmark size={18} /></button><button className="outline-button event-rsvp">I’m interested <ArrowUpRight size={14} /></button></div>)}</div><div className="event-callout"><div><span className="eyebrow">YOUR NEXT ROOM</span><h2>Good things happen<br /><i>in progress.</i></h2><p>Find people who are close enough to build with.</p></div><div className="callout-illustration"><div /><div /><div /><BrandMark size={55} inverted /></div></div></div>;
}

function NerddingsView() {
  return <div className="view"><div className="view-intro"><div><div className="eyebrow">YOUR ECOSYSTEM</div><h1>Your <i>Nerddings.</i></h1><p>The people, projects and opportunities you’ve chosen to keep close.</p></div><button className="outline-button"><Settings size={15} /> Organize</button></div><div className="nerdding-stats"><div><span>Following</span><strong>48</strong></div><div><span>Projects saved</span><strong>12</strong></div><div><span>Collaborations</span><strong>06</strong></div><div><span>Affiliations</span><strong>02</strong></div></div><div className="nerdding-grid"><div className="collection-card"><div className="collection-head"><div><div className="eyebrow">SAVED WORK</div><h3>Projects to revisit</h3></div><Bookmark size={18} /></div>{projects.slice(0, 3).map((project) => <button className="saved-project" key={project.id} onClick={() => navigate(`/project/${project.slug}`)}><ProjectMark project={project} size="sm" /><span><strong>{project.name}</strong><small>{project.stage} · {project.stats}</small></span><ChevronRight size={15} /></button>)}<button className="collection-link">View all saved projects <ArrowRight size={14} /></button></div><div className="collection-card"><div className="collection-head"><div><div className="eyebrow">PEOPLE TO WATCH</div><h3>Your circle</h3></div><Users size={18} /></div>{users.slice(1, 4).map((user) => <button className="saved-project" key={user.id} onClick={() => navigate(`/profile/${user.username}`)}><Avatar user={user} size="sm" /><span><strong>{user.name}</strong><small>{user.role}</small></span><span className="circle-signal">↗</span></button>)}<button className="collection-link">Find more builders <ArrowRight size={14} /></button></div></div><div className="affiliation-card"><div className="affiliation-icon"><Check size={17} /></div><div><div className="eyebrow">TRUSTED IDENTITY</div><h3>Your affiliations</h3><p>Official relationships you’ve built with verified Agents.</p></div><div className="affiliation-item"><span className="org-badge">L</span><span><strong>Loomly</strong><small>Founder · Verified Agent</small></span><span className="approved"><Check size={13} /> Approved</span></div><div className="affiliation-item"><span className="org-badge org-purple">V</span><span><strong>Vector Labs</strong><small>Researcher · Pending</small></span><span className="pending">Awaiting review</span></div></div></div>;
}

function MessagesView({ onToast }: { onToast: (message: string) => void }) {
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState("");
  const conversation = conversations[selected];
  const send = async () => { if (!message.trim() || !requireSession(onToast)) return; try { await apiFetch("/messages", { method: "POST", body: JSON.stringify({ recipientId: conversation.user.id, body: message.trim() }) }); setMessage(""); onToast("Message sent"); } catch (error) { onToast(error instanceof Error ? error.message : "Message could not be sent"); } };
  return <div className="view messages-view"><div className="view-intro compact-intro"><div><div className="eyebrow">PRIVATE NETWORK</div><h1>Messages</h1></div><button className="primary-button" onClick={() => { if (requireSession(onToast)) onToast("Choose a builder from their profile to start a conversation"); }}><Plus size={15} /> New message</button></div><div className="messages-shell"><div className="conversation-list"><div className="message-search"><Search size={15} /><input placeholder="Search messages" /></div><button className="request-box" onClick={() => onToast("Message requests are reviewed here") }><span className="request-icon"><Users size={15} /></span><span><strong>Message requests</strong><small>2 waiting for you</small></span><ChevronRight size={15} /></button>{conversations.map((item, i) => <button className={`conversation-item ${selected === i ? "conversation-active" : ""}`} key={item.id} onClick={() => setSelected(i)}><Avatar user={item.user} size="md" online={i === 0} /><span><strong>{item.user.name}</strong><small>{item.preview}</small></span><time>{item.time}</time>{item.unread > 0 && <b>{item.unread}</b>}</button>)}</div><div className="conversation-panel"><div className="conversation-head"><UserIdentity user={conversation.user} compact /><div><button className="icon-btn" onClick={() => onToast("Search this conversation") }><Search size={17} /></button><button className="icon-btn" onClick={() => onToast("Conversation options") }><MoreHorizontal size={18} /></button></div></div><div className="chat-space"><div className="chat-date">TODAY</div><div className="message-bubble message-in"><small>{conversation.user.name} · 9:40 AM</small><p>Hey Ashrith — saw the latest Loomly update. The new setup flow feels really considered.</p></div><div className="message-bubble message-in"><p>Would love to compare notes on how you’re thinking about the project board.</p></div><div className="message-bubble message-out"><p>Thanks Rahul! That would be great. Your Threadline work was a big inspiration for the flow.</p><small>9:42 AM · Seen</small></div></div><div className="message-compose"><button className="icon-btn" onClick={() => onToast("Attach files in a message") }><Plus size={18} /></button><input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a message…" onKeyDown={(e) => { if (e.key === "Enter") void send(); }} /><button className="send-message" onClick={() => void send()}><Send size={17} /></button></div></div></div></div>;
}

function NotificationsView({ onToast }: { onToast: (message: string) => void }) {
  const markRead = async () => { if (!requireSession(onToast)) return; try { await apiFetch("/notifications/read-all", { method: "POST" }); onToast("Notifications marked as read"); } catch (error) { onToast(error instanceof Error ? error.message : "Notifications could not be updated"); } };
  return <div className="view notifications-view"><div className="view-intro compact-intro"><div><div className="eyebrow">KEEP IN THE LOOP</div><h1>Notifications</h1></div><button className="text-button" onClick={() => void markRead()}>Mark all as read <Check size={14} /></button></div><div className="notification-panel"><div className="notification-tabs"><button className="tab-active">All activity <span>4</span></button><button onClick={() => onToast("Mentions filtered")}>Mentions</button><button onClick={() => onToast("Requests filtered")}>Requests</button></div><div className="notification-group"><span className="notification-day">TODAY</span>{notifications.slice(0, 3).map((item) => <button className={`notification-row ${item.unread ? "notification-unread" : ""}`} key={item.id} onClick={() => navigate(`/profile/${item.actor.username}`)}><span className={`notification-symbol symbol-${item.kind}`}>{item.kind === "proof" ? <Bookmark size={15} /> : item.kind === "follow" ? <Users size={15} /> : item.kind === "comment" ? <MessageCircle size={15} /> : <Link2 size={15} />}</span><Avatar user={item.actor} size="md" /><span className="notification-copy"><strong>{item.actor.name}</strong> {item.text}<small>{item.time} · Nerdding</small></span>{item.unread && <i className="unread-dot" />}</button>)}</div><div className="notification-group"><span className="notification-day">YESTERDAY</span>{notifications.slice(3).map((item) => <button className="notification-row" key={item.id} onClick={() => navigate(`/profile/${item.actor.username}`)}><span className="notification-symbol symbol-team"><Link2 size={15} /></span><Avatar user={item.actor} size="md" /><span className="notification-copy"><strong>{item.actor.name}</strong> {item.text}<small>{item.time} · Nerdding</small></span></button>)}</div></div></div>;
}

type LiveEvent = { id: string; title: string; description: string; eventType: string; startsAt: string; location: string; url?: string | null; rsvpCount: number; creator?: { name: string; username: string } };

function EventsLiveView({ onToast }: { onToast: (message: string) => void }) {
  const [items, setItems] = useState<LiveEvent[]>([]);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const load = () => apiFetch<{ data: LiveEvent[] }>("/events").then((response) => setItems(response.data)).catch(() => setItems([]));
  useEffect(() => { void load(); }, []);
  const create = async () => { if (!requireSession(onToast)) return; try { await apiFetch("/events", { method: "POST", body: JSON.stringify({ title, description, eventType: "Community", startsAt: new Date(startsAt).toISOString(), location }) }); setCreating(false); setTitle(""); setDescription(""); setStartsAt(""); setLocation(""); await load(); onToast("Event created"); } catch (error) { onToast(error instanceof Error ? error.message : "Event could not be created"); } };
  const rsvp = async (id: string) => { if (!requireSession(onToast)) return; try { await apiFetch(`/events/${id}/rsvp`, { method: "POST", body: JSON.stringify({ status: "interested" }) }); onToast("You’re on the event list"); await load(); } catch (error) { onToast(error instanceof Error ? error.message : "RSVP could not be saved"); } };
  return <div className="view"><div className="view-intro"><div><div className="eyebrow">MEET THE ECOSYSTEM</div><h1>Make it <i>real.</i></h1><p>Live events created by Nerdding members.</p></div><button className="primary-button" onClick={() => { if (requireSession(onToast)) setCreating((value) => !value); }}><Plus size={15} /> Create event</button></div>{creating && <div className="event-create-card"><h3>Create an event</h3><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Event title" /><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What should people know?" /><div className="event-create-row"><input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Online or location" /></div><button className="primary-button" disabled={!title.trim() || !description.trim() || !startsAt || !location.trim()} onClick={() => void create()}>Publish event <ArrowUpRight size={14} /></button></div>}<div className="event-list">{items.length ? items.map((event) => { const date = new Date(event.startsAt); return <article className="event-card" key={event.id}><div className="event-date"><strong>{date.toLocaleDateString(undefined, { day: "2-digit" })}</strong><span>{date.toLocaleDateString(undefined, { month: "short" }).toUpperCase()}</span></div><div className="event-info"><div className="event-kicker">{event.eventType} <span>·</span> {event.creator?.name ?? "Nerdding member"}</div><h3>{event.title}</h3><p>{event.description}</p><p><CalendarDays size={14} /> {date.toLocaleString()} · {event.location}</p><small><Users size={14} /> {event.rsvpCount} interested</small></div><button className="outline-button event-rsvp" onClick={() => void rsvp(event.id)}>I’m interested <ArrowUpRight size={14} /></button></article>; }) : <div className="empty-state"><CalendarDays size={20} /><strong>No events yet.</strong><span>When members publish events, they will appear here.</span></div>}</div></div>;
}

function NerddingsLiveView({ onToast }: { onToast: (message: string) => void }) {
  const [data, setData] = useState<{ savedPosts: Array<{ id: string; body: string; createdAt: string; author: { name: string; username: string }; media: { publicUrl: string | null; mimeType: string }[] }>; following: Array<{ id: string; name: string; username: string; accountType: string }>; stats: { following: number; savedPosts: number; collaborations: number; affiliations: number } } | null>(null);
  useEffect(() => { if (!requireSession(onToast)) return; apiFetch<{ data: NonNullable<typeof data> }>("/nerddings").then((response) => setData(response.data)).catch(() => setData({ savedPosts: [], following: [], stats: { following: 0, savedPosts: 0, collaborations: 0, affiliations: 0 } })); }, []);
  if (!data) return <div className="view"><div className="empty-state"><Layers3 size={20} /><strong>Sign in to see your Nerddings.</strong><span>Your saved work and following list will sync here.</span></div></div>;
  return <div className="view"><div className="view-intro"><div><div className="eyebrow">YOUR ECOSYSTEM</div><h1>Your <i>Nerddings.</i></h1><p>Saved work and people you chose to keep close.</p></div></div><div className="nerdding-stats"><div><span>Following</span><strong>{data.stats.following}</strong></div><div><span>Saved posts</span><strong>{data.stats.savedPosts}</strong></div><div><span>Collaborations</span><strong>{data.stats.collaborations}</strong></div><div><span>Affiliations</span><strong>{data.stats.affiliations}</strong></div></div><div className="nerdding-grid"><div className="collection-card"><div className="collection-head"><div><div className="eyebrow">SAVED WORK</div><h3>Posts to revisit</h3></div><Bookmark size={18} /></div>{data.savedPosts.length ? data.savedPosts.map((post) => <button className="saved-project" key={post.id} onClick={() => navigate(`/post/${post.id}`)}><span className="saved-post-dot"><Bookmark size={14} /></span><span><strong>{post.body.slice(0, 90)}</strong><small>{post.author.name} · {new Date(post.createdAt).toLocaleDateString()}</small></span><ChevronRight size={15} /></button>) : <div className="collection-empty">Saved posts will appear here when you bookmark a live update.</div>}</div><div className="collection-card"><div className="collection-head"><div><div className="eyebrow">PEOPLE TO WATCH</div><h3>Your circle</h3></div><Users size={18} /></div>{data.following.length ? data.following.map((user) => <button className="saved-project" key={user.id} onClick={() => navigate(`/profile/${user.username}`)}><Avatar user={{ name: user.name, initials: user.name.slice(0, 2).toUpperCase(), color: currentUser.color }} size="sm" /><span><strong>{user.name}</strong><small>@{user.username} · {user.accountType === "agent" ? "Agent" : "Builder"}</small></span><ChevronRight size={15} /></button>) : <div className="collection-empty">People you follow will appear here.</div>}</div></div></div>;
}

type LiveNotification = { id: string; kind: string; text: string; readAt: string | null; createdAt: string; actor: { name: string; username: string } | null };
function NotificationsLiveView({ onToast }: { onToast: (message: string) => void }) {
  const [items, setItems] = useState<LiveNotification[]>([]);
  const load = () => apiFetch<{ data: LiveNotification[] }>("/notifications").then((response) => setItems(response.data)).catch(() => setItems([]));
  useEffect(() => { if (getAuthToken()) void load(); }, []);
  const markRead = async () => { if (!requireSession(onToast)) return; try { await apiFetch("/notifications/read-all", { method: "POST" }); await load(); onToast("Notifications marked as read"); } catch (error) { onToast(error instanceof Error ? error.message : "Notifications could not be updated"); } };
  return <div className="view notifications-view"><div className="view-intro compact-intro"><div><div className="eyebrow">KEEP IN THE LOOP</div><h1>Notifications</h1></div><button className="text-button" onClick={() => void markRead()}>Mark all as read <Check size={14} /></button></div><div className="notification-panel">{items.length ? items.map((item) => <button className={`notification-row ${!item.readAt ? "notification-unread" : ""}`} key={item.id} onClick={() => { if (item.actor) navigate(`/profile/${item.actor.username}`); }}><span className="notification-symbol symbol-team"><Bell size={15} /></span><span className="notification-copy"><strong>{item.actor?.name ?? "Nerdding"}</strong> {item.text}<small>{new Date(item.createdAt).toLocaleString()}</small></span>{!item.readAt && <i className="unread-dot" />}</button>) : <div className="empty-state"><Bell size={20} /><strong>No notifications yet.</strong><span>Activity from your live network will appear here.</span></div>}</div></div>;
}

type LiveContact = { id: string; name: string; username: string; accountType: string; messagingPublicKey: string | null };
type LiveRequest = { id: string; senderId: string; recipientId: string; status: string; other?: LiveContact };
type LiveConversation = { id: string; participant: LiveContact | null; lastMessage: { senderId: string; ciphertext?: string | null; iv?: string | null; senderKey?: string | null; recipientKey?: string | null; createdAt: string } | null };
type LiveEncryptedMessage = { id: string; senderId: string; ciphertext?: string | null; iv?: string | null; senderKey?: string | null; recipientKey?: string | null; createdAt: string; clear?: string };

function MessagesLiveView({ onToast }: { onToast: (message: string) => void }) {
  const [conversations, setConversations] = useState<LiveConversation[]>([]);
  const [requests, setRequests] = useState<LiveRequest[]>([]);
  const [selected, setSelected] = useState<LiveConversation | null>(null);
  const [messages, setMessages] = useState<LiveEncryptedMessage[]>([]);
  const [text, setText] = useState("");
  const [newMessage, setNewMessage] = useState(false);
  const [contacts, setContacts] = useState<LiveContact[]>([]);
  const [search, setSearch] = useState("");
  const viewerId = getSavedUser()?.id;
  const load = async () => { if (!getAuthToken()) return; try { await import("@/lib/messaging").then(({ ensureMessagingIdentity }) => ensureMessagingIdentity()); const [conversationResult, requestResult] = await Promise.all([apiFetch<{ data: LiveConversation[] }>("/messages"), apiFetch<{ data: LiveRequest[] }>("/messages/requests")]); setConversations(conversationResult.data); setRequests(requestResult.data); } catch (error) { onToast(error instanceof Error ? error.message : "Messages could not be loaded"); } };
  useEffect(() => { void load(); }, []);
  useEffect(() => { if (!selected) return; apiFetch<{ data: LiveEncryptedMessage[] }>(`/messages/${selected.id}`).then(async (response) => { const { decryptMessage } = await import("@/lib/messaging"); setMessages(await Promise.all(response.data.map(async (message) => ({ ...message, clear: await decryptMessage(message) })))); }).catch(() => setMessages([])); }, [selected]);
  useEffect(() => { if (!newMessage) return; apiFetch<{ data: LiveContact[] }>(`/messages/contacts?q=${encodeURIComponent(search)}`).then((response) => setContacts(response.data)).catch(() => setContacts([])); }, [newMessage, search]);
  const request = async (recipient: LiveContact) => { try { await apiFetch("/messages/requests", { method: "POST", body: JSON.stringify({ recipientId: recipient.id }) }); setNewMessage(false); onToast("Message request sent"); await load(); } catch (error) { onToast(error instanceof Error ? error.message : "Message request could not be sent"); } };
  const decide = async (item: LiveRequest, action: "accept" | "decline") => { try { await apiFetch(`/messages/requests/${item.id}`, { method: "POST", body: JSON.stringify({ action }) }); await load(); onToast(action === "accept" ? "Request accepted" : "Request declined"); } catch (error) { onToast(error instanceof Error ? error.message : "Request could not be updated"); } };
  const send = async () => { if (!text.trim() || !selected?.participant?.messagingPublicKey || !selected.participant.id) return; try { const { encryptMessage } = await import("@/lib/messaging"); const encrypted = await encryptMessage(text.trim(), selected.participant.messagingPublicKey); await apiFetch("/messages", { method: "POST", body: JSON.stringify({ recipientId: selected.participant.id, ...encrypted }) }); setText(""); const result = await apiFetch<{ data: LiveEncryptedMessage[] }>(`/messages/${selected.id}`); const { decryptMessage } = await import("@/lib/messaging"); setMessages(await Promise.all(result.data.map(async (message) => ({ ...message, clear: await decryptMessage(message) })))); } catch (error) { onToast(error instanceof Error ? error.message : "Message could not be sent"); } };
  if (!getAuthToken()) return <div className="view"><div className="empty-state"><MessageCircle size={20} /><strong>Sign in to message.</strong><span>Private conversations are available to members.</span><button className="primary-button" onClick={() => navigate("/login")}>Sign in <ArrowRight size={15} /></button></div></div>;
  return <div className="view messages-view"><div className="view-intro compact-intro"><div><div className="eyebrow">PRIVATE NETWORK</div><h1>Messages</h1><p className="privacy-note"><LockKeyhole size={12} /> End-to-end encrypted in your browser</p></div><button className="primary-button" onClick={() => setNewMessage((value) => !value)}><Plus size={15} /> New message</button></div>{newMessage && <div className="message-new-panel"><div className="message-search"><Search size={15} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a member by name or username" /></div>{contacts.map((contact) => <button className="contact-result" key={contact.id} onClick={() => void request(contact)}><Avatar user={{ name: contact.name, initials: contact.name.slice(0, 2).toUpperCase(), color: currentUser.color }} size="sm" /><span><strong>{contact.name}</strong><small>@{contact.username}</small></span><span className="text-button">Request</span></button>)}</div>}<div className="message-request-strip">{requests.filter((item) => item.status === "pending" && item.recipientId === viewerId).map((item) => <div className="message-request-item" key={item.id}><span><strong>{item.other?.name ?? "A member"}</strong> wants to message you.</span><button className="primary-button" onClick={() => void decide(item, "accept")}>Accept</button><button className="outline-button" onClick={() => void decide(item, "decline")}>Decline</button></div>)}</div><div className="messages-shell"><div className="conversation-list"><div className="message-search"><Search size={15} /><input placeholder="Search messages" /></div>{conversations.length ? conversations.map((item) => <button className={`conversation-item ${selected?.id === item.id ? "conversation-active" : ""}`} key={item.id} onClick={() => setSelected(item)}>{item.participant && <Avatar user={{ name: item.participant.name, initials: item.participant.name.slice(0, 2).toUpperCase(), color: currentUser.color }} size="md" />}<span><strong>{item.participant?.name ?? "Conversation"}</strong><small>Encrypted conversation</small></span></button>) : <div className="conversation-empty">No conversations yet. Send a request to start one.</div>}</div><div className="conversation-panel">{selected?.participant ? <><div className="conversation-head"><UserIdentity user={{ ...currentUser, id: selected.participant.id, name: selected.participant.name, username: selected.participant.username, initials: selected.participant.name.slice(0, 2).toUpperCase(), role: selected.participant.accountType === "agent" ? "Agent" : "Builder" }} compact /><span className="encrypted-label"><LockKeyhole size={12} /> E2E</span></div><div className="chat-space">{messages.length ? messages.map((message) => <div className={`message-bubble ${message.senderId === viewerId ? "message-out" : "message-in"}`} key={message.id}><p>{message.clear}</p><small>{new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small></div>) : <div className="chat-empty">No messages yet. Say hello.</div>}</div><div className="message-compose"><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Write an encrypted message…" onKeyDown={(event) => { if (event.key === "Enter") void send(); }} /><button className="send-message" onClick={() => void send()}><Send size={17} /></button></div></> : <div className="chat-empty"><MessageCircle size={24} /><strong>Select a conversation</strong><span>Accepted message requests appear here.</span></div>}</div></div></div>;
}

function SearchView({ query }: { query: string }) {
  const [search, setSearch] = useState(query || "AI");
  return <div className="view search-view"><div className="search-hero"><div className="eyebrow">GLOBAL SEARCH</div><h1>Find the <i>signal.</i></h1><div className="big-search"><Search size={22} /><input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} /><kbd>ESC</kbd></div></div><div className="search-result-head"><span>Showing results for <strong>“{search || "everything"}”</strong></span><button><Filter size={14} /> Filter results</button></div><div className="search-tabs"><button className="tab-active">All <span>24</span></button><button>People <span>11</span></button><button>Projects <span>7</span></button><button>Startups <span>3</span></button><button>Events <span>3</span></button></div><div className="result-list">{searchResults.map((result) => <button className="result-row" key={result.title}><span className="result-icon" style={{ background: `${result.accent}18`, color: result.accent }}>{result.kind === "Person" ? <UserRound size={17} /> : result.kind === "Event" ? <CalendarDays size={17} /> : <Layers3 size={17} />}</span><span><small>{result.kind}</small><strong>{result.title}</strong><em>{result.detail}</em></span><span className="result-meta">{result.meta}</span><ArrowUpRight size={16} /></button>)}</div></div>;
}

function ProfileView() {
  const [following, setFollowing] = useState(false);
  return <div className="view profile-view"><div className="profile-cover"><div className="cover-grid" /><div className="cover-symbol"><BrandMark size={82} inverted /></div></div><div className="profile-header"><Avatar user={currentUser} size="xl" /><div className="profile-head-copy"><div className="profile-title-row"><div><h1>{currentUser.name} <VerifiedMark /></h1><p>@{currentUser.username} · {currentUser.location}</p></div><div className="profile-actions"><button className={following ? "outline-button following-button" : "primary-button"} onClick={() => setFollowing(!following)}>{following ? <Check size={15} /> : <Plus size={15} />}{following ? "Following" : "Follow"}</button><button className="outline-button"><MoreHorizontal size={16} /></button></div></div><p className="profile-bio">{currentUser.bio}</p><div className="role-pills">{currentUser.roles.map((role) => <span key={role}>{role}</span>)}</div></div></div><div className="profile-stats"><span><strong>18</strong> Projects</span><span><strong>{currentUser.followers}</strong> Followers</span><span><strong>412</strong> Following</span><span><strong>9</strong> Build notes</span></div><div className="profile-body"><div><SectionHeading eyebrow="CURRENTLY BUILDING" title="Projects" action="View all" /><div className="profile-projects">{projects.slice(0, 2).map((project) => <ProjectCard project={project} key={project.id} />)}</div></div><div className="profile-side-card"><div className="eyebrow">OFFICIAL AFFILIATION</div><div className="official-affiliation"><span className="org-badge">L</span><span><strong>Loomly</strong><small>Founder · Verified Agent</small></span><VerifiedMark /></div><div className="eyebrow build-history-label">BUILD HISTORY</div><div className="timeline"><div><i /><span><strong>Shipped Loomly v0.4</strong><small>Today · Product update</small></span></div><div><i /><span><strong>Launched private beta</strong><small>28 Jul · Milestone</small></span></div><div><i /><span><strong>Started building Loomly</strong><small>08 Mar · Project</small></span></div></div></div></div></div>;
}

function ProjectView() {
  const project = projects[0];
  return <div className="view project-view"><button className="back-button" onClick={() => navigate("/explore")}><ArrowLeft size={15} /> Back to explore</button><div className="project-hero"><div className="project-hero-mark"><ProjectMark project={project} size="lg" /></div><div><div className="eyebrow">PROJECT · {project.stage.toUpperCase()}</div><h1>{project.name}</h1><p>{project.description}</p><div className="project-hero-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><div className="project-hero-actions"><button className="primary-button"><Plus size={15} /> Follow</button><button className="outline-button"><ExternalLink size={15} /> Open demo</button></div></div><div className="project-tabs"><button className="tab-active">Overview</button><button>Build updates <span>12</span></button><button>Contributors <span>8</span></button><button>Discussions</button></div><div className="project-body"><div><div className="project-proof-banner"><div className="proof-icon"><Check size={15} /></div><span><small>Proof of work verified</small><strong>Live product · GitHub repository · 8 contributors</strong></span><ArrowUpRight size={16} /></div><SectionHeading eyebrow="FROM THE BUILD LOG" title="Recent updates" action="See all" /><div className="empty-state"><Sparkles size={20} /><strong>No build updates yet.</strong><span>Project activity will appear here when the backend receives it.</span></div></div><div className="project-details"><div className="detail-card"><div className="eyebrow">PROJECT DETAILS</div><div className="detail-row"><span>Stage</span><strong>{project.stage}</strong></div><div className="detail-row"><span>Category</span><strong>{project.category}</strong></div><div className="detail-row"><span>Based in</span><strong>{project.location}</strong></div><div className="detail-row"><span>Owner</span><button onClick={() => navigate(`/profile/${currentUser.username}`)}>{project.owner} <ArrowUpRight size={13} /></button></div><div className="detail-links"><button><Github size={15} /> GitHub <ExternalLink size={12} /></button><button><Link2 size={15} /> Website <ExternalLink size={12} /></button></div></div><div className="contributors-card"><div className="eyebrow">CONTRIBUTORS</div><p>Contributor data will appear from the live backend.</p></div></div></div></div>;
}

function AgentView() {
  return <div className="view agent-view"><div className="agent-hero"><div className="agent-mark-large">V</div><div><div className="eyebrow">VERIFIED AGENT · STARTUP</div><h1>Vector Labs <VerifiedMark /></h1><p>Applied research for a more useful internet.</p><div className="agent-meta"><span>◎ Bengaluru, India</span><span>·</span><span>vectorlabs.ai</span></div></div><button className="primary-button"><Plus size={15} /> Follow agent</button></div><div className="agent-tabs"><button className="tab-active">Overview</button><button>People <span>12</span></button><button>Projects <span>4</span></button><button>Opportunities <span>2</span></button></div><div className="agent-body"><div><div className="agent-about"><div className="eyebrow">ABOUT VECTOR LABS</div><p>We work on the connective tissue between research and real products. Our team is small, technical and curious about the hard parts.</p><button className="text-button">Visit website <ExternalLink size={13} /></button></div><SectionHeading eyebrow="PEOPLE AFFILIATED" title="The team" action="See everyone" /><div className="team-grid">{users.slice(1, 5).map((user) => <button className="team-card" key={user.id} onClick={() => navigate(`/profile/${user.username}`)}><Avatar user={user} size="md" /><span><strong>{user.name}</strong><small>{user.roles[0]} @ Vector Labs</small></span><ArrowUpRight size={14} /></button>)}</div></div><div className="agent-aside"><div className="agent-fact"><div className="eyebrow">OPEN POSITIONS</div><h3>Build with us.</h3><p>2 roles are looking for a thoughtful person.</p><button className="outline-button">See opportunities <ArrowUpRight size={14} /></button></div><div className="agent-fact agent-fact-dark"><Zap size={18} /><h3>Verified, by design.</h3><p>Domain ownership confirmed Aug 2026.</p></div></div></div></div>;
}

function SettingsView({ onToast }: { onToast: (message: string) => void }) {
  const saved = getSavedUser();
  const [name, setName] = useState(saved?.name ?? currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [location, setLocation] = useState(currentUser.location);
  const [avatarUrl, setAvatarUrl] = useState(saved?.avatarUrl ?? currentUser.avatarUrl ?? null);
  const [discoverable, setDiscoverable] = useState(true);
  const [section, setSection] = useState("Profile details");
  const saveProfile = async () => { if (!requireSession(onToast)) return; try { await apiFetch("/settings/profile", { method: "PATCH", body: JSON.stringify({ name, bio, location }) }); onToast("Profile saved"); } catch (error) { onToast(error instanceof Error ? error.message : "Profile could not be saved"); } };
  const savePrivacy = async () => { if (!requireSession(onToast)) return; try { await apiFetch("/settings/privacy", { method: "PATCH", body: JSON.stringify({ discoverable }) }); onToast("Privacy settings saved"); } catch (error) { onToast(error instanceof Error ? error.message : "Settings could not be saved"); } };
  const uploadAvatar = async (file: File) => { if (!requireSession(onToast)) return; try { const uploaded = await uploadMedia(file); await apiFetch("/settings/profile", { method: "PATCH", body: JSON.stringify({ avatarUrl: uploaded.publicUrl }) }); setAvatarUrl(uploaded.publicUrl); const token = getAuthToken(); if (token && saved) saveAuthSession({ token, user: { ...saved, avatarUrl: uploaded.publicUrl } }); onToast("Profile photo updated"); } catch (error) { onToast(error instanceof Error ? error.message : "Profile photo could not be uploaded"); } };
  const logout = () => { clearAuthSession(); navigate("/"); window.location.reload(); };
  return <div className="view settings-view"><div className="view-intro compact-intro"><div><div className="eyebrow">YOUR ACCOUNT</div><h1>Settings</h1></div><button className="outline-button" onClick={logout}><LockKeyhole size={15} /> Log out</button></div><div className="settings-layout"><nav className="settings-nav">{["Profile details", "Roles & interests", "Affiliations", "Privacy & discoverability", "Notifications", "Connected accounts"].map((item) => <button key={item} className={section === item ? "settings-active" : ""} onClick={() => setSection(item)}>{item}</button>)}<button className="settings-danger" onClick={logout}>Log out of Nerdding</button></nav><div className="settings-panel">{section === "Profile details" && <><div className="settings-section"><div><h3>Profile details</h3><p>How people find and recognize you on Nerdding.</p></div><button className="primary-button" onClick={() => void saveProfile()}>Save changes <Check size={14} /></button></div><div className="settings-profile-row"><Avatar user={{ ...currentUser, avatarUrl }} size="lg" /><span><strong>{name}</strong><small>@{saved?.username ?? currentUser.username}</small></span><label className="profile-upload-button"><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAvatar(file); }} />Change photo</label></div><label>Display name<input value={name} onChange={(e) => setName(e.target.value)} /></label><label>Bio<textarea value={bio} onChange={(e) => setBio(e.target.value)} /></label><label>Location<input value={location} onChange={(e) => setLocation(e.target.value)} /></label></>}{section === "Privacy & discoverability" && <><div className="settings-section"><div><h3>Privacy & discoverability</h3><p>Choose how people can find and contact you.</p></div><button className="primary-button" onClick={() => void savePrivacy()}>Save settings <Check size={14} /></button></div><label className="setting-toggle"><span><strong>Discoverable profile</strong><small>Allow your profile to appear in search and Explore.</small></span><input type="checkbox" checked={discoverable} onChange={(e) => setDiscoverable(e.target.checked)} /></label><label className="setting-toggle"><span><strong>Allow messages</strong><small>Let other builders start a conversation with you.</small></span><input type="checkbox" defaultChecked /></label><label className="setting-toggle"><span><strong>Email notifications</strong><small>Receive updates when your work gets meaningful activity.</small></span><input type="checkbox" defaultChecked /></label></>}{section !== "Profile details" && section !== "Privacy & discoverability" && <div className="settings-empty"><Sparkles size={20} /><h3>{section}</h3><p>This section is ready for your account data and will sync to the same production API.</p><button className="outline-button" onClick={() => onToast("Your request has been queued")}>Manage {section.toLowerCase()}</button></div>}</div></div></div>;
}

function OAuthButtons() {
  const [error, setError] = useState("");
  const begin = (provider: "google" | "github") => { try { startOAuth(provider); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "OAuth is not configured"); } };
  return <div className="oauth-stack"><button type="button" className="oauth-button" onClick={() => begin("google")}><span className="oauth-google">G</span><span>Continue with Google</span><ArrowRight size={15} /></button><button type="button" className="oauth-button" onClick={() => begin("github")}><Github size={17} /><span>Continue with GitHub</span><ArrowRight size={15} /></button>{error && <p className="auth-error">{error}</p>}</div>;
}

function LoginView({ register = false }: { register?: boolean }) {
  return (
    <div className="public-entry-page">
      <div className="login-page">
        <div className="login-art">
          <div className="login-art-top">
            <Wordmark />
          </div>

          <div className="login-art-copy">
            <span className="eyebrow">THE SOCIAL NETWORK FOR</span>

            <h1>
              People
              <br />
              <i>building</i>
              <br />
              the future.
            </h1>

            <p>
              Build in public. Find your people.
              <br />
              Make something worth finding.
            </p>
          </div>

          <div className="login-art-symbol">
            <BrandMark size={190} inverted />
          </div>

          <small>nerdding.com · 2026</small>
        </div>

        <div className="login-panel">
          <div className="login-panel-top">
            <button
              className="login-back"
              onClick={() => navigate("/home")}
            >
              <ArrowLeft size={15} />
              Back to Nerdding
            </button>

            <span>
              {register ? "Already a member?" : "New to Nerdding?"}{" "}
              <button
                onClick={() =>
                  navigate(register ? "/login" : "/register")
                }
              >
                {register ? "Sign in" : "Create account"}
              </button>
            </span>
          </div>

          <div className="login-content">
            <BrandMark size={43} />

            <div className="eyebrow">
              {register ? "JOIN NERDDING" : "WELCOME TO NERDDING"}
            </div>

            <h1>
              {register ? (
                <>
                  Make your
                  <br />
                  <i>signal.</i>
                </>
              ) : (
                <>
                  Good to have
                  <br />
                  <i>you here.</i>
                </>
              )}
            </h1>

            <p>
              {register
                ? "Start with a secure provider, then shape your builder profile."
                : "Sign in securely and keep building your network."}
            </p>

            <OAuthButtons />

            <div className="oauth-divider">
              <span>ONE SECURE ACCOUNT</span>
            </div>

            <div className="login-benefits">
              <span>✓ No passwords to remember</span>
              <span>✓ Your profile is yours</span>
              <span>✓ Choose Builder or Agent next</span>
            </div>

            <small className="login-note">
              <LockKeyhole size={13} />
              Authentication is handled securely by your OAuth provider.
            </small>
          </div>

          <div className="login-footer">
            By continuing, you agree to Nerdding’s <LegalLinks />
          </div>
        </div>
      </div>

      <PublicAboutSection />
    </div>
  );
}

function AuthRequiredModal({ onClose }: { onClose: () => void }) {
  return <div className="modal-backdrop auth-required-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="auth-required-modal"><button className="icon-btn auth-required-close" onClick={onClose} aria-label="Close"><X size={18} /></button><BrandMark size={42} /><div className="eyebrow">MEMBERS ONLY</div><h2>Sign in to join the conversation.</h2><p>Like, comment, save, follow, message and publish from your own Nerdding account.</p><button className="primary-button auth-required-action" onClick={() => { onClose(); navigate("/login"); }}>Sign in <ArrowRight size={15} /></button><button className="outline-button auth-required-action" onClick={() => { onClose(); navigate("/register"); }}>Create an account <ArrowRight size={15} /></button></div></div>;
}

function LegalLinks() {
  const open = (path: string) => {
    const from = `${window.location.pathname}${window.location.search}`;
    navigate(`${path}?from=${encodeURIComponent(from)}`);
  };
  return <div className="legal-links"><button onClick={() => open("/privacy")}>Privacy</button><span>·</span><button onClick={() => open("/terms")}>Terms</button><span>·</span><button onClick={() => open("/community-guidelines")}>Guidelines</button><span>·</span><button onClick={() => open("/cookies")}>Cookies</button></div>;
}

function LegalPage({ kind }: { kind: "privacy" | "terms" | "community-guidelines" | "cookies" }) {
  const [returnTo] = useState(() => {
    const value = typeof window === "undefined" ? "/" : new URLSearchParams(window.location.search).get("from") ?? "/";
    return value.startsWith("/") && !value.startsWith("//") ? value : "/";
  });
  const content = {
    privacy: { label: "PRIVACY", title: "Your data should help you build — not follow you around.", intro: "This policy explains what Nerdding collects, why we use it, and the controls available to you.", sections: [["What we collect", "We collect account details provided through your OAuth provider, profile information you add during onboarding, posts and media you publish, and activity needed to operate social features such as follows, saves, messages and notifications."], ["How we use data", "We use information to provide the Nerdding product, rank relevant public content, protect the community, prevent abuse, operate fundraising and agent workflows, and communicate important service updates."], ["Public and private content", "Your profile, public posts, public projects and public agent information can be viewed by visitors. Messages, privacy settings and investor-only fundraising information are restricted according to the feature settings and access rules."], ["Storage and providers", "OAuth authentication is handled by Supabase Auth and Google or GitHub. Uploaded post media is stored in Supabase Storage. We do not put image or video binaries in PostgreSQL; the database stores the media path and metadata."], ["Your choices", "You can update profile and discoverability settings, delete content where the product provides that control, and request account deletion or a copy of your data by contacting legal@nerdding.com."], ["Contact", "For privacy questions or deletion requests, contact legal@nerdding.com. Replace this address with the operating entity’s official address before public launch."]] },
    terms: { label: "TERMS", title: "A clear agreement for a thoughtful network.", intro: "By using Nerdding, you agree to use it lawfully, respect other builders, and keep the signal useful.", sections: [["Eligibility and accounts", "You must provide accurate information, keep access to your OAuth account secure, and be old enough to enter a binding agreement in your location. One person or organization may not create accounts to mislead, impersonate or evade enforcement."], ["Your content", "You retain rights to content you publish. You grant Nerdding a limited, worldwide, non-exclusive license to host, process, display and distribute that content as needed to operate the service. You are responsible for having permission to upload media, links and brand assets."], ["Agent and fundraising information", "Agent verification is a review status, not a guarantee, endorsement, investment recommendation or financial outcome. Fundraising information must be accurate and kept current. Nerdding does not provide investment, legal or financial advice."], ["Acceptable use", "Do not use Nerdding for unlawful activity, fraud, spam, harassment, credential theft, scraping that harms the service, malware, impersonation, market manipulation or uploading content that violates another person’s rights."], ["Enforcement and availability", "We may limit, suspend or remove accounts and content that violate these Terms or create risk for the community. Features may change, be unavailable, or require configuration of third-party services."], ["Contact", "Questions about these Terms can be sent to legal@nerdding.com. These product terms should be reviewed by your lawyer for the countries where you operate."]] },
    "community-guidelines": { label: "COMMUNITY GUIDELINES", title: "Make the network worth finding.", intro: "Nerdding is for people building, learning, researching and collaborating in public.", sections: [["Add signal", "Share useful progress, honest context, meaningful questions, evidence of work and respectful disagreement. Give credit to collaborators and link to original sources."], ["Respect people", "Do not harass, threaten, discriminate against, dox, impersonate or target people or communities. Keep criticism focused on work and ideas, not personal attacks."], ["Be honest", "Do not fabricate traction, affiliations, funding, credentials, verification, testimonials or engagement. Do not use automated accounts to create misleading activity."], ["Keep it safe", "No malware, phishing, credential requests, illegal goods, sexual exploitation, violent threats or instructions intended to facilitate serious harm."], ["Report and appeal", "Use the report controls when available, or contact safety@nerdding.com with links and context. We may preserve evidence and restrict access while reviewing a report."]] },
    cookies: { label: "COOKIES", title: "Small files, clear choices.", intro: "Nerdding uses only the storage and browser mechanisms needed to keep the experience working.", sections: [["Essential storage", "We use browser local storage for your Nerdding session token, saved user session, encrypted messaging key and theme preference. These are necessary for authentication, encrypted conversations, navigation and your selected experience."], ["OAuth redirects", "When you sign in with Google or GitHub, Supabase and the provider use redirect state to complete authentication and protect the sign-in flow."], ["Analytics", "The current frontend does not require advertising cookies. If analytics, error monitoring or marketing tools are added later, this page and the consent experience should be updated before enabling them."], ["Your controls", "You can clear site data through your browser settings. Clearing session storage signs you out and removes local preferences; it does not delete server-side account data. Clearing the encrypted messaging key may make messages unreadable on this device."]] }
  }[kind];
  return <div className="legal-page"><div className="legal-top"><button className="logo-link" onClick={() => navigate(returnTo)}><Wordmark /></button><button className="outline-button" onClick={() => navigate(returnTo)}><ArrowLeft size={14} /> Back</button></div><main className="legal-shell"><div className="eyebrow">{content.label}</div><h1>{content.title}</h1><p className="legal-intro">{content.intro}</p><p className="legal-date">Last updated: August 16, 2026</p><div className="legal-sections">{content.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}</div><LegalLinks /></main></div>;
}

function OAuthCallbackView() {
  const [error, setError] = useState("");
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) { setError("OAuth sign-in did not return a session."); return; }
    window.localStorage.setItem("nerdding.token", token);
    apiFetch<{ data: ApiUser }>("/auth/me").then((response) => { saveAuthSession({ token, user: response.data }); navigate(response.data.onboardingCompleted === false ? "/onboarding" : "/home"); window.location.reload(); }).catch(() => setError("We could not finish signing you in. Please try again."));
  }, []);
  return <div className="auth-callback"><BrandMark size={48} /><h1>{error ? "Sign-in paused" : "Finishing your sign-in…"}</h1><p>{error || "Securing your Nerdding profile."}</p>{error && <button className="primary-button" onClick={() => navigate("/login")}>Back to sign in</button>}</div>;
}

function OnboardingView() {
  const saved = getSavedUser();
  const [name, setName] = useState(saved?.name ?? "");
  const [username, setUsername] = useState(saved?.username ?? "");
  const [accountType, setAccountType] = useState<"user" | "agent">("user");
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const interestOptions = ["AI & agents", "Climate tech", "Open source", "Product craft", "BioTech", "Indie hacking"];
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(""); setBusy(true); try { const result = await apiFetch<{ data: ApiUser }>("/auth/onboarding", { method: "POST", body: JSON.stringify({ name, username, accountType, interests }) }); const token = getAuthToken(); if (token) saveAuthSession({ token, user: result.data }); navigate("/home"); window.location.reload(); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to finish setup"); } finally { setBusy(false); } };
  return <div className="onboarding-page"><div className="onboarding-art"><Wordmark /><div><span className="eyebrow">YOUR NERDDING PROFILE</span><h1>Make your<br /><i>signal.</i></h1><p>A little context helps the right people find your work.</p></div><BrandMark size={150} inverted /></div><form className="onboarding-card" onSubmit={submit}><div className="eyebrow">STEP 1 OF 1</div><h1>Tell us about you.</h1><p>Signed in as <strong>{saved?.email}</strong></p><label className="auth-field"><span>Display name</span><input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} /></label><label className="auth-field"><span>Username</span><input required pattern="[a-zA-Z0-9_.-]{3,40}" value={username} onChange={(e) => setUsername(e.target.value)} /></label><div className="onboarding-label">I’m joining as</div><div className="auth-role-toggle"><button type="button" className={accountType === "user" ? "selected" : ""} onClick={() => setAccountType("user")}>Builder / user</button><button type="button" className={accountType === "agent" ? "selected" : ""} onClick={() => setAccountType("agent")}>Agent / organization</button></div>{accountType === "agent" && <div className="agent-status-note"><strong>Agent verification</strong><span>Your profile will be created as <b>Pending review</b>. Verification unlocks the public badge and Agent tools.</span></div>}<div className="onboarding-label">What are you curious about?</div><div className="interest-pills">{interestOptions.map((interest) => <button type="button" key={interest} className={interests.includes(interest) ? "interest-selected" : ""} onClick={() => setInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest])}>{interest}</button>)}</div>{error && <p className="auth-error">{error}</p>}<button className="primary-button auth-submit" disabled={busy}>{busy ? "Saving your profile…" : "Enter Nerdding"} <ArrowRight size={15} /></button></form></div>;
}

function CreateMenu({ onClose, onToast, onOpenComposer }: { onClose: () => void; onToast: (message: string) => void; onOpenComposer: () => void }) {
  const options = [{ icon: MessageCircle, title: "Create a post", sub: "Share a build update or idea", action: "post" }, { icon: Layers3, title: "Create a project", sub: "Give your work a home", action: "project" }, { icon: TrendingUp, title: "Share a milestone", sub: "Celebrate meaningful progress", action: "milestone" }, { icon: BriefcaseBusiness, title: "Post an opportunity", sub: "Find a collaborator or teammate", action: "opportunity" }, { icon: CalendarDays, title: "Create an event", sub: "Bring your community together", action: "event" }];
  return <div className="create-popover"><div className="create-popover-head"><span className="eyebrow">MAKE SOMETHING</span><button className="icon-btn icon-btn-quiet" onClick={onClose}><X size={17} /></button></div>{options.map(({ icon: Icon, title, sub, action }) => <button key={title} className="create-option" onClick={() => { if (!getAuthToken()) { onClose(); window.dispatchEvent(new CustomEvent("nerdding:auth-required")); return; } if (action === "post" || action === "milestone") { onClose(); onOpenComposer(); } else if (action === "event") { onClose(); navigate("/events?create=1"); } else if (action === "project") { onClose(); navigate("/project/new"); } else { onClose(); navigate("/events?opportunity=1"); } }}><span className="create-option-icon"><Icon size={17} /></span><span><strong>{title}</strong><small>{sub}</small></span><ArrowUpRight size={15} /></button>)}<div className="create-popover-foot">Press <kbd>C</kbd> anywhere to open</div></div>;
}

export function NerddingApp() {
  const [pathname, setPathname] = useState(() => typeof window === "undefined" ? "/" : window.location.pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [posts, setPosts] = useState<Post[]>([]);
  const [authPrompt, setAuthPrompt] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "c" && !["INPUT", "TEXTAREA"].includes((event.target as HTMLElement)?.tagName)) setMenuOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  useEffect(() => {
    const onAuthRequired = () => setAuthPrompt(true);
    window.addEventListener("nerdding:auth-required", onAuthRequired);
    return () => window.removeEventListener("nerdding:auth-required", onAuthRequired);
  }, []);
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("nerdding.theme");
    if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; window.localStorage.setItem("nerdding.theme", theme); }, [theme]);
  useEffect(() => {
    apiFetch<{ data: Array<{ id: string; authorId: string; author?: { id: string; name: string; username: string; accountType: string; avatarUrl?: string | null }; text: string; createdAt: string; projectSlug?: string; media?: { publicUrl: string | null; mimeType: string }[]; likes?: number; comments?: number; reposts?: number; liked?: boolean; saved?: boolean }> }>("/feed").then((response) => {
      const mapped = response.data.map((post) => ({ id: post.id, author: post.author ? { ...currentUser, id: post.author.id, name: post.author.name, username: post.author.username, avatarUrl: post.author.avatarUrl, role: post.author.accountType === "agent" ? "Agent" : "Builder", initials: post.author.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() } : currentUser, type: "Build update" as const, time: "now", text: post.text, likes: post.likes ?? 0, comments: post.comments ?? 0, reposts: post.reposts ?? 0, liked: post.liked, saved: post.saved, media: post.media, project: projects.find((project) => project.slug === post.projectSlug) }));
      setPosts(mapped);
    }).catch(() => undefined);
  }, []);
  const active = pathname === "/" ? "/home" : pathname.startsWith("/profile") ? "/profile/ashrith.builds" : pathname.startsWith("/project") ? "/explore" : pathname.split("/").slice(0, 2).join("/");
  const hasSession = Boolean(getAuthToken());

  const isRoot = pathname === "/";
  const isAuth =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  const isOAuthCallback = pathname.startsWith("/auth/callback");
  const isOnboarding = pathname.startsWith("/onboarding");
  if (isOnboarding) return <OnboardingView />;
  if (isRoot && !hasSession) {
    return <LoginView />;
  }
  const title = useMemo(() => ({ "/home": "Home", "/explore": "Explore", "/charts": "Top charts", "/fundraising": "Fundraising", "/events": "Events", "/nerddings": "Your Nerddings", "/messages": "Messages", "/notifications": "Notifications", "/settings": "Settings", "/search": "Search" }[active] ?? "Nerdding"), [active]);

  if (pathname.startsWith("/privacy")) return <LegalPage kind="privacy" />;
  if (pathname.startsWith("/terms")) return <LegalPage kind="terms" />;
  if (pathname.startsWith("/community-guidelines")) return <LegalPage kind="community-guidelines" />;
  if (pathname.startsWith("/cookies")) return <LegalPage kind="cookies" />;
  if (isOAuthCallback) return <OAuthCallbackView />;
  if (isOnboarding) return <OnboardingView />;
  if (isAuth) return <LoginView register={pathname.startsWith("/register")} />;
  if (getAuthToken() && getSavedUser()?.onboardingCompleted === false) return <OnboardingView />;
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2800); };
  const handleSearch = (value: string) => { setQuery(value); if (value.length > 1) navigate(`/search?q=${encodeURIComponent(value)}`); };
  const handlePost = async (text: string, media: { path: string; publicUrl: string; mimeType: string }[]) => {
    const result = await apiFetch<{ data: { id: string } }>("/posts", { method: "POST", body: JSON.stringify({ body: text, media }) });
    setPosts((current) => [{ id: result.data.id, author: currentUser, type: "Build update", time: "now", text, likes: 0, comments: 0, reposts: 0 }, ...current]); showToast("Your update is live");
  };
  let content: React.ReactNode;
  if (pathname.startsWith("/search")) content = <SearchView query={query} />;
  else if (pathname.startsWith("/explore")) content = <ExploreViewNew onToast={showToast} />;
  else if (pathname.startsWith("/charts")) content = <ChartsViewNew />;
  else if (pathname.startsWith("/fundraising")) content = <FundraisingViewNew onToast={showToast} />;
  else if (pathname.startsWith("/events")) content = <EventsLiveView onToast={showToast} />;
  else if (pathname.startsWith("/nerddings")) content = <NerddingsLiveView onToast={showToast} />;
  else if (pathname.startsWith("/messages")) content = <MessagesPanel />;
  else if (pathname.startsWith("/notifications")) content = <NotificationsLiveView onToast={showToast} />;
  else if (pathname.startsWith("/profile")) content = <ProfileView />;
  else if (pathname.startsWith("/agent")) content = <AgentView />;
  else if (pathname.startsWith("/project")) content = <ProjectView />;
  else if (pathname.startsWith("/settings")) content = <SettingsView onToast={showToast} />;
  else content = <HomeView onCreate={() => { if (!requireSession(showToast)) return; setComposerOpen(true); }} onToast={showToast} posts={posts} onPost={handlePost} />;

  return <div className="app-shell"><Sidebar active={active} onCreate={() => setMenuOpen(true)} /><main className="app-main"><Header title={title} onCreate={() => setMenuOpen(!menuOpen)} onMenu={() => setMobileMenu(!mobileMenu)} onSearch={handleSearch} theme={theme} onToggleTheme={() => setTheme((current) => current === "light" ? "dark" : "light")} />{mobileMenu && <div className="mobile-drawer"><LogoLink />{navItems.map(({ label, href, icon: Icon }) => <button key={label} onClick={() => { navigate(href); setMobileMenu(false); }}><Icon size={17} />{label}</button>)}<button onClick={() => { navigate("/settings"); setMobileMenu(false); }}><Settings size={17} />Settings</button><button onClick={() => { clearAuthSession(); navigate("/"); window.location.reload(); }}><LockKeyhole size={17} />Log out</button></div>}<div className="page-content">{content}</div></main><MobileNav active={active} onCreate={() => setMenuOpen(true)} />{menuOpen && <CreateMenu onClose={() => setMenuOpen(false)} onToast={showToast} onOpenComposer={() => setComposerOpen(true)} />}{composerOpen && <Composer onClose={() => setComposerOpen(false)} onToast={showToast} onPost={handlePost} />}{authPrompt && <AuthRequiredModal onClose={() => setAuthPrompt(false)} />}{toast && <Toast message={toast} onClose={() => setToast("")} />}</div>;
}
