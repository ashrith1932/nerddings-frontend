"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, 
  Bookmark, 
  Eye, 
  Heart, 
  Loader2, 
  MessageCircle, 
  MoreHorizontal, 
  Plus, 
  Send, 
  X 
} from "lucide-react";
import { apiFetch, getSavedUser } from "@/lib/api";
import ThreadedCommentTree, {
  type ThreadComment,
} from "@/components/social/ThreadedCommentTree";

type UserRef = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  accountType?: string;
};
type Media = { publicUrl: string | null; mimeType: string };
type QuotePost = {
  id: string;
  author: UserRef;
  text: string;
  createdAt: string;
  linkUrl?: string | null;
  media?: Media[];
  likes?: number;
  comments?: number;
  reposts?: number;
  saves?: number;
  views?: number;
  project?: {
    id: string;
    name: string;
    slug: string;
    stage: string;
    description: string;
    githubUrl?: string | null;
  } | null;
};
type FeedPost = {
  id: string;
  authorId: string;
  author: UserRef;
  text: string;
  createdAt: string;
  likes: number;
  comments: number;
  reposts: number;
  saves: number;
  views?: number;
  liked?: boolean;
  saved?: boolean;
  reposted?: boolean;
  following?: boolean;
  linkUrl?: string | null;
  media?: Media[];
  project?: {
    id: string;
    name: string;
    slug: string;
    stage: string;
    description: string;
    githubUrl?: string | null;
  } | null;
  quotePostId?: string | null;
  quotePost?: QuotePost | null;
};
type PostDetail = FeedPost & { commentsTree: ThreadComment[] };

