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
    {post.media?.filter((media) => media.publicUrl).length ? <div className="social-media"><div className="media-grid">{post.media?.filter((media) => media.publicUrl).map((media, index) => media.mimeType.startsWith("video") ? <video key={index} src={media.publicUrl ?? ""} controls /> : <img key={index} src={media.publicUrl ?? ""} alt="" />)}</div></div> : null}
    {post.project && <button className="post-project" onClick={() => navigate(`/project/${post.project?.slug}`)}><ProjectMark project={post.project} /><span className="project-copy"><strong>{post.project.name}</strong><small>{post.project.stage} · {post.project.category}</small><em>{post.project.description}</em></span><ArrowUpRight size={17} /></button>}
    {post.linkUrl && <a className="post-link-card" href={post.linkUrl} target="_blank" rel="noreferrer"><Link2 size={15} /><span>{post.linkUrl.replace(/^https?:\/\//, "").slice(0, 95)}</span><ExternalLink size={14} /></a>}
    <div className="post-stats"><span>{post.likes} likes</span><span>{post.comments} comments</span><span>{post.reposts} nerddings</span>{post.score != null && <span>{Math.round(post.score * 100)} signal</span>}</div>
    <div className="post-actions"><button className={liked ? "action-liked" : ""} onClick={() => void runAction("like")}><Heart size={17} fill={liked ? "currentColor" : "none"} /> Like</button><button className={commentOpen ? "action-active" : ""} onClick={() => setCommentOpen(!commentOpen)}><MessageCircle size={17} /> Comment</button><button className={reposted ? "action-active" : ""} onClick={() => void runAction("repost")}><Activity size={17} /> Nerdd</button><button className={saved ? "action-active" : ""} onClick={() => void runAction("save")}><Bookmark size={17} fill={saved ? "currentColor" : "none"} /> Save</button><button onClick={() => onToast("Share options opened")}><Share2 size={17} /></button></div>
    {commentOpen && <div className="comment-box"><Avatar user={currentUser} size="xs" /><input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a thoughtful comment…" onKeyDown={(e) => { if (e.key === "Enter") void submitComment(); }} /><button disabled={!comment.trim()} onClick={() => void submitComment()}><Send size={15} /></button></div>}
  </article>;
}

function HomeView({ toast }: { toast: (message: string) => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
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

  return <>
    <Header ...
