"use client";

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
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BrandMark, Wordmark } from "@/components/brand/BrandMark";
import { Avatar, ProjectMark, VerifiedMark } from "@/components/ui/Avatar";
import { Toast } from "@/components/ui/Toast";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { apiFetch, clearAuthSession, getAuthToken, getSavedUser, saveAuthSession, uploadMedia, type ApiFundraising, type ApiUser } from "@/lib/api";
import {
  charts,
  conversations,
  currentUser,
  events,
  notifications,
  posts as seededPosts,
  projects,
  searchResults,
  trendingPosts,
  users,
  type Post,
  type Project,
  type User,
} from "@/lib/mock-data";

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
  navigate("/login");
  return false;
}

function LogoLink() {
  return <button className="logo-link" onClick={() => navigate("/home")}><Wordmark /></button>;
}

function Sidebar({ active, onCreate }: { active: string; onCreate: () => void }) {
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
        <div className="status-chip"><span className="pulse-dot" />Guest view · sign in to build</div>
        <button className="user-mini" onClick={() => navigate("/profile/ashrith.builds")}><Avatar user={currentUser} size="sm" online /><span><strong>{currentUser.name}</strong><small>@{currentUser.username}</small></span><MoreHorizontal size={16} /></button>
      </div>
    </aside>
  );
}

function MobileNav({ active, onCreate }: { active: string; onCreate: () => void }) {
  const items = navItems.slice(0, 4);
  return <nav className="mobile-nav" aria-label="Mobile navigation">{items.map(({ label, href, icon: Icon }) => <button key={href} onClick={() => navigate(href)} className={active === href ? "mobile-active" : ""}><Icon size={19} /><span>{label === "Top charts" ? "Charts" : label}</span></button>)}<button className="mobile-create" onClick={onCreate}><Plus size={19} /></button><button onClick={() => navigate("/profile/ashrith.builds")} className={active.includes("profile") ? "mobile-active" : ""}><UserRound size={19} /><span>You</span></button></nav>;
}

function Header({ title, onCreate, onMenu, onSearch }: { title: string; onCreate: () => void; onMenu: () => void; onSearch: (value: string) => void }) {
  return <header className="topbar"><button className="mobile-menu" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button><div className="page-title">{title}</div><div className="header-search"><Search size={17} /><input onChange={(e) => onSearch(e.target.value)} placeholder="Search people, projects, ideas" aria-label="Search" /><span className="search-shortcut">⌘ K</span></div><div className="topbar-actions"><button className="icon-btn header-icon" onClick={() => navigate("/notifications")} aria-label="Notifications"><Bell size={19} /><i /></button><button className="header-create" onClick={onCreate}><Plus size={16} /> Create</button><Avatar user={currentUser} size="sm" /></div></header>;
}