const activePanelStyles = `
.home-live-grid { display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(280px, 350px) !important; gap: 24px !important; align-items: start !important; }
.home-info-rail { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.home-info-card { padding: 16px; border: 1px solid var(--line, #ddd6cc); border-radius: 12px; background: var(--card, #fff); }
.home-info-card h3 { margin: 0 0 5px; font: 700 14px 'Space Grotesk', sans-serif; }
.home-info-card p { margin: 0; color: #8a8178; font-size: 11px; line-height: 1.45; }
.home-info-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 11px; font: 700 14px 'Space Grotesk', sans-serif; }
.home-info-heading button { color: var(--accent, #e4572e); font-size: 10px; font-weight: 700; }
.home-info-list { display: grid; gap: 9px; }
.home-info-list > div { display: flex; align-items: center; gap: 9px; padding-top: 9px; border-top: 1px solid #eee8e1; color: #756c64; font-size: 11px; }
.home-info-list > div:first-child { padding-top: 0; border-top: 0; }
.home-info-list strong { display: block; color: var(--ink, #201c19); font-size: 11px; }
.home-info-list small { display: block; margin-top: 2px; color: #9b9188; font-size: 9px; }
.nerdd-quote { border: 1px solid #d9d2c9; background: #faf7f2; border-radius: 11px; padding: 11px; margin: 0 0 10px; cursor: pointer; }
.nerdd-quote-label { font-size: 8px; font-weight: 800; letter-spacing: .13em; color: #9a9087; margin-bottom: 8px; }
.nerdd-quote-head { display: flex; align-items: center; gap: 8px; }
.nerdd-quote-head > span:last-child { display: flex; flex-direction: column; }
.nerdd-quote-head strong { font-size: 10px; }
.nerdd-quote-head small { font-size: 8px; color: #938980; margin-top: 2px; }
.nerdd-quote-avatar { width: 29px; height: 29px; border-radius: 50%; overflow: hidden; display: grid; place-items: center; background: #e9e3db; font-size: 8px; font-weight: 800; }
.nerdd-quote-avatar img { width: 100%; height: 100%; object-fit: cover; }
.nerdd-quote-text { font-size: 11px; line-height: 1.5; white-space: pre-wrap; margin-top: 8px; color: #332e29; }
.nerdd-quote-media { margin-top: 8px; border-radius: 8px; overflow: hidden; }
.nerdd-quote-media img, .nerdd-quote-media video { display: block; width: 100%; height: 170px; object-fit: cover; background: #eee9e2; }
.home-live-root { min-height: 100%; position: relative; z-index: 30; }
.home-live-shell { max-width: 1120px; margin: 0 auto; padding: 4px 0 40px; }
.home-live-tabs { display: flex; gap: 24px; border-bottom: 1px solid var(--line, #ded7ce); margin-bottom: 14px; }
.home-live-tabs button { border: 0; background: none; color: #81786f; font-weight: 650; font-size: 13px; padding: 12px 0 11px; position: relative; cursor: pointer; }
.home-live-tabs button.active { color: var(--ink, #201c19); }
.home-live-tabs button.active:after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 3px; border-radius: 8px; background: var(--ink, #201c19); }
.home-feed-column { min-width: 0; max-height: calc(100dvh - 170px); overflow-y: auto; overscroll-behavior: contain; padding-right: 4px; scrollbar-gutter: stable; }
.home-composer { width: 100%; height: 58px; border: 1px solid var(--line, #ddd6cc); background: var(--card, #fff); border-radius: 12px; padding: 0 14px; display: flex; align-items: center; gap: 10px; color: #8a8178; cursor: pointer; margin-bottom: 12px; }
.home-composer > span:nth-child(2) { flex: 1; text-align: left; font-size: 13px; }
.home-avatar { display: inline-grid; place-items: center; flex: 0 0 auto; overflow: hidden; border-radius: 50%; background: #e9e3db; color: #2b2622; font-weight: 800; }
.home-avatar img { width: 100%; height: 100%; object-fit: cover; }
.home-avatar-xs { width: 27px; height: 27px; font-size: 9px; }
.home-avatar-sm { width: 36px; height: 36px; font-size: 10px; }
.home-avatar-md { width: 42px; height: 42px; font-size: 12px; }
.home-post { background: var(--card, #fff); border: 1px solid var(--line, #ddd6cc); border-radius: 12px; padding: 15px 16px 8px; margin-bottom: 11px; transition: box-shadow .16s ease, border-color .16s ease; cursor: pointer; }
.home-post:hover { border-color: #c6bdb3; box-shadow: 0 8px 22px rgba(31, 27, 24, .06); }
.home-post-selected { border-color: #b9afa5; box-shadow: 0 8px 22px rgba(31, 27, 24, .08); }
.home-post-head { display: flex; justify-content: space-between; align-items: center; }
.home-author { display: flex; align-items: center; gap: 9px; border: 0; background: none; padding: 0; text-align: left; cursor: pointer; color: inherit; }
.home-author > span { display: flex; flex-direction: column; }
.home-author strong { font-size: 12px; }
.home-author small { font-size: 10px; color: #938980; margin-top: 2px; }
.home-more { width: 30px; height: 30px; border: 0; background: none; color: #948a81; display: grid; place-items: center; border-radius: 8px; cursor: pointer; }
.home-post-copy { font-size: 14px; line-height: 1.62; white-space: pre-wrap; margin: 13px 0; }
.home-media { display: grid; gap: 5px; overflow: hidden; border-radius: 10px; margin-bottom: 9px; }
.home-media-2, .home-media-3, .home-media-4 { grid-template-columns: repeat(2, 1fr); }
.home-media img, .home-media video { width: 100%; height: 220px; object-fit: cover; background: #eee9e2; }
.home-media-1 img, .home-media-1 video { height: 330px; }
.home-project, .home-link { width: 100%; border: 1px solid var(--line, #ddd6cc); background: #faf7f2; border-radius: 9px; padding: 10px; text-align: left; display: flex; color: inherit; text-decoration: none; }
.home-project { cursor: pointer; }
.home-project span { display: flex; flex-direction: column; min-width: 0; }
.home-project strong { font-size: 11px; }
.home-project small { font-size: 10px; color: #8e847a; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.home-link { margin-top: 7px; color: #6d645c; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.home-actions { border-top: 1px solid #eee8e1; padding-top: 6px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.home-actions-left, .home-actions-right { display: flex; align-items: center; gap: 6px; min-width: 0; }
.home-actions-right { margin-left: auto; }
.home-actions-right { padding-left: 18px; }
.home-actions button { border: 0; background: none; color: #7d736b; display: flex; align-items: center; gap: 5px; padding: 6px 4px; cursor: pointer; font-size: 10px; border-radius: 7px; white-space: nowrap; }
.home-actions button.active { color: var(--accent, #d85a2d); }
.home-feed-loading, .home-empty { min-height: 220px; display: grid; place-items: center; text-align: center; color: #8d8379; border: 1px solid var(--line); border-radius: 12px; background: var(--card); }
.home-empty { gap: 7px; padding: 55px 20px; }
.home-empty strong { color: var(--ink); }
.home-feed-column { max-height: calc(100dvh - 170px); overflow-y: auto; overscroll-behavior: contain; padding-right: 4px; scrollbar-gutter: stable; }
.home-views { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; color: #7d736b; font-size: 10px; }
.home-active-post { min-width: 0; max-height: min(70vh, 760px); overflow: hidden; border: 1px solid var(--line, #ddd6cc); border-radius: 12px; background: var(--card, #fff); box-shadow: 0 5px 18px rgba(31,27,24,.05); animation: home-panel-in .3s ease-out; }
.home-active-post .home-modal { width: 100%; max-height: min(70vh, 760px); border: 0; border-radius: 0; box-shadow: none; overflow: hidden; }
.home-active-post .home-modal-scroll { max-height: calc(min(70vh, 760px) - 60px); overflow-y: auto; overscroll-behavior: contain; }
.home-modal-head { position: sticky; top: 0; z-index: 2; background: var(--card, #fff); }
.home-modal-head button { border: 1px solid var(--line, #ddd6cc) !important; border-radius: 50% !important; }
.home-composer .home-avatar-sm { width: 32px; height: 32px; flex-basis: 32px; font-size: 9px; }
@keyframes home-panel-in { from { opacity: 0; transform: translateX(18px); } to { opacity: 1; transform: translateX(0); } }
@media (max-width: 920px) { .home-live-grid { grid-template-columns: minmax(0, 1fr) !important; } .home-info-rail { display: none; } }
@media (max-width: 600px) { .home-live-grid { display: block !important; } .home-feed-column { max-height: none; overflow: visible; padding-right: 0; } .home-active-post { margin-top: 16px; max-height: none; } .home-active-post .home-modal { max-height: none; } .home-active-post .home-modal-scroll { max-height: none; } }
.home-modal-backdrop{position:fixed;inset:0;z-index:2000;background:rgba(20,16,12,.36);display:flex;align-items:flex-start;justify-content:center;padding:70px 14px 14px}.home-modal{width:min(680px,100%);max-height:calc(100vh - 84px);background:var(--card,#fff);border:1px solid var(--line,#ddd6cc);border-radius:14px;box-shadow:0 30px 90px rgba(0,0,0,.24);overflow:hidden;display:flex;flex-direction:column}.home-modal-head{height:60px;flex:0 0 60px;border-bottom:1px solid var(--line,#ddd6cc);display:flex;align-items:center;justify-content:space-between;padding:0 15px}.home-modal-head span{font-size:8px;letter-spacing:.14em;color:#978d84;font-weight:800}.home-modal-head h2{font-size:17px;margin:3px 0 0}.home-modal-head button{width:32px;height:32px;border:0;background:none;color:#8e847a;border-radius:8px;display:grid;place-items:center;cursor:pointer}.home-modal-scroll{overflow:auto;padding:14px}.home-modal-content{border:1px solid var(--line);border-radius:10px;padding:12px}.home-modal-text{font-size:13px;line-height:1.6;white-space:pre-wrap;margin:13px 0}.home-modal-media{display:grid;gap:5px;border-radius:9px;overflow:hidden}.home-modal-media img,.home-modal-media video{width:100%;max-height:420px;object-fit:contain;background:#eee9e2}.home-modal-stats{display:flex;gap:12px;color:#8b8178;font-size:9px;padding-top:9px;margin-top:9px;border-top:1px solid #eee8e1}.home-comment-compose{display:flex;align-items:center;gap:7px;border:1px solid var(--line);border-radius:9px;background:var(--card);padding:5px 6px;margin:11px 0}.home-comment-compose input{flex:1;border:0;outline:0;background:transparent;font-size:10px;min-width:0}.home-comment-compose button{width:28px;height:28px;border:0;border-radius:7px;background:var(--ink,#211d19);color:#fff;display:grid;place-items:center}.home-section-label{font-size:8px;letter-spacing:.14em;font-weight:800;color:#978d84;margin:12px 0 5px}.home-no-comments{display:flex;justify-content:center;align-items:center;gap:6px;padding:28px;color:#958b82;font-size:10px}.home-composer-backdrop{position:fixed;inset:0;z-index:2100;background:rgba(20,16,12,.32);display:flex;align-items:center;justify-content:center}.home-composer-modal{width:min(650px,calc(100vw - 18px));background:var(--card,#fff);border:1px solid var(--line);border-radius:13px;box-shadow:0 30px 90px rgba(0,0,0,.2);overflow:hidden}.home-composer-modal header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--line)}.home-composer-modal h2{font-size:18px;margin:3px 0 0}.home-composer-modal textarea{display:block;width:100%;min-height:190px;border:0;outline:0;resize:vertical;padding:0 16px 16px;background:transparent;font:inherit;font-size:14px;line-height:1.6}.home-composer-modal footer{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-top:1px solid var(--line);color:#958b82;font-size:9px}.home-composer-modal footer button{border:0;background:var(--ink,#211d19);color:#fff;border-radius:8px;padding:8px 12px;font-weight:800}
@media(max-width:600px){.home-live-tabs{gap:18px}.home-post{padding:13px 12px 7px}.home-post-copy{font-size:13px}.home-actions button span{display:none}.home-modal-backdrop{padding:62px 8px 8px}.home-modal{max-height:calc(100vh - 70px)}.nerdd-quote-media img,.nerdd-quote-media video{height:145px}}
`;

