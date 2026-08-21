"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Heart, MessageCircle, Activity, Eye, Bookmark, Send, ArrowLeft } from "lucide-react";
import { apiFetch, getSavedUser } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import VerifiedName from "@/components/ui/VerifiedName";
import ThreadedCommentTree, { type ThreadComment } from "@/components/social/ThreadedCommentTree";

type UserRef = { id: string; name: string; username: string; avatarUrl?: string | null; accountType?: string };
type Media = { publicUrl: string | null; mimeType: string };
type PostDetail = {
  id: string; authorId: string; author: UserRef; text: string; createdAt: string;
  likes: number; comments: number; reposts: number; saves: number; views?: number;
  liked?: boolean; saved?: boolean; reposted?: boolean;
  linkUrl?: string | null; media?: Media[];
  commentsTree: ThreadComment[];
};

interface PostBottomSheetProps {
  postId: string;
  onClose: () => void;
}

const timeAgo = (value: string) => {
  const s = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

/**
 * Instagram-style bottom sheet for post detail.
 * On mobile: slides up from bottom, covers ~50% of screen, draggable to expand/dismiss.
 * On desktop (>800px): side overlay sliding in from the right.
 */
export default function PostBottomSheet({ postId, onClose }: PostBottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reposted, setReposted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startY: 0, currentY: 0, dragging: false });
  const [sheetHeight, setSheetHeight] = useState(50); // percentage of viewport

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const resp = await apiFetch<{ data: PostDetail }>(`/social/posts/${encodeURIComponent(postId)}`);
        if (alive) {
          setPost(resp.data);
          setLiked(Boolean(resp.data.liked));
          setSaved(Boolean(resp.data.saved));
          setReposted(Boolean(resp.data.reposted));
        }
      } catch (e) {
        console.error("PostBottomSheet: failed to load post", e);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [postId]);

  const action = async (kind: "like" | "save" | "repost") => {
    if (!post) return;
    try {
      const r = await apiFetch<{ data: { active: boolean } }>(`/posts/${post.id}/${kind}`, { method: "POST" });
      const active = r.data.active;
      if (kind === "like") setLiked(active);
      if (kind === "save") setSaved(active);
      if (kind === "repost") setReposted(active);
      setPost((v) =>
        v
          ? {
              ...v,
              [kind === "like" ? "likes" : kind === "save" ? "saves" : "reposts"]:
                Math.max(0, (v[kind === "like" ? "likes" : kind === "save" ? "saves" : "reposts"] ?? 0) + (active ? 1 : -1)),
            }
          : v
      );
    } catch {}
  };

  const addComment = async (parentId: string | null, body: string) => {
    if (!body.trim() || busy || !post) return;
    setBusy(true);
    try {
      await apiFetch(`/social/posts/${post.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: body.trim(), parentId }),
      });
      setComment("");
      const fresh = await apiFetch<{ data: PostDetail }>(`/social/posts/${encodeURIComponent(post.id)}`);
      setPost(fresh.data);
    } finally {
      setBusy(false);
    }
  };

  // Drag-to-dismiss / drag-to-expand handlers (mobile)
  const onTouchStart = (e: React.TouchEvent) => {
    dragRef.current = { startY: e.touches[0].clientY, currentY: e.touches[0].clientY, dragging: true };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.currentY = e.touches[0].clientY;
    const diff = dragRef.current.startY - dragRef.current.currentY;
    const newHeight = Math.min(95, Math.max(20, sheetHeight + (diff / window.innerHeight) * 100));
    if (sheetRef.current) {
      sheetRef.current.style.height = `${newHeight}vh`;
    }
  };
  const onTouchEnd = () => {
    if (!dragRef.current.dragging) return;
    const diff = dragRef.current.startY - dragRef.current.currentY;
    const delta = (diff / window.innerHeight) * 100;
    dragRef.current.dragging = false;

    if (delta < -15) {
      // Swiped down significantly → close
      onClose();
    } else if (delta > 10) {
      // Swiped up → expand
      setSheetHeight(Math.min(95, sheetHeight + delta));
    } else {
      // Snap back
      if (sheetRef.current) sheetRef.current.style.height = `${sheetHeight}vh`;
    }
  };

  const isDesktop = typeof window !== "undefined" && window.innerWidth > 800;

  if (!mounted) return null;

  const content = (
    <>
      <style>{bottomSheetStyles}</style>
      {/* Backdrop */}
      <div
        className="pbs-backdrop"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`pbs-sheet ${isDesktop ? "pbs-sheet--desktop" : "pbs-sheet--mobile"}`}
        style={!isDesktop ? { height: `${sheetHeight}vh` } : undefined}
      >
        {/* Drag handle (mobile only) */}
        {!isDesktop && (
          <div
            className="pbs-drag-handle"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="pbs-drag-bar" />
          </div>
        )}

        {/* Header */}
        <header className="pbs-header">
          <div className="pbs-header-left">
            <span className="pbs-label">POST</span>
            <h3 className="pbs-title">Detail</h3>
          </div>
          <button className="pbs-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>

        {/* Scrollable content */}
        <div className="pbs-body">
          {loading ? (
            <div className="pbs-loading">Loading post…</div>
          ) : !post ? (
            <div className="pbs-loading">Could not load post.</div>
          ) : (
            <>
              {/* Author */}
              <div className="pbs-author">
                <Avatar user={{ name: post.author.name, avatarUrl: post.author.avatarUrl }} size="sm" />
                <div className="pbs-author-info">
                  <VerifiedName name={post.author.name} verified={post.author.accountType === "agent"} />
                  <small>@{post.author.username} · {timeAgo(post.createdAt)}</small>
                </div>
              </div>

              {/* Body text */}
              <p className="pbs-text">{post.text}</p>

              {/* Media */}
              {post.media && post.media.length > 0 && (
                <div className="pbs-media">
                  {post.media.map((m, i) =>
                    m.publicUrl ? (
                      m.mimeType.startsWith("video/") ? (
                        <video key={i} src={m.publicUrl} controls />
                      ) : (
                        <img key={i} src={m.publicUrl} alt="" />
                      )
                    ) : null
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="pbs-actions">
                <button className={liked ? "active" : ""} onClick={() => void action("like")}>
                  <Heart size={15} fill={liked ? "currentColor" : "none"} /> {post.likes}
                </button>
                <button onClick={() => {}}>
                  <MessageCircle size={15} /> {post.comments}
                </button>
                <button className={reposted ? "active" : ""} onClick={() => void action("repost")}>
                  <Activity size={15} /> {post.reposts}
                </button>
                <span className="pbs-views"><Eye size={13} /> {post.views ?? 0}</span>
                <button className={saved ? "active" : ""} onClick={() => void action("save")}>
                  <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
                </button>
                <button onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/post/${post.id}`)}>
                  <Send size={15} />
                </button>
              </div>

              {/* Comment compose */}
              <div className="pbs-compose">
                <Avatar user={getSavedUser()} size="xs" />
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void addComment(null, comment); }}
                  placeholder="Write a comment…"
                />
                <button disabled={!comment.trim() || busy} onClick={() => void addComment(null, comment)}>
                  <Send size={13} />
                </button>
              </div>

              {/* Comments */}
              <div className="pbs-comments-section">
                <div className="pbs-section-label">COMMENTS</div>
                {post.commentsTree?.length ? (
                  <ThreadedCommentTree comments={post.commentsTree} onReply={addComment} />
                ) : (
                  <div className="pbs-no-comments">
                    <MessageCircle size={16} /> No comments yet
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}

const bottomSheetStyles = `
/* Backdrop */
.pbs-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 9998;
  animation: pbs-fade-in 0.2s ease;
}
@keyframes pbs-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Sheet — Mobile (bottom sheet) */
.pbs-sheet--mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: var(--card, #fff);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 24px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  animation: pbs-slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  max-height: 95vh;
  overflow: hidden;
}
@keyframes pbs-slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* Sheet — Desktop (side overlay) */
.pbs-sheet--desktop {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 440px;
  max-width: 100vw;
  z-index: 9999;
  background: var(--card, #fff);
  border-left: 1px solid var(--line, #ded7ce);
  box-shadow: -4px 0 24px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  animation: pbs-slide-right 0.25s cubic-bezier(0.32, 0.72, 0, 1);
  overflow: hidden;
}
@keyframes pbs-slide-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* Drag handle */
.pbs-drag-handle {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  padding: 10px 0 4px;
  cursor: grab;
  touch-action: none;
}
.pbs-drag-bar {
  width: 36px;
  height: 4px;
  border-radius: 4px;
  background: var(--line, #ded7ce);
}

/* Header */
.pbs-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--line, #ded7ce);
}
.pbs-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pbs-label {
  font-size: 8px;
  letter-spacing: 0.14em;
  color: #978d84;
  font-weight: 800;
  text-transform: uppercase;
}
.pbs-title {
  font-size: 15px;
  margin: 0;
  font-weight: 700;
}
.pbs-close {
  width: 30px;
  height: 30px;
  border: 1px solid var(--line, #ded7ce);
  background: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 0.15s;
}
.pbs-close:hover { background: var(--line, #ded7ce); }

/* Body */
.pbs-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px;
  overscroll-behavior: contain;
}
.pbs-loading {
  display: flex;
  justify-content: center;
  padding: 40px;
  color: var(--muted, #8a8178);
  font-size: 12px;
}

/* Author */
.pbs-author {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 6px;
}
.pbs-author-info {
  display: flex;
  flex-direction: column;
}
.pbs-author-info strong { font-size: 12px; }
.pbs-author-info small { font-size: 10px; color: #938980; margin-top: 1px; }

/* Text */
.pbs-text {
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 10px 0;
}

/* Media */
.pbs-media {
  display: grid;
  gap: 4px;
  border-radius: 9px;
  overflow: hidden;
  margin-bottom: 10px;
}
.pbs-media img, .pbs-media video {
  width: 100%;
  max-height: 320px;
  object-fit: contain;
  border-radius: 8px;
}

/* Actions */
.pbs-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  border-top: 1px solid var(--line, #eee8e1);
  border-bottom: 1px solid var(--line, #eee8e1);
}
.pbs-actions button {
  border: 0;
  background: none;
  color: #7d736b;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px;
  border-radius: 6px;
  font-size: 10px;
  cursor: pointer;
}
.pbs-actions button.active { color: var(--accent, #d85a2d); }
.pbs-actions button:hover { background: rgba(0,0,0,0.04); }
.pbs-views {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #7d736b;
  font-size: 10px;
  margin-left: auto;
}

/* Compose */
.pbs-compose {
  display: flex;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--line, #ded7ce);
  border-radius: 9px;
  background: var(--card, #fff);
  padding: 5px 6px;
  margin: 10px 0;
}
.pbs-compose input {
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 11px;
  min-width: 0;
}
.pbs-compose button {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 7px;
  background: var(--ink, #201c19);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.pbs-compose button:disabled { opacity: 0.5; cursor: not-allowed; }

/* Comments */
.pbs-comments-section { margin-top: 4px; }
.pbs-section-label {
  font-size: 8px;
  letter-spacing: 0.14em;
  font-weight: 800;
  color: #978d84;
  margin: 8px 0 6px;
}
.pbs-no-comments {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 24px;
  color: #958b82;
  font-size: 11px;
}
`;
