"use client";

import { useId } from "react";
import type { User } from "@/lib/mock-data";

type AvatarUser = { initials?: string; name: string; color?: string; avatarUrl?: string | null; id?: string; username?: string; accountType?: string };

export function Avatar({ user, size = "md", online = false }: { user: AvatarUser; size?: "xs" | "sm" | "md" | "lg" | "xl"; online?: boolean }) {
  return (
    <span className={`avatar avatar-${size}`} style={{ background: user.color, position: "relative" }} aria-label={user.name}>
      {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : user.initials ?? user.name.slice(0, 2).toUpperCase()}
      {user.accountType === "agent" ? <VerifiedMark size={size === "xl" ? 23 : size === "lg" ? 20 : size === "md" ? 17 : size === "sm" ? 15 : 12} floating /> : null}
      {online && <i className="online-dot" />}
    </span>
  );
}

export function VerifiedMark({ size = 18, floating = false }: { size?: number; floating?: boolean }) {
  const id = useId().replace(/:/g, "");
  const gradientId = `shinyGold-${id}`;
  const glowId = `innerGlow-${id}`;
  return (
    <span
      className="verified-mark"
      aria-label="Verified"
      style={{
        width: size,
        height: size,
        display: "inline-grid",
        placeItems: "center",
        verticalAlign: "middle",
        lineHeight: 0,
        flex: "0 0 auto",
        ...(floating ? { position: "absolute", right: -2, bottom: -2, zIndex: 2, filter: "drop-shadow(0 1px 2px rgba(0,0,0,.28))" } : {}),
      }}
    >
      <svg viewBox="0 0 200 200" aria-hidden="true" style={{ display: "block", width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bf953f" />
            <stop offset="25%" stopColor="#fcf6ba" />
            <stop offset="50%" stopColor="#b38728" />
            <stop offset="75%" stopColor="#fbf5b7" />
            <stop offset="100%" stopColor="#aa771c" />
          </linearGradient>
          <linearGradient id={glowId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffe57f" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#996515" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path d="M 100,15 Q 112,35 130,20 Q 135,42 160,40 Q 153,62 175,75 Q 158,92 170,115 Q 148,122 150,148 Q 130,142 120,165 Q 102,150 80,165 Q 70,142 50,148 Q 52,122 30,115 Q 42,92 25,75 Q 47,62 40,40 Q 65,42 70,20 Q 88,35 100,15 Z" fill={`url(#${gradientId})`} stroke="#fff2a3" strokeWidth="1.5" />
        <path d="M 100,22 Q 110,39 126,26 Q 130,45 152,43 Q 146,62 165,73 Q 150,88 160,108 Q 141,114 143,137 Q 125,132 117,152 Q 101,139 83,152 Q 75,132 57,137 Q 59,114 40,108 Q 50,88 35,73 Q 54,62 48,43 Q 70,45 74,26 Q 90,39 100,22 Z" fill="none" stroke={`url(#${glowId})`} strokeWidth="2.5" opacity="0.7" />
        <path d="M72 100 L90 118 L130 75" fill="none" stroke="#121212" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function ProjectMark({ project, size = "md" }: { project: { icon: string; accent: string; name: string; id?: string; slug?: string; description?: string; stage?: string }; size?: "sm" | "md" | "lg" }) {
  return <span className={`project-mark project-mark-${size}`} style={{ background: project.accent }} aria-label={project.name}>{project.icon}</span>;
}