function RightRail() {
  return <aside className="right-rail">
    <div className="rail-card signal-card"><div className="signal-orb"><Sparkles size={17} /></div><div><strong>Build signal</strong><p>Your work is reaching more people this week.</p></div><span className="signal-number">+24%</span></div>
    <div className="rail-card"><div className="rail-heading"><span>Rising builders</span><button className="text-button" onClick={() => navigate("/charts")}>See all <ArrowUpRight size={13} /></button></div><div className="rail-list">{charts.builders.slice(0, 3).map((user, index) => <button className="rail-person" key={user.id} onClick={() => navigate(`/profile/${user.username}`)}><span className="rank">0{index + 1}</span><Avatar user={user} size="sm" /><span className="rail-person-name"><strong>{user.name}</strong><small>{user.role}</small></span><span className="trend">↗ {index === 0 ? "18" : index === 1 ? "12" : "9"}</span></button>)}</div></div>
    <div className="rail-card"><div className="rail-heading"><span>Projects to watch</span><button className="text-button" onClick={() => navigate("/explore")}>Explore <ArrowUpRight size={13} /></button></div>{projects.slice(0, 2).map((project) => <button className="rail-project" key={project.id} onClick={() => navigate(`/project/${project.slug}`)}><ProjectMark project={project} size="sm" /><span><strong>{project.name}</strong><small>{project.category} · {project.stats}</small></span><ChevronRight size={15} /></button>)}</div>
    <div className="rail-card quick-links"><div className="rail-heading"><span>Quick links</span></div><button onClick={() => navigate("/fundraising")}><BriefcaseBusiness size={15} /> Fundraising directory <ArrowUpRight size={13} /></button><button onClick={() => navigate("/events")}><CalendarDays size={15} /> Events this week <ArrowUpRight size={13} /></button><button onClick={() => navigate("/nerddings")}><Bookmark size={15} /> Saved for later <ArrowUpRight size={13} /></button></div>
    <div className="rail-footer">© 2026 Nerdding <span>·</span> About <span>·</span> Guidelines <span>·</span> Help</div>
  </aside>;
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
  return <div className="view home-view"><div className="feed-column"><div className="welcome-card"><div className="welcome-copy"><span className="eyebrow">SUNDAY, AUG 16 · WEEK 33</span><h1>Make something<br /><i>worth finding.</i></h1><p>A focused feed for the people building the future — one thoughtful update at a time.</p><button className="welcome-cta" onClick={onCreate}>Share what you’re building <ArrowUpRight size={15} /></button></div><div className="welcome-art"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-mark"><BrandMark size={106} inverted /></div><span className="art-label art-label-top">build · prove</span><span className="art-label art-label-bottom">connect · grow</span></div></div><div className="feed-toolbar"><div className="feed-tabs"><button className={tab === "All updates" ? "tab-active" : ""} onClick={() => setTab("All updates")}>All updates</button><button className={tab === "Proof of work" ? "tab-active" : ""} onClick={() => setTab("Proof of work")}>Proof of work <span>✦</span></button></div><button className="filter-button"><ListFilter size={15} /> Curated <ChevronDown size={14} /></button></div><div className="composer-inline"><Avatar user={currentUser} size="sm" /><button onClick={onCreate}>Share a build update, Ashrith…</button><button className="composer-add" onClick={onCreate}><Plus size={18} /></button></div>{visible.map((post) => <SocialPostCard post={post} key={post.id} onToast={onToast} />)}</div><RightRail /></div>;
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
  return <div className="view explore-view-new"><div className="view-intro"><div><div className="eyebrow">DISCOVER THE CONVERSATION</div><h1>What’s <i>moving.</i></h1><p>Trending stories, build notes and ideas people are gathering around right now.</p></div><button className="outline-button" onClick={() => onToast("Explore filters: topic, format, stage and time window") }><Filter size={15} /> Filters</button></div><div className="explore-modebar"><div className="explore-modes">{["Trending now", "For your interests", "People you follow"].map((item) => <button key={item} className={mode === item ? "mode-active" : ""} onClick={() => setMode(item)}>{item}{item === "Trending now" && <span className="mode-live">LIVE</span>}</button>)}</div><span className="explore-updated"><Activity size={13} /> Updated a minute ago</span></div><div className="explore-layout-new"><main className="explore-feed-new"><div className="explore-section-label"><span className="eyebrow">HOT IN NERDDING</span><span>Based on meaningful reads, saves and replies</span></div><TrendingCard item={trendingPosts[0]} featured onToast={onToast} /><div className="trending-grid">{trendingPosts.slice(1).map((item) => <TrendingCard item={item} key={item.id} onToast={onToast} />)}</div><div className="explore-for-you"><SectionHeading eyebrow="FOR YOUR INTERESTS" title={mode === "For your interests" ? "Picked for your curiosity" : "Because you follow AI & climate"} action="Refresh" /><div className="interest-stream">{projects.slice(0, 2).map((project) => <button className="interest-project" key={project.id} onClick={() => navigate(`/project/${project.slug}`)}><ProjectMark project={project} size="sm" /><span><strong>{project.name}</strong><small>{project.category} · {project.stage}</small><em>{project.description}</em></span><ArrowUpRight size={15} /></button>)}</div></div></main><aside className="explore-discover-rail"><div className="discover-card"><div className="rail-heading"><span>What people are into</span><Sparkles size={15} /></div>{["AI agents", "Climate tech", "Solo founders", "Open source", "Product craft"].map((topic, index) => <button className="topic-row" key={topic} onClick={() => navigate("/search")}><span>0{index + 1}</span><strong>{topic}</strong><small>{["2.4k", "1.8k", "930", "812", "644"][index]} posts</small><ArrowUpRight size={13} /></button>)}</div><div className="discover-card"><div className="rail-heading"><span>People to follow</span><button className="text-button" onClick={() => navigate("/charts")}>See all <ArrowUpRight size={13} /></button></div>{users.slice(1, 4).map((user) => <button className="discover-person" key={user.id} onClick={() => navigate(`/profile/${user.username}`)}><Avatar user={user} size="sm" /><span><strong>{user.name}</strong><small>{user.role}</small></span><span className="follow-plus"><Plus size={14} /></span></button>)}</div><div className="discover-note"><Sparkles size={15} /><p><strong>Explore is a little different here.</strong> It favors the work people are reading and discussing, not just the loudest posts.</p></div></aside></div></div>;
}

