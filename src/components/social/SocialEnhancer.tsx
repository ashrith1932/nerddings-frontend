"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  Check,
  ChevronRight,
  Github,
  Heart,
  Image as ImageIcon,
  Link2,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Quote,
  Rocket,
  Search,
  Send,
  Share2,
  Users,
  X,
} from "lucide-react";
import { apiFetch, getAuthToken, getSavedUser, uploadMedia } from "@/lib/api";

interface UserRef {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  accountType?: string;
  bio?: string | null;
  location?: string | null;
}

interface MentionRef extends UserRef {
  kind: "user" | "agent";
  verified?: boolean;
}

interface ProjectRef {
  id: string;
  name: string;
  slug: string;
  description: string;
  stage: string;
  githubUrl?: string | null;
}

interface QuotePostRef {
  id: string;
  text: string;
  createdAt: string;
  author: UserRef;
}

interface FeedPost {
  id: string;
  authorId: string;
  author: UserRef;
  text: string;
  createdAt: string;
  score?: number;
  likes: number;
  comments: number;
  reposts: number;
  saves: number;
  liked?: boolean;
  saved?: boolean;
  reposted?: boolean;
  following?: boolean;
  linkUrl?: string | null;
  media?: Array<{ publicUrl: string | null; mimeType: string }>;
  project?: ProjectRef | null;
  quotePostId?: string | null;
  quotePost?: QuotePostRef | null;
}

interface CommentNode {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  author: UserRef;
  replies: CommentNode[];
}

const timeAgo = (value: string) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

const initials = (name?: string) =>
  (name ?? "N")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function Avatar({ user, size = "sm" }: { user?: UserRef | null; size?: "xs" | "sm" | "md" | "lg" }) {
  return (
    <span className={`se-avatar se-avatar-${size}`}>
      {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials(user?.name)}
    </span>
  );
}

function ButtonIcon({ children, onClick, label }: { children: React.ReactNode; onClick?: () => void; label?: string }) {
  return <button className="se-icon-button" onClick={onClick} aria-label={label}>{children}</button>;
}

function MiniCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`se-card ${className}`}>{children}</section>;
}

