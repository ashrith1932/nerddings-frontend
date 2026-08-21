"use client";

import { useEffect, useState } from "react";
import { Star, ArrowUpRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import ProjectInterestButton from "@/components/ui/ProjectInterestButton";
import VerifiedName from "@/components/ui/VerifiedName";

type InterestProject = {
  id: string;
  name: string;
  slug: string;
  description: string;
  stage: string;
  interestCount: number;
  interested: boolean;
  owner?: { id: string; name: string; username: string; avatarUrl?: string | null; accountType?: string } | null;
};

interface InterestsSectionProps {
  username: string;
}

/**
 * Displays a list of projects the user has expressed interest in.
 * Renders on the user's profile page.
 */
export default function InterestsSection({ username }: InterestsSectionProps) {
  const [projects, setProjects] = useState<InterestProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const resp = await apiFetch<{ data: InterestProject[] }>(
          `/users/${encodeURIComponent(username)}/interests`
        );
        if (!cancelled) setProjects(resp.data);
      } catch (e) {
        console.error("Failed to load interests", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [username]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "24px", color: "var(--muted, #8a8178)", fontSize: "12px" }}>
        Loading interests…
      </div>
    );
  }

  if (!projects.length) return null; // Don't show section if no interests

  return (
    <section className="interests-section">
      <style>{interestsSectionStyles}</style>
      <h3 className="interests-title">
        <Star size={14} /> Interested In <span className="interests-count">{projects.length}</span>
      </h3>
      <div className="interests-grid">
        {projects.map((p) => (
          <div
            key={p.id}
            className="interest-project-card"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("nerdding:open-project-inline", { detail: { slug: p.slug } }));
            }}
          >
            <div className="interest-project-top">
              <div className="interest-project-info">
                <strong>{p.name}</strong>
                <span className="interest-project-stage">{p.stage}</span>
              </div>
            </div>
            <p className="interest-project-desc">{p.description}</p>
            {p.owner && (
              <div className="interest-project-owner">
                <Avatar user={{ name: p.owner.name, avatarUrl: p.owner.avatarUrl }} size="xs" />
                <VerifiedName name={p.owner.name} verified={p.owner.accountType === "agent"} />
              </div>
            )}
            <div className="interest-project-footer">
              <ProjectInterestButton
                projectId={p.id}
                initiallyInterested={p.interested}
                initialCount={p.interestCount}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const interestsSectionStyles = `
.interests-section { margin: 20px 0; }
.interests-title {
  font: 700 13px 'Space Grotesk', sans-serif;
  color: var(--ink, #201c19);
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.interests-title svg { color: #c9a84c; }
.interests-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted, #8a8178);
  background: var(--line, #ded7ce);
  border-radius: 10px;
  padding: 1px 8px;
}
.interests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}
.interest-project-card {
  background: var(--card, #fffdf9);
  border: 1px solid var(--line, #ded7ce);
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}
.interest-project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(31,27,24,.07);
  border-color: #c9c0b7;
}
.interest-project-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
}
.interest-project-info strong {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink, #201c19);
  display: block;
}
.interest-project-stage {
  font-size: 9px;
  font-weight: 700;
  color: var(--accent, #d85a2d);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 2px;
  display: block;
}
.interest-project-desc {
  font-size: 11px;
  color: #6e655d;
  line-height: 1.5;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.interest-project-owner {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.interest-project-owner strong {
  font-size: 10px;
}
.interest-project-footer {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
@media(max-width:600px) {
  .interests-grid { grid-template-columns: 1fr; }
}
`;
