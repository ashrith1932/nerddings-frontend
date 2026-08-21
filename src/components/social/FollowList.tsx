"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import VerifiedName from "@/components/ui/VerifiedName";

type User = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  verified?: boolean;
};

interface FollowListProps {
  title: string;
  endpoint: string; // API endpoint returning a list of users
}

function go(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function FollowList({ title, endpoint }: FollowListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const resp = await apiFetch<{ data: User[] }>(endpoint);
        if (!cancelled) setUsers(resp.data);
      } catch (e) {
        console.error("Failed to load follow list", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [endpoint]);

  if (loading) {
    return (
      <div className="follow-list-loading" style={{ display: "flex", justifyContent: "center", padding: "32px", color: "var(--muted, #8a8178)", fontSize: "12px" }}>
        Loading {title}…
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="follow-list-empty" style={{ display: "flex", justifyContent: "center", padding: "32px", color: "var(--muted, #8a8178)", fontSize: "12px" }}>
        No {title.toLowerCase()} yet
      </div>
    );
  }

  return (
    <section className="follow-list">
      <style>{followListStyles}</style>
      <h3 className="follow-list-title">{title} <span className="follow-list-count">{users.length}</span></h3>
      <div className="follow-list-grid">
        {users.map((u) => (
          <div
            key={u.id}
            className="follow-card"
            onClick={() => go(`/profile/${encodeURIComponent(u.username)}`)}
          >
            <Avatar user={{ name: u.name, avatarUrl: u.avatarUrl }} size="sm" />
            <div className="follow-info">
              <VerifiedName name={u.name} username={u.username} verified={u.verified} />
              <small className="follow-username">@{u.username}</small>
            </div>
            <button
              className="follow-action-btn"
              onClick={(e) => { e.stopPropagation(); /* TODO: wire follow/unfollow API */ }}
            >
              Follow
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

const followListStyles = `
.follow-list { margin: 0; }
.follow-list-title {
  font: 700 13px 'Space Grotesk', sans-serif;
  color: var(--ink, #201c19);
  margin: 0 0 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.follow-list-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted, #8a8178);
  background: var(--line, #ded7ce);
  border-radius: 10px;
  padding: 1px 8px;
}
.follow-list-grid {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.follow-card {
  background: var(--card, #fff);
  border: 1px solid var(--line, #ded7ce);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s, transform 0.15s;
}
.follow-card:hover {
  background: #faf7f2;
  box-shadow: 0 2px 8px rgba(31,27,24,.06);
  transform: translateY(-1px);
}
.follow-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.follow-info strong {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink, #201c19);
}
.follow-username {
  font-size: 10px;
  color: var(--muted, #8a8178);
  margin-top: 1px;
}
.follow-action-btn {
  flex: 0 0 auto;
  border: 1px solid var(--line, #ded7ce);
  background: var(--ink, #201c19);
  color: var(--cream, #faf6f0);
  font-size: 10px;
  font-weight: 700;
  padding: 5px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.follow-action-btn:hover { opacity: 0.85; }
`;
