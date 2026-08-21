"use client";

/**
 * AppRuntime — the ONE and ONLY global runtime for the entire app.
 *
 * Rules:
 *  1. ONE document click listener, capturing phase. All click interception happens here.
 *  2. A .profile-page guard is the FIRST check — ProfilePage owns its own React events.
 *  3. All UI (composer, project popup) rendered in a single createPortal to document.body.
 *  4. No other file in this codebase may add a global document click listener.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft, ArrowUpRight, Bookmark, Check, Clock3, FileImage,
  Github, Heart, Link2, Loader2, MessageCircle, MoreHorizontal,
  Rocket, Send, X,
} from "lucide-react";
import { apiFetch, getAuthToken, getSavedUser, uploadMedia } from "@/lib/api";
import { getAuthToken as serviceGetAuthToken } from "@/services/api";
import { getNavigationCounts } from "@/services/navigation";
import { Toast } from "@/components/ui/Toast";

// ─── types ────────────────────────────────────────────────────────────────────

type UserRef = { id: string; name: string; username: string; avatarUrl?: string | null; accountType?: string };
type ProjectRef = { id: string; name: string; slug: string; stage?: string; description?: string; githubUrl?: string | null };
type FeedPost = { id: string; authorId: string; author: UserRef; text: string; createdAt: string; likes: number; comments: number; reposts: number; saves: number; views?: number; linkUrl?: string | null; media?: Array<{ publicUrl: string | null; mimeType: string }>; project?: ProjectRef | null; quotePostId?: string | null };
type ProjectDetail = { id: string; name: string; slug: string; description: string; stage: string; githubUrl?: string | null; createdAt?: string; owner?: { id: string; name: string; username: string; avatarUrl?: string | null } | null; posts?: Array<{ id: string; body: string; created_at: string }> };
type ProjectMember = { user_id: string; name: string; username: string; avatar_url?: string | null; role?: string };
type Commit = { sha: string; message: string; author: string; date: string | null; url: string };

// ─── helpers ─────────────────────────────────────────────────────────────────

const timeAgo = (v: string) => { const s = Math.max(0, Math.floor((Date.now() - new Date(v).getTime()) / 1000)); if (s < 60) return "now"; if (s < 3600) return `${Math.floor(s / 60)}m`; if (s < 86400) return `${Math.floor(s / 3600)}h`; return `${Math.floor(s / 86400)}d`; };
const initials = (n?: string | null) => (n ?? "?").split(/\s+/).filter(Boolean).map(x => x[0]).join("").slice(0, 2).toUpperCase();
const navTo = (path: string) => { window.history.pushState({}, "", path); window.dispatchEvent(new PopStateEvent("popstate")); };

// ─── CSS (all runtime styles in one block) ────────────────────────────────────

const RUNTIME_CSS = `
html{scrollbar-gutter:stable}
.page-content{min-height:100vh;position:relative}

/* ── Composer overlay ── */
.nrt-overlay{position:fixed;inset:0;z-index:7000;display:grid;place-items:center;padding:24px;background:rgba(24,20,17,.44);backdrop-filter:blur(5px);overscroll-behavior:contain}
.nrt-composer,.nrt-menu{width:min(660px,calc(100vw - 32px));max-height:min(820px,calc(100dvh - 32px));overflow:auto;background:#fffdf9;border:1px solid #ddd6cc;border-radius:18px;box-shadow:0 30px 100px rgba(20,16,12,.25);color:#201c19}
.nrt-menu{width:min(500px,calc(100vw - 32px))}
.nrt-composer header,.nrt-menu header{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #e8e1d9}
.nrt-composer header small,.nrt-menu header small{font:700 9px/1 monospace;letter-spacing:.15em;color:#93877d}
.nrt-composer h2,.nrt-menu h2{margin:4px 0 0;font:700 22px/1.1 sans-serif}
.nrt-x{width:34px;height:34px;border:1px solid #ddd6cc;border-radius:50%;display:grid;place-items:center;background:#fff;color:#70675f;cursor:pointer}
.nrt-choice{width:calc(100% - 32px);margin:10px 16px 0;display:flex;align-items:center;gap:12px;padding:14px;border:1px solid #e2dbd3;border-radius:12px;background:#fff;text-align:left;cursor:pointer}
.nrt-choice:hover{background:#faf6f0;border-color:#c9bfb5}
.nrt-choice>span{width:34px;height:34px;border-radius:9px;background:#fce9df;color:#d85a2d;display:grid;place-items:center;flex:0 0 34px}
.nrt-choice div{min-width:0;flex:1}.nrt-choice strong{display:block;font-size:13px}.nrt-choice small{display:block;margin-top:3px;color:#8e847b;font-size:10px}
.nrt-menu footer{padding:16px 20px;color:#93877d;font-size:10px}
.nrt-author{display:flex;align-items:center;gap:10px;padding:15px 20px}
.nrt-author>div{display:flex;flex-direction:column}.nrt-author small{margin-top:2px;color:#93877d;font-size:10px}
.nrt-avatar{display:grid;place-items:center;overflow:hidden;border-radius:50%;background:#e9e3db;color:#201c19;font-weight:800;flex:0 0 auto}
.nrt-avatar img{width:100%;height:100%;object-fit:cover}
.nrt-composer textarea{display:block;width:100%;min-height:160px;border:0;outline:0;resize:vertical;padding:0 20px 18px;background:transparent;font:inherit;font-size:15px;line-height:1.65;box-sizing:border-box}
.nrt-quote-wrap{padding:0 20px 14px}
.nrt-quote{border:1px solid #ddd6cc;border-radius:12px;background:#fff;padding:12px}
.nrt-quote-head{display:flex;align-items:center;gap:9px}.nrt-quote-head>div{display:flex;flex-direction:column}.nrt-quote-head small{margin-top:2px;color:#93877d;font-size:9px}
.nrt-quote>p{margin:11px 0;font-size:12px;line-height:1.55;white-space:pre-wrap}
.nrt-fields{display:flex;flex-wrap:wrap;gap:9px;padding:12px 20px;border-top:1px solid #eee8e1}
.nrt-fields label,.nrt-fields select{height:40px;display:flex;align-items:center;gap:7px;border:1px solid #ddd6cc;border-radius:9px;background:#fff;padding:0 10px;font-size:10px;color:#645c55;box-sizing:border-box;cursor:pointer}
.nrt-fields label input[type=file]{display:none}.nrt-fields .wide{flex:1;min-width:220px}.nrt-fields .wide input{border:0;outline:0;min-width:0;width:100%;font:inherit}
.nrt-fields select{min-width:180px}
.nrt-composer footer{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid #e8e1d9;background:#fffdf9}
.nrt-composer footer span{font-size:9px;color:#93877d}
.nrt-composer footer button{border:0;border-radius:10px;background:#201c19;color:#fff;padding:10px 15px;font-weight:800;display:inline-flex;align-items:center;gap:6px;cursor:pointer}
.nrt-composer footer button:disabled{opacity:.45;cursor:not-allowed}
.nrt-error{margin:0;padding:0 20px 10px;color:#b6462d;font-size:10px}
.nrt-spin{animation:nrt-spin .8s linear infinite}@keyframes nrt-spin{to{transform:rotate(360deg)}}

/* ── Project popup ── */
.nrt-proj-backdrop{position:fixed;inset:0;z-index:6000;background:rgba(22,17,14,.38);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:24px}
.nrt-proj-panel{width:min(540px,100%);max-height:100%;background:#fffdf9;border:1px solid #dfd8cf;border-radius:18px;box-shadow:0 30px 100px rgba(0,0,0,.18);display:flex;flex-direction:column;overflow:hidden;animation:nrt-proj-in .3s cubic-bezier(.22,1,.36,1)}
@keyframes nrt-proj-in{from{transform:translateY(20px) scale(0.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
.nrt-proj-head{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid #ede6de;flex:0 0 auto;background:#fffdf9}
.nrt-proj-back{display:inline-flex;align-items:center;gap:6px;border:0;background:none;color:#8a8077;font-size:11px;font-weight:700;padding:6px 4px;cursor:pointer;border-radius:7px}
.nrt-proj-back:hover{color:#201c19;background:#f3ede6}
.nrt-proj-close{margin-left:auto;width:32px;height:32px;border:1px solid #e2dbd2;border-radius:50%;background:#fff;display:grid;place-items:center;cursor:pointer;color:#8a8077;flex:0 0 auto}
.nrt-proj-close:hover{background:#f3ede6;color:#201c19}
.nrt-proj-scroll{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:18px}
.nrt-proj-hero{background:linear-gradient(115deg,#161310,#2a1e19 60%,#352019);border-radius:14px;padding:22px;color:#fff;position:relative;overflow:hidden;margin-bottom:14px}
.nrt-proj-hero:before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.07) .8px,transparent .8px);background-size:13px 13px;opacity:.16;pointer-events:none}
.nrt-proj-hero-inner{position:relative;z-index:1}
.nrt-proj-eyebrow{font-size:8px;letter-spacing:.16em;font-weight:800;color:#f07b54;margin-bottom:6px}
.nrt-proj-name{font-size:24px;font-weight:800;letter-spacing:-.03em;margin:0 0 6px;line-height:1.1}
.nrt-proj-desc{font-size:11px;line-height:1.6;color:#d9d0c8;margin:0 0 12px}
.nrt-proj-badges{display:flex;gap:6px;flex-wrap:wrap}
.nrt-proj-badge{display:inline-flex;align-items:center;gap:4px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);border-radius:999px;padding:4px 8px;color:#f3ece7;font-size:8px;font-weight:700}
.nrt-proj-badge.accent{border-color:rgba(232,93,47,.5);color:#ff9a73}
.nrt-proj-gh{display:inline-flex;align-items:center;gap:6px;color:#fff;text-decoration:none;border:1px solid rgba(255,255,255,.25);border-radius:9px;padding:8px 10px;font-size:10px;font-weight:800;margin-top:12px}
.nrt-proj-gh:hover{background:rgba(255,255,255,.07)}
.nrt-proj-card{border:1px solid #ede6de;border-radius:12px;background:#fff;padding:14px;margin-bottom:12px}
.nrt-proj-card-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.nrt-proj-icon{width:24px;height:24px;border-radius:7px;background:#fff1e9;color:#e85d2f;display:grid;place-items:center;font-size:11px;font-weight:900;flex:0 0 auto}
.nrt-proj-card h3{font-size:12px;margin:0;font-weight:750}
.nrt-proj-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.nrt-proj-stat{border:1px solid #ede6de;border-radius:9px;padding:10px 6px;text-align:center}
.nrt-proj-stat strong{font-size:17px;display:block;letter-spacing:-.02em}
.nrt-proj-stat span{display:block;color:#91877f;font-size:8px;margin-top:2px}
.nrt-proj-detail-row{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:10px;padding:4px 0}
.nrt-proj-detail-row>span:first-child{color:#8c8279}
.nrt-proj-owner{margin-top:10px;border:1px solid #ede6de;border-radius:9px;display:flex;align-items:center;gap:9px;padding:9px;background:#fafaf8;cursor:pointer;width:100%;text-align:left}
.nrt-proj-owner:hover{background:#f5f0ea;border-color:#d0c8bf}
.nrt-proj-avatar{width:30px;height:30px;border-radius:50%;overflow:hidden;background:#e8e2db;display:grid;place-items:center;font-size:9px;font-weight:800;flex:0 0 auto}
.nrt-proj-avatar img{width:100%;height:100%;object-fit:cover}
.nrt-proj-meta{flex:1;min-width:0}
.nrt-proj-meta strong{display:block;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nrt-proj-meta small{display:block;font-size:8px;color:#91877f;margin-top:1px}
.nrt-proj-role{padding:3px 6px;border-radius:999px;font-size:7px;font-weight:800;background:#eff0ed;color:#615a54}
.nrt-proj-member{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f0ebe4}
.nrt-proj-member:last-child{border-bottom:0}
.nrt-proj-update{border:1px solid #ede6de;border-radius:9px;padding:10px;margin-bottom:7px;background:#fafaf8}
.nrt-proj-update:last-child{margin-bottom:0}
.nrt-proj-update strong{display:block;font-size:10px;line-height:1.5}
.nrt-proj-update small{display:block;margin-top:4px;color:#91877f;font-size:8px}
.nrt-proj-commit{display:grid;grid-template-columns:10px minmax(0,1fr) 14px;gap:8px;align-items:center;border:1px solid #ede6de;border-radius:9px;padding:9px;text-decoration:none;color:inherit;margin-bottom:6px;background:#fff;transition:background .15s,border-color .15s}
.nrt-proj-commit:last-child{margin-bottom:0}
.nrt-proj-commit:hover{background:#faf7f2;border-color:#c9bfb5}
.nrt-proj-commit-dot{width:8px;height:8px;border-radius:50%;background:#28a967;box-shadow:0 0 0 3px #e8f7ef}
.nrt-proj-commit-main{min-width:0}
.nrt-proj-commit-main strong{display:block;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nrt-proj-commit-main small{display:block;font-size:7px;color:#91877f;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nrt-proj-loading{display:grid;place-items:center;min-height:200px;gap:8px;color:#91877f;font-size:11px}
.nrt-proj-empty{padding:16px;text-align:center;color:#91877f;font-size:10px}
.nrt-proj-full{width:100%;border:1px solid #e2dbd2;border-radius:10px;padding:10px 14px;background:#fff;color:#5f5750;font-size:10px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:24px}
.nrt-proj-full:hover{background:#f5f0ea}

/* ── Settings role upgrade ── */
.nerdd-role-upgrade{margin-top:18px;border-top:1px solid #eee8e1;padding-top:18px}
.nerdd-role-card{border:1px solid #e0d9d1;border-radius:11px;padding:12px;margin-top:9px;background:#fcfaf7}
.nerdd-role-card-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
.nerdd-role-card strong{font-size:11px}.nerdd-role-card small{font-size:8px;color:#91877e}
.nerdd-role-input{display:flex;gap:6px;margin-top:9px}
.nerdd-role-input input{flex:1;min-width:0;border:1px solid #ddd6cc;border-radius:8px;padding:8px;font-size:10px;outline:0}
.nerdd-role-input button{border:0;border-radius:8px;background:#211d19;color:#fff;padding:8px 10px;display:flex;align-items:center;gap:4px;font-size:9px;font-weight:800}
.nerdd-role-status{font-size:8px;margin-top:7px;color:#9a9087;display:flex;gap:5px;align-items:center}

@media(max-width:640px){
  .nrt-overlay{padding:10px}
  .nrt-composer,.nrt-menu{width:100%;max-height:calc(100dvh - 20px);border-radius:14px}
  .nrt-fields{display:grid}.nrt-fields .wide,.nrt-fields select{min-width:0;width:100%}
}
@media(max-width:600px){.nrt-proj-backdrop{padding:12px}.nrt-proj-panel{border-radius:14px}}
`;

// ─── Tiny avatar used in composer ────────────────────────────────────────────

function MiniAvatar({ user, size = 36 }: { user?: UserRef | null; size?: number }) {
  return (
    <span className="nrt-avatar" style={{ width: size, height: size }}>
      {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials(user?.name)}
    </span>
  );
}

// ─── Post Composer ────────────────────────────────────────────────────────────

function Composer({ quote, onClose, onPosted }: { quote?: FeedPost | null; onClose: () => void; onPosted: () => void }) {
  const viewer = getSavedUser();
  const [text, setText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [projects, setProjects] = useState<ProjectRef[]>([]);
  const [projectSlug, setProjectSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!viewer?.username) return;
    apiFetch<{ data: { projects?: ProjectRef[] } }>(`/social/users/${encodeURIComponent(viewer.username)}/profile-live`)
      .then(r => setProjects(r.data.projects ?? [])).catch(() => setProjects([]));
  }, [viewer?.username]);
  const publish = async () => {
    if (!text.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const media = [];
      for (const file of files) media.push(await uploadMedia(file));
      await apiFetch("/posts", { method: "POST", body: JSON.stringify({ body: text.trim(), linkUrl: linkUrl.trim() || undefined, media, projectSlug: projectSlug || undefined, quotePostId: quote?.id || undefined }) });
      onPosted();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to publish this post."); }
    finally { setBusy(false); }
  };
  return (
    <div className="nrt-overlay" onMouseDown={e => e.currentTarget === e.target && !busy && onClose()}>
      <section className="nrt-composer">
        <header>
          <div><small>{quote ? "AMPLIFY" : "CREATE"}</small><h2>{quote ? "Amplify this post" : "Create a post"}</h2></div>
          <button className="nrt-x" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="nrt-author"><MiniAvatar user={viewer} size={40} /><div><strong>{viewer?.name ?? "Member"}</strong><small>@{viewer?.username ?? "member"}</small></div></div>
        {quote ? <div className="nrt-quote-wrap"><article className="nrt-quote"><div className="nrt-quote-head"><MiniAvatar user={quote.author} size={32} /><div><strong>{quote.author.name}</strong><small>@{quote.author.username} · {timeAgo(quote.createdAt)}</small></div></div><p>{quote.text}</p></article></div> : null}
        <textarea autoFocus value={text} maxLength={5000} onChange={e => setText(e.target.value)} placeholder={quote ? "Add your perspective…" : "What are you building, learning, testing or shipping?"} />
        <div className="nrt-fields">
          <label><FileImage size={15} /><span>{files.length ? `${files.length} media` : "Add media"}</span><input type="file" multiple accept="image/*,video/*" onChange={e => setFiles(Array.from(e.target.files ?? []).slice(0, 10))} /></label>
          <label className="wide"><Link2 size={15} /><input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="Optional link" /></label>
          <select value={projectSlug} onChange={e => setProjectSlug(e.target.value)}><option value="">No project</option>{projects.map(p => <option key={p.id} value={p.slug}>{p.name}</option>)}</select>
        </div>
        {error && <p className="nrt-error">{error}</p>}
        <footer><span>{text.length}/5000</span><button disabled={!text.trim() || busy} onClick={() => void publish()}>{busy ? <><Loader2 size={15} className="nrt-spin" /> Publishing…</> : <>Publish <ArrowUpRight size={15} /></>}</button></footer>
      </section>
    </div>
  );
}

function CreateMenu({ onClose, onPost, onProject }: { onClose: () => void; onPost: () => void; onProject: () => void }) {
  return (
    <div className="nrt-overlay" onMouseDown={e => e.currentTarget === e.target && onClose()}>
      <section className="nrt-menu">
        <header><div><small>MAKE SOMETHING</small><h2>Create</h2></div><button className="nrt-x" onClick={onClose}><X size={18} /></button></header>
        <button className="nrt-choice" onClick={onPost}><span><MessageCircle size={17} /></span><div><strong>Post</strong><small>Share an update, idea or build note</small></div><ArrowUpRight size={15} /></button>
        <button className="nrt-choice" onClick={onProject}><span><Rocket size={17} /></span><div><strong>Project</strong><small>Give your work a home and invite collaborators</small></div><ArrowUpRight size={15} /></button>
        <footer>Choose what you want to publish.</footer>
      </section>
    </div>
  );
}



// ─── Settings Role Upgrade (portal into .settings-panel) ─────────────────────

type Aff = { id: string; name: string; role: string };
type RoleRequest = { id: string; agentId: string; agentName: string; currentRole?: string; requestedRole: string; status: string };

function SettingsRoleUpgrade() {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [affiliations, setAffiliations] = useState<Aff[]>([]);
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const load = () => {
    if (!window.location.pathname.startsWith("/settings")) { setMount(null); return; }
    const host = document.querySelector<HTMLElement>(".settings-panel");
    if (!host) { setMount(null); return; }
    let node = host.querySelector<HTMLElement>(".nerdd-role-upgrade-mount");
    if (!node) { node = document.createElement("div"); node.className = "nerdd-role-upgrade-mount"; host.appendChild(node); }
    setMount(node);
    const user = getSavedUser();
    if (!user?.username) return;
    apiFetch<any>(`/social/users/${encodeURIComponent(user.username)}/profile-live`).then(r => setAffiliations(r.data.affiliations ?? [])).catch(() => setAffiliations([]));
    apiFetch<any>("/social/affiliations/role-requests").then(r => setRequests(r.data ?? [])).catch(() => setRequests([]));
  };
  useEffect(() => { load(); const onPop = () => window.setTimeout(load, 0); window.addEventListener("popstate", onPop); return () => { window.removeEventListener("popstate", onPop); document.querySelectorAll(".nerdd-role-upgrade-mount").forEach(x => x.remove()); }; }, []);
  const submit = async (agentId: string) => { const requestedRole = values[agentId]?.trim(); if (!requestedRole) return; try { await apiFetch("/affiliations/role-requests", { method: "POST", body: JSON.stringify({ agentId, requestedRole }) }); setValues(v => ({ ...v, [agentId]: "" })); load(); } catch (e) { window.alert(e instanceof Error ? e.message : "Role request failed"); } };
  if (!mount) return null;
  return createPortal(
    <section className="nerdd-role-upgrade">
      <div className="eyebrow">ROLE UPGRADES</div>
      <p style={{ fontSize: 10, color: "#91877e", margin: "4px 0 10px" }}>Request a new role inside an existing verified Agent affiliation.</p>
      {affiliations.length ? affiliations.map(a => { const pending = requests.find(r => r.agentId === a.id && r.status === "pending"); return <article className="nerdd-role-card" key={a.id}><div className="nerdd-role-card-head"><span><strong>{a.name}</strong><small>Current role · {a.role}</small></span>{pending ? <span className="nerdd-role-status"><Clock3 size={11} /> Pending: {pending.requestedRole}</span> : <Check size={14} />}</div>{!pending && <div className="nerdd-role-input"><input value={values[a.id] ?? ""} onChange={e => setValues(v => ({ ...v, [a.id]: e.target.value }))} placeholder="Request a new role" /><button onClick={() => void submit(a.id)}><Send size={11} /> Request</button></div>}</article>; })
        : <div style={{ fontSize: 10, color: "#91877e" }}>No active Agent affiliations yet.</div>}
    </section>,
    mount
  );
}

// ─── Body lock ────────────────────────────────────────────────────────────────

function LockBody({ active }: { active: boolean }) {
  useEffect(() => { if (!active) return; const prev = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = prev; }; }, [active]);
  return null;
}

// ─── AppRuntime (root export) ─────────────────────────────────────────────────

export default function AppRuntime({ path }: { path: string }) {
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [quote, setQuote] = useState<FeedPost | null>(null);
  const feedCacheRef = useRef<FeedPost[]>([]);

  // ── hydrate post IDs onto DOM cards ──────────────────────────────────────
  const hydrateFeed = async () => {
    try {
      const r = await apiFetch<{ data: FeedPost[] }>("/social/feed?mode=for-you");
      feedCacheRef.current = r.data ?? [];
      for (const selector of [".home-post", ".se-post", ".social-post-card"]) {
        document.querySelectorAll<HTMLElement>(selector).forEach((card, i) => {
          const post = feedCacheRef.current[i];
          if (post) { card.dataset.postId = String(post.id); if (post.project?.slug) card.dataset.projectSlug = String(post.project.slug); }
        });
      }
    } catch { /* silently skip */ }
  };

  // ── navigation badge refresh ──────────────────────────────────────────────
  const refreshBadges = async () => {
    if (!serviceGetAuthToken()) return;
    try {
      const { notifications, messages } = await getNavigationCounts();
      document.querySelectorAll<HTMLElement>(".nav-item").forEach(item => {
        const label = item.querySelector("span")?.textContent?.trim();
        const count = label === "Messages" ? messages : label === "Notifications" ? notifications : 0;
        let badge = item.querySelector<HTMLElement>("b");
        if (count <= 0) { badge?.remove(); return; }
        if (!badge) { badge = document.createElement("b"); item.appendChild(badge); }
        badge.textContent = count > 99 ? "99+" : String(count);
      });
    } catch { /* badges are non-critical */ }
  };

  // ── set body route attr (used by some CSS selectors) ─────────────────────
  useEffect(() => {
    document.body.dataset.appRoute = path;
    return () => { delete document.body.dataset.appRoute; };
  }, [path]);

  // ── search bar enter key ──────────────────────────────────────────────────
  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>(".header-search input");
    if (!input) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Enter") { const q = input.value.trim(); if (q) navTo(`/search?q=${encodeURIComponent(q)}`); } };
    input.addEventListener("keydown", onKey);
    return () => input.removeEventListener("keydown", onKey);
  });

  // ── main effect: click listener + badge + hydration ───────────────────────
  useEffect(() => {
    setReady(true);

    void hydrateFeed();
    void refreshBadges();
    const feedTimer = window.setInterval(() => void hydrateFeed(), 3000);
    const badgeTimer = window.setInterval(() => void refreshBadges(), 15000);

    const isAmplify = (btn: HTMLElement) => {
      if (btn.dataset.action === "amplify") return true;
      const label = `${btn.getAttribute("aria-label") ?? ""} ${btn.textContent ?? ""}`.toLowerCase();
      if (label.includes("amplif") || label.includes("quote")) return true;
      const group = btn.closest(".home-actions,.se-actions");
      if (!group) return false;
      return Array.from(group.querySelectorAll("button")).indexOf(btn as HTMLButtonElement) === 2;
    };

    /**
     * THE ONE AND ONLY global click handler.
     * Priority chain (first match wins):
     *   0. Inside .profile-page → bail immediately (ProfilePage owns its clicks)
     *   1. Inside .nrt-overlay or .nrt-proj-backdrop → bail (UI owns its clicks)
     *   2. Create/header-create buttons → open create menu
     *   3. Amplify buttons (home feed only) → open composer with quote
     *   4. .home-author, .post-detail-author-button etc → navigate to profile
     *   5. .home-comment-meta strong → navigate to profile
     *   6. .home-project → open project popup
     *   7. .social-post-card, .home-post → dispatch open-post event
     */
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 0. Profile page owns all its own clicks via React
      if (target.closest(".profile-page")) return;

      // 1. Don't intercept clicks inside our own UI
      if (target.closest(".nrt-overlay,.nrt-proj-backdrop")) return;

      // 2. Create menu
      const createTarget = target.closest<HTMLElement>(".create-button,.header-create,.mobile-create");
      if (createTarget) {
        e.preventDefault(); e.stopImmediatePropagation();
        if (!getAuthToken()) { window.dispatchEvent(new CustomEvent("nerdding:auth-required")); return; }
        setCreateOpen(true); setComposerOpen(false); setQuote(null);
        return;
      }

      // 3. Amplify/quote button
      const btnTarget = target.closest<HTMLElement>("button");
      if (btnTarget && isAmplify(btnTarget)) {
        const card = btnTarget.closest<HTMLElement>(".home-post,.se-post,.social-post-card");
        const id = card?.dataset.postId;
        if (id) {
          e.preventDefault(); e.stopImmediatePropagation();
          if (!getAuthToken()) { window.dispatchEvent(new CustomEvent("nerdding:auth-required")); return; }
          apiFetch<{ data: FeedPost }>(`/social/posts/${encodeURIComponent(id)}`).then(r => { setCreateOpen(false); setQuote(r.data); setComposerOpen(true); }).catch(() => undefined);
        }
        return;
      }

      // 4. Author identity → navigate to profile
      const identity = target.closest<HTMLElement>(".home-author,.post-detail-author-button,.post-comment-author,.project-contributor-row");
      if (identity) {
        const match = (identity.querySelector("small")?.textContent ?? "").match(/@([a-zA-Z0-9_.-]+)/);
        if (match) { e.preventDefault(); e.stopPropagation(); navTo(`/profile/${encodeURIComponent(match[1])}`); return; }
      }

      // 5. Comment author name → navigate to profile
      const commentMeta = target.closest<HTMLElement>(".home-comment-meta");
      if (commentMeta && target.closest("strong")) {
        const match = (commentMeta.querySelector("span")?.textContent ?? "").match(/@([a-zA-Z0-9_.-]+)/);
        if (match) { e.preventDefault(); e.stopPropagation(); navTo(`/profile/${encodeURIComponent(match[1])}`); return; }
      }

      // 6. Deleted Project badge global listener!
      // (The click is intercepted by HomeFeedSurface / ProfilePage via nerdding:open-project-inline)

      // 7. Post card click → dispatch open-post event (handled by AppRouter/pages)
      const postCard = target.closest<HTMLElement>(".social-post-card");
      if (postCard?.dataset.postId && !target.closest("button,a,video")) {
        e.preventDefault(); e.stopPropagation();
        window.dispatchEvent(new CustomEvent("nerdding:open-post", { detail: { postId: postCard.dataset.postId } }));
        return;
      }
    };

    // ── nerdding events ───────────────────────────────────────────────────────
    const onToast = (e: Event) => { const msg = (e as CustomEvent<string>).detail; if (msg) setToast(msg); };
    const onOpenComposer = () => { setCreateOpen(false); setQuote(null); setComposerOpen(true); };
    const onOpenProject = (e: Event) => {
      const slug = (e as CustomEvent<{ slug?: string; id?: string }>).detail?.slug;
      if (slug) {
        window.history.pushState({}, "", `/project/${encodeURIComponent(slug)}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    };
    const onFeedRefresh = () => void hydrateFeed();

    document.addEventListener("click", onClick, true);
    window.addEventListener("nerdding:toast", onToast);
    window.addEventListener("nerdding:open-composer", onOpenComposer);
    window.addEventListener("nerdding:open-create-post", onOpenComposer);
    window.addEventListener("nerdding:open-project-panel", onOpenProject as EventListener);
    window.addEventListener("nerdding:open-project", onOpenProject as EventListener);
    window.addEventListener("nerdding:feed-refresh", onFeedRefresh);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("nerdding:toast", onToast);
      window.removeEventListener("nerdding:open-composer", onOpenComposer);
      window.removeEventListener("nerdding:open-create-post", onOpenComposer);
      window.removeEventListener("nerdding:open-project-panel", onOpenProject as EventListener);
      window.removeEventListener("nerdding:open-project", onOpenProject as EventListener);
      window.removeEventListener("nerdding:feed-refresh", onFeedRefresh);
      window.clearInterval(feedTimer);
      window.clearInterval(badgeTimer);
    };
  }, []);

  // toast auto-dismiss
  useEffect(() => { if (!toast) return; const t = window.setTimeout(() => setToast(""), 2800); return () => window.clearTimeout(t); }, [toast]);

  const modalOpen = createOpen || composerOpen;

  return (
    <>
      <style>{RUNTIME_CSS}</style>
      <LockBody active={modalOpen} />
      <SettingsRoleUpgrade />
      {ready && createPortal(
        <>
          {createOpen && <CreateMenu onClose={() => setCreateOpen(false)} onPost={() => { setCreateOpen(false); setComposerOpen(true); }} onProject={() => { setCreateOpen(false); navTo("/project/new"); }} />}
          {composerOpen && <Composer quote={quote} onClose={() => { setComposerOpen(false); setQuote(null); }} onPosted={() => { setComposerOpen(false); setQuote(null); window.dispatchEvent(new Event("nerdding:feed-refresh")); }} />}
          {toast && <Toast message={toast} onClose={() => setToast("")} />}
        </>,
        document.body
      )}
    </>
  );
}
