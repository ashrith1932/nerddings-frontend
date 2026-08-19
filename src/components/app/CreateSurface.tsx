"use client";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { ArrowUpRight, Image as ImageIcon, Loader2, Rocket, X } from "lucide-react";
import { getAuthToken, getSavedUser } from "@/lib/api";
import { getCreateProjects, publishPost } from "@/services/create";
import "./nerdding-enhancements.css";
import "./nerdding-create-project.css";

function PostComposer({ onClose }: { onClose: () => void }) {
  const viewer = getSavedUser();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [projectSlug, setProjectSlug] = useState("");
  const [projects, setProjects] = useState<Array<{ slug: string; name: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!viewer?.username) return;
    void getCreateProjects(viewer.username).then(setProjects).catch(() => setProjects([]));
  }, [viewer?.username]);

  const publish = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await publishPost({ body: text.trim(), files, projectSlug: projectSlug || undefined });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to publish post.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="nerdd-create-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <section className="nerdd-create-modal">
        <header><div><small>CREATE</small><h2>Post</h2></div><button onClick={onClose} aria-label="Close"><X size={18} /></button></header>
        <div className="nerdd-create-author"><span>{viewer?.name?.slice(0, 2).toUpperCase() || "N"}</span><div><strong>{viewer?.name || "Member"}</strong><small>@{viewer?.username || "member"}</small></div></div>
        <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} maxLength={5000} placeholder="What are you building, learning, testing or shipping?" className="nerdd-create-textarea" />
        <label className="nerdd-create-media"><ImageIcon size={15} /> {files.length ? `${files.length} media` : "Add media"}<input type="file" accept="image/*,video/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 10))} /></label>
        {projects.length > 0 && <label className="nerdd-create-project"><Rocket size={15} /> Mention project<select value={projectSlug} onChange={(e) => setProjectSlug(e.target.value)}><option value="">No project</option>{projects.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}</select></label>}
        {error && <p className="nerdd-create-error">{error}</p>}
        <footer><span>{text.length}/5000</span><button disabled={!text.trim() || busy} onClick={() => void publish()} className="nerdd-create-publish-button">{busy ? <><Loader2 className="nerdd-spin" size={15} />Publishing…</> : <>Publish <ArrowUpRight size={15} /></>}</button></footer>
      </section>
    </div>
  );
}

export default function CreateSurface() {
  const [open, setOpen] = useState(false);
  const [composer, setComposer] = useState(false);

  const show = () => {
    if (!getAuthToken()) {
      window.dispatchEvent(new CustomEvent("nerdding:auth-required"));
      return;
    }
    setOpen(true);
  };

  useEffect(() => {
    const click = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest(".create-button,.header-create,.mobile-create")) return;
      e.preventDefault();
      e.stopPropagation();
      show();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "c" || ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      e.preventDefault();
      e.stopPropagation();
      show();
    };
    document.addEventListener("click", click, true);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("click", click, true);
      document.removeEventListener("keydown", key, true);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("nerdd-new-create", open || composer);
    return () => document.documentElement.classList.remove("nerdd-new-create");
  }, [open, composer]);

  if (!open && !composer) return null;

  return createPortal(<>
    {open && <div className="nerdd-create-menu"><header><div><small>MAKE SOMETHING</small><strong>Create</strong></div><button onClick={() => setOpen(false)} aria-label="Close"><X size={17} /></button></header>
      <button onClick={() => { setOpen(false); setComposer(true); }} className="nerdd-create-menu-item"><span><ImageIcon size={17} /></span><div><strong>Post</strong><small>Share an update, idea or piece of work</small></div><ArrowUpRight size={15} /></button>
      <button onClick={() => { setOpen(false); window.history.pushState({}, "", "/project/new"); window.dispatchEvent(new PopStateEvent("popstate")); }} className="nerdd-create-menu-item"><span><Rocket size={17} /></span><div><strong>Project</strong><small>Give your work a home and invite collaborators</small></div><ArrowUpRight size={15} /></button>
      <footer>Only two creation types: <b>Post</b> and <b>Project</b>.</footer>
    </div>}
    {composer && <PostComposer onClose={() => setComposer(false)} />}
  </>, document.body);
}
