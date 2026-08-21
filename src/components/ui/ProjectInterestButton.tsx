"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ProjectInterestButtonProps {
  projectId: string;
  initiallyInterested?: boolean;
  initialCount?: number;
}

/**
 * Star-shaped interest toggle button for projects.
 * Displays a count and toggles the user's interest via API.
 */
export default function ProjectInterestButton({
  projectId,
  initiallyInterested = false,
  initialCount = 0,
}: ProjectInterestButtonProps) {
  const [interested, setInterested] = useState(initiallyInterested);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    // Optimistic update
    const wasInterested = interested;
    setInterested(!wasInterested);
    setCount((c) => c + (wasInterested ? -1 : 1));
    try {
      const resp = await apiFetch<{ data: { active: boolean; count: number } }>(
        `/projects/${encodeURIComponent(projectId)}/interest`,
        { method: "POST" }
      );
      setInterested(resp.data.active);
      setCount(resp.data.count);
    } catch {
      // Revert on error
      setInterested(wasInterested);
      setCount((c) => c + (wasInterested ? 1 : -1));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <style>{interestBtnStyles}</style>
      <button
        className={`interest-btn ${interested ? "interest-btn--active" : ""}`}
        onClick={toggle}
        disabled={busy}
        aria-label={interested ? "Remove interest" : "Add interest"}
      >
        <Star size={14} fill={interested ? "currentColor" : "none"} />
        <span className="interest-btn-label">
          {interested ? "Interested" : "Interest"}
        </span>
        {count > 0 && <span className="interest-btn-count">{count}</span>}
      </button>
    </>
  );
}

const interestBtnStyles = `
.interest-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: 1px solid var(--line, #ded7ce);
  border-radius: 8px;
  background: var(--card, #fff);
  color: var(--muted, #8a8178);
  font-size: 11px;
  font-weight: 650;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.interest-btn:hover {
  border-color: #c9a84c;
  color: #b8972e;
  background: #fdf8ed;
}
.interest-btn--active {
  border-color: #c9a84c;
  color: #b8972e;
  background: #fdf8ed;
}
.interest-btn--active:hover {
  background: #faf2d8;
}
.interest-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.interest-btn-count {
  background: var(--line, #ded7ce);
  border-radius: 10px;
  padding: 0 6px;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  text-align: center;
  line-height: 18px;
}
.interest-btn--active .interest-btn-count {
  background: #e8d48a;
  color: #5c4b12;
}

/* Micro-animation on toggle */
@keyframes interest-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.25); }
  100% { transform: scale(1); }
}
.interest-btn--active svg {
  animation: interest-pop 0.3s ease;
}
`;