function ChartMiniSection({ eyebrow, title, action, children, className = "" }: { eyebrow: string; title: string; action: string; children: React.ReactNode; className?: string }) {
  return <section className={`chart-mini-section ${className}`}><div className="chart-mini-head"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2></div><button className="text-button">{action} <ArrowUpRight size={13} /></button></div>{children}</section>;
}

function ChartsViewNew() {
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
  return <div className="view project-view"><button className="back-button" onClick={() => navigate("/explore")}><ArrowLeft size={15} /> Back to explore</button><div className="project-hero"><div className="project-hero-mark"><ProjectMark project={project} size="lg" /></div><div><div className="eyebrow">PROJECT · {project.stage.toUpperCase()}</div><h1>{project.name}</h1><p>{project.description}</p><div className="project-hero-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><div className="project-hero-actions"><button className="primary-button"><Plus size={15} /> Follow</button><button className="outline-button"><ExternalLink size={15} /> Open demo</button></div></div><div className="project-tabs"><button className="tab-active">Overview</button><button>Build updates <span>12</span></button><button>Contributors <span>8</span></button><button>Discussions</button></div><div className="project-body"><div><div className="project-proof-banner"><div className="proof-icon"><Check size={15} /></div><span><small>Proof of work verified</small><strong>Live product · GitHub repository · 8 contributors</strong></span><ArrowUpRight size={16} /></div><SectionHeading eyebrow="FROM THE BUILD LOG" title="Recent updates" action="See all" />{seededPosts.slice(0, 2).map((post) => <SocialPostCard key={post.id} post={post} onToast={() => undefined} />)}</div><div className="project-details"><div className="detail-card"><div className="eyebrow">PROJECT DETAILS</div><div className="detail-row"><span>Stage</span><strong>{project.stage}</strong></div><div className="detail-row"><span>Category</span><strong>{project.category}</strong></div><div className="detail-row"><span>Based in</span><strong>{project.location}</strong></div><div className="detail-row"><span>Owner</span><button onClick={() => navigate("/profile/ashrith.builds")}>{project.owner} <ArrowUpRight size={13} /></button></div><div className="detail-links"><button><Github size={15} /> GitHub <ExternalLink size={12} /></button><button><Link2 size={15} /> Website <ExternalLink size={12} /></button></div></div><div className="contributors-card"><div className="eyebrow">CONTRIBUTORS · 8</div><div className="contributor-stack">{users.slice(0, 5).map((user) => <Avatar key={user.id} user={user} size="sm" />)}<span>+3</span></div><p>Builders shipping together from Hyderabad, Bengaluru and beyond.</p></div></div></div></div>;
}