function FeedPostCard({ post, onOpen, onChanged }: { post: FeedPost; onOpen: (post: FeedPost) => void; onChanged: (id: string, patch: Partial<FeedPost>) => void }) {
  const action = async (kind: "like" | "save" | "repost") => {
    try {
      const result = await apiFetch<{ data: { active: boolean } }>(`/posts/${post.id}/${kind}`, { method: "POST" });
      const active = result.data.active;
      if (kind === "like") onChanged(post.id, { liked: active, likes: Math.max(0, post.likes + (active ? 1 : -1)) });
      if (kind === "save") onChanged(post.id, { saved: active, saves: Math.max(0, post.saves + (active ? 1 : -1)) });
      if (kind === "repost") onChanged(post.id, { reposted: active, reposts: Math.max(0, post.reposts + (active ? 1 : -1)) });
    } catch {
      // Keep the existing UI stable on transient failures.
    }
  };

  return (
    <article className="se-post">
      <div className="se-post-head">
        <button className="se-author" onClick={() => { window.history.pushState({}, "", `/profile/${post.author.username}`); window.dispatchEvent(new PopStateEvent("popstate")); }}>
          <Avatar user={post.author} size="sm" />
          <span><strong>{post.author.name}</strong><small>@{post.author.username} · {timeAgo(post.createdAt)}</small></span>
        </button>
        <ButtonIcon label="More"><MoreHorizontal size={17} /></ButtonIcon>
      </div>

      <div className="se-post-copy" onClick={() => onOpen(post)}>{post.text}</div>

      {post.quotePost && (
        <button className="se-quoted" onClick={() => onOpen({ ...post, text: post.quotePost?.text ?? post.text, author: post.quotePost?.author ?? post.author, createdAt: post.quotePost?.createdAt ?? post.createdAt, id: post.quotePost?.id ?? post.id })}>
          <div className="se-author"><Avatar user={post.quotePost.author} size="xs" /><span><strong>{post.quotePost.author.name}</strong><small>@{post.quotePost.author.username}</small></span></div>
          <p>{post.quotePost.text}</p>
        </button>
      )}

      {post.media?.length ? (
        <div className={`se-media-grid se-media-${Math.min(post.media.length, 4)}`}>
          {post.media.slice(0, 4).map((media, index) => media.publicUrl ? (
            media.mimeType.startsWith("video/")
              ? <video key={`${media.publicUrl}-${index}`} src={media.publicUrl} controls preload="metadata" />
              : <img key={`${media.publicUrl}-${index}`} src={media.publicUrl} alt="" loading="lazy" />
          ) : null)}
        </div>
      ) : null}

      {post.project && (
        <button className="se-project-card" onClick={() => { window.history.pushState({}, "", `/project/${post.project?.slug}`); window.dispatchEvent(new PopStateEvent("popstate")); }}>
          <span className="se-project-mark"><Rocket size={15} /></span>
          <span><strong>{post.project.name}</strong><small>{post.project.stage} · {post.project.description}</small></span>
          <ArrowUpRight size={15} />
        </button>
      )}

      {post.linkUrl && (
        <a className="se-link-card" href={post.linkUrl} target="_blank" rel="noreferrer">
          <Link2 size={14} /><span>{post.linkUrl.replace(/^https?:\/\//, "")}</span><ArrowUpRight size={14} />
        </a>
      )}

      <div className="se-post-stats">
        <span>{post.likes} likes</span><span>{post.comments} comments</span><span>{post.reposts} nerddings</span>
        {post.score != null && <span className="se-score">{Math.round(post.score * 100)} signal</span>}
      </div>

      <div className="se-actions">
        <button className={post.liked ? "active" : ""} onClick={() => void action("like")}><Heart size={16} fill={post.liked ? "currentColor" : "none"} />{post.likes}</button>
        <button onClick={() => onOpen(post)}><MessageCircle size={16} />{post.comments}</button>
        <button className={post.reposted ? "active" : ""} onClick={() => void action("repost")}><Activity size={16} />{post.reposts}</button>
        <button className={post.saved ? "active" : ""} onClick={() => void action("save")}><Bookmark size={16} fill={post.saved ? "currentColor" : "none"} /></button>
        <button onClick={() => onOpen(post)}><Quote size={16} /></button>
        <button onClick={async () => { await navigator.clipboard?.writeText(`${window.location.origin}/post/${post.id}`); }}><Share2 size={16} /></button>
      </div>
    </article>
  );
}

function Composer({ onClose, onPosted, initialQuote }: { onClose: () => void; onPosted: () => void; initialQuote?: FeedPost | null }) {
  const viewer = getSavedUser();
  const [text, setText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [projects, setProjects] = useState<ProjectRef[]>([]);
  const [projectSlug, setProjectSlug] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentions, setMentions] = useState<MentionRef[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!viewer?.username) return;
    apiFetch<{ data: { projects?: ProjectRef[] } }>(`/social/users/${encodeURIComponent(viewer.username)}/profile`)
      .then((response) => setProjects(response.data.projects ?? []))
      .catch(() => setProjects([]));
  }, [viewer?.username]);

  useEffect(() => {
    if (!mentionQuery) { setMentions([]); return; }
    const timer = window.setTimeout(() => {
      apiFetch<{ data: MentionRef[] }>(`/social/mentions?q=${encodeURIComponent(mentionQuery)}`)
        .then((response) => setMentions(response.data ?? []))
        .catch(() => setMentions([]));
    }, 120);
    return () => window.clearTimeout(timer);
  }, [mentionQuery]);

  const onTextChange = (value: string) => {
    setText(value);
    const match = value.match(/(?:^|\s)@([a-zA-Z0-9_.-]*)$/);
    setMentionQuery(match ? match[1] : "");
  };

  const chooseMention = (mention: MentionRef) => {
    setText((current) => current.replace(/(?:^|\s)@([a-zA-Z0-9_.-]*)$/, ` @${mention.username} `).trimStart());
    setMentionQuery("");
    setMentions([]);
  };

  const publish = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const media = [];
      for (const file of files) media.push(await uploadMedia(file));
      await apiFetch("/posts", {
        method: "POST",
        body: JSON.stringify({
          body: text.trim(),
          projectSlug: projectSlug || undefined,
          linkUrl: linkUrl.trim() || undefined,
          media,
        }),
      });
      onPosted();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="se-modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <div className="se-composer">
        <header><div><small>SHARE YOUR WORK</small><h2>{initialQuote ? "Quote post" : "Create a post"}</h2></div><ButtonIcon onClick={onClose} label="Close"><X size={18} /></ButtonIcon></header>
        {initialQuote && <div className="se-compose-quote"><Avatar user={initialQuote.author} size="xs" /><div><strong>{initialQuote.author.name}</strong><small>{initialQuote.text}</small></div></div>}
        <div className="se-compose-user"><Avatar user={viewer} size="sm" /><span><strong>{viewer?.name ?? "Member"}</strong><small>@{viewer?.username ?? "member"}</small></span></div>
        <div className="se-compose-body">
          <textarea autoFocus value={text} onChange={(event) => onTextChange(event.target.value)} maxLength={5000} placeholder="What are you building, learning, testing or shipping?" />
          {mentions.length > 0 && <div className="se-mentions">{mentions.map((mention) => <button key={`${mention.kind}-${mention.id}`} onClick={() => chooseMention(mention)}><Avatar user={mention} size="xs" /><span><strong>{mention.name}</strong><small>@{mention.username} · {mention.kind}</small></span>{mention.verified && <Check size={13} />}</button>)}</div>}
        </div>
        <div className="se-compose-fields">
          <label><ImageIcon size={15} /><span>{files.length ? `${files.length} media` : "Media"}</span><input type="file" multiple accept="image/*,video/*" onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 10))} /></label>
          <label><Link2 size={15} /><input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="Optional link" /></label>
          <select value={projectSlug} onChange={(event) => setProjectSlug(event.target.value)}><option value="">Attach a project</option>{projects.map((project) => <option key={project.id} value={project.slug}>{project.name}</option>)}</select>
        </div>
        <footer><span>{text.length}/5000</span><button disabled={!text.trim() || busy} onClick={() => void publish()}>{busy ? <><Loader2 className="se-spin" size={15} /> Publishing…</> : <>Publish <ArrowUpRight size={15} /></>}</button></footer>
      </div>
    </div>
  );
}

