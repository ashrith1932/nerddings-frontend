"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, Bell, Bookmark, BriefcaseBusiness, CalendarDays, Check, Flame, Loader2, MessageCircle, Search, Sparkles, TrendingUp, Users } from "lucide-react";
import { apiFetch, getAuthToken } from "@/lib/api";
import MessagesPanel from "@/components/messages/MessagesPanel";
import HomeFeedSurface from "@/components/social/HomeFeedSurface";

const panelCss = `
.live-data-route{width:100%;padding:4px 0 60px}.live-data-route h1{margin:4px 0 7px;font-size:28px;letter-spacing:-.02em}.live-data-route p{color:#8b8178;font-size:12px;line-height:1.55}.live-data-head{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;margin-bottom:18px}.live-data-head .eyebrow,.live-data-kicker{font-size:8px;letter-spacing:.14em;font-weight:800;color:#978d84}.live-data-tabs{display:flex;gap:26px;border-bottom:1px solid #e3ddd5;margin-bottom:18px}.live-data-tabs button{border:0;background:none;padding:11px 0 12px;color:#8b8178;font-weight:700;font-size:12px;cursor:pointer;position:relative}.live-data-tabs button.active{color:#201c19}.live-data-tabs button.active:after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:3px;border-radius:8px;background:#201c19}.live-data-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.live-data-card{background:#fffdf9;border:1px solid #ded7cf;border-radius:14px;padding:0;box-shadow:0 2px 10px rgba(31,27,24,.03);overflow:hidden}.live-data-card:hover{border-color:#c9c0b7;box-shadow:0 14px 30px rgba(31,27,24,.06)}.live-data-card-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.live-data-card h3{font-size:13px;margin:4px 0}.live-data-meta{font-size:9px;color:#978d84}.live-data-row{display:grid;grid-template-columns:34px 40px minmax(0,1fr) auto 18px;align-items:center;gap:12px;min-height:78px;padding:0 18px;border-bottom:1px solid #eee8e1;transition:background .18s ease,transform .18s ease}.live-data-row:last-child{border-bottom:0}.live-data-row:hover{background:#faf7f1;transform:translateX(2px)}.live-data-rank{width:34px;font-size:10px;color:#988e85;font-weight:800;text-align:center}.live-data-row>.home-avatar-sm{width:40px!important;height:40px!important;border-radius:50%!important;overflow:hidden!important;display:grid;place-items:center;background:#eee8df;flex:0 0 auto}.live-data-row>.home-avatar-sm img{width:100%;height:100%;object-fit:cover;border-radius:50%}.live-data-row-main{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center}.live-data-row-main strong{font-size:11px;display:block;color:#201c19;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.live-data-row-main>span:not(.live-data-progress){font-size:9px;color:#8e847b;display:block;margin-top:2px}.live-data-score{font-size:10px;font-weight:800;color:#655d55;min-width:45px;text-align:right}.live-data-row:has(.live-data-score)::after{content:"›";font-size:19px;color:#8f857c;line-height:1}.live-data-progress{height:4px;max-width:170px;border-radius:99px;background:#eee9e3;overflow:hidden;margin-top:7px;display:block}.live-data-progress i{display:block;height:100%;background:#d35d34;border-radius:99px}.live-data-notification{display:flex;gap:10px;align-items:flex-start;padding:13px 0;border-bottom:1px solid #eee8e1;cursor:pointer}.live-data-notification.unread{background:#fbf7f1;margin:0 -8px;padding-left:8px;padding-right:8px;border-radius:8px}.live-data-notification-icon{width:32px;height:32px;border-radius:9px;background:#f0ebe4;display:grid;place-items:center;color:#6e655d;flex:0 0 auto}.live-data-notification-main{flex:1;min-width:0}.live-data-notification-main strong{font-size:11px}.live-data-notification-main p{margin:3px 0;font-size:10px}.live-data-notification-main small{font-size:8px;color:#9a9087}.live-data-unread{width:6px;height:6px;border-radius:50%;background:#d35d34;margin-top:8px}.live-data-empty{min-height:220px;display:grid;place-items:center;text-align:center;border:1px solid #ded7cf;border-radius:14px;background:#fffdf9;padding:30px}.live-data-empty svg{color:#9a9087}.live-data-empty strong{font-size:12px}.live-data-empty span{font-size:10px;color:#948a81}.live-data-fundraising{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.live-fund-card{background:#fffdf9;border:1px solid #ded7cf;border-radius:12px;padding:15px;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}.live-fund-card:hover{transform:translateY(-2px);border-color:#c9c0b7;box-shadow:0 12px 26px rgba(31,27,24,.07)}.live-fund-top{display:flex;justify-content:space-between;align-items:flex-start}.live-fund-top strong{font-size:14px}.live-fund-stage{font-size:8px;padding:4px 7px;border:1px solid #ded7cf;border-radius:99px}.live-fund-amount{font-size:20px;font-weight:800;margin:13px 0 2px}.live-fund-sub{font-size:9px;color:#948a81}.live-fund-progress{height:7px;background:#eee9e3;border-radius:99px;overflow:hidden;margin:12px 0 7px}.live-fund-progress i{display:block;height:100%;background:#d35d34}.live-fund-foot{display:flex;justify-content:space-between;color:#8e847b;font-size:9px}.live-search-box{display:flex;align-items:center;gap:8px;border:1px solid #ddd6cc;border-radius:10px;background:#fffdf9;padding:9px 11px;margin-bottom:14px}.live-search-box input{border:0;outline:0;flex:1;background:transparent;font:inherit;font-size:12px}.live-search-section{margin-bottom:18px}.live-search-section h2{font-size:13px;margin:0 0 8px}.live-search-item{display:flex;align-items:center;gap:9px;border-bottom:1px solid #eee8e1;padding:10px 0}.live-search-item strong{font-size:11px}.live-search-item small{display:block;color:#91877e;font-size:9px;margin-top:2px}.live-search-link{border:0;background:none;padding:0;text-align:left;cursor:pointer;color:inherit;flex:1}.live-messages-wrap{min-height:500px}.live-messages-wrap>div{min-height:500px}.charts-board{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:16px;align-items:start}.charts-board-main{min-width:0}.charts-context{display:grid;gap:12px}.charts-context-card{background:#fffdf9;border:1px solid #ded7cf;border-radius:14px;padding:18px;box-shadow:0 2px 10px rgba(31,27,24,.03)}.charts-context-card h3{font-size:12px;margin:0 0 8px}.charts-context-card p{font-size:10px;margin:0;color:#81776e;line-height:1.65}.charts-how-row{display:flex;gap:10px;align-items:flex-start;padding:8px 0}.charts-how-icon{width:30px;height:30px;border-radius:10px;background:#fbf5e9;color:#c07827;display:grid;place-items:center;flex:none}.charts-how-copy strong{font-size:10px}.charts-how-copy small{display:block;color:#91877e;font-size:9px;margin-top:2px}.chart-row-open{border:0;background:none;color:#8b8178;font-size:18px;line-height:1;cursor:pointer;padding:0}.chart-row-open:hover{color:#201c19}.nerdd-project-card-hover{transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}.nerdd-project-card-hover:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(31,27,24,.09);border-color:#c9c0b7}
@media(max-width:980px){.charts-board{grid-template-columns:1fr}.charts-context{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:800px){.live-data-grid,.live-data-fundraising{grid-template-columns:1fr}.live-data-head{align-items:flex-start;flex-direction:column}.live-data-route h1{font-size:24px}.charts-context{grid-template-columns:1fr}.live-data-row{grid-template-columns:28px 34px minmax(0,1fr) auto 16px;padding:0 12px;gap:9px}.live-data-progress{max-width:120px}}
`;