const styles = activePanelStyles;

const timeAgo = (value: string) => {
  const s = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000),
  );
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};
const initials = (name?: string) =>
  (name ?? "N")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
function Avatar({
  user,
  size = "sm",
}: {
  user?: UserRef | null;
  size?: "xs" | "sm" | "md";
}) {
  return (
    <span className={`home-avatar home-avatar-${size}`}>
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt="" />
      ) : (
        initials(user?.name)
      )}
    </span>
  );
}
function go(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

async function fetchDetail(id: string) {
  try {
    const r = await apiFetch<{ data: PostDetail }>(
      `/social/posts/${encodeURIComponent(id)}`,
    );
    return r.data;
  } catch {
    return null;
  }
}

function QuoteCard({
  quote,
  onOpen,
}: {
  quote: QuotePost;
  onOpen: () => void;
}) {
  return (
    <article
      className="nerdd-quote"
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
    >
      <div className="nerdd-quote-label">QUOTED POST</div>
      <div className="nerdd-quote-head">
        <span className="nerdd-quote-avatar">
          {quote.author.avatarUrl ? (
            <img src={quote.author.avatarUrl} alt="" />
          ) : (
            initials(quote.author.name)
          )}
        </span>
        <span>
          <strong>{quote.author.name}</strong>
          <small>
            @{quote.author.username} · {timeAgo(quote.createdAt)}
          </small>
        </span>
      </div>
      <div className="nerdd-quote-text">{quote.text}</div>
      {quote.media?.length ? (
        <div className="nerdd-quote-media">
          {quote.media
            .slice(0, 4)
            .map((m, i) =>
              m.publicUrl ? (
                m.mimeType.startsWith("video/") ? (
                  <video
                    key={i}
                    src={m.publicUrl}
                    controls
                    preload="metadata"
                  />
                ) : (
                  <img key={i} src={m.publicUrl} alt="" loading="lazy" />
                )
              ) : null,
            )}
        </div>
      ) : null}
    </article>
  );
}

function PostCard({
  post,
  selected,
  select,
  onChanged,
}: {
  post: FeedPost;
  selected: boolean;
  select: () => void;
  onChanged: (id: string, patch: Partial<FeedPost>) => void;
}) {
  const action = async (kind: "like" | "save" | "repost") => {
    try {
      const r = await apiFetch<{ data: { active: boolean } }>(
        `/posts/${post.id}/${kind}`,
        { method: "POST" },
      );
      const active = r.data.active;
      const d = active ? 1 : -1;
      if (kind === "like")
        onChanged(post.id, {
          liked: active,
          likes: Math.max(0, post.likes + d),
        });
      if (kind === "save")
        onChanged(post.id, {
          saved: active,
          saves: Math.max(0, post.saves + d),
        });
      if (kind === "repost")
        onChanged(post.id, {
          reposted: active,
          reposts: Math.max(0, post.reposts + d),
        });
    } catch {}
  };
  return (
    <article
      className={`home-post ${selected ? "home-post-selected" : ""}`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button,a,input,.nerdd-quote"))
          return;
        select();
      }}
    >
      <div className="home-post-head">
        <button
          className="home-author"
          onClick={(e) => {
            e.stopPropagation();
            go(`/profile/${encodeURIComponent(post.author.username)}`);
          }}
        >
          <Avatar user={post.author} size="md" />
          <span>
            <strong>{post.author.name}</strong>
            <small>
              @{post.author.username} · {timeAgo(post.createdAt)}
            </small>
          </span>
        </button>
        <button
          className="home-more"
          onClick={(e) => e.stopPropagation()}
          aria-label="Post options"
        >
          <MoreHorizontal size={17} />
        </button>
      </div>
      <div
        className="home-post-copy"
        onClick={(e) => {
          e.stopPropagation();
          select();
        }}
      >
        {post.text}
      </div>
      {post.quotePost ? (
        <QuoteCard quote={post.quotePost} onOpen={select} />
      ) : null}
      {post.media?.length ? (
        <div
          className={`home-media home-media-${Math.min(post.media.length, 4)}`}
        >
          {post.media
            .slice(0, 4)
            .map((m, i) =>
              m.publicUrl ? (
                m.mimeType.startsWith("video/") ? (
                  <video
                    key={`${m.publicUrl}-${i}`}
                    src={m.publicUrl}
                    controls
                    preload="metadata"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <img
                    key={`${m.publicUrl}-${i}`}
                    src={m.publicUrl}
                    alt=""
                    loading="lazy"
                    onClick={(e) => e.stopPropagation()}
                  />
                )
              ) : null,
            )}
        </div>
      ) : null}
      {post.project ? (
        <button
          className="home-project"
          onClick={(e) => {
            e.stopPropagation();
            go(`/project/${encodeURIComponent(post.project!.slug)}`);
          }}
        >
          <span>
            <strong>{post.project.name}</strong>
            <small>
              {post.project.stage} · {post.project.description}
            </small>
          </span>
        </button>
      ) : null}
      {post.linkUrl ? (
        <a
          className="home-link"
          href={post.linkUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {post.linkUrl.replace(/^https?:\/\//, "")}
        </a>
      ) : null}
      <div className="home-actions">
        <div className="home-actions-left">
        <button
          className={post.liked ? "active" : ""}
          onClick={(e) => {
            e.stopPropagation();
            void action("like");
          }}
        >
          <Heart size={16} fill={post.liked ? "currentColor" : "none"} />
          <span>{post.likes}</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            select();
          }}
        >
          <MessageCircle size={16} />
          <span>{post.comments}</span>
        </button>
        <button
          className={post.reposted ? "active" : ""}
          data-action="amplify"
          onClick={(e) => {
            e.stopPropagation();
            void action("repost");
          }}
        >
          <Activity size={16} />
          <span>{post.reposts}</span>
        </button>
        </div>
        <div className="home-actions-right">
          <span className="home-views"><Eye size={14} /> {post.views ?? 0} views</span>
          <button
            className={post.saved ? "active" : ""}
            aria-label="Save post"
            onClick={(e) => {
              e.stopPropagation();
              void action("save");
            }}
          >
            <Bookmark size={16} fill={post.saved ? "currentColor" : "none"} />
            <span>Save</span>
          </button>
        <button
          data-action="send"
          aria-label="Send post"
          onClick={async (e) => {
            e.stopPropagation();
            await navigator.clipboard?.writeText(
              `${window.location.origin}/post/${post.id}`,
            );
          }}
        >
          <Send size={16} />
          <span>Send</span>
        </button>
        </div>
      </div>
    </article>
  );
}

function ActivePostModal({
  post,
  close,
}: {
  post: FeedPost;
  close: () => void;
}) {
  const [detail, setDetail] = useState<PostDetail | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    setDetail(null);
    void fetchDetail(post.id).then((v) => {
      if (alive) setDetail(v);
    });
    return () => {
      alive = false;
    };
  }, [post.id]);
  const current = detail ?? post;
  const addComment = async (parentId: string | null, body: string) => {
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      await apiFetch(`/social/posts/${post.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: body.trim(), parentId }),
      });
      setComment("");
      const fresh = await fetchDetail(post.id);
      if (fresh) setDetail(fresh);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section
      className="home-active-post"
      role="dialog"
      aria-label="Active post"
    >
      <div className="home-modal">
        <header className="home-modal-head">
          <div>
            <span>POST DETAIL</span>
            <h2>Active post</h2>
          </div>
          <button onClick={close} aria-label="Close post">
            <X size={18} />
          </button>
        </header>
        <div className="home-modal-scroll">
          <article className="home-modal-content">
            <button
              className="home-author"
              onClick={() =>
                go(`/profile/${encodeURIComponent(current.author.username)}`)
              }
            >
              <Avatar user={current.author} size="md" />
              <span>
                <strong>{current.author.name}</strong>
                <small>
                  @{current.author.username} · {timeAgo(current.createdAt)}
                </small>
              </span>
            </button>
            <p className="home-modal-text">{current.text}</p>
            {current.quotePost ? (
              <QuoteCard quote={current.quotePost} onOpen={() => {}} />
            ) : null}
            {current.media?.length ? (
              <div className="home-modal-media">
                {current.media.map((m, i) =>
                  m.publicUrl ? (
                    m.mimeType.startsWith("video/") ? (
                      <video key={i} src={m.publicUrl} controls />
                    ) : (
                      <img key={i} src={m.publicUrl} alt="" />
                    )
                  ) : null,
                )}
              </div>
            ) : null}
            <div className="home-modal-stats">
              <span>{current.likes} likes</span>
              <span>{current.comments} comments</span>
              <span>{current.reposts} nerddings</span>
            </div>
          </article>
          <div className="home-comment-compose">
            <Avatar user={getSavedUser()} size="xs" />
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void addComment(null, comment);
              }}
              placeholder="Write a comment or reply…"
            />
            <button
              disabled={!comment.trim() || busy}
              onClick={() => void addComment(null, comment)}
            >
              <Send size={14} />
            </button>
          </div>
          <section>
            <div className="home-section-label">COMMENTS</div>
            {detail?.commentsTree?.length ? (
              <ThreadedCommentTree
                comments={detail.commentsTree}
                onReply={addComment}
              />
            ) : (
              <div className="home-no-comments">
                <MessageCircle size={17} />
                <span>{detail ? "No comments yet." : "Loading post…"}</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

type ChartBuilder = { id: string; name: string; username: string; accountType?: string; avatarUrl?: string | null; score?: number };
type RailProject = { id: string; name: string; slug: string; stage?: string; description?: string };

function HomeInfoRail() {
  const [builders, setBuilders] = useState<ChartBuilder[]>([]);
  const [projects, setProjects] = useState<RailProject[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const viewer = getSavedUser();
    void Promise.allSettled([
      apiFetch<{ data: { risingBuilders?: ChartBuilder[] } }>("/charts"),
      viewer?.username
        ? apiFetch<{ data: { projects?: RailProject[] } }>(`/social/users/${encodeURIComponent(viewer.username)}/profile-live`)
        : Promise.resolve({ data: { projects: [] } }),
    ]).then(([charts, profile]) => {
      if (charts.status === "fulfilled") setBuilders(charts.value.data.risingBuilders ?? []);
      if (profile.status === "fulfilled") setProjects(profile.value.data.projects ?? []);
    }).finally(() => setLoading(false));
  }, []);
  return (
    <aside className="home-info-rail">
      <section className="home-info-card">
        <h3>Build signal</h3>
        <p>{loading ? "Loading live signals…" : builders.length ? `${builders.length} builders are rising in the live charts.` : "Live signals will appear here as the network grows."}</p>
      </section>
      <section className="home-info-card">
        <div className="home-info-heading">
          <span>Rising builders</span>
          <button onClick={() => go("/charts")}>See all ↗</button>
        </div>
        <div className="home-info-list">{builders.slice(0, 3).map((builder) => <div key={builder.id}><span className="home-avatar home-avatar-xs">{builder.avatarUrl ? <img src={builder.avatarUrl} alt="" /> : initials(builder.name)}</span><span><strong>{builder.name}</strong><small>@{builder.username} · {builder.accountType === "agent" ? "Agent" : "Builder"}</small></span></div>)}{!loading && !builders.length && <p>No rising builders yet.</p>}</div>
      </section>
      <section className="home-info-card">
        <div className="home-info-heading">
          <span>Projects to watch</span>
          <button onClick={() => go("/explore")}>Explore ↗</button>
        </div>
        <div className="home-info-list">{projects.slice(0, 3).map((project) => <div key={project.id}><span className="home-avatar home-avatar-xs">{project.name.slice(0, 1).toUpperCase()}</span><span><strong>{project.name}</strong><small>{project.stage ?? "Project"}{project.description ? ` · ${project.description}` : ""}</small></span></div>)}{!loading && !projects.length && <p>No projects to watch yet.</p>}</div>
      </section>
      <section className="home-info-card">
        <div className="home-info-heading">
          <span>Quick links</span>
        </div>
        <div className="home-info-list">
          <div>Fundraising directory ↗</div>
          <div>Events this week ↗</div>
          <div>Saved for later ↗</div>
        </div>
      </section>
    </aside>
  );
}

function Composer({
  onClose,
  onPosted,
}: {
  onClose: () => void;
  onPosted: () => void;
}) {
  const viewer = getSavedUser();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const publish = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await apiFetch("/posts", {
        method: "POST",
        body: JSON.stringify({ body: text.trim() }),
      });
      onPosted();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className="home-composer-backdrop"
      onMouseDown={(e) => e.currentTarget === e.target && onClose()}
    >
      <div className="home-composer-modal">
        <header>
          <div>
            <div
              style={{
                fontSize: 8,
                letterSpacing: ".13em",
                fontWeight: 800,
                color: "#978d84",
              }}
            >
              SHARE YOUR WORK
            </div>
            <h2>Create a post</h2>
          </div>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div
          style={{
            display: "flex",
            gap: 9,
            alignItems: "center",
            padding: "12px 16px",
          }}
        >
          <Avatar user={viewer} size="sm" />
          <span>
            <strong>{viewer?.name ?? "Member"}</strong>
            <small style={{ display: "block", fontSize: 9, color: "#91877d" }}>
              @{viewer?.username ?? "member"}
            </small>
          </span>
        </div>
        <textarea
          autoFocus
          maxLength={5000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What are you building, learning, testing or shipping?"
        />
        <footer>
          <span>{text.length}/5000</span>
          <button
            disabled={!text.trim() || busy}
            onClick={() => void publish()}
          >
            {busy ? "Publishing…" : "Publish"}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default function HomeFeedSurface() {
  const [mode, setMode] = useState<"for-you" | "network">("for-you");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composer, setComposer] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      const r = await apiFetch<{ data: FeedPost[] }>(
        `/social/feed?mode=${mode}`,
      );
      let next = r.data ?? [];
      const candidates = next.filter(
        (p) => (p.media?.length ?? 0) > 0 || Boolean(p.quotePostId),
      );
      const details = await Promise.all(
        candidates.map((p) => fetchDetail(p.id)),
      );
      const byId = new Map(details.filter(Boolean).map((d) => [d!.id, d!]));
      const quotes = await Promise.all(
        next
          .filter((p) => p.quotePostId && !p.quotePost)
          .map((p) => fetchDetail(p.quotePostId!)),
      );
      const qById = new Map(quotes.filter(Boolean).map((q) => [q!.id, q!]));
      next = next.map((p) => {
        const d = byId.get(p.id);
        const q =
          p.quotePost ?? (p.quotePostId ? qById.get(p.quotePostId) : null);
        return d
          ? { ...p, ...d, quotePost: q ?? null }
          : { ...p, quotePost: q ?? null };
      });
      setPosts(next);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    setSelectedId(null);
  }, [mode]);
  const changed = (id: string, patch: Partial<FeedPost>) =>
    setPosts((cur) => cur.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const selected = useMemo(
    () =>
      selectedId ? (posts.find((p) => p.id === selectedId) ?? null) : null,
    [posts, selectedId],
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <>
      <style>{styles}</style>
      <div className="home-live-root">
        <div className="home-live-shell">
          <div className="home-live-tabs">
            <button
              className={mode === "for-you" ? "active" : ""}
              onClick={() => setMode("for-you")}
            >
              For you
            </button>
            <button
              className={mode === "network" ? "active" : ""}
              onClick={() => setMode("network")}
            >
              Your network
            </button>
          </div>
          <div className="home-live-grid">
            <main className="home-feed-column">
              <button
                className="home-composer"
                onClick={() => setComposer(true)}
              >
                <Avatar user={getSavedUser()} size="sm" />
                <span>Share a post…</span>
                <Plus size={18} />
              </button>
              {loading ? (
                <div className="home-feed-loading">
                  <Loader2 size={20} />
                </div>
              ) : posts.length ? (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    selected={selectedId === post.id}
                    select={() => setSelectedId(post.id)}
                    onChanged={changed}
                  />
                ))
              ) : (
                <div className="home-empty">
                  <MessageCircle size={20} />
                  <strong>No posts yet</strong>
                  <span>There is no live activity for this feed yet.</span>
                </div>
              )}
            </main>
            {selected ? (
              <ActivePostModal
                key={selected.id}
                post={selected}
                close={() => setSelectedId(null)}
              />
            ) : (
              <HomeInfoRail />
            )}
          </div>
        </div>
      </div>
      {composer ? (
        <Composer
          onClose={() => setComposer(false)}
          onPosted={() => {
            setComposer(false);
            void load();
          }}
        />
      ) : null}
    </>
  );
}