function CommentNode({ postId, node, onReload, depth = 0 }: { postId: string; node: CommentNode; onReload: () => void; depth?: number }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply] = useState("");
  const send = async () => {
    if (!reply.trim()) return;
    await apiFetch(`/social/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ body: reply.trim(), parentId: node.id }) });
    setReply(""); setReplyOpen(false); onReload();
  };
  return <div className="se-comment" style={{ marginLeft: Math.min(depth, 5) * 18 }}>
    <Avatar user={node.author} size="xs" />
    <div className="se-comment-body"><div><strong>{node.author.name}</strong><small>@{node.author.username} · {timeAgo(node.createdAt)}</small></div><p>{node.body}</p><button onClick={() => setReplyOpen((value) => !value)}>Reply</button>{replyOpen && <div className="se-reply"><input autoFocus value={reply} onChange={(event) => setReply(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void send()} placeholder="Reply…"/><button onClick={() => void send()}><Send size={13} /></button></div>}{node.replies.map((child) => <CommentNode key={child.id} postId={postId} node={child} onReload={onReload} depth={depth + 1} />)}</div>
  </div>;
}

function PostDrawer({ post, onClose, onQuote }: { post: FeedPost; onClose: () => void; onQuote: () => void }) {
  const [detail, setDetail] = useState<FeedPost & { commentsTree: CommentNode[] } | null>(null);
  const [comment, setComment] = useState("");
  const load = async () => {
    const response = await apiFetch<{ data: FeedPost & { commentsTree: CommentNode[] } }>(`/social/posts/${post.id}`);
    setDetail(response.data);
  };
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 1800);
    return () => window.clearInterval(timer);
  }, [post.id]);
  const addComment = async () => {
    if (!comment.trim()) return;
    await apiFetch(`/social/posts/${post.id}/comments`, { method: "POST", body: JSON.stringify({ body: comment.trim() }) });
    setComment(""); void load();
  };
  return <div className="se-drawer-backdrop" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
    <aside className="se-drawer">
      <header><div><small>POST DETAIL</small><h2>Conversation</h2></div><ButtonIcon onClick={onClose} label="Close"><X size={18} /></ButtonIcon></header>
      <div className="se-drawer-scroll">
        <article className="se-detail-post"><div className="se-author"><Avatar user={post.author} size="sm" /><span><strong>{post.author.name}</strong><small>@{post.author.username} · {timeAgo(post.createdAt)}</small></span></div><p>{post.text}</p>{post.project && <button className="se-project-card"><span><strong>{post.project.name}</strong><small>{post.project.stage}</small></span><ChevronRight size={15} /></button>}<div className="se-post-stats"><span>{detail?.likes ?? post.likes} likes</span><span>{detail?.comments ?? post.comments} comments</span><span>{detail?.reposts ?? post.reposts} nerddings</span><span className="se-score">{Math.round((detail?.score ?? post.score ?? 0) * 100)} signal</span></div><div className="se-actions"><button onClick={onQuote}><Quote size={16} /> Quote</button><button><Bookmark size={16} /> Save</button><button><Share2 size={16} /> Share</button></div></article>
        <div className="se-comment-compose"><Avatar user={getSavedUser()} size="xs" /><input value={comment} onChange={(event) => setComment(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void addComment()} placeholder="Write a thoughtful comment…" /><button disabled={!comment.trim()} onClick={() => void addComment()}><Send size={15} /></button></div>
        <div className="se-comments">{detail?.commentsTree?.length ? detail.commentsTree.map((node) => <CommentNode key={node.id} postId={post.id} node={node} onReload={() => void load()} />) : <div className="se-empty-comments"><MessageCircle size={18} /><span>No comments yet.</span></div>}</div>
      </div>
    </aside>
  </div>;
}

function HomeEnhanced() {
  const [mode, setMode] = useState<"for-you" | "network">("for-you");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FeedPost | null>(null);
  const [composer, setComposer] = useState(false);
  const [quote, setQuote] = useState<FeedPost | null>(null);
  const load = async () => {
    setLoading(true);
    try {
      const response = await apiFetch<{ data: FeedPost[] }>(`/social/feed?mode=${mode}`);
      setPosts(response.data ?? []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, [mode]);
  const changed = (id: string, patch: Partial<FeedPost>) => setPosts((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  return <div className="se-home">
    <div className="se-tabs"><button className={mode === "for-you" ? "active" : ""} onClick={() => setMode("for-you")}>For You</button><button className={mode === "network" ? "active" : ""} onClick={() => setMode("network")}>Your network</button></div>
    <button className="se-mini-composer" onClick={() => setComposer(true)}><Avatar user={getSavedUser()} size="sm" /><span>Share what you’re building…</span><Plus size={18} /></button>
    <div className="se-layout"><main>{loading ? <div className="se-loading"><Loader2 className="se-spin" size={20} /></div> : posts.length ? posts.map((post) => <FeedPostCard key={post.id} post={post} onOpen={setSelected} onChanged={changed} />) : <MiniCard className="se-empty"><Rocket size={22} /><strong>No posts yet</strong><span>Publish an update or follow builders to shape your network.</span></MiniCard>}</main><aside className="se-rail"><MiniCard><div className="se-card-head"><strong>Discover</strong><button onClick={() => { window.history.pushState({}, "", "/explore"); window.dispatchEvent(new PopStateEvent("popstate")); }}>Explore <ArrowUpRight size={13} /></button></div><p>Fresh work ranked by freshness, useful discussion, proof of work and trust.</p></MiniCard><MiniCard><div className="se-card-head"><strong>Rising builders</strong><button onClick={() => { window.history.pushState({}, "", "/charts"); window.dispatchEvent(new PopStateEvent("popstate")); }}>Charts <ArrowUpRight size={13} /></button></div><p>Top charts are calculated from real activity rather than seeded values.</p></MiniCard></aside></div>
    {composer && <Composer onClose={() => setComposer(false)} onPosted={() => void load()} />}
    {quote && <Composer initialQuote={quote} onClose={() => setQuote(null)} onPosted={() => { setQuote(null); void load(); }} />}
    {selected && <PostDrawer post={selected} onClose={() => setSelected(null)} onQuote={() => { setSelected(null); setQuote(selected); }} />}
  </div>;
}

function ProfileEnhanced({ username }: { username: string }) {
  const [data, setData] = useState<any>(null);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const load = async () => {
    try {
      const response = await apiFetch<any>(`/social/users/${encodeURIComponent(username)}/profile`);
      setData(response.data); setFollowing(Boolean(response.data.isFollowing));
    } catch { setData({ error: true }); }
  };
  useEffect(() => { void load(); }, [username]);
  if (!data) return <div className="se-loading"><Loader2 className="se-spin" size={20} /></div>;
  if (data.error) return <MiniCard className="se-empty"><strong>Profile not found</strong><span>Check the username and try again.</span></MiniCard>;
  const user: UserRef = { id: data.user.id, name: data.user.name, username: data.user.username, avatarUrl: data.user.avatar_url ?? data.user.avatarUrl, bio: data.user.bio, location: data.user.location, accountType: data.user.account_type };
  const toggleFollow = async () => {
    const result = await apiFetch<{ data: { active: boolean } }>(`/users/${user.id}/follow`, { method: "POST" });
    setFollowing(result.data.active);
    await load();
  };
  return <div className="se-profile">
    <div className="se-profile-cover" />
    <div className="se-profile-head"><Avatar user={user} size="lg" /><div className="se-profile-copy"><div className="se-profile-title"><div><h1>{user.name}</h1><p>@{user.username} · {user.accountType === "agent" ? "Agent / organization" : "Builder"}{user.location ? ` · ${user.location}` : ""}</p></div><button className={following ? "se-outline" : "se-primary"} onClick={() => void toggleFollow()}>{following ? <><Check size={14} /> Following</> : <><Plus size={14} /> Follow</>}</button></div><p>{user.bio || "Building in public on Nerddings."}</p><div className="se-mutuals">{data.mutualFollowers?.length ? <><Users size={13} /> Followed by {data.mutualFollowers.slice(0, 3).map((item: any) => item.name).join(", ")}</> : <span />}</div></div></div>
    <div className="se-stats"><button onClick={() => setFollowersOpen(true)}><strong>{data.stats.followers}</strong> Followers</button><button onClick={() => setFollowingOpen(true)}><strong>{data.stats.following}</strong> Following</button><span><strong>{data.stats.projects}</strong> Projects</span><span><strong>{data.stats.posts}</strong> Posts</span></div>
    <MiniCard><div className="se-card-head"><strong>Projects</strong>{user.username === getSavedUser()?.username && <button onClick={() => { window.history.pushState({}, "", "/project/new"); window.dispatchEvent(new PopStateEvent("popstate")); }}>Create project <Plus size={13} /></button>}</div><div className="se-project-grid">{data.projects?.length ? data.projects.map((project: ProjectRef) => <button className="se-project-tile" key={project.id} onClick={() => { window.history.pushState({}, "", `/project/${project.slug}`); window.dispatchEvent(new PopStateEvent("popstate")); }}><span>{project.stage}</span><h3>{project.name}</h3><p>{project.description}</p>{project.github_url && <small><Github size={12} /> GitHub linked</small>}</button>) : <div className="se-empty-inline">No projects yet.</div>}</div></MiniCard>
    {(followersOpen || followingOpen) && <div className="se-modal-backdrop"><div className="se-list-modal"><header><strong>{followersOpen ? "Followers" : "Following"}</strong><ButtonIcon onClick={() => { setFollowersOpen(false); setFollowingOpen(false); }} label="Close"><X size={18} /></ButtonIcon></header>{(followersOpen ? data.followers : data.following).map((person: any) => <button key={person.id} className="se-person-row" onClick={() => { setFollowersOpen(false); setFollowingOpen(false); window.history.pushState({}, "", `/profile/${person.username}`); window.dispatchEvent(new PopStateEvent("popstate")); }}><Avatar user={{ id: person.id, name: person.name, username: person.username, avatarUrl: person.avatar_url }} size="sm" /><span><strong>{person.name}</strong><small>@{person.username}</small></span><ChevronRight size={14} /></button>)}{!(followersOpen ? data.followers : data.following)?.length && <div className="se-empty-inline">Nothing here yet.</div>}</div></div>}
  </div>;
}

function NotificationsEnhanced() {
  const [items, setItems] = useState<any[]>([]);
  const load = async () => { const response = await apiFetch<{ data: any[] }>("/notifications"); setItems(response.data ?? []); };
  useEffect(() => { void load(); }, []);
  const unread = items.filter((item) => !item.readAt).length;
  return <div className="se-simple-page"><div className="se-page-head"><div><small>KEEP IN THE LOOP</small><h1>Notifications</h1></div><button className="se-outline" onClick={async () => { await apiFetch("/notifications/read-all", { method: "POST" }); await load(); }}>Mark all as read <Check size={14} /></button></div><MiniCard><div className="se-card-head"><strong>All activity</strong><span>{unread} unread</span></div>{items.length ? items.map((item) => <button key={item.id} className={`se-notification ${!item.readAt ? "unread" : ""}`} onClick={async () => { await apiFetch(`/notifications/${item.id}/read`, { method: "POST" }); if (item.actor?.username) { window.history.pushState({}, "", `/profile/${item.actor.username}`); window.dispatchEvent(new PopStateEvent("popstate")); } }}><Avatar user={item.actor} size="sm" /><span><strong>{item.actor?.name ?? "Nerddings"}</strong> {item.text}<small>{timeAgo(item.createdAt)}</small></span>{!item.readAt && <i />}</button>) : <div className="se-empty-inline">No notifications yet.</div>}</MiniCard></div>;
}

function ExploreEnhanced() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { apiFetch<any>("/social/explore/live").then((response) => setData(response.data)).catch(() => setData({ stories: [], topics: [] })); }, []);
  return <div className="se-simple-page"><div className="se-page-head"><div><small>DISCOVER THE WORK</small><h1>What’s <i>moving.</i></h1><p>Ranked from live activity, freshness, replies, saves and project momentum.</p></div></div><div className="se-explore-grid"><main>{data?.stories?.length ? data.stories.map((post: FeedPost) => <FeedPostCard key={post.id} post={post} onOpen={() => {}} onChanged={() => {}} />) : <MiniCard className="se-empty">No live stories yet.</MiniCard>}</main><MiniCard><div className="se-card-head"><strong>Topics gaining velocity</strong></div>{data?.topics?.map((topic: any, index: number) => <div className="se-topic" key={topic.topic}><b>0{index + 1}</b><span><strong>{topic.topic}</strong><small>{topic.posts} posts · {topic.engagement} interactions</small></span></div>)}</MiniCard></div></div>;
}

function ChartsEnhanced() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { apiFetch<any>("/social/charts/live").then((response) => setData(response.data)).catch(() => setData({ risingBuilders: [], topProjects: [] })); }, []);
  return <div className="se-simple-page"><div className="se-page-head"><div><small>SIGNALS OVER STATUS</small><h1>Top <i>charts.</i></h1><p>Calculated from work, meaningful engagement, consistency, collaboration and freshness.</p></div></div><MiniCard>{data?.risingBuilders?.length ? data.risingBuilders.map((builder: any, index: number) => <button className="se-chart-row" key={builder.id} onClick={() => { window.history.pushState({}, "", `/profile/${builder.username}`); window.dispatchEvent(new PopStateEvent("popstate")); }}><b>{String(index + 1).padStart(2, "0")}</b><Avatar user={{ id: builder.id, name: builder.name, username: builder.username, avatarUrl: builder.avatar_url }} size="sm" /><span><strong>{builder.name}</strong><small>@{builder.username} · {builder.accountType === "agent" ? "Agent" : "Builder"}</small></span><em>{Math.round(builder.trust_score ?? 0)} trust · {builder.posts} posts</em><ChevronRight size={14} /></button>) : <div className="se-empty-inline">No chart entries yet.</div>}</MiniCard><MiniCard><div className="se-card-head"><strong>Most saved projects</strong></div>{data?.topProjects?.map((project: any, index: number) => <button className="se-chart-row" key={project.id} onClick={() => { window.history.pushState({}, "", `/project/${project.slug}`); window.dispatchEvent(new PopStateEvent("popstate")); }}><b>{String(index + 1).padStart(2, "0")}</b><span><strong>{project.name}</strong><small>{project.stage}</small></span><em>{project.saves} saves · {project.reposts} nerddings</em><ChevronRight size={14} /></button>)}</MiniCard></div>;
}

function ProjectCreateEnhanced() {
  const [agents, setAgents] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState("Idea");
  const [agentId, setAgentId] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { apiFetch<any>("/social/agents").then((response) => setAgents(response.data ?? [])).catch(() => setAgents([])); }, []);
  const submit = async () => {
    if (!name.trim() || !description.trim() || busy) return;
    setBusy(true);
    try {
      const response = await apiFetch<any>("/social/projects", { method: "POST", body: JSON.stringify({ name, description, stage, agentId: agentId || null, githubUrl: githubUrl || null }) });
      window.history.pushState({}, "", `/project/${response.data.slug}`); window.dispatchEvent(new PopStateEvent("popstate"));
    } finally { setBusy(false); }
  };
  return <div className="se-simple-page"><div className="se-page-head"><div><small>YOUR WORK</small><h1>Create project</h1><p>Connect an Agent, GitHub and contributors without changing the rest of Nerddings.</p></div></div><MiniCard className="se-form"><label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Project name" /></label><label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What are you building?" /></label><label>Stage<select value={stage} onChange={(event) => setStage(event.target.value)}><option>Idea</option><option>Prototype</option><option>Building</option><option>Beta</option><option>Launched</option><option>Fundraising</option></select></label><label>Agent / organization<select value={agentId} onChange={(event) => setAgentId(event.target.value)}><option value="">No Agent</option>{agents.map((agent: any) => <option key={agent.id} value={agent.id}>{agent.name}{agent.verified ? " ✓" : ""}</option>)}</select></label><label>GitHub URL<input value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} placeholder="https://github.com/owner/repository" /></label><button className="se-primary" disabled={busy || !name.trim() || !description.trim()} onClick={() => void submit()}>{busy ? "Creating…" : "Create project"} <ArrowRight size={15} /></button></MiniCard></div>;
}

function ProjectEnhanced({ slug }: { slug: string }) {
  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [commits, setCommits] = useState<any[]>([]);
  const [candidate, setCandidate] = useState("");
  const [suggestions, setSuggestions] = useState<MentionRef[]>([]);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    try {
      const [projectResponse, membersResponse, commitResponse] = await Promise.all([
        apiFetch<any>(`/projects/${encodeURIComponent(slug)}`),
        apiFetch<any>(`/social/projects/${encodeURIComponent(slug)}/members`),
        apiFetch<any>(`/social/projects/${encodeURIComponent(slug)}/github-commits`),
      ]);
      setProject(projectResponse.data); setMembers(membersResponse.data ?? []); setCommits(commitResponse.data ?? []);
    } catch { setProject({ error: true }); }
  };
  useEffect(() => { void load(); }, [slug]);
  useEffect(() => {
    if (!candidate) { setSuggestions([]); return; }
    const timer = window.setTimeout(() => apiFetch<{ data: MentionRef[] }>(`/social/mentions?q=${encodeURIComponent(candidate)}`).then((response) => setSuggestions(response.data.filter((item) => item.kind === "user"))).catch(() => setSuggestions([])), 120);
    return () => window.clearTimeout(timer);
  }, [candidate]);
  if (!project) return <div className="se-loading"><Loader2 className="se-spin" size={20} /></div>;
  if (project.error) return <MiniCard className="se-empty"><strong>Project not found</strong><span>Check the project URL.</span></MiniCard>;
  const viewer = getSavedUser();
  const invite = async (person: MentionRef) => {
    if (busy) return;
    setBusy(true);
    try { await apiFetch(`/social/projects/${encodeURIComponent(slug)}/invitations`, { method: "POST", body: JSON.stringify({ userId: person.id }) }); setCandidate(""); setSuggestions([]); await load(); } finally { setBusy(false); }
  };
  const isOwner = String(project.owner?.id) === String(viewer?.id);
  return <div className="se-simple-page"><div className="se-project-hero"><div><small>PROJECT · {String(project.stage ?? "").toUpperCase()}</small><h1>{project.name}</h1><p>{project.description}</p><div className="se-pills"><span>Owner @{project.owner?.username}</span>{project.agent && <span>Agent {project.agent.name}</span>}</div></div>{isOwner && <button className="se-outline">Manage project</button>}</div><div className="se-project-columns"><main><MiniCard><div className="se-card-head"><strong>Contributors</strong><span>{members.length}</span></div>{members.map((member: any) => <button className="se-person-row" key={member.user_id} onClick={() => { window.history.pushState({}, "", `/profile/${member.username}`); window.dispatchEvent(new PopStateEvent("popstate")); }}><Avatar user={{ id: member.user_id, name: member.name, username: member.username, avatarUrl: member.avatar_url }} size="sm" /><span><strong>{member.name}</strong><small>@{member.username}</small></span><span className="se-contributor">Contributor</span></button>)}{!members.length && <div className="se-empty-inline">No contributors yet.</div>}</MiniCard>{isOwner && <MiniCard><div className="se-card-head"><strong>Invite contributor</strong></div><div className="se-invite"><Search size={14} /><input value={candidate} onChange={(event) => setCandidate(event.target.value)} placeholder="Type a username" />{suggestions.length > 0 && <div className="se-mentions">{suggestions.map((person) => <button key={person.id} onClick={() => void invite(person)}><Avatar user={person} size="xs" /><span><strong>{person.name}</strong><small>@{person.username}</small></span><Plus size={13} /></button>)}</div>}</div></MiniCard>}</main><aside><MiniCard>{project.githubUrl ? <a className="se-github" href={project.githubUrl} target="_blank" rel="noreferrer"><Github size={18} /><span><strong>GitHub repository</strong><small>Recent commits</small></span><ArrowUpRight size={15} /></a> : <p>No GitHub repository connected.</p>}<div className="se-card-head"><strong>Recent commits</strong><span>{commits.length}</span></div>{commits.map((commit: any) => <a className="se-commit" key={commit.sha} href={commit.url} target="_blank" rel="noreferrer"><span /><div><strong>{commit.message}</strong><small>{commit.author} · {commit.date ? new Date(commit.date).toLocaleDateString() : ""}</small></div></a>)}</MiniCard></aside></div></div>;
}

function AgentEnhanced({ slug }: { slug: string }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => { apiFetch<any>(`/agents/${slug}`).then((response) => setData(response.data)).catch(() => setData({ error: true })); }, [slug]);
  if (!data) return <div className="se-loading"><Loader2 className="se-spin" size={20} /></div>;
  if (data.error) return <MiniCard className="se-empty"><strong>Agent not found</strong></MiniCard>;
  return <div className="se-simple-page"><div className="se-profile-cover" /><div className="se-agent-head"><div className="se-agent-mark"><Rocket size={22} /></div><div><small>AGENT · {data.agent.type}</small><h1>{data.agent.name}</h1><p>{data.agent.domain ?? "Organization"}</p></div></div><div className="se-stats"><span><strong>{data.projects?.length ?? 0}</strong> Projects</span><span><strong>{data.followers ?? 0}</strong> Followers</span><span><strong>{data.posts ?? 0}</strong> Posts</span></div><MiniCard><div className="se-card-head"><strong>Projects</strong></div>{data.projects?.map((project: any) => <button key={project.id} className="se-chart-row" onClick={() => { window.history.pushState({}, "", `/project/${project.slug}`); window.dispatchEvent(new PopStateEvent("popstate")); }}><Rocket size={16} /><span><strong>{project.name}</strong><small>{project.stage}</small></span><ChevronRight size={14} /></button>)}</MiniCard></div>;
}

export default function SocialEnhancer() {
  const [path, setPath] = useState(() => (typeof window === "undefined" ? "/" : window.location.pathname));
  const [mounted, setMounted] = useState(false);
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const sync = () => setPath(window.location.pathname);
    window.addEventListener("popstate", sync);
    sync();
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    const host = document.querySelector<HTMLElement>(".page-content");
    if (!host) return;
    let mount = host.querySelector<HTMLElement>(":scope > .social-enhancer-root");
    if (!mount) { mount = document.createElement("div"); mount.className = "social-enhancer-root"; host.appendChild(mount); }
    setRoot(mount);
    return () => { mount?.remove(); };
  }, []);

  const isTarget = useMemo(() => {
    return path === "/home" || path.startsWith("/explore") || path.startsWith("/charts") || path.startsWith("/notifications") || path.startsWith("/profile/") || path === "/profile" || path === "/project/new" || path.startsWith("/project/") || path.startsWith("/agent/");
  }, [path]);

  useEffect(() => {
    const host = document.querySelector<HTMLElement>(".page-content");
    if (!host) return;
    const active = isTarget && Boolean(getAuthToken());
    host.classList.toggle("social-enhancer-host", active);
    document.documentElement.classList.toggle("nerddings-hide-live-account", true);
    const status = document.querySelector<HTMLElement>(".status-chip");
    if (status) status.style.display = "none";
    const refreshCounts = async () => {
      if (!getAuthToken()) return;
      const [notificationsResult, messagesResult] = await Promise.allSettled([
        apiFetch<any>("/notifications"),
        apiFetch<any>("/social/messages/unread-count"),
      ]);
      const notificationsUnread = notificationsResult.status === "fulfilled" ? Number(notificationsResult.value.unreadCount ?? 0) : 0;
      const messagesUnread = messagesResult.status === "fulfilled" ? Number(messagesResult.value.data?.unreadCount ?? 0) + Number(messagesResult.value.data?.pendingRequests ?? 0) : 0;
      for (const button of Array.from(document.querySelectorAll<HTMLElement>(".nav-item"))) {
        const label = button.querySelector("span")?.textContent?.trim();
        const value = label === "Notifications" ? notificationsUnread : label === "Messages" ? messagesUnread : null;
        if (value == null) continue;
        let badge = button.querySelector<HTMLElement>("b");
        if (!badge) { badge = document.createElement("b"); button.appendChild(badge); }
        badge.textContent = value > 99 ? "99+" : String(value);
        badge.style.display = value > 0 ? "inline-flex" : "none";
      }
    };
    void refreshCounts();
    const timer = window.setInterval(() => void refreshCounts(), 10000);
    return () => window.clearInterval(timer);
  }, [isTarget]);

  if (!mounted || !root || !isTarget || !getAuthToken()) return null;
  const username = path.startsWith("/profile/") ? decodeURIComponent(path.split("/")[2] ?? "") : getSavedUser()?.username ?? "";
  let content: React.ReactNode = <HomeEnhanced />;
  if (path.startsWith("/explore")) content = <ExploreEnhanced />;
  else if (path.startsWith("/charts")) content = <ChartsEnhanced />;
  else if (path.startsWith("/notifications")) content = <NotificationsEnhanced />;
  else if (path === "/profile" || path.startsWith("/profile/")) content = <ProfileEnhanced username={username} />;
  else if (path === "/project/new") content = <ProjectCreateEnhanced />;
  else if (path.startsWith("/project/")) content = <ProjectEnhanced slug={decodeURIComponent(path.split("/")[2] ?? "")} />;
  else if (path.startsWith("/agent/")) content = <AgentEnhanced slug={decodeURIComponent(path.split("/")[2] ?? "")} />;
  return createPortal(<div className="social-enhancer-content">{content}</div>, root);
}
