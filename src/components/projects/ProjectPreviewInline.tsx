"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Loader2, X, Github, Users, Activity, Layers } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Avatar, ProjectMark } from "@/components/ui/Avatar";

type Person = { id: string; name: string; username: string; avatarUrl?: string | null };
type ProjectUpdate = { id: string; body: string; created_at: string };
type Project = {
  id: string;
  name: string;
  slug: string;
  description: string;
  stage: string;
  githubUrl?: string | null;
  owner?: Person | null;
  contributors?: Array<{ user_id: string; name: string; username: string; avatar_url?: string | null }>;
  posts?: ProjectUpdate[];
};

export default function ProjectPreviewInline({ slug, onClose, onOpenFull }: { slug: string; onClose: () => void; onOpenFull: () => void }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProject = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch<{ data: Project }>(`/projects/${encodeURIComponent(slug)}`);
      setProject(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProject();
  }, [slug]);

  const initials = (name?: string) => (name ?? "N").split(/\s+/).filter(Boolean).map(x => x[0]).join("").slice(0, 2).toUpperCase();

  return (
    <section className="home-active-post project-preview-inline" role="dialog" aria-label="Project Preview">
      <style>{panelStyles}</style>
      <div className="home-modal">
        <header className="home-modal-head">
          <div>
            <button className="post-history-back" onClick={onClose}><ArrowLeft size={14} /> Back</button>
            <div><span>PROJECT</span><h2>Preview</h2></div>
          </div>
          <button onClick={onClose} aria-label="Close panel" className="post-history-back" style={{ width: "32px", height: "32px", borderRadius: "50%", display: "grid", placeItems: "center", padding: 0 }}><X size={18} /></button>
        </header>
        <div className="home-modal-scroll" style={{ padding: "16px" }}>
          {loading ? (
            <div className="post-detail-error" style={{ padding: 40, display: "flex", justifyContent: "center" }}>
              <Loader2 size={24} className="nerdd-spin" />
            </div>
          ) : !project ? (
            <div className="post-detail-error" style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>
              {error || "Project could not be loaded."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Project Hero Banner */}
              <div style={{
                background: "linear-gradient(135deg, var(--ink) 0%, #2f251f 100%)",
                borderRadius: "12px",
                padding: "20px",
                color: "var(--cream)",
                position: "relative",
                overflow: "hidden"
              }}>
                <div style={{ position: "relative", zIndex: 2 }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                    <ProjectMark project={{ name: project.name, icon: "🚀", accent: "var(--accent)" }} size="sm" />
                    <div>
                      <small style={{
                        fontFamily: "var(--font-mono, 'DM Mono')",
                        fontSize: "9px",
                        letterSpacing: "0.1em",
                        color: "var(--accent)",
                        textTransform: "uppercase"
                      }}>
                        {project.stage}
                      </small>
                      <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, fontFamily: "Space Grotesk" }}>{project.name}</h3>
                    </div>
                  </div>
                  <p style={{ fontSize: "12px", margin: 0, opacity: 0.9, lineHeight: 1.5 }}>
                    {project.description || "A project built by the Nerdding community."}
                  </p>
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "14px",
                        fontSize: "11px",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.2)",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.05)"
                      }}
                    >
                      <Github size={12} /> View Repository <ArrowUpRight size={11} />
                    </a>
                  )}
                </div>
              </div>

              {/* Stats Card Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                <div style={{ border: "1px solid var(--line)", background: "var(--card)", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                  <Layers size={14} style={{ color: "var(--muted)", marginBottom: "4px" }} />
                  <strong style={{ display: "block", fontSize: "14px" }}>{project.stage}</strong>
                  <span style={{ fontSize: "9px", color: "var(--muted)" }}>Current Stage</span>
                </div>
                <div style={{ border: "1px solid var(--line)", background: "var(--card)", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                  <Activity size={14} style={{ color: "var(--accent)", marginBottom: "4px" }} />
                  <strong style={{ display: "block", fontSize: "14px" }}>{project.posts?.length ?? 0}</strong>
                  <span style={{ fontSize: "9px", color: "var(--muted)" }}>Build Updates</span>
                </div>
                <div style={{ border: "1px solid var(--line)", background: "var(--card)", padding: "10px", borderRadius: "8px", textAlign: "center" }}>
                  <Users size={14} style={{ color: "var(--green)", marginBottom: "4px" }} />
                  <strong style={{ display: "block", fontSize: "14px" }}>{project.contributors?.length ?? 0}</strong>
                  <span style={{ fontSize: "9px", color: "var(--muted)" }}>Collaborators</span>
                </div>
              </div>

              {/* Project Owner Section */}
              {project.owner && (
                <div style={{
                  border: "1px solid var(--line)",
                  background: "var(--card)",
                  borderRadius: "10px",
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}>
                  <Avatar user={{ name: project.owner.name, avatarUrl: project.owner.avatarUrl }} size="sm" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong style={{ display: "block", fontSize: "12px" }}>{project.owner.name}</strong>
                    <small style={{ display: "block", color: "var(--subtle)", fontSize: "10px" }}>@{project.owner.username} · Owner</small>
                  </div>
                </div>
              )}

              {/* Collaborators List Row */}
              {project.contributors && project.contributors.length > 0 && (
                <div style={{ border: "1px solid var(--line)", background: "var(--card)", borderRadius: "10px", padding: "12px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", fontFamily: "Space Grotesk" }}>
                    Collaborators ({project.contributors.length})
                  </h4>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {project.contributors.slice(0, 8).map(member => (
                      <Avatar
                        key={member.user_id}
                        user={{ name: member.name, avatarUrl: member.avatar_url }}
                        size="sm"
                      />
                    ))}
                    {project.contributors.length > 8 && (
                      <span style={{
                        width: "29px",
                        height: "29px",
                        borderRadius: "50%",
                        background: "var(--line)",
                        display: "inline-grid",
                        placeItems: "center",
                        fontSize: "10px",
                        fontWeight: "bold",
                        color: "var(--muted)"
                      }}>
                        +{project.contributors.length - 8}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Project Build Log (Latest 2 updates) */}
              {project.posts && project.posts.length > 0 && (
                <div style={{ border: "1px solid var(--line)", background: "var(--card)", borderRadius: "10px", padding: "12px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", fontFamily: "Space Grotesk" }}>
                    Recent Build Updates
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {project.posts.slice(0, 2).map(update => (
                      <div key={update.id} style={{
                        padding: "10px",
                        background: "var(--paper)",
                        border: "1px solid var(--line)",
                        borderRadius: "8px",
                      }}>
                        <p style={{ margin: 0, fontSize: "11px", fontWeight: 650, lineHeight: 1.4 }}>{update.body}</p>
                        <small style={{ display: "block", color: "var(--subtle)", fontSize: "9px", marginTop: "4px" }}>
                          {new Date(update.created_at).toLocaleDateString()}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Full Page Navigation CTA */}
              <button
                onClick={onOpenFull}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  background: "var(--ink)",
                  color: "var(--cream)",
                  fontSize: "12px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
              >
                See Full Project Dashboard <ArrowUpRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const panelStyles = `
.home-active-post {
  min-width: 0;
  width: 100%;
  max-height: min(82vh, 900px);
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--card);
  box-shadow: 0 5px 18px rgba(31,27,24,.05);
}
.home-modal {
  width: 100%;
  max-height: min(82vh, 900px);
  border: 0;
  border-radius: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.home-modal-head {
  height: 60px;
  flex: 0 0 60px;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--card);
}
.home-modal-head>div {
  display: flex;
  align-items: center;
  gap: 8px;
}
.home-modal-head span {
  font-size: 8px;
  letter-spacing: .14em;
  color: #978d84;
  font-weight: 800;
  text-transform: uppercase;
}
.home-modal-head h2 {
  font-size: 17px;
  margin: 0;
}
.home-modal-head button {
  width: 32px;
  height: 32px;
  border: 1px solid var(--line);
  background: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.home-modal-head .post-history-back {
  width: auto;
  padding: 0 10px;
  border-radius: 8px;
  display: inline-flex;
  gap: 6px;
  font-size: 10px;
  font-weight: 700;
  align-items: center;
}
.home-modal-scroll {
  max-height: calc(min(82vh, 900px) - 60px);
  overflow-y: auto;
}
`;
