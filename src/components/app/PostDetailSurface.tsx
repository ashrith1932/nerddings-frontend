"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, Eye, Heart, Link2, MessageCircle, Send, X } from "lucide-react";
import { apiFetch, getSavedUser } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import ThreadedCommentTree, { type ThreadComment } from "@/components/social/ThreadedCommentTree";

type UserRef = { id: string; name: string; username: string; avatarUrl?: string | null };
type Media = { publicUrl: string | null; mimeType: string };
type QuotePost = { id: string; text: string; createdAt: string; author: UserRef; media?: Media[]; linkUrl?: string | null; likes?: number; comments?: number; reposts?: number; saves?: number; views?: number };
type ProjectRef = { name: string; slug: string; stage?: string; description?: string; githubUrl?: string | null };
type Post = { id: string; text: string; createdAt: string; likes: number; comments: number; reposts: number; saves?: number; views?: number; author: UserRef; project?: ProjectRef | null; linkUrl?: string | null; media?: Media[]; quotePost?: QuotePost | null; commentsTree: ThreadComment[] };

const nav = (path: string) => { window.history.pushState({}, "", path); window.dispatchEvent(new PopStateEvent("popstate")); };
const ago = (value: string) => { const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); if (seconds < 60) return "now"; if (seconds < 3600) return `${Math.floor(seconds / 60)}m`; if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`; return `${Math.floor(seconds / 86400)}d`; };
const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

const panelStyles = `
.home-active-post{min-width:0;width:100%;max-height:min(82vh,900px);overflow:hidden;border:1px solid var(--line,#ddd6cc);border-radius:12px;background:var(--card,#fff);box-shadow:0 5px 18px rgba(31,27,24,.05);animation:home-panel-in .3s ease-out}
.home-active-post .home-modal{width:100%;max-height:min(82vh,900px);border:0;border-radius:0;box-shadow:none;overflow:hidden;display:flex;flex-direction:column}
.home-active-post .home-modal-head{height:60px;flex:0 0 60px;border-bottom:1px solid var(--line,#ddd6cc);display:flex;align-items:center;justify-content:space-between;padding:0 15px;position:sticky;top:0;z-index:2;background:var(--card,#fff)}
.home-active-post .home-modal-head span{font-size:8px;letter-spacing:.14em;color:#978d84;font-weight:800}
.home-active-post .home-modal-head h2{font-size:17px;margin:3px 0 0}
.home-active-post .home-modal-head button{width:32px;height:32px;border:1px solid var(--line,#ddd6cc);background:none;color:#8e847a;border-radius:50%;display:grid;place-items:center;cursor:pointer}
.home-active-post .home-modal-scroll{max-height:calc(min(82vh,900px) - 60px);overflow-y:auto;overscroll-behavior:contain;padding:14px}
.home-modal-content{border:1px solid var(--line,#ddd6cc);border-radius:10px;padding:12px;background:var(--card,#fff)}
.home-modal-text{font-size:13px;line-height:1.6;white-space:pre-wrap;margin:13px 0}
.home-modal-media{display:grid;gap:5px;border-radius:9px;overflow:hidden}
.home-modal-media img,.home-modal-media video{width:100%;max-height:420px;object-fit:contain;background:#eee9e2}
.home-modal-stats{display:flex;gap:12px;color:#8b8178;font-size:9px;padding-top:9px;margin-top:9px;border-top:1px solid #eee8e1}
.home-comment-compose{display:flex;align-items:center;gap:7px;border:1px solid var(--line);border-radius:9px;background:var(--card);padding:5px 6px;margin:11px 0}
.home-comment-compose input{flex:1;border:0;outline:0;background:transparent;font-size:10px;min-width:0}
.home-comment-compose button{width:28px;height:28px;border:0;border-radius:7px;background:var(--ink,#211d19);color:#fff;display:grid;place-items:center}
.home-section-label{font-size:8px;letter-spacing:.14em;font-weight:800;color:#978d84;margin:12px 0 5px}
.home-no-comments{display:flex;justify-content:center;align-items:center;gap:6px;padding:28px;color:#958b82;font-size:10px}
.home-modal-content .home-author{display:flex;align-items:center;gap:9px;border:0;background:none;padding:0;text-align:left;cursor:pointer;color:inherit}
.home-modal-content .home-author>span{display:flex;flex-direction:column}
.home-modal-content .home-author strong{font-size:12px}
.home-modal-content .home-author small{font-size:10px;color:#938980;margin-top:2px}
.nerdd-quote{border:1px solid #d9d2c9;background:#faf7f2;border-radius:11px;padding:11px;margin:0 0 10px;cursor:pointer}
.nerdd-quote-label{font-size:8px;font-weight:800;letter-spacing:.13em;color:#9a9087;margin-bottom:8px}
.nerdd-quote-head{display:flex;align-items:center;gap:8px}
.nerdd-quote-head>span:last-child{display:flex;flex-direction:column}
.nerdd-quote-head strong{font-size:10px}
.nerdd-quote-head small{font-size:8px;color:#938980;margin-top:2px}
.nerdd-quote-avatar{width:29px;height:29px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:#e9e3db;font-size:8px;font-weight:800}
.nerdd-quote-avatar img{width:100%;height:100%;object-fit:cover}
.nerdd-quote-text{font-size:11px;line-height:1.5;white-space:pre-wrap;margin-top:8px;color:#332e29}
.nerdd-quote-media{margin-top:8px;border-radius:8px;overflow:hidden}
.nerdd-quote-media img,.nerdd-quote-media video{display:block;width:100%;height:170px;object-fit:cover;background:#eee9e2}
.home-project,.home-link{width:100%;border:1px solid var(--line,#ddd6cc);background:#faf7f2;border-radius:9px;padding:10px;text-align:left;display:flex;color:inherit;text-decoration:none;margin-top:7px}
.home-project{cursor:pointer}
.home-project span{display:flex;flex-direction:column;min-width:0}
.home-project strong{font-size:11px}
.home-project small{font-size:10px;color:#8e847a;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@keyframes home-panel-in{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}
@media(max-width:600px){.home-active-post,.home-active-post .home-modal{max-height:none}.home-active-post .home-modal-scroll{max-height:none}}
`;

function QuoteCard({ quote, onOpen }: { quote: QuotePost; onOpen: () => void }) {
  return <article className="nerdd-quote" role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); onOpen(); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onOpen(); } }}>
    <div className="nerdd-quote-label">QUOTED POST</div>
    <div className="nerdd-quote-head"><span className="nerdd-quote-avatar">{quote.author.avatarUrl ? <img src={quote.author.avatarUrl} alt="" /> : initials(quote.author.name)}</span><span><strong>{quote.author.name}</strong><small>@{quote.author.username} · {ago(quote.createdAt)}</small></span></div>
    <div className="nerdd-quote-text">{quote.text}</div>
    {quote.media?.length ? <div className="nerdd-quote-media">{quote.media.slice(0,4).map((media,index) => media.publicUrl ? (media.mimeType.startsWith("video/") ? <video key={index} src={media.publicUrl} controls onClick={(event) => event.stopPropagation()} /> : <img key={index} src={media.publicUrl} alt="" loading="lazy" />) : null)}</div> : null}
  </article>;
}

export default function PostDetailSurface({ postId, onClose, isPanel = false }: { postId: string; onClose?: () => void; isPanel?: boolean }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const openPost = (id: string) => {
    if (isPanel) {
      window.dispatchEvent(new CustomEvent("nerdding:open-profile-post", { detail: { postId: id } }));
    } else {
      nav(`/post/${encodeURIComponent(id)}`);
    }
  };

  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await apiFetch<{ data: Post }>(`/social/posts/${encodeURIComponent(postId)}`);
      setPost(response.data);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Post could not be loaded");
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [postId]);

  const addComment = async (parentId: string | null, body: string) => {
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      await apiFetch(`/social/posts/${encodeURIComponent(postId)}/comments`, { method: "POST", body: JSON.stringify({ body: body.trim(), parentId }) });
      setComment("");
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Comment could not be posted");
    } finally { setBusy(false); }
  };

  const panel = <><style>{panelStyles}</style><section className="home-active-post" role="dialog" aria-label="Active post"><div className="home-modal"><header className="home-modal-head"><div><span>POST DETAIL</span><h2>Active post</h2></div>{onClose && <button onClick={onClose} aria-label="Close post"><X size={18} /></button>}</header><div className="home-modal-scroll">{loading ? <div className="skeleton-block skeleton-hero" /> : !post ? <div className="empty-state"><strong>Post could not be loaded.</strong><span>{error}</span><button className="outline-button" onClick={() => void load()}>Try again</button></div> : <><article className="home-modal-content"><button className="home-author" onClick={() => nav(`/profile/${encodeURIComponent(post.author.username)}`)}><Avatar user={post.author} size="md" /><span><strong>{post.author.name}</strong><small>@{post.author.username} · {ago(post.createdAt)}</small></span></button><p className="home-modal-text">{post.text}</p>{post.quotePost ? <QuoteCard quote={post.quotePost} onOpen={() => openPost(post.quotePost!.id)} /> : null}{post.media?.length ? <div className="home-modal-media">{post.media.slice(0,4).map((media,index) => media.publicUrl ? (media.mimeType.startsWith("video/") ? <video key={index} src={media.publicUrl} controls /> : <img key={index} src={media.publicUrl} alt="" />) : null)}</div> : null}{post.project && <button className="home-project" onClick={() => nav(`/project/${encodeURIComponent(post.project!.slug)}`)}><span><strong>{post.project.name}</strong><small>{post.project.stage ?? "Project"}</small></span></button>}{post.linkUrl && <a className="home-link" href={post.linkUrl} target="_blank" rel="noreferrer"><Link2 size={14} />{post.linkUrl.replace(/^https?:\/\//, "")}</a>}<div className="home-modal-stats"><span>{post.likes} likes</span><span>{post.comments} comments</span><span>{post.reposts} nerddings</span><span>{post.views ?? 0} views</span></div></article><div className="home-comment-compose"><Avatar user={getSavedUser()} size="xs" /><input value={comment} onChange={(event) => setComment(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && comment.trim()) void addComment(null, comment); }} placeholder="Write a comment or reply..." /><button disabled={!comment.trim() || busy} onClick={() => void addComment(null, comment)}><Send size={14} /></button></div><section><div className="home-section-label">COMMENTS</div>{post.commentsTree?.length ? <ThreadedCommentTree comments={post.commentsTree} onReply={addComment} /> : <div className="home-no-comments"><MessageCircle size={17} /><span>No comments yet.</span></div>}</section></>}</div></div></section></>;
  if (isPanel) return panel;
  return <div className="view post-detail-view" style={{ maxWidth: 760, margin: "0 auto" }}>{!onClose && <button className="back-button" onClick={() => nav("/home")}><ArrowLeft size={15} /> Back to feed</button>}{loading ? <div className="skeleton-block skeleton-hero" /> : post ? <article className="home-modal-content"><button className="home-author" onClick={() => nav(`/profile/${encodeURIComponent(post.author.username)}`)}><Avatar user={post.author} size="md" /><span><strong>{post.author.name}</strong><small>@{post.author.username} · {ago(post.createdAt)}</small></span></button><p className="home-modal-text">{post.text}</p>{post.quotePost ? <QuoteCard quote={post.quotePost} onOpen={() => openPost(post.quotePost!.id)} /> : null}{post.media?.length ? <div className="home-modal-media">{post.media.slice(0,4).map((media,index) => media.publicUrl ? (media.mimeType.startsWith("video/") ? <video key={index} src={media.publicUrl} controls /> : <img key={index} src={media.publicUrl} alt="" />) : null)}</div> : null}<div className="home-modal-stats"><span>{post.likes} likes</span><span>{post.comments} comments</span><span>{post.reposts} nerddings</span><span>{post.views ?? 0} views</span></div></article> : <div className="empty-state"><strong>Post could not be loaded.</strong><span>{error}</span></div>}</div>;
}