function AgentView() {
  return <div className="view agent-view"><div className="agent-hero"><div className="agent-mark-large">V</div><div><div className="eyebrow">VERIFIED AGENT · STARTUP</div><h1>Vector Labs <VerifiedMark /></h1><p>Applied research for a more useful internet.</p><div className="agent-meta"><span>◎ Bengaluru, India</span><span>·</span><span>vectorlabs.ai</span></div></div><button className="primary-button"><Plus size={15} /> Follow agent</button></div><div className="agent-tabs"><button className="tab-active">Overview</button><button>People <span>12</span></button><button>Projects <span>4</span></button><button>Opportunities <span>2</span></button></div><div className="agent-body"><div><div className="agent-about"><div className="eyebrow">ABOUT VECTOR LABS</div><p>We work on the connective tissue between research and real products. Our team is small, technical and curious about the hard parts.</p><button className="text-button">Visit website <ExternalLink size={13} /></button></div><SectionHeading eyebrow="PEOPLE AFFILIATED" title="The team" action="See everyone" /><div className="team-grid">{users.slice(1, 5).map((user) => <button className="team-card" key={user.id} onClick={() => navigate(`/profile/${user.username}`)}><Avatar user={user} size="md" /><span><strong>{user.name}</strong><small>{user.roles[0]} @ Vector Labs</small></span><ArrowUpRight size={14} /></button>)}</div></div><div className="agent-aside"><div className="agent-fact"><div className="eyebrow">OPEN POSITIONS</div><h3>Build with us.</h3><p>2 roles are looking for a thoughtful person.</p><button className="outline-button">See opportunities <ArrowUpRight size={14} /></button></div><div className="agent-fact agent-fact-dark"><Zap size={18} /><h3>Verified, by design.</h3><p>Domain ownership confirmed Aug 2026.</p></div></div></div></div>;
}

