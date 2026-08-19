"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, MoreHorizontal, Plus, Settings as SettingsIcon, Users, X } from "lucide-react";
import { apiFetch, getSavedUser, uploadMedia } from "@/lib/api";
import { Avatar, VerifiedMark } from "@/components/ui/Avatar";
import { currentUser as seededCurrentUser, type User } from "@/lib/mock-data";
import ProfileSectionTabs from "@/components/app/ProfileSectionTabs";

type ProfileData = {
  user: {
    id: string; name: string; username: string; avatarUrl?: string | null; bio?: string | null;
    location?: string | null; accountType: "user" | "agent"; coverUrl?: string | null;
    profileLogoUrl?: string | null; coverPositionX?: number; coverPositionY?: number;
  };
  stats: { followers: number; following: number; projects: number; posts: number };
  projects: Array<{ id: string; name: string; slug: string; description: string; stage: string; github_url?: string | null; created_at?: string }>;
  posts: Array<{ id: string; text: string; createdAt: string }>;
  affiliations: Array<{ id: string; name: string; slug: string; type: string; verified: boolean; role: string }>;
};
type Agent = { id: string; name: string; slug: string; type: string; verified: boolean };
const me = () => getSavedUser();
const mapUser = (u: ProfileData["user"]): User => ({ ...seededCurrentUser, id: u.id, name: u.name, username: u.username, avatarUrl: u.avatarUrl ?? undefined, bio: u.bio ?? "", location: u.location ?? "", role: u.accountType === "agent" ? "Agent" : "Builder", roles: [u.accountType === "agent" ? "Agent" : "Builder"], initials: u.name.slice(0, 2).toUpperCase(), verified: u.accountType === "agent" });

function Skeleton() {
  return <div className="profile-page profile-loading"><div className="skeleton-block skeleton-cover" /><div className="skeleton-profile-head"><div className="skeleton-circle" /><div className="skeleton-lines"><i /><i /><i /></div></div><div className="skeleton-stats"><i /><i /><i /><i /></div><div className="skeleton-profile-grid"><div className="skeleton-block large" /><div className="skeleton-block" /></div></div>;
}