const notifCardCss = `
.notif-list { display: flex; flex-direction: column; gap: 6px; }
.notif-card {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  background: var(--card, #fffdf9);
  border: 1px solid var(--line, #ded7cf);
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s, transform 0.15s;
}
.notif-card:hover { background: #faf7f1; box-shadow: 0 2px 10px rgba(31,27,24,.05); transform: translateY(-1px); }
.notif-card--unread { background: #fbf6ee; border-color: #d8cfc4; }
.notif-card-left { position: relative; flex: 0 0 auto; }
.notif-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  overflow: hidden; display: grid; place-items: center;
  background: #e9e3db; font-size: 11px; font-weight: 800; color: #2b2622;
}
.notif-avatar img { width: 100%; height: 100%; object-fit: cover; }
.notif-kind-icon {
  position: absolute; bottom: -2px; right: -2px;
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--ink, #201c19); color: #fff;
  display: grid; place-items: center;
  border: 2px solid var(--card, #fffdf9);
}
.notif-card-body { flex: 1; min-width: 0; }
.notif-card-actor { font-size: 12px; font-weight: 700; color: var(--ink, #201c19); }
.notif-card-text { margin: 2px 0 0; font-size: 11px; color: #6e655d; line-height: 1.45; }
.notif-card-time { font-size: 9px; color: #9a9087; }
.notif-card-actions { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; }
.notif-action-accept {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 12px; border: 0; border-radius: 8px;
  background: var(--ink, #201c19); color: var(--cream, #faf6f0);
  font-size: 10px; font-weight: 700; cursor: pointer;
  transition: opacity 0.15s;
}
.notif-action-accept:hover { opacity: 0.85; }
.notif-action-accept:disabled { opacity: 0.5; cursor: not-allowed; }
.notif-action-reject {
  display: inline-flex; align-items: center;
  padding: 5px 10px; border: 1px solid var(--line, #ded7cf); border-radius: 8px;
  background: none; color: #7d736b;
  font-size: 10px; font-weight: 650; cursor: pointer;
  transition: background 0.15s;
}
.notif-action-reject:hover { background: rgba(0,0,0,.04); }
.notif-action-reject:disabled { opacity: 0.5; cursor: not-allowed; }
.notif-unread-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #d35d34; flex: 0 0 auto;
}
@media(max-width:600px){
  .notif-card { padding: 10px; gap: 10px; }
  .notif-avatar { width: 34px; height: 34px; }
  .notif-action-accept, .notif-action-reject { padding: 4px 8px; font-size: 9px; }
}
`;


