"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Heart, Send, Bookmark, Activity, Eye, MessageCircle } from "lucide-react";
import { apiFetch, getSavedUser } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import ThreadedCommentTree, { type ThreadComment } from "@/components/social/ThreadedCommentTree";

type UserRef = { id: string; name: string; username: string; avatarUrl?: string | null };
type Post = { id: string; text: string; createdAt: string; likes: number; comments: number; reposts: number; saves?: number; views?: number; author: UserRef; project?: { name: string; slug: string } | null; commentsTree: ThreadComment[] };
const nav = (p: string) => { window.history.pushState({}, "", p); window.dispatchEvent(new PopStateEvent("popstate")); };

function UserButton({ user, size = "xs" }: { user: UserRef; size?: "xs" | "sm" | "md" }) {
  return <button className="post-detail-author-button" onClick={() => nav(`/profile/${encodeURIComponent(user.username)}`)}><Avatar user={user} size={size} /><span><strong>{user.name}</strong><small>@{user.username}</small></span></button>;
}

export default function PostDetailSurface({ postId }: { postId: string }) {
  const [post, setPost] = useState<Post | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [text, setText] = useState(""); const [busy, setBusy] = useState(false); const [saved, setSaved] = useState(false);
  const load = async () => { setLoading(true); setError(""); try { const r = await apiFetch<{ data: Post }>(`/social/posts/${encodeURIComponent(postId)}`); setPost(r.data); setSaved(Boolean(r.data.saves && r.data.saves > 0)); } catch (e) { setError(e instanceof Error ? e.message : "Post could not be loaded"); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [postId]);
  const addComment = async (parentId: string | null, body: string) => { if (!getSavedUser() || busy) return; setBusy(true); try { await apiFetch(`/social/posts/${encodeURIComponent(postId)}/comments`, { method: "POST", body: JSON.stringify({ body, parentId }) }); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Comment could not be posted"); } finally { setBusy(false); } };
  if (loading) return <div className="nerdd-route-surface"><div className="skeleton-block skeleton-hero" /></div>;
  if (!post) return <div className="nerdd-route-surface"><div className="empty-state"><strong>Post could not be loaded.</strong><span>{error}</span><button className="outline-button" onClick={() => void load()}>Try again</button></div></div>;
  const views = Number(post.views ?? 0);
  return <div className="nerdd-route-surface"><div className="view post-detail-view"><button className="back-button" onClick={() => nav("/home")}><ArrowLeft size={15} /> Back to feed</button><article className="post-detail-card"><UserButton user={post.author} size="md" /><span className="post-detail-time">{new Date(post.createdAt).toLocaleString()}</span><p className="post-detail-copy">{post.text}</p>{post.project && <button className="outline-button post-detail-project" onClick={() => window.dispatchEvent(new CustomEvent("nerdding:open-project", { detail: { slug: post.project!.slug } }))}>Mentioned project: {post.project.name}</button>}<div className="post-detail-actionbar"><div><span title="Likes"><Heart size={15} /> {post.likes}</span><span title="Comments"><MessageCircle size={15} /> {post.comments}</span><span title="Amplifies"><Activity size={15} /> {post.reposts}</span></div><div><span title="Views"><Eye size={15} /> {views}</span><button title="Save" className={saved ? "action-active" : ""} onClick={async () => { try { const r = await apiFetch<{ data: { active: boolean } }>(`/posts/${post.id}/save`, { method: "POST" }); setSaved(r.data.active); await load(); } catch {} }}><Bookmark size={15} fill={saved ? "currentColor" : "none"} /> Save</button></div></div></article><section className="post-detail-comments"><div className="eyebrow">REPLIES</div><h2>Replies</h2><div className="post-detail-compose"><Avatar user={getSavedUser()} size="xs" /><input value={text} onChange={e => setText(e.target.value)} placeholder="Write a reply…" onKeyDown={e => { if (e.key === "Enter" && text.trim()) { void addComment(null, text.trim()); setText(""); } }} /><button disabled={!text.trim() || busy} onClick={() => { void addComment(null, text.trim()); setText(""); }}><Send size={14} /></button></div><ThreadedCommentTree comments={post.commentsTree ?? []} onReply={addComment} /></section></div></div>;
}
