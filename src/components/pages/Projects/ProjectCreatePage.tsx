"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function ProjectCreatePage({ onClose }: { onClose?: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState("Idea");
  const [githubUrl, setGithubUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      window.history.pushState({}, "", "/home");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const submit = async () => {
    if (!name.trim() || !description.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await apiFetch<{ data: { slug: string } }>("/social/projects", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          stage,
          githubUrl: githubUrl.trim() || null
        })
      });
      if (!r.data?.slug) throw new Error("Project was created but no URL slug was returned.");
      
      // Update browser URL and trigger router update
      window.history.pushState({}, "", `/project/${encodeURIComponent(r.data.slug)}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Project could not be created.");
    } finally {
      setBusy(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <style>{modalStyles}</style>
      <div className="project-detail-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) handleClose(); }}>
        <div className="project-detail-modal" style={{ width: "min(520px, 95vw)", height: "auto", maxHeight: "min(640px, 90vh)" }}>
          <header className="project-detail-header">
            <div className="project-detail-header-left">
              <h2 style={{ fontSize: "16px", margin: 0, fontWeight: 700, fontFamily: "Space Grotesk" }}>Create a project</h2>
            </div>
            <button className="project-detail-close" onClick={handleClose} aria-label="Close modal"><X size={16} /></button>
          </header>
          <div className="project-detail-body-scroll">
            <div className="create-proj-form">
              <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "var(--muted)" }}>
                A permanent home for your work, updates and collaborators.
              </p>

              <div className="create-proj-field">
                <label htmlFor="proj-name">Project name</label>
                <input
                  id="proj-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Antigravity AI"
                  disabled={busy}
                />
              </div>

              <div className="create-proj-field">
                <label htmlFor="proj-desc">Description</label>
                <textarea
                  id="proj-desc"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What are you building?"
                  disabled={busy}
                />
              </div>

              <div className="create-proj-field">
                <label htmlFor="proj-stage">Stage</label>
                <select
                  id="proj-stage"
                  value={stage}
                  onChange={e => setStage(e.target.value)}
                  disabled={busy}
                >
                  <option>Idea</option>
                  <option>Prototype</option>
                  <option>Building</option>
                  <option>Beta</option>
                  <option>Launched</option>
                  <option>Fundraising</option>
                </select>
              </div>

              <div className="create-proj-field">
                <label htmlFor="proj-github">GitHub repository <span style={{ textTransform: "lowercase", fontWeight: 400, opacity: 0.8 }}>(optional)</span></label>
                <input
                  id="proj-github"
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  disabled={busy}
                />
              </div>

              {error && (
                <div style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "#fff5f1",
                  border: "1px solid #efd4ca",
                  color: "var(--accent-dark)",
                  fontSize: "11px",
                  lineHeight: 1.4
                }}>
                  {error}
                </div>
              )}

              <div className="create-proj-actions">
                <button
                  type="button"
                  className="outline-button"
                  onClick={handleClose}
                  disabled={busy}
                  style={{ padding: "8px 16px", fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-button"
                  disabled={busy || !name.trim() || !description.trim()}
                  onClick={() => void submit()}
                  style={{ padding: "8px 16px", fontSize: "12px" }}
                >
                  {busy ? (
                    <><Loader2 className="nerdd-spin" size={13} /> Creating…</>
                  ) : (
                    <>Create project <ArrowRight size={13} /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

const modalStyles = `
.create-proj-form {
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.create-proj-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.create-proj-field label {
  font-size: 10px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.create-proj-field input,
.create-proj-field textarea,
.create-proj-field select {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card);
  color: var(--ink);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.create-proj-field input:focus,
.create-proj-field textarea:focus,
.create-proj-field select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(228,87,46,0.1);
}
.create-proj-field textarea {
  min-height: 80px;
  resize: vertical;
}
.create-proj-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
  border-top: 1px solid var(--line);
  padding-top: 16px;
}
`;