export default function ProfilePage({ username }: { username: string }) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [following, setFollowing] = useState(false);
  const [cover, setCover] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [crop, setCrop] = useState(false);
  const [picker, setPicker] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const own = me()?.username?.toLowerCase() === username.toLowerCase();
  const nav = (path: string) => { window.history.pushState({}, "", path); window.dispatchEvent(new PopStateEvent("popstate")); };
  const load = async () => {
    setLoading(true); setError("");
    try {
      const r = await apiFetch<{ data: ProfileData }>(`/social/users/${encodeURIComponent(username)}/profile-live`);
      setData(r.data); setCover(r.data.user.coverUrl ?? null); setLogo(r.data.user.profileLogoUrl ?? null); setX(r.data.user.coverPositionX ?? 50); setY(r.data.user.coverPositionY ?? 50);
      if (!own && me()) setFollowing((await apiFetch<{ data: { active: boolean } }>(`/social/users/${r.data.user.id}/following`)).data.active);
    } catch (e) { setError(e instanceof Error ? e.message : "Profile could not be loaded"); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [username]);
  useEffect(() => { if (picker) apiFetch<{ data: Agent[] }>("/social/affiliations/agents").then((r) => setAgents(r.data ?? [])).catch(() => setAgents([])); }, [picker]);
  const saveProfile = async (patch: Record<string, unknown>) => {
    setBusy(true);
    try { await apiFetch("/settings/profile", { method: "PATCH", body: JSON.stringify(patch) }); await load(); setCrop(false); }
    catch (e) { setError(e instanceof Error ? e.message : "Profile could not be updated"); }
    finally { setBusy(false); }
  };
  const upload = (field: "coverUrl" | "profileLogoUrl", file?: File) => {
    if (!file) return;
    void (async () => { setBusy(true); try { const r = await uploadMedia(file); if (field === "coverUrl") { setCover(r.publicUrl); setCrop(true); } else { setLogo(r.publicUrl); await saveProfile({ profileLogoUrl: r.publicUrl }); } } catch (e) { setError(e instanceof Error ? e.message : "Upload failed"); } finally { setBusy(false); } })();
  };
  const follow = async () => {
    if (!data) return;
    try { const r = await apiFetch<{ data: { active: boolean } }>(`/social/users/${data.user.id}/follow`, { method: "POST" }); setFollowing(r.data.active); }
    catch (e) { setError(e instanceof Error ? e.message : "Follow failed"); }
  };
  const requestAffiliation = async (agentId: string) => {
    if (!role.trim()) return;
    try { await apiFetch("/social/affiliations/requests", { method: "POST", body: JSON.stringify({ agentId, role: role.trim() }) }); setPicker(false); setRole(""); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Affiliation request failed"); }
  };
  if (loading) return <Skeleton />;
  if (!data) return <div className="profile-page"><div className="empty-state"><strong>Profile not found.</strong><span>{error}</span><button className="outline-button" onClick={() => void load()}>Try again</button></div></div>;
  const user = mapUser(data.user);
  const filteredAgents = agents.filter((a) => `${a.name} ${a.slug}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="profile-page">
      <div className="profile-cover">
        {cover ? <img className="profile-cover-image" src={cover} alt="Profile banner" style={{ objectPosition: `${x}% ${y}%` }} /> : <div className="cover-grid" />}
        <div className="cover-overlay" />
        {logo ? <img className="cover-profile-logo" src={logo} alt="Profile logo" /> : <div className="cover-symbol" />}
        {own && <div className="profile-cover-actions"><label className="cover-action"><input type="file" accept="image/*" onChange={(e) => upload("coverUrl", e.target.files?.[0])} />Change banner</label><label className="cover-action"><input type="file" accept="image/*" onChange={(e) => upload("profileLogoUrl", e.target.files?.[0])} />Add logo</label></div>}
      </div>
      <div className="profile-header">
        <Avatar user={user} size="xl" />
        <div className="profile-head-copy">
          <div className="profile-title-row"><div><h1>{user.name} {user.verified && <VerifiedMark />}</h1><p>@{user.username}{user.location ? ` · ${user.location}` : ""}</p></div><div className="profile-actions">{own ? <button className="outline-button" onClick={() => setCrop(true)}><SettingsIcon size={14} /> Edit banner</button> : <button className={following ? "outline-button" : "primary-button"} onClick={() => void follow()}>{following ? <Check size={14} /> : <Plus size={14} />} {following ? "Following" : "Follow"}</button>}<button className="outline-button"><MoreHorizontal size={16} /></button></div></div>
          <p className="profile-bio">{user.bio || "Building in public on Nerdding."}</p>
          <div className="role-pills">{user.roles.map((r) => <span key={r}>{r}</span>)}{data.affiliations.map((a) => <span key={a.id}>{a.name} · {a.role}</span>)}</div>
        </div>
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}><ProfileSectionTabs username={username} /></div>
      {error && <div className="profile-inline-error">{error}</div>}
      {crop && <div className="modal-backdrop"><div className="cover-editor-modal"><div className="modal-head"><div><div className="eyebrow">PROFILE BANNER</div><h2>Crop your banner to fit</h2></div><button className="icon-btn" onClick={() => setCrop(false)}><X size={18} /></button></div><p className="cover-editor-help">Adjust the position so the important part of your uploaded banner stays visible.</p><div className="cover-editor-preview">{cover ? <img src={cover} alt="Crop preview" style={{ objectPosition: `${x}% ${y}%` }} /> : <div className="cover-grid" />}</div><label>Horizontal position<input type="range" min="0" max="100" value={x} onChange={(e) => setX(Number(e.target.value))} /></label><label>Vertical position<input type="range" min="0" max="100" value={y} onChange={(e) => setY(Number(e.target.value))} /></label><div className="modal-foot"><span>{busy ? "Saving…" : "Preview"}</span><button className="primary-button" disabled={busy || !cover} onClick={() => void saveProfile({ coverUrl: cover, coverPositionX: x, coverPositionY: y })}>Save banner <Check size={14} /></button></div></div></div>}
      {picker && <div className="modal-backdrop"><div className="affiliation-modal"><div className="modal-head"><div><div className="eyebrow">TRUSTED IDENTITY</div><h2>Request an Agent affiliation</h2></div><button className="icon-btn" onClick={() => setPicker(false)}><X size={18} /></button></div><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search verified Agents" /><input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Your role" />{filteredAgents.map((a) => <button className="affiliation-picker-row" key={a.id} onClick={() => void requestAffiliation(a.id)}><span className="org-badge">{a.name.slice(0, 1)}</span><span><strong>{a.name}</strong><small>{a.type} · Verified Agent</small></span><ArrowRight size={14} /></button>)}</div></div>}
      {void nav}
    </div>
  );
}
