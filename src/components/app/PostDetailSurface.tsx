"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowLeft, Bookmark, Eye, Heart, Link2, MessageCircle, Send, X } from "lucide-react";
import { apiFetch, getSavedUser } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import ThreadedCommentTree, { type ThreadComment } from "@/components/social/ThreadedCommentTree";

type UserRef = { id: string; name: string; username: string; avatarUrl?: string | null };
type Media = { publicUrl: string | null; mimeType: string };
type QuotePost = { id: string; text: string; createdAt: string; author: UserRef; media?: Media[]; likes?: number; comments?: number; reposts?: number; saves?: number; views?: number };
type ProjectRef = { name: string; slug: string; stage?: string; description?: string; githubUrl?: string | null };
type Post = { id: string; text: string; createdAt: string; likes: number; comments: number; reposts: number; saves?: number; views?: number; author: UserRef; project?: ProjectRef | null; linkUrl?: string | null; media?: Media[]; quotePost?: QuotePost | null; commentsTree: ThreadComment[] };

const nav = (path: string) => { window.history.pushState({}, "", path); window.dispatchEvent(new PopStateEvent("popstate")); };
const ago = (value: string) => { const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); if (seconds < 60) return "now"; if (seconds < 3600) return `${Math.floor(seconds / 60)}m`; if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`; return `${Math.floor(seconds / 86400)}d`; };

const homePanelStyles = `
.profile-active-post .home-active-post { min-width:0; max-height:min(70vh,760px); overflow:hidden; border:1px solid var(--line,#ddd6cc); border-radius:12px; background:var(--card,#fff); box-shadow:0 5px 18px rgba(31,27,24,.05); animation:profile-home-panel-in .3s ease-out; }
.profile-active-post .home-modal { width:100%; max-height:min(70vh,760px); border:0; border-radius:0; box-shadow:none; overflow:hidden; display:flex; flex-direction:column; }
.profile-active-post .home-modal-head { height:60px; flex:0 0 60px; border-bottom:1px solid var(--line,#ddd6cc); display:flex; align-items:center; justify-content:space-between; padding:0 15px; position:sticky; top:0; z-index:2; background:var(--card,#fff); }
.profile-active-post .home-modal-head span { font-size:8px; letter-spacing:.14em; color:#978d84; font-weight:800; }
.profile-active-post .home-modal-head h2 { font-size:17px; margin:3px 0 0; }
.profile-active-post .home-modal-head button { width:32px; height:32px; border:1px solid var(--line,#ddd6cc)!important; background:none; color:#8e847a; border-radius:50%!important; display:grid; place-items:center; cursor:pointer; }
.profile-active-post .home-modal-scroll { max-height:calc(min(70vh,760px) - 60px); overflow-y:auto; overscroll-behavior:contain; padding:14px; }
.profile-active-post .home-modal-content { border:1px solid var(--line,#ddd6cc); border-radius:10px; padding:12px; background:var(--card,#fff); }
.profile-active-post .home-modal-text { font-size:13px; line-height:1.6; white-space:pre-wrap; margin:13px 0; }
.profile-active-post .home-modal-media { display:grid; gap:5px; border-radius:9px; overflow:hidden; }
.profile-active-post .home-modal-media img,.profile-active-post .home-modal-media video { width:100%; max-height:420px; object-fit:contain; background:#eee9e2; }
.profile-active-post .home-modal-stats { display:flex; gap:12px; color:#8b8178; font-size:9px; padding-top:9px; margin-top:9px; border-top:1px solid #eee8e1; }
.profile-active-post .home-comment-compose { display:flex; align-items:center; gap:7px; border:1px solid var(--line); border-radius:9px; background:var(--card); padding:5px 6px; margin:11px 0; }
.profile-active-post .home-comment-compose input { flex:1; border:0; outline:0; background:transparent; font-size:10px; min-width:0; }
.profile-active-post .home-comment-compose button { width:28px; height:28px; border:0; border-radius:7px; background:var(--ink,#211d19); color:#fff; display:grid; place-items:center; }
.profile-active-post .home-section-label { font-size:8px; letter-spacing:.14em; font-weight:800; color:#978d84; margin:12px 0 5px; }
.profile-active-post .home-no-comments { display:flex; justify-content:center; align-items:center; gap:6px; padding:28px; color:#958b82; font-size:10px; }
.profile-active-post .home-modal-content .home-author { display:flex; align-items:center; gap:9px; border:0; background:none; padding:0; text-align:left; cursor:pointer; color:inherit; }
.profile-active-post .home-modal-content .home-author > span { display:flex; flex-direction:column; }
.profile-active-post .home-modal-content .home-author strong { font-size:12px; }
.profile-active-post .home-modal-content .home-author small { font-size:10px; color:#938980; margin-top:2px; }
.profile-active-post .nerdd-quote { border:1px solid #d9d2c9; background:#faf7f2; border-radius:11px; padding:11px; margin:0 0 10px; cursor:pointer; }
.profile-active-post .nerdd-quote-label { font-size:8px; font-weight:800; letter-spacing:.13em; color:#9a9087; margin-bottom:8px; }
.profile-active-post .nerdd-quote-head { display:flex; align-items:center; gap:8px; }
.profile-active-post .nerdd-quote-head>span:last-child { display:flex; flex-direction:column; }
.profile-active-post .nerdd-quote-head strong { font-size:10px; }
.profile-active-post .nerdd-quote-head small { font-size:8px; color:#938980; margin-top:2px; }
.profile-active-post .nerdd-quote-avatar { width:29px; height:29px; border-radius:50%; overflow:hidden; display:grid; place-items:center; background:#e9e3db; font-size:8px; font-weight:800; }
.profile-active-post .nerdd-quote-avatar img { width:100%; height:100%; object-fit:cover; }
.profile-active-post .nerdd-quote-text { font-size:11px; line-height:1.5; white-space:pre-wrap; margin-top:8px; color:#332e29; }
@keyframes profile-home-panel-in { from { opacity:0; transform:translateX(18px);} to { opacity:1; transform:translateX(0);} }
@media(max-width:600px){.profile-active-post .home-active-post{margin-top:16px;max-height:none}.profile-active-post .home-modal{max-height:none}.profile-active-post .home-modal-scroll{max-height:none}.profile-active-post .home-modal-head{height:58px;flex-basis:58px}}
`;

function UserButton({ user }: { user: UserRef }) {
  return <button className="home-author" onClick={() => nav(`/profile/${encodeURIComponent(user.username)}`)}><Avatar user={user} size="md" /><span><strong>{user.name}</strong><small>@{user.username}</small></span></button>;
}

function QuoteCard({ quote }: { quote: QuotePost }) {
  return <article className="nerdd-quote"><div className="nerdd-quote-label">QUOTED POST</div><div className="nerdd-quote-head"><span className="nerdd-quote-avatar">{quote.author.avatarUrl ? <img src={quote.author.avatarUrl} alt="" /> : null}</span><span><strong>{quote.author.name}</strong><small>@{quote.author.username} · {ago(quote.createdAt)}</small></span></div><div className="nerdd-quote-text">{quote.text}</div>{quote.media?.length ? <div className="nerdd-quote-media">{quote.media.slice(0,4).map((media,index) => media.publicUrl ? (media.mimeType.startsWith("video/") ? <video key={index} src={media.publicUrl} controls /> : <img key={index} src={media.publicUrl} alt="" loading="lazy" />) : null)}</div> : null}</article>;
}

export default function PostDetailSurface({ postId, onClose, isPanel = false }: { postId: string; onClose?: () => void; isPanel?: boolean }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => { setLoading(true); setError(""); try { const response = await apiFetch<{ data: Post }>(`/social/posts/${encodeURIComponent(postId)}`); setPost(response.data); setSaved(Boolean(response.data.saves && response.data.saves > 0)); } catch (errorValue) { setError(errorValue instanceof Error ? errorValue.message : "Post could not be loaded"); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [postId]);

  const addComment = async (parentId: string | null, body: string) => { if (!getSavedUser() || busy) return; setBusy(true); try { await apiFetch(`/social/posts/${encodeURIComponent(postId)}/comments`, { method: "POST", body: JSON.stringify({ body, parentId }) }); await load(); } catch (errorValue) { setError(errorValue instanceof Error ? errorValue.message : "Comment could not be posted"); } finally { setBusy(false); } };

  if (loading) {
    if (!isPanel) return <div className="nerdd-route-surface"><div className="skeleton-block skeleton-hero" /></div>;
    return <section className="home-active-post" role="dialog" aria-label="Active post"><style>{homePanelStyles}</style><div className="home-modal"><header className="home-modal-head"><div><span>POST DETAIL</span><h2>Active post</h2></div>{onClose && <button onClick={onClose} aria-label="Close post"><X size={18} /></button>}</header><div className="home-modal-scroll"><div className="skeleton-block skeleton-hero" /></div></div></section>;
  }

  if (!post) {
    if (!isPanel) return <div className="nerdd-route-surface"><div className="empty-state"><strong>Post could not be loaded.</strong><span>{error}</span><button className="outline-button" onClick={() => void load()}>Try again</button></div></div>;
    return <section className="home-active-post" role="dialog" aria-label="Active post"><style>{homePanelStyles}</style><div className="home-modal"><header className="home-modal-head"><div><span>POST DETAIL</span><h2>Active post</h2></div>{onClose && <button onClick={onClose} aria-label="Close post"><X size={18} /></button>}</header><div className="home-modal-scroll"><div className="empty-state"><strong>Post could not be loaded.</strong><span>{error}</span><button className="outline-button" onClick={() => void load()}>Try again</button></div></div></div></section>;
  }

  const content = <><article className="home-modal-content">
    <UserButton user={post.author} />
    <p className="home-modal-text">{post.text}</p>
    {post.quotePost ? <QuoteCard quote={post.quotePost} /> : null}
    {post.media?.length ? <div className="home-modal-media">{post.media.slice(0,4).map((media,index) => media.publicUrl ? (media.mimeType.startsWith("video/") ? <video key={index} src={media.publicUrl} controls /> : <img key={index} src={media.publicUrl} alt="" loading="lazy" />) : null)}</div> : null}
    {post.project && <button className="home-project" onClick={() => window.dispatchEvent(new CustomEvent("nerdding:open-project", { detail: { slug: post.project?.slug } }))}><span><strong>{post.project.name}</strong><small>{post.project.stage ?? "Project"}</small></span></button>}
    {post.linkUrl ? <a className="home-link" href={post.linkUrl} target="_blank" rel="noreferrer"><Link2 size={14} />{post.linkUrl.replace(/^https?:\/\//, "")}</a> : null}
    <div className="home-modal-stats"><span>{post.likes} likes</span><span>{post.comments} comments</span><span>{post.reposts} nerddings</span></div>
  </article>
  <section>
    <div className="home-section-label">COMMENTS</div>
    <div className="home-comment-compose"><Avatar user={getSavedUser() ?? { id:"guest", name:"Guest", username:"guest" }} size="xs" /><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Write a comment or reply..." onKeyDown={(event) => { if (event.key === "Enter" && text.trim()) { const body = text.trim(); setText(""); void addComment(null, body); } }} /><button disabled={!text.trim() || busy} onClick={() => { const body = text.trim(); setText(""); void addComment(null, body); }}><Send size={14} /></button></div>
    {post.commentsTree?.length ? <ThreadedCommentTree comments={post.commentsTree} onReply={addComment} /> : <div className="home-no-comments"><MessageCircle size={17} /> No comments yet.</div>}
  </section></>;

  if (isPanel) return <section className="home-active-post" role="dialog" aria-label="Active post"><style>{homePanelStyles}</style><div className="home-modal"><header className="home-modal-head"><div><span>POST DETAIL</span><h2>Active post</h2></div>{onClose && <button onClick={onClose} aria-label="Close post"><X size={18} /></button>}</header><div className="home-modal-scroll">{content}</div></div></section>;

  return <div className="nerdd-route-surface"><div className="view post-detail-view">{!onClose && <button className="back-button" onClick={() => nav("/home")}><ArrowLeft size={15} /> Back to feed</button>}<article className="post-detail-card"><div className="post-detail-card-head"><UserButton user={post.author} /><span className="post-detail-time">{new Date(post.createdAt).toLocaleString()}</span></div><p className="post-detail-copy">{post.text}</p>{post.quotePost ? <QuoteCard quote={post.quotePost} /> : null}{post.media?.length ? <div className="post-detail-media">{post.media.slice(0,4).map((media,index) => media.publicUrl ? (media.mimeType.startsWith("video/") ? <video key={index} src={media.publicUrl} controls /> : <img key={index} src={media.publicUrl} alt="" loading="lazy" />) : null)}</div> : null}<div className="post-detail-actionbar"><div><span title="Likes"><Heart size={15} /> {post.likes}</span><span title="Comments"><MessageCircle size={15} /> {post.comments}</span><span title="Amplifies"><Activity size={15} /> {post.reposts}</span></div><div><span title="Views"><Eye size={15} /> {post.views ?? 0}</span><button title="Save" className={saved ? "action-active" : ""} onClick={async () => { try { const response = await apiFetch<{ data: { active: boolean } }>(`/posts/${post.id}/save`, { method: "POST" }); setSaved(response.data.active); await load(); } catch { setError("Post could not be saved"); } }}><Bookmark size={15} fill={saved ? "currentColor" : "none"} /> Save</button></div></div></article></div></div>;
}