function SettingsView({ onToast }: { onToast: (message: string) => void }) {
  const saved = getSavedUser();
  const [name, setName] = useState(saved?.name ?? currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [location, setLocation] = useState(currentUser.location);
  const [discoverable, setDiscoverable] = useState(true);
  const [section, setSection] = useState("Profile details");
  const saveProfile = async () => { if (!requireSession(onToast)) return; try { await apiFetch("/settings/profile", { method: "PATCH", body: JSON.stringify({ name, bio, location }) }); onToast("Profile saved"); } catch (error) { onToast(error instanceof Error ? error.message : "Profile could not be saved"); } };
  const savePrivacy = async () => { if (!requireSession(onToast)) return; try { await apiFetch("/settings/privacy", { method: "PATCH", body: JSON.stringify({ discoverable }) }); onToast("Privacy settings saved"); } catch (error) { onToast(error instanceof Error ? error.message : "Settings could not be saved"); } };
  const logout = () => { clearAuthSession(); navigate("/"); window.location.reload(); };
  return <div className="view settings-view"><div className="view-intro compact-intro"><div><div className="eyebrow">YOUR ACCOUNT</div><h1>Settings</h1></div><button className="outline-button" onClick={logout}><LockKeyhole size={15} /> Log out</button></div><div className="settings-layout"><nav className="settings-nav">{["Profile details", "Roles & interests", "Affiliations", "Privacy & discoverability", "Notifications", "Connected accounts"].map((item) => <button key={item} className={section === item ? "settings-active" : ""} onClick={() => setSection(item)}>{item}</button>)}<button className="settings-danger" onClick={logout}>Log out of Nerdding</button></nav><div className="settings-panel">{section === "Profile details" && <><div className="settings-section"><div><h3>Profile details</h3><p>How people find and recognize you on Nerdding.</p></div><button className="primary-button" onClick={() => void saveProfile()}>Save changes <Check size={14} /></button></div><div className="settings-profile-row"><Avatar user={currentUser} size="lg" /><span><strong>{name}</strong><small>@{saved?.username ?? currentUser.username}</small></span><button className="text-button" onClick={() => onToast("Choose a profile image from the upload control in your next profile edit")}>Change photo</button></div><label>Display name<input value={name} onChange={(e) => setName(e.target.value)} /></label><label>Bio<textarea value={bio} onChange={(e) => setBio(e.target.value)} /></label><label>Location<input value={location} onChange={(e) => setLocation(e.target.value)} /></label></>}{section === "Privacy & discoverability" && <><div className="settings-section"><div><h3>Privacy & discoverability</h3><p>Choose how people can find and contact you.</p></div><button className="primary-button" onClick={() => void savePrivacy()}>Save settings <Check size={14} /></button></div><label className="setting-toggle"><span><strong>Discoverable profile</strong><small>Allow your profile to appear in search and Explore.</small></span><input type="checkbox" checked={discoverable} onChange={(e) => setDiscoverable(e.target.checked)} /></label><label className="setting-toggle"><span><strong>Allow messages</strong><small>Let other builders start a conversation with you.</small></span><input type="checkbox" defaultChecked /></label><label className="setting-toggle"><span><strong>Email notifications</strong><small>Receive updates when your work gets meaningful activity.</small></span><input type="checkbox" defaultChecked /></label></>}{section !== "Profile details" && section !== "Privacy & discoverability" && <div className="settings-empty"><Sparkles size={20} /><h3>{section}</h3><p>This section is ready for your account data and will sync to the same production API.</p><button className="outline-button" onClick={() => onToast("Your request has been queued")}>Manage {section.toLowerCase()}</button></div>}</div></div></div>;
}

function LoginView({ register = false }: { register?: boolean }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"user" | "agent">("user");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const result = await apiFetch<{ data: { token: string; user: ApiUser } }>(register ? "/auth/register" : "/auth/login", { method: "POST", body: JSON.stringify(register ? { name, username, email, password, accountType } : { email, password }) });
      saveAuthSession(result.data); navigate("/home"); window.location.reload();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to continue"); }
    finally { setBusy(false); }
  };
  return <div className="login-page"><div className="login-art"><div className="login-art-top"><Wordmark /></div><div className="login-art-copy"><span className="eyebrow">THE SOCIAL NETWORK FOR</span><h1>People<br /><i>building</i><br />the future.</h1><p>Build in public. Find your people.<br />Make something worth finding.</p></div><div className="login-art-symbol"><BrandMark size={190} inverted /></div><small>nerdding.com · 2026</small></div><div className="login-panel"><div className="login-panel-top"><button className="login-back" onClick={() => navigate("/")}><ArrowLeft size={15} /> Browse as guest</button><span>{register ? "Already a member?" : "New to Nerdding?"} <button onClick={() => navigate(register ? "/login" : "/register")}>{register ? "Sign in" : "Create account"}</button></span></div><form className="login-content" onSubmit={submit}><BrandMark size={43} /><div className="eyebrow">{register ? "JOIN NERDDING" : "WELCOME TO NERDDING"}</div><h1>{register ? <>Make your<br /><i>signal.</i></> : <>Good to have<br /><i>you here.</i></>}</h1><p>{register ? "Create your identity and start building in public." : "Sign in to keep building your network."}</p>{register && <><label className="auth-field"><span>Full name</span><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ashrith Reddy" /></label><label className="auth-field"><span>Username</span><input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ashrith.builds" /></label><div className="auth-role-toggle"><button type="button" className={accountType === "user" ? "selected" : ""} onClick={() => setAccountType("user")}>Builder account</button><button type="button" className={accountType === "agent" ? "selected" : ""} onClick={() => setAccountType("agent")}>Verified Agent</button></div></>}<label className="auth-field"><span>Email</span><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label><label className="auth-field"><span>Password</span><input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ characters" /></label>{error && <p className="auth-error">{error}</p>}<button className="primary-button auth-submit" disabled={busy}>{busy ? "Working…" : register ? "Create my account" : "Sign in"} <ArrowRight size={15} /></button><small className="login-note"><LockKeyhole size={13} /> Your account is secured with encrypted password hashing.</small></form><div className="login-footer">By continuing, you agree to Nerdding’s <u>Community Guidelines</u> and <u>Terms</u>.</div></div></div>;
}

function CreateMenu({ onClose, onToast, onOpenComposer }: { onClose: () => void; onToast: (message: string) => void; onOpenComposer: () => void }) {
  const options = [{ icon: MessageCircle, title: "Create a post", sub: "Share a build update or idea", action: "post" }, { icon: Layers3, title: "Create a project", sub: "Give your work a home", action: "project" }, { icon: TrendingUp, title: "Share a milestone", sub: "Celebrate meaningful progress", action: "milestone" }, { icon: BriefcaseBusiness, title: "Post an opportunity", sub: "Find a collaborator or teammate", action: "opportunity" }, { icon: CalendarDays, title: "Create an event", sub: "Bring your community together", action: "event" }];
  return <div className="create-popover"><div className="create-popover-head"><span className="eyebrow">MAKE SOMETHING</span><button className="icon-btn icon-btn-quiet" onClick={onClose}><X size={17} /></button></div>{options.map(({ icon: Icon, title, sub, action }) => <button key={title} className="create-option" onClick={() => { if (!getAuthToken()) { onClose(); navigate("/login"); return; } if (action === "post" || action === "milestone") { onClose(); onOpenComposer(); } else if (action === "event") { onClose(); navigate("/events?create=1"); } else if (action === "project") { onClose(); navigate("/project/new"); } else { onClose(); navigate("/events?opportunity=1"); } }}><span className="create-option-icon"><Icon size={17} /></span><span><strong>{title}</strong><small>{sub}</small></span><ArrowUpRight size={15} /></button>)}<div className="create-popover-foot">Press <kbd>C</kbd> anywhere to open</div></div>;
}

