import type { User } from "@/lib/mock-data";

export function Avatar({ user, size = "md", online = false }: { user: Pick<User, "initials" | "color" | "name"> & { avatarUrl?: string | null }; size?: "xs" | "sm" | "md" | "lg" | "xl"; online?: boolean }) {
  return (
    <span className={`avatar avatar-${size}`} style={{ background: user.color }} aria-label={user.name}>
      {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : user.initials}
      {online && <i className="online-dot" />}
    </span>
  );
}

export function VerifiedMark() {
  return <span className="verified-mark" aria-label="Verified">✓</span>;
}

export function ProjectMark({ project, size = "md" }: { project: { icon: string; accent: string; name: string }; size?: "sm" | "md" | "lg" }) {
  return <span className={`project-mark project-mark-${size}`} style={{ background: project.accent }} aria-label={project.name}>{project.icon}</span>;
}
