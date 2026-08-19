// @ts-nocheck
"use client";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bookmark,
  FileImage,
  Heart,
  Link2,
  Loader2,
  MessageCircle,
  Rocket,
  X,
} from "lucide-react";
import { apiFetch, getAuthToken, getSavedUser, uploadMedia } from "@/lib/api";

type UserRef = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  accountType?: string;
};
type ProjectRef = {
  id: string;
  name: string;
  slug: string;
  stage?: string;
  description?: string;
  githubUrl?: string | null;
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
  linkUrl?: string | null;
  media?: Array<{ publicUrl: string | null; mimeType: string }>;
  project?: ProjectRef | null;
  quotePostId?: string | null;
};
const timeAgo = (v: string) => {
  const s = Math.max(
    0,
    Math.floor((Date.now() - new Date(v).getTime()) / 1000),
  );
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};
const initials = (n?: string) =>
  (n ?? "N")
    .split(/\s+/)
    .filter(Boolean)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
function Avatar({ user, size = 36 }: { user?: UserRef | null; size?: number }) {
  return (
    <span className="nerdd-create-avatar" style={{ width: size, height: size }}>
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt="" />
      ) : (
        initials(user?.name)
      )}
    </span>
  );
}
function QuotedPostCard({ post }: { post: FeedPost }) {
  return (
    <article className="nerdd-quote-card">
      <div className="nerdd-quote-author">
        <Avatar user={post.author} size={32} />
        <div>
          <strong>{post.author.name}</strong>
          <small>
            @{post.author.username} · {timeAgo(post.createdAt)}
          </small>
        </div>
      </div>
      <p>{post.text}</p>
      {post.media?.length ? (
        <div
          className={`nerdd-quote-media count-${Math.min(post.media.length, 4)}`}
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
                  />
                ) : (
                  <img key={`${m.publicUrl}-${i}`} src={m.publicUrl} alt="" />
                )
              ) : null,
            )}
        </div>
      ) : null}
      {post.project ? (
        <div className="nerdd-quote-project">
          <Rocket size={14} />
          <span>
            <strong>{post.project.name}</strong>
            <small>{post.project.stage ?? "Project"}</small>
          </span>
        </div>
      ) : null}
      {post.linkUrl ? (
        <div className="nerdd-quote-link">
          <Link2 size={13} />
          {post.linkUrl.replace(/^https?:\/\//, "")}
        </div>
      ) : null}
      <div className="nerdd-quote-stats">
        <span>
          <Heart size={13} />
          {post.likes}
        </span>
        <span>
          <MessageCircle size={13} />
          {post.comments}
        </span>
        <span>
          <Activity size={13} />
          {post.reposts}
        </span>
        <span className="spacer" />
        <span>{post.views ?? 0} views</span>
        <span>
          <Bookmark size={13} />
          {post.saves}
        </span>
      </div>
    </article>
  );
}
function Composer({
  quote,
  onClose,
  onPosted,
}: {
  quote?: FeedPost | null;
  onClose: () => void;
  onPosted: () => void;
}) {
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
    apiFetch<{ data: { projects?: ProjectRef[] } }>(
      `/social/users/${encodeURIComponent(viewer.username)}/profile-live`,
    )
      .then((r) => setProjects(r.data.projects ?? []))
      .catch(() => setProjects([]));
  }, [viewer?.username]);
  const publish = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const media = [];
      for (const file of files) media.push(await uploadMedia(file));
      await apiFetch("/posts", {
        method: "POST",
        body: JSON.stringify({
          body: text.trim(),
          linkUrl: linkUrl.trim() || undefined,
          media,
          projectSlug: projectSlug || undefined,
          quotePostId: quote?.id || undefined,
        }),
      });
      onPosted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to publish this post.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className="nerdd-create-overlay"
      onMouseDown={(e) => e.currentTarget === e.target && !busy && onClose()}
    >
      <section className="nerdd-create-composer">
        <header>
          <div>
            <small>{quote ? "AMPLIFY" : "CREATE"}</small>
            <h2>{quote ? "Amplify this post" : "Create a post"}</h2>
          </div>
          <button className="nerdd-create-close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="nerdd-create-author">
          <Avatar user={viewer} size={40} />
          <div>
            <strong>{viewer?.name ?? "Member"}</strong>
            <small>@{viewer?.username ?? "member"}</small>
          </div>
        </div>
        {quote ? (
          <div className="nerdd-create-quote-wrap">
            <QuotedPostCard post={quote} />
          </div>
        ) : null}
        <textarea
          autoFocus
          value={text}
          maxLength={5000}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            quote
              ? "Add your perspective…"
              : "What are you building, learning, testing or shipping?"
          }
        />
        <div className="nerdd-create-fields">
          <label>
            <FileImage size={15} />
            <span>{files.length ? `${files.length} media` : "Add media"}</span>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) =>
                setFiles(Array.from(e.target.files ?? []).slice(0, 10))
              }
            />
          </label>
          <label className="wide">
            <Link2 size={15} />
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Optional link"
            />
          </label>
          <select
            value={projectSlug}
            onChange={(e) => setProjectSlug(e.target.value)}
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="nerdd-create-error">{error}</p>}
        <footer>
          <span>{text.length}/5000</span>
          <button
            disabled={!text.trim() || busy}
            onClick={() => void publish()}
          >
            {busy ? (
              <>
                <Loader2 size={15} className="nerdd-create-spin" />
                Publishing…
              </>
            ) : (
              <>
                Publish <ArrowUpRight size={15} />
              </>
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}
function CreateMenu({
  onClose,
  onPost,
  onProject,
}: {
  onClose: () => void;
  onPost: () => void;
  onProject: () => void;
}) {
  return (
    <div
      className="nerdd-create-overlay"
      onMouseDown={(e) => e.currentTarget === e.target && onClose()}
    >
      <section className="nerdd-create-menu">
        <header>
          <div>
            <small>MAKE SOMETHING</small>
            <h2>Create</h2>
          </div>
          <button className="nerdd-create-close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <button className="nerdd-create-choice" onClick={onPost}>
          <span>
            <MessageCircle size={17} />
          </span>
          <div>
            <strong>Post</strong>
            <small>Share an update, idea or build note</small>
          </div>
          <ArrowUpRight size={15} />
        </button>
        <button className="nerdd-create-choice" onClick={onProject}>
          <span>
            <Rocket size={17} />
          </span>
          <div>
            <strong>Project</strong>
            <small>Give your work a home and invite collaborators</small>
          </div>
          <ArrowUpRight size={15} />
        </button>
        <footer>Choose what you want to publish.</footer>
      </section>
    </div>
  );
}
export default function InteractionCreateLayer() {
  const [mounted, setMounted] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [quote, setQuote] = useState<FeedPost | null>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!mounted) return;
    const hydrate = async () => {
      try {
        const r = await apiFetch<{ data: FeedPost[] }>(
          "/social/feed?mode=for-you",
        );
        const posts = r.data ?? [];
        for (const selector of [
          ".home-post",
          ".se-post",
          ".social-post-card",
        ]) {
          document
            .querySelectorAll<HTMLElement>(selector)
            .forEach((card, i) => {
              if (posts[i]) card.dataset.postId = String(posts[i].id);
            });
        }
      } catch {}
    };
    const isAmplify = (button: HTMLElement) => {
      if (button.dataset.action === "amplify") return true;
      const label =
        `${button.getAttribute("aria-label") ?? ""} ${button.getAttribute("title") ?? ""} ${button.textContent ?? ""}`.toLowerCase();
      if (label.includes("amplif") || label.includes("quote")) return true;
      const group = button.closest(".home-actions,.se-actions");
      if (!group) return false;
      const index = Array.from(group.querySelectorAll("button")).indexOf(
        button,
      );
      return index === 2;
    };
    const openComposer = () => {
      if (!getAuthToken()) {
        window.dispatchEvent(new CustomEvent("nerdding:auth-required"));
        return;
      }
      setCreateOpen(false);
      setQuote(null);
      setComposerOpen(true);
    };
    const openCreate = () => {
      if (!getAuthToken()) {
        window.dispatchEvent(new CustomEvent("nerdding:auth-required"));
        return;
      }
      setCreateOpen(true);
      setComposerOpen(false);
      setQuote(null);
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.closest(".nerdd-create-overlay")) return;
      const createTarget = target.closest<HTMLElement>(
        ".create-button,.header-create,.mobile-create",
      );
      if (createTarget) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openCreate();
        return;
      }
      const amplifyTarget = target.closest<HTMLElement>("button");
      if (amplifyTarget && isAmplify(amplifyTarget)) {
        const card = amplifyTarget.closest<HTMLElement>(
          ".home-post,.se-post,.social-post-card",
        );
        const id = card?.dataset.postId;
        if (!id) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!getAuthToken()) {
          window.dispatchEvent(new CustomEvent("nerdding:auth-required"));
          return;
        }
        apiFetch<{ data: FeedPost }>(`/social/posts/${encodeURIComponent(id)}`)
          .then((r) => {
            setCreateOpen(false);
            setQuote(r.data);
            setComposerOpen(true);
          })
          .catch(() => undefined);
      }
    };
    const onOpenPost = () => openComposer();
    window.addEventListener("click", onClick, true);
    window.addEventListener("nerdding:open-create-post", onOpenPost);
    void hydrate();
    const refresh = () => void hydrate();
    window.addEventListener("nerdding:feed-refresh", refresh);
    const timer = window.setInterval(() => void hydrate(), 2500);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("nerdding:open-create-post", onOpenPost);
      window.removeEventListener("nerdding:feed-refresh", refresh);
      window.clearInterval(timer);
    };
  }, [mounted]);
  if (!mounted) return null;
  return createPortal(
    <>
      <style>{`.nerdd-create-overlay{position:fixed;inset:0;z-index:7000;display:grid;place-items:center;padding:24px;background:rgba(24,20,17,.44);backdrop-filter:blur(5px);overscroll-behavior:contain}.nerdd-create-menu,.nerdd-create-composer{width:min(660px,calc(100vw - 32px));max-height:min(820px,calc(100dvh - 32px));overflow:auto;background:#fffdf9;border:1px solid #ddd6cc;border-radius:18px;box-shadow:0 30px 100px rgba(20,16,12,.25);color:#201c19}.nerdd-create-menu{width:min(500px,calc(100vw - 32px))}.nerdd-create-menu header,.nerdd-create-composer header{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #e8e1d9}.nerdd-create-menu header small,.nerdd-create-composer header small{font:700 9px/1 monospace;letter-spacing:.15em;color:#93877d}.nerdd-create-menu h2,.nerdd-create-composer h2{margin:4px 0 0;font:700 22px/1.1 sans-serif}.nerdd-create-close{width:34px;height:34px;border:1px solid #ddd6cc;border-radius:50%;display:grid;place-items:center;background:#fff;color:#70675f;cursor:pointer}.nerdd-create-choice{width:calc(100% - 32px);margin:10px 16px 0;display:flex;align-items:center;gap:12px;padding:14px;border:1px solid #e2dbd3;border-radius:12px;background:#fff;text-align:left;cursor:pointer}.nerdd-create-choice:hover{background:#faf6f0;border-color:#c9bfb5}.nerdd-create-choice>span{width:34px;height:34px;border-radius:9px;background:#fce9df;color:#d85a2d;display:grid;place-items:center;flex:0 0 34px}.nerdd-create-choice div{min-width:0;flex:1}.nerdd-create-choice strong{display:block;font-size:13px}.nerdd-create-choice small{display:block;margin-top:3px;color:#8e847b;font-size:10px}.nerdd-create-menu footer{padding:16px 20px;color:#93877d;font-size:10px}.nerdd-create-author{display:flex;align-items:center;gap:10px;padding:15px 20px}.nerdd-create-author>div{display:flex;flex-direction:column}.nerdd-create-author small{margin-top:2px;color:#93877d;font-size:10px}.nerdd-create-avatar{display:grid;place-items:center;overflow:hidden;border-radius:50%;background:#e9e3db;color:#201c19;font-weight:800;flex:0 0 auto}.nerdd-create-avatar img{width:100%;height:100%;object-fit:cover}.nerdd-create-composer textarea{display:block;width:100%;min-height:160px;border:0;outline:0;resize:vertical;padding:0 20px 18px;background:transparent;font:inherit;font-size:15px;line-height:1.65;box-sizing:border-box}.nerdd-create-quote-wrap{padding:0 20px 14px}.nerdd-quote-card{border:1px solid #ddd6cc;border-radius:12px;background:#fff;padding:12px}.nerdd-quote-author{display:flex;align-items:center;gap:9px}.nerdd-quote-author>div{display:flex;flex-direction:column}.nerdd-quote-author small{margin-top:2px;color:#93877d;font-size:9px}.nerdd-quote-card>p{margin:11px 0;font-size:12px;line-height:1.55;white-space:pre-wrap}.nerdd-quote-media{display:grid;gap:4px;overflow:hidden;border-radius:8px}.nerdd-quote-media.count-2,.nerdd-quote-media.count-3,.nerdd-quote-media.count-4{grid-template-columns:repeat(2,1fr)}.nerdd-quote-media img,.nerdd-quote-media video{width:100%;height:180px;object-fit:cover}.nerdd-quote-media.count-2 img,.nerdd-quote-media.count-2 video,.nerdd-quote-media.count-3 img,.nerdd-quote-media.count-3 video,.nerdd-quote-media.count-4 img,.nerdd-quote-media.count-4 video{height:120px}.nerdd-quote-project{display:flex;align-items:center;gap:8px;padding:8px 0;color:#8f857c}.nerdd-quote-project span{display:flex;flex-direction:column}.nerdd-quote-project strong{font-size:10px;color:#201c19}.nerdd-quote-project small{font-size:9px}.nerdd-quote-link{border:1px solid #e3ddd6;border-radius:8px;padding:7px;font-size:9px;color:#71685f;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nerdd-quote-stats{display:flex;align-items:center;gap:14px;padding-top:9px;margin-top:8px;border-top:1px solid #eee8e1;color:#8a8178;font-size:9px}.nerdd-quote-stats span{display:flex;align-items:center;gap:4px}.nerdd-quote-stats .spacer{flex:1}.nerdd-create-fields{display:flex;flex-wrap:wrap;gap:9px;padding:12px 20px;border-top:1px solid #eee8e1}.nerdd-create-fields label,.nerdd-create-fields select{height:40px;display:flex;align-items:center;gap:7px;border:1px solid #ddd6cc;border-radius:9px;background:#fff;padding:0 10px;font-size:10px;color:#645c55;box-sizing:border-box}.nerdd-create-fields label{cursor:pointer}.nerdd-create-fields label input[type=file]{display:none}.nerdd-create-fields .wide{flex:1;min-width:220px}.nerdd-create-fields .wide input{border:0;outline:0;min-width:0;width:100%;font:inherit}.nerdd-create-fields select{min-width:180px}.nerdd-create-composer footer{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid #e8e1d9;background:#fffdf9}.nerdd-create-composer footer span{font-size:9px;color:#93877d}.nerdd-create-composer footer button{border:0;border-radius:10px;background:#201c19;color:#fff;padding:10px 15px;font-weight:800;display:inline-flex;align-items:center;gap:6px;cursor:pointer}.nerdd-create-composer footer button:disabled{opacity:.45;cursor:not-allowed}.nerdd-create-error{margin:0;padding:0 20px 10px;color:#b6462d;font-size:10px}.nerdd-create-spin{animation:nerdd-create-spin .8s linear infinite}@keyframes nerdd-create-spin{to{transform:rotate(360deg)}}@media(max-width:640px){.nerdd-create-overlay{padding:10px}.nerdd-create-menu,.nerdd-create-composer{width:100%;max-height:calc(100dvh - 20px);border-radius:14px}.nerdd-create-fields{display:grid}.nerdd-create-fields .wide,.nerdd-create-fields select{min-width:0;width:100%}}`}</style>
      {createOpen ? (
        <CreateMenu
          onClose={() => setCreateOpen(false)}
          onPost={() => openComposer()}
          onProject={() => {
            setCreateOpen(false);
            window.history.pushState({}, "", "/project/new");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
        />
      ) : null}
      {composerOpen ? (
        <Composer
          quote={quote}
          onClose={() => {
            setComposerOpen(false);
            setQuote(null);
          }}
          onPosted={() => {
            setComposerOpen(false);
            setQuote(null);
            window.dispatchEvent(new Event("nerdding:feed-refresh"));
          }}
        />
      ) : null}
    </>,
    document.body,
  );
}