export function NerddingApp() {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [posts, setPosts] = useState<Post[]>(seededPosts);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "c" && !["INPUT", "TEXTAREA"].includes((event.target as HTMLElement)?.tagName)) setMenuOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  useEffect(() => {
    apiFetch<{ data: Array<{ id: string; authorId: string; text: string; createdAt: string; projectSlug?: string }> }>("/feed").then((response) => {
      const mapped = response.data.map((post) => ({ id: post.id, author: users.find((user) => user.id === post.authorId) ?? currentUser, type: "Build update" as const, time: "now", text: post.text, likes: 0, comments: 0, reposts: 0, project: projects.find((project) => project.slug === post.projectSlug) }));
      if (mapped.length) setPosts(mapped);
    }).catch(() => undefined);
  }, []);
  const active = pathname === "/" ? "/home" : pathname.startsWith("/profile") ? "/profile/ashrith.builds" : pathname.startsWith("/project") ? "/explore" : pathname.split("/").slice(0, 2).join("/");
  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/register");
  const title = useMemo(() => ({ "/home": "Home", "/explore": "Explore", "/charts": "Top charts", "/fundraising": "Fundraising", "/events": "Events", "/nerddings": "Your Nerddings", "/messages": "Messages", "/notifications": "Notifications", "/settings": "Settings", "/search": "Search" }[active] ?? "Nerdding"), [active]);

  if (isAuth) return <LoginView register={pathname.startsWith("/register")} />;

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
  else if (pathname.startsWith("/events")) content = <EventsView />;
  else if (pathname.startsWith("/nerddings")) content = <NerddingsView />;
  else if (pathname.startsWith("/messages")) content = <MessagesView onToast={showToast} />;
  else if (pathname.startsWith("/notifications")) content = <NotificationsView onToast={showToast} />;
  else if (pathname.startsWith("/profile")) content = <ProfileView />;
  else if (pathname.startsWith("/agent")) content = <AgentView />;
  else if (pathname.startsWith("/project")) content = <ProjectView />;
  else if (pathname.startsWith("/settings")) content = <SettingsView onToast={showToast} />;
  else content = <HomeView onCreate={() => setComposerOpen(true)} onToast={showToast} posts={posts} onPost={handlePost} />;

  return <div className="app-shell"><Sidebar active={active} onCreate={() => setMenuOpen(true)} /><main className="app-main"><Header title={title} onCreate={() => setMenuOpen(!menuOpen)} onMenu={() => setMobileMenu(!mobileMenu)} onSearch={handleSearch} />{mobileMenu && <div className="mobile-drawer"><LogoLink />{navItems.map(({ label, href, icon: Icon }) => <button key={href} onClick={() => { navigate(href); setMobileMenu(false); }}><Icon size={17} />{label}</button>)}<button onClick={() => { clearAuthSession(); navigate("/"); window.location.reload(); }}><LockKeyhole size={17} />Log out</button></div>}<div className="page-content">{content}</div></main><MobileNav active={active} onCreate={() => setMenuOpen(true)} />{menuOpen && <CreateMenu onClose={() => setMenuOpen(false)} onToast={showToast} onOpenComposer={() => setComposerOpen(true)} />}{composerOpen && <Composer onClose={() => setComposerOpen(false)} onToast={showToast} onPost={handlePost} />}{toast && <Toast message={toast} onClose={() => setToast("")} />}</div>;
}
