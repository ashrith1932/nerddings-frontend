"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { apiFetch } from "@/lib/api";

type UserRef = { id: string; name: string; username: string; avatarUrl?: string | null };
export type ThreadComment = { id: string; postId: string; parentId: string | null; body: string; createdAt: string; author: UserRef; replies: ThreadComment[] };

const MAX_DEPTH = 4;

const styles = `
.threaded-comments-tree{display:grid;gap:2px}.threaded-comment-node{position:relative;min-width:0}.threaded-comment-row{position:relative;display:flex;gap:8px;padding:7px 0}.threaded-comment-node.is-reply>.threaded-comment-row:before{content:"";position:absolute;left:-12px;top:21px;width:10px;height:1px;background:#d9d2ca}.threaded-comment-avatar{width:28px;height:28px;border-radius:50%;overflow:hidden;flex:0 0 28px;background:#ebe5dd;display:grid;place-items:center;font-size:9px;font-weight:800;color:#5d544d}.threaded-comment-avatar img{width:100%;height:100%;object-fit:cover}.threaded-comment-body{min-width:0;flex:1}.threaded-comment-meta{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap}.threaded-comment-meta strong{font-size:10px;line-height:1.2}.threaded-comment-meta small{font-size:8px;color:#988e86}.threaded-comment-text{margin:3px 0 4px;font-size:10px;line-height:1.5;overflow-wrap:anywhere}.threaded-comment-actions{display:flex;align-items:center;gap:10px}.threaded-comment-actions button{border:0;background:none;padding:0;color:#8c827a;font-size:9px;cursor:pointer}.threaded-comment-actions button:hover{color:#d35d35}.threaded-comment-children{margin-left:16px;padding-left:12px;border-left:1px solid #ded7cf}.threaded-comment-reply{display:flex;gap:6px;margin:5px 0 7px}.threaded-comment-reply input{min-width:0;flex:1;border:1px solid #ded7cf;border-radius:8px;padding:7px 8px;background:#fffdf9;font:inherit;font-size:9px;outline:none}.threaded-comment-reply button{width:27px;height:27px;border:0;border-radius:7px;background:#211d19;color:#fff;display:grid;place-items:center;cursor:pointer}.threaded-comment-reply button:disabled{opacity:.45;cursor:not-allowed}.threaded-thread-control{border:0;background:none;color:#9b5b39;font-size:9px;font-weight:700;padding:4px 0 7px;cursor:pointer}.threaded-thread-control:hover{text-decoration:underline}.threaded-hidden-count{color:#9a9088;font-size:8px}
`;

function initials(name: string) { return name.split(/\s+/).filter(Boolean).map(part => part[0]).join("").slice(0, 2).toUpperCase(); }
function timeAgo(value: string) { const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); if (seconds < 60) return "now"; if (seconds < 3600) return `${Math.floor(seconds / 60)}m`; if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`; return `${Math.floor(seconds / 86400)}d`; }
function descendants(c: ThreadComment): number { return c.replies.reduce((sum, child) => sum + 1 + descendants(child), 0); }

function CommentNode({ node, depth, onReply, expandedRoot = false }: { node: ThreadComment; depth: number; onReply: (parentId: string, body: string) => Promise<void>; expandedRoot?: boolean }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [continued, setContinued] = useState(expandedRoot);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const hasReplies = node.replies?.length > 0;
  const atCap = hasReplies && depth >= MAX_DEPTH && !continued;
  const send = async () => { const value = text.trim(); if (!value || busy) return; setBusy(true); try { await onReply(node.id, value); setText(""); setReplyOpen(false); } finally { setBusy(false); } };
  return <div className={`threaded-comment-node ${depth > 0 ? "is-reply" : ""}`}>
    <div className="threaded-comment-row">
      {depth > 0 && <span aria-hidden="true" />}
      <span className="threaded-comment-avatar">{node.author.avatarUrl ? <img src={node.author.avatarUrl} alt="" /> : initials(node.author.name)}</span>
      <div className="threaded-comment-body">
        <div className="threaded-comment-meta"><strong>{node.author.name}</strong><small>@{node.author.username} · {timeAgo(node.createdAt)}</small></div>
        <p className="threaded-comment-text">{node.body}</p>
        <div className="threaded-comment-actions">
          <button onClick={() => setReplyOpen(v => !v)}>Reply</button>
          {hasReplies && <button onClick={() => setCollapsed(v => !v)}>{collapsed ? "+" : "−"}</button>}
          {collapsed && hasReplies && <span className="threaded-hidden-count">{descendants(node)} repl{descendants(node) === 1 ? "y" : "ies"} hidden</span>}
        </div>
        {replyOpen && <div className="threaded-comment-reply"><input autoFocus value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && void send()} placeholder={`Reply to ${node.author.name}…`} /><button disabled={!text.trim() || busy} onClick={() => void send()}><Send size={13}/></button></div>}
      </div>
    </div>
    {hasReplies && !collapsed && <div className="threaded-comment-children">
      {atCap ? <button className="threaded-thread-control" onClick={() => setContinued(true)}>Continue this thread → ({descendants(node)} more repl{descendants(node) === 1 ? "y" : "ies"})</button> : node.replies.map(child => <CommentNode key={child.id} node={child} depth={continued ? 1 : depth + 1} onReply={onReply} expandedRoot={continued} />)}
    </div>}
  </div>;
}

export default function ThreadedCommentTree({ comments, onReply }: { comments: ThreadComment[]; onReply: (parentId: string, body: string) => Promise<void> }) {
  return <><style>{styles}</style><div className="threaded-comments-tree">{comments.map(comment => <CommentNode key={comment.id} node={comment} depth={0} onReply={onReply} />)}</div></>;
}