const ago = (value: string) => { const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); if (seconds < 60) return "now"; if (seconds < 3600) return `${Math.floor(seconds / 60)}m`; if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`; return `${Math.floor(seconds / 86400)}d`; };
const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0,2).toUpperCase();

function LiveNavMeta() {
  useEffect(() => {
    const refresh = async () => {
      const status = document.querySelector<HTMLElement>(".status-chip");
      if (status) status.style.display = "none";
      if (!getAuthToken()) return;
      try {
        const [notifications, messages] = await Promise.allSettled([apiFetch<any>("/notifications"), apiFetch<any>("/social/messages/unread-count")]);
        const counts = { Messages: messages.status === "fulfilled" ? Number(messages.value?.data?.unreadCount ?? 0) + Number(messages.value?.data?.pendingRequests ?? 0) : 0, Notifications: notifications.status === "fulfilled" ? Number(notifications.value?.unreadCount ?? 0) : 0 };
        document.querySelectorAll<HTMLElement>(".nav-item").forEach((item) => { const label = item.querySelector("span")?.textContent?.trim() as keyof typeof counts | undefined; if (!label || !(label in counts)) return; const count = counts[label]; let badge = item.querySelector<HTMLElement>("b"); if (count <= 0) { badge?.remove(); return; } if (!badge) { badge = document.createElement("b"); item.appendChild(badge); } badge.textContent = count > 99 ? "99+" : String(count); badge.style.display = "inline-flex"; });
      } catch {}
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(timer);
  }, []);
  return null;
}

export function LiveHomeRoute() { return <HomeFeedSurface />; }

export function LiveMessagesRoute() { return <div className="live-data-route live-messages-wrap"><style>{panelCss}</style><LiveNavMeta /><MessagesPanel /></div>; }

export function LiveNotificationsRoute() {
  const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<Record<string, boolean>>({});
  const load = async () => { setLoading(true); try { const response = await apiFetch<any>("/notifications"); setItems(response.data ?? []); } catch { setItems([]); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const markAll = async () => { try { await apiFetch("/notifications/read-all", { method: "POST" }); await load(); } catch {} };
  const markRead = async (id: string) => { try { await apiFetch(`/notifications/${id}/read`, { method: "POST" }); } catch {} };
  const handleAffiliationAction = async (notifId: string, entityId: string, decision: "accept" | "reject") => {
    setActionBusy(prev => ({ ...prev, [notifId]: true }));
    try {
      await apiFetch(`/affiliations/agent-requests/${entityId}/${decision}`, { method: "POST" });
      await markRead(notifId);
      await load();
    } catch (e) { console.error("Affiliation action failed", e); }
    finally { setActionBusy(prev => ({ ...prev, [notifId]: false })); }
  };
  const navigateNotification = (item: any) => {
    if (item.kind === "follow" && item.actor?.username) {
      window.history.pushState({}, "", `/profile/${encodeURIComponent(item.actor.username)}`);
    } else if (item.entityId) {
      window.history.pushState({}, "", `/post/${encodeURIComponent(item.entityId)}`);
    }
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return <div className="live-data-route"><style>{panelCss}{notifCardCss}</style><LiveNavMeta />
    <div className="live-data-head">
      <div><div className="eyebrow">KEEP IN THE LOOP</div><h1>Notifications</h1><p>Live activity generated by your Nerdding network.</p></div>
      <button className="outline-button" onClick={() => void markAll()}><Check size={14} /> Mark all as read</button>
    </div>
    {loading ? <div className="live-data-empty"><Loader2 size={20} /></div> : items.length ? <div className="notif-list">
      {items.map((item) => {
        const isAffiliationRequest = item.kind === "agent_affiliation_request";
        const isUnread = !item.readAt;
        return <div className={`notif-card ${isUnread ? "notif-card--unread" : ""}`} key={item.id}>
          <div className="notif-card-left" onClick={() => { if (!isAffiliationRequest) { void markRead(item.id); navigateNotification(item); } }}>
            {/* Avatar */}
            <span className="notif-avatar">
              {item.actor?.avatarUrl ? <img src={item.actor.avatarUrl} alt="" /> : <span>{(item.actor?.name ?? "N").slice(0, 2).toUpperCase()}</span>}
            </span>
            {/* Icon overlay */}
            <span className="notif-kind-icon">
              {item.kind === "follow" ? <Users size={11} /> : item.kind === "comment" ? <MessageCircle size={11} /> : item.kind === "message_request" ? <Bell size={11} /> : item.kind === "agent_affiliation_request" ? <Users size={11} /> : item.kind === "agent_affiliation_approved" ? <Check size={11} /> : <Activity size={11} />}
            </span>
          </div>
          <div className="notif-card-body" onClick={() => { if (!isAffiliationRequest) { void markRead(item.id); navigateNotification(item); } }}>
            <div className="notif-card-actor">{item.actor?.name ?? "Nerdding"}</div>
            <p className="notif-card-text">{item.text}</p>
            <small className="notif-card-time">{ago(item.createdAt)}</small>
          </div>
          <div className="notif-card-actions">
            {isAffiliationRequest && isUnread && item.entityId ? <>
              <button className="notif-action-accept" disabled={!!actionBusy[item.id]} onClick={() => void handleAffiliationAction(item.id, item.entityId, "accept")}><Check size={13} /> Accept</button>
              <button className="notif-action-reject" disabled={!!actionBusy[item.id]} onClick={() => void handleAffiliationAction(item.id, item.entityId, "reject")}>Decline</button>
            </> : null}
            {isUnread && <i className="notif-unread-dot" />}
          </div>
        </div>;
      })}
    </div> : <div className="live-data-empty"><Bell size={20} /><strong>No notifications</strong><span>New activity will appear here when something happens.</span></div>}
  </div>;
}


export function LiveChartsRoute() {
  const [data, setData] = useState<any>(null); const [tab, setTab] = useState("risingBuilders"); const [loading, setLoading] = useState(true);
  useEffect(() => { apiFetch<any>("/charts").then((response) => setData(response.data)).catch(() => setData(null)).finally(() => setLoading(false)); }, []);
  const rows = useMemo(() => data?.[tab] ?? [], [data, tab]);
  const openRow = (row: any) => { const path = tab === "risingBuilders" && row.username ? `/profile/${encodeURIComponent(row.username)}` : row.slug ? `/project/${encodeURIComponent(row.slug)}` : null; if(path){window.history.pushState({},"",path);window.dispatchEvent(new PopStateEvent("popstate"));} };
  return <div className="live-data-route"><style>{panelCss}</style><LiveNavMeta /><div className="live-data-head"><div><div className="eyebrow">SIGNALS OVER STATUS</div><h1>Charts</h1><p>Live ranking data from proof, trust and meaningful activity.</p></div></div><div className="live-data-tabs"><button className={tab === "risingBuilders" ? "active" : ""} onClick={() => setTab("risingBuilders")}>Rising builders</button><button className={tab === "topProjects" ? "active" : ""} onClick={() => setTab("topProjects")}>Top projects</button><button className={tab === "trendingStartups" ? "active" : ""} onClick={() => setTab("trendingStartups")}>Trending startups</button></div><div className="charts-board"><div className="charts-board-main">{loading ? <div className="live-data-empty"><Loader2 size={20} /></div> : rows.length ? <div className="live-data-card">{rows.map((row: any, index: number) => <div className="live-data-row" key={row.id ?? index}><span className="live-data-rank">{String(index + 1).padStart(2, "0")}</span><span className="home-avatar home-avatar-sm">{row.avatarUrl ? <img src={row.avatarUrl} alt="" /> : initials(row.name ?? row.startupName ?? row.title ?? "N")}</span><span className="live-data-row-main"><strong>{row.name ?? row.startupName ?? row.title}</strong><span>{row.username ? `@${row.username}` : row.stage ?? row.industry ?? "Live signal"}</span><span className="live-data-progress"><i style={{ width: `${Math.min(100, Math.max(8, Number(row.score ?? row.progress ?? 0) * (row.score ? 100 : 1)))}%` }} /></span></span><span className="live-data-score">{row.score != null ? Number(row.score).toFixed(2) : row.progress != null ? `${row.progress}%` : "—"}</span><button className="chart-row-open" onClick={() => openRow(row)} aria-label="Open ranking item">›</button></div>)}</div> : <div className="live-data-empty"><TrendingUp size={20} /><strong>No live rankings yet</strong><span>The backend has no records for this chart.</span></div>}</div><aside className="charts-context"><section className="charts-context-card"><h3>About Charts</h3><p>Charts are calculated from real-time proof-of-work, trust signals, engagement quality, consistency, and impact. Rankings are designed to surface useful momentum, not follower count alone.</p><p style={{marginTop:10}}>Rankings update frequently as meaningful activity changes.</p></section><section className="charts-context-card"><h3>How it works</h3><div className="charts-how-row"><span className="charts-how-icon"><Check size={15}/></span><span className="charts-how-copy"><strong>Proof</strong><small>Verifiable work matters</small></span></div><div className="charts-how-row"><span className="charts-how-icon"><Users size={15}/></span><span className="charts-how-copy"><strong>Trust</strong><small>Built through community</small></span></div><div className="charts-how-row"><span className="charts-how-icon"><TrendingUp size={15}/></span><span className="charts-how-copy"><strong>Activity</strong><small>Meaningful engagement</small></span></div><div className="charts-how-row"><span className="charts-how-icon"><Sparkles size={15}/></span><span className="charts-how-copy"><strong>Impact</strong><small>Real-world outcomes</small></span></div></section></aside></div></div>;
}

export function LiveFundraisingRoute() {
  const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { apiFetch<any>("/fundraisings").then((response) => setItems(response.data ?? [])).catch(() => setItems([])).finally(() => setLoading(false)); }, []);
  return <div className="live-data-route"><style>{panelCss}</style><LiveNavMeta /><div className="live-data-head"><div><div className="eyebrow">FUNDRAISING</div><h1>Capital for builders.</h1><p>Active fundraising profiles published by verified agents.</p></div></div>{loading ? <div className="live-data-empty"><Loader2 size={20} /></div> : items.length ? <div className="live-data-fundraising">{items.map((item) => <article className="live-fund-card" key={item.id}><div className="live-fund-top"><strong>{item.startupName}</strong><span className="live-fund-stage">{item.stage}</span></div><div className="live-fund-amount">{item.currency} {Number(item.raisedAmount).toLocaleString()}</div><div className="live-fund-sub">raised of {Number(item.targetAmount).toLocaleString()}</div><div className="live-fund-progress"><i style={{ width: `${item.progress}%` }} /></div><div className="live-fund-foot"><span>{item.industry}</span><span>{item.investorCount} investors</span></div></article>)}</div> : <div className="live-data-empty"><BriefcaseBusiness size={20} /><strong>No fundraising profiles yet</strong><span>Verified agents can publish fundraising opportunities here.</span></div>}</div>;
}

export function LiveSearchRoute({ query }: { query: string }) {
  const [data, setData] = useState<any>(null); const [loading, setLoading] = useState(false); const [tab, setTab] = useState<"builds" | "projects" | "users" | "agents">("builds");
  useEffect(() => { const q = query.trim(); if (!q) { setData(null); return; } setLoading(true); const timer = window.setTimeout(() => { apiFetch<any>(`/search?q=${encodeURIComponent(q)}`).then((response) => setData(response.data)).catch(() => setData(null)).finally(() => setLoading(false)); }, 250); return () => window.clearTimeout(timer); }, [query]);
  const groups = { builds: { label: "Build Notes", items: data?.posts ?? [], href: (item: any) => `/post/${encodeURIComponent(item.id)}` }, projects: { label: "Projects", items: data?.projects ?? [], href: (item: any) => `/project/${encodeURIComponent(item.slug)}` }, users: { label: "Users", items: data?.users ?? [], href: (item: any) => `/profile/${encodeURIComponent(item.username)}` }, agents: { label: "Agents", items: data?.agents ?? [], href: (item: any) => `/agent/${encodeURIComponent(item.slug ?? item.username)}` } } as const;
  const current = groups[tab];
  const section = (title: string, items: any[], href: (item: any) => string) => <section className="live-search-section"><h2>{title}</h2>{items.length ? items.map((item) => <div className="live-search-item" key={item.id}><span className="home-avatar home-avatar-sm">{item.avatarUrl ? <img src={item.avatarUrl} alt="" /> : initials(item.name ?? item.title ?? "N")}</span><button className="live-search-link" onClick={() => { window.history.pushState({}, "", href(item)); window.dispatchEvent(new PopStateEvent("popstate")); }}><strong>{item.name ?? item.title}</strong><small>{item.username ? `@${item.username}` : item.description ?? item.body}</small></button><ArrowUpRight size={14} /></div>) : <p>No {title.toLowerCase()} found.</p>}</section>;
  return <div className="live-data-route"><style>{panelCss}</style><LiveNavMeta /><div className="live-data-head"><div><div className="eyebrow">SEARCH</div><h1>Search Nerdding.</h1><p>Results come directly from the production database.</p></div></div>{!query.trim() ? <div className="live-data-empty"><Search size={20} /><strong>Start searching</strong><span>Enter a name, project or idea in the top search box.</span></div> : loading ? <div className="live-data-empty"><Loader2 size={20} /></div> : data ? <><nav className="live-data-tabs search-category-tabs">{(Object.keys(groups) as Array<keyof typeof groups>).map((key) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{groups[key].label} <span>{groups[key].items.length}</span></button>)}</nav><div className="live-data-card">{section(current.label, current.items, current.href)}</div></> : <div className="live-data-empty"><Search size={20} /><strong>No results</strong><span>Try a different search term.</span></div>}</div>;
}
