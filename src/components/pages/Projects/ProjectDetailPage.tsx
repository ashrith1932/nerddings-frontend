"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowUpRight, ChevronDown, ChevronUp, Github, Loader2, Plus, Search, Share2, X } from "lucide-react";
import { apiFetch, getSavedUser } from "@/lib/api";
import { Avatar, ProjectMark } from "@/components/ui/Avatar";
import ProjectInterestButton from "@/components/ui/ProjectInterestButton";
import { projects as seededProjects } from "@/lib/mock-data";

type Project = { id:string; name:string; slug:string; description:string; stage:string; githubUrl?:string|null; createdAt?:string; owner?:{id:string;name:string;username:string;avatarUrl?:string|null}|null; agent?:{id:string;name:string;slug:string;verified?:boolean}|null; posts?:Array<{id:string;body:string;created_at:string}> };
type Commit = { sha:string; message:string; author:string; date:string|null; url:string };
type Member = { user_id:string; name:string; username:string; avatar_url?:string|null; role?:string; status?:string };
type Suggestion = { id:string; name:string; username:string; avatarUrl?:string|null; accountType?:string };
const nav=(path:string)=>{window.history.pushState({},"",path);window.dispatchEvent(new PopStateEvent("popstate"));};
const roleLabel=(role?:string,ownerId?:string,userId?:string)=>String(ownerId)===String(userId)?"Owner":role==="viewer"?"Viewer":"Editor";
const styles=`
.project-detail-page{--paper:#f8f6f2;--card:#fffdf9;--ink:#201c19;--line:#ded7cf;--accent:#e85d2f;background:var(--paper);color:var(--ink);min-height:100%;padding:16px 0 72px}.project-detail-inner{width:100%;margin:0 auto}.project-topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:2px 0 14px}.project-back{display:inline-flex;align-items:center;gap:7px;border:0;background:transparent;color:#756c64;font-size:12px;font-weight:650;padding:6px 2px;cursor:pointer}.project-back:hover{color:var(--ink)}.project-search{display:flex;align-items:center;gap:8px;background:#fffdf9;border:1px solid var(--line);border-radius:11px;padding:8px 11px;width:min(330px,42vw);color:#8e847a}.project-search input{border:0;outline:0;background:transparent;min-width:0;flex:1;font-size:11px}.project-hero{position:relative;overflow:hidden;background:linear-gradient(115deg,#161310,#2a1e19 60%,#352019);border:1px solid #2c211b;border-radius:17px;padding:28px;display:flex;align-items:center;gap:20px;color:#fff;box-shadow:0 15px 38px rgba(31,27,24,.12)}.project-hero:before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.08) .7px,transparent .7px);background-size:14px 14px;opacity:.18;pointer-events:none}.project-hero-mark,.project-hero-copy,.project-hero-actions{position:relative;z-index:1}.project-hero-mark{width:88px;height:88px;border-radius:17px;overflow:hidden;flex:0 0 auto}.project-hero-copy{min-width:0;flex:1}.project-hero .eyebrow{color:#f07b54}.project-hero h1{font-size:32px;line-height:1.05;margin:6px 0 7px;letter-spacing:-.03em}.project-hero p{margin:0;color:#d9cfc7;font-size:12px;line-height:1.55;max-width:690px}.project-badges{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.project-badge{display:inline-flex;align-items:center;gap:5px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);border-radius:999px;padding:5px 8px;color:#f3ece7;font-size:9px}.project-badge.accent{border-color:rgba(232,93,47,.55);color:#ff9a73}.project-hero-actions{display:flex;align-items:center;gap:8px}.project-hero-actions a{display:inline-flex;align-items:center;gap:7px;color:#fff;text-decoration:none;border:1px solid rgba(255,255,255,.28);border-radius:10px;padding:10px 12px;font-size:10px;font-weight:800}.project-hero-actions a:hover{background:rgba(255,255,255,.08)}.project-grid-top{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:12px;align-items:stretch}.project-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:17px;box-shadow:0 5px 18px rgba(31,27,24,.035);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}.project-card:hover{transform:translateY(-2px);box-shadow:0 12px 25px rgba(31,27,24,.07);border-color:#cbc2b8}.project-card h2{font-size:13px;margin:0}.project-card p{font-size:11px;line-height:1.65;color:#746b63;margin:10px 0 0}.project-card-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}.project-card-icon{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:#fff1e9;color:var(--accent);font-size:13px;font-weight:900}.project-overview-cta{margin-top:13px}.project-secondary{border:1px solid var(--line);border-radius:9px;background:#fff;padding:8px 10px;font-size:10px;font-weight:750;color:#5f5750;cursor:pointer}.project-secondary:hover{background:#faf6f0}.project-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:11px}.project-stat{border:1px solid #eee7df;border-radius:10px;padding:12px 8px;text-align:center}.project-stat strong{font-size:19px;display:block}.project-stat span{display:block;color:#91877f;font-size:9px;margin-top:3px}.project-detail-list{display:grid;gap:11px;margin-top:8px}.project-detail-row{display:flex;align-items:center;justify-content:space-between;gap:10px}.project-detail-row>span:first-child{font-size:10px;color:#8c8279}.project-detail-row button{border:0;background:none;padding:0;color:#e25b34;font-size:10px;font-weight:800;display:inline-flex;align-items:center;gap:3px;cursor:pointer}.project-main-grid{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);gap:12px;margin-top:12px;align-items:start}.project-build-card{min-height:250px}.project-empty{min-height:230px;border:1px dashed #e0d6cb;border-radius:12px;background:#fff9f3;display:flex;align-items:center;justify-content:center;text-align:center;padding:28px}.project-empty-inner{max-width:350px}.project-empty-icon{width:58px;height:58px;border-radius:18px;background:#ffe8da;color:#ed865f;display:grid;place-items:center;margin:0 auto 12px}.project-empty h3{font-size:15px;margin:0 0 7px}.project-empty p{font-size:10px;margin:0;color:#8a7f76}.project-primary{margin-top:14px;border:0;background:var(--accent);color:#fff;border-radius:9px;padding:9px 13px;font-size:10px;font-weight:850;cursor:pointer}.project-primary:hover{filter:brightness(.97);transform:translateY(-1px)}.project-updates{display:grid;gap:8px}.project-update{border:1px solid #eee7df;background:#fff;border-radius:10px;padding:11px}.project-update strong{font-size:10px;display:block}.project-update small{display:block;margin-top:5px;color:#91877f;font-size:8px}.project-quick{margin-top:12px}.project-actions{display:flex;flex-wrap:wrap;gap:8px}.project-actions button,.project-actions a{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:#fff;border-radius:9px;padding:9px 11px;color:#5f5750;font-size:10px;font-weight:750;text-decoration:none;cursor:pointer}.project-actions button:hover,.project-actions a:hover{background:#faf6f0;border-color:#cfc6bc}.project-commits{display:grid;gap:8px}.project-commit{display:grid;grid-template-columns:18px minmax(0,1fr) 18px;gap:9px;align-items:center;border:1px solid #eee7df;background:#fff;border-radius:10px;padding:10px;text-decoration:none;color:inherit;transition:background .16s ease,border-color .16s ease,transform .16s ease}.project-commit:hover{background:#faf7f2;border-color:#c9bfb5;transform:translateY(-1px)}.project-commit-dot{width:9px;height:9px;border-radius:50%;background:#28a967;box-shadow:0 0 0 4px #e8f7ef}.project-commit-main{min-width:0}.project-commit-main strong{font-size:10px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.project-commit-main small{font-size:8px;color:#91877f;display:block;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.project-commit-arrow{color:#8d837a}.project-collabs{display:flex;flex-direction:column;min-height:0;scroll-margin-top:18px}.project-collab-list{display:grid;gap:5px;margin-top:7px}.project-collab-list.scrollable{max-height:250px;overflow:auto;padding-right:4px;overscroll-behavior:contain}.project-collab-row{display:flex;align-items:center;gap:8px;width:100%;border:0;background:transparent;padding:7px 6px;border-radius:9px;text-align:left;cursor:pointer;transition:background .15s ease}.project-collab-row:hover{background:#f6f1eb}.project-collab-meta{min-width:0;display:flex;flex-direction:column;flex:1}.project-collab-meta strong{font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.project-collab-meta small{font-size:8px;color:#91877f;margin-top:2px}.project-role{padding:4px 7px;border-radius:999px;font-size:8px;font-weight:800;background:#eff0ed;color:#615a54}.project-role.owner{background:#e6f6e9;color:#277b46}.project-role.editor{background:#e7efff;color:#3a65a9}.project-role.viewer{background:#f0f0f0;color:#6d6965}.collab-toggle{border:0;background:none;color:#d45c36;font-size:9px;font-weight:850;padding:8px 0;cursor:pointer;display:inline-flex;align-items:center;gap:4px}.project-invite-button{width:100%;border:1px solid #efb9a5;background:#fff9f6;color:#df5e35;border-radius:9px;padding:9px 11px;font-size:10px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;margin-top:7px}.project-invite-button:hover{background:#fff3ec}.project-pending-title{margin:12px 0 4px;font-size:9px;letter-spacing:.1em;color:#958a80;font-weight:850}.project-pending-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 0;border-bottom:1px solid #eee7df}.project-pending-row span{font-size:9px;color:#5f5750}.project-pending-row small{color:#91877f;font-size:8px}.project-invite-popover{position:fixed;inset:0;z-index:7200;background:rgba(22,17,14,.32);display:grid;place-items:center;padding:18px}.project-invite-modal{width:min(430px,calc(100vw - 24px));background:#fffdf9;border:1px solid var(--line);border-radius:15px;box-shadow:0 28px 70px rgba(0,0,0,.2);padding:18px}.project-invite-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.project-invite-head h3{font-size:16px;margin:0}.project-invite-head p{font-size:9px;color:#91877f;margin:5px 0 0}.project-invite-close{border:0;background:transparent;color:#8a8077;cursor:pointer}.project-search-wrap{display:flex;align-items:center;gap:7px;border:1px solid var(--line);background:#fff;border-radius:9px;padding:8px 9px;margin-top:15px}.project-search-wrap input{border:0;outline:0;background:transparent;min-width:0;flex:1;font-size:10px}.project-user-options{margin-top:6px;border:1px solid var(--line);border-radius:9px;max-height:180px;overflow:auto;background:#fff}.project-user-option{width:100%;border:0;background:transparent;display:flex;align-items:center;gap:9px;padding:9px;text-align:left;cursor:pointer}.project-user-option:hover{background:#f6f1eb}.project-selected-user{display:flex;align-items:center;gap:9px;margin-top:10px;padding:8px;border:1px solid #eee7df;border-radius:9px;background:#fff}.project-role-select{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-top:12px}.project-role-select label{font-size:9px;color:#7f756d;font-weight:750}.project-role-select select{border:1px solid var(--line);border-radius:8px;padding:7px 8px;background:#fff;font-size:9px}.project-invite-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:15px}.project-invite-footer button{border:1px solid var(--line);background:#fff;border-radius:9px;padding:8px 11px;font-size:10px;font-weight:750;cursor:pointer}.project-invite-footer .send{border-color:var(--accent);background:var(--accent);color:#fff}.project-invite-footer button:disabled{opacity:.5;cursor:not-allowed}.project-invite-success{margin-top:12px;border:1px solid #ccebd6;background:#effaf2;color:#2b7d48;border-radius:9px;padding:10px;font-size:9px}.project-inline-error{margin-top:10px;color:#b9492a;background:#fff1eb;border:1px solid #f0c1b1;padding:9px;border-radius:9px;font-size:9px}.project-loading{padding:20px}.project-skeleton{height:110px;border-radius:16px;background:linear-gradient(90deg,#ebe5de 0%,#f7f3ee 48%,#ebe5de 100%);background-size:200% 100%;animation:projectShimmer 1.15s infinite}.project-skeleton-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:12px}.project-skeleton-small{height:150px;border-radius:14px;background:#ebe5de}@keyframes projectShimmer{to{background-position:-200% 0}}@media(max-width:1120px){.project-grid-top{grid-template-columns:repeat(2,1fr)}.project-main-grid{grid-template-columns:1fr}.project-search{width:260px}}@media(max-width:760px){.project-detail-inner{width:calc(100vw - 24px)}.project-topbar{align-items:flex-start;flex-direction:column}.project-search{width:100%}.project-hero{flex-direction:column;align-items:flex-start;padding:22px}.project-hero-actions{width:100%}.project-hero-actions a{flex:1;justify-content:center}.project-hero h1{font-size:28px}.project-grid-top{grid-template-columns:1fr}.project-main-grid{grid-template-columns:1fr}.project-collab-list.scrollable{max-height:220px}.project-skeleton-grid{grid-template-columns:1fr 1fr}}
.project-detail-backdrop{--paper:#f8f6f2;--card:#fffdf9;--ink:#201c19;--line:#ded7cf;--accent:#e85d2f;position:fixed;inset:0;z-index:6500;background:rgba(22,17,14,.42);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:24px;color:var(--ink);animation:nrtProjFadeIn .22s ease-out;overscroll-behavior:contain}
.project-detail-modal{width:min(1200px,calc(100vw - 48px));max-height:min(680px,calc(100vh - 48px));background:var(--paper);border:1px solid var(--line);border-radius:20px;box-shadow:0 35px 95px rgba(20,16,12,.24);display:flex;flex-direction:column;overflow:hidden;animation:nrtProjScaleUp .3s cubic-bezier(.22,1,.36,1)}
.project-detail-header{display:flex;align-items:center;justify-content:space-between;padding:15px 22px;border-bottom:1px solid var(--line);background:var(--card);flex:0 0 auto}
.project-detail-header-left{display:flex;align-items:center;gap:12px}
.project-detail-close{width:32px;height:32px;border:1px solid var(--line);border-radius:50%;background:#fff;display:grid;place-items:center;cursor:pointer;color:#8a8077;transition:background .15s,color .15s;flex:0 0 auto}
.project-detail-close:hover{background:#f3ede6;color:var(--ink)}
.project-detail-body-scroll{flex:1;overflow-y:auto;padding:22px;overscroll-behavior:contain}
@keyframes nrtProjFadeIn{from{opacity:0}to{opacity:1}}
@keyframes nrtProjScaleUp{from{transform:translateY(24px) scale(.98);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
@media(max-width:800px){.project-detail-backdrop{padding:12px}.project-detail-modal{border-radius:14px}}
`;

export default function ProjectDetailSurface({slug, onClose}:{slug:string; onClose?:()=>void}){
 const [mounted,setMounted]=useState(false);useEffect(()=>{setMounted(true)},[]);
 const [project,setProject]=useState<Project|null>(null);const [members,setMembers]=useState<Member[]>([]);const [pending,setPending]=useState<Member[]>([]);const [commits,setCommits]=useState<Commit[]>([]);const [query,setQuery]=useState("");const [suggestions,setSuggestions]=useState<Suggestion[]>([]);const [selectedUser,setSelectedUser]=useState<Suggestion|null>(null);const [inviteRole,setInviteRole]=useState<"editor"|"viewer">("editor");const [inviteOpen,setInviteOpen]=useState(false);const [expanded,setExpanded]=useState(false);const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [busy,setBusy]=useState(false);const [success,setSuccess]=useState("");const collabRef=useRef<HTMLDivElement|null>(null);const previousScroll=useRef(0);const [interestData, setInterestData] = useState<{ active: boolean; count: number }>({ active: false, count: 0 });

 const load=async()=>{setLoading(true);setError("");const results=await Promise.allSettled([apiFetch<{data:Project}>(`/projects/${encodeURIComponent(slug)}`),apiFetch<{data:Member[]}>(`/social/projects/${encodeURIComponent(slug)}/members`),apiFetch<{data:Commit[]}>(`/social/projects/${encodeURIComponent(slug)}/github-commits`),apiFetch<{data:Member[]}>(`/social/projects/${encodeURIComponent(slug)}/pending-invitations`)]);if(results[0].status==="fulfilled")setProject(results[0].value.data);else setError(results[0].reason instanceof Error?results[0].reason.message:"Project could not be loaded");if(results[1].status==="fulfilled")setMembers(results[1].value.data??[]);if(results[2].status==="fulfilled")setCommits(results[2].value.data??[]);if(results[3].status==="fulfilled")setPending(results[3].value.data??[]);setLoading(false);try{const interestResp=await apiFetch<{data:{active:boolean;count:number}}>(`/projects/${encodeURIComponent(slug)}/interest`);setInterestData(interestResp.data);}catch{}};

  const invite = async () => {
    if (!selectedUser || busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch(`/social/projects/${encodeURIComponent(slug)}/invitations`, {
        method: "POST",
        body: JSON.stringify({ userId: selectedUser.id, role: inviteRole })
      });
      setSuccess(`Successfully invited @${selectedUser.username} as ${inviteRole}.`);
      setSelectedUser(null);
      setQuery("");
      const results = await Promise.allSettled([
        apiFetch<{data:Member[]}>(`/social/projects/${encodeURIComponent(slug)}/members`),
        apiFetch<{data:Member[]}>(`/social/projects/${encodeURIComponent(slug)}/pending-invitations`)
      ]);
      if (results[0].status === "fulfilled") setMembers(results[0].value.data ?? []);
      if (results[1].status === "fulfilled") setPending(results[1].value.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation.");
    } finally {
      setBusy(false);
    }
  };

  const cancelInvitation = async (userId: string) => {
    try {
      await apiFetch(`/social/projects/${encodeURIComponent(slug)}/invitations/${encodeURIComponent(userId)}`, {
        method: "DELETE"
      });
      const r = await apiFetch<{data:Member[]}>(`/social/projects/${encodeURIComponent(slug)}/pending-invitations`);
      setPending(r.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel invitation.");
    }
  };

 useEffect(()=>{void load()},[slug]);useEffect(()=>{if(!query.trim()){setSuggestions([]);return}const timer=window.setTimeout(()=>{apiFetch<{data:Suggestion[]}>(`/social/mentions?q=${encodeURIComponent(query)}`).then(r=>setSuggestions((r.data??[]).filter(x=>x.id!==getSavedUser()?.id&&x.accountType!=="agent"))).catch(()=>setSuggestions([]))},180);return()=>window.clearTimeout(timer)},[query]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      window.history.pushState({}, "", "/home");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="project-detail-inner project-loading">
          <div className="project-skeleton" />
          <div className="project-skeleton-grid">
            <div className="project-skeleton-small" />
            <div className="project-skeleton-small" />
            <div className="project-skeleton-small" />
            <div className="project-skeleton-small" />
          </div>
        </div>
      );
    }
    if (!project) {
      return (
        <div className="project-detail-inner">
          <div className="project-card">
            <strong>Project could not be loaded.</strong>
            <p>{error}</p>
            <button className="project-secondary" onClick={() => void load()}>Try again</button>
          </div>
        </div>
      );
    }

    const viewer = getSavedUser();
    const owner = String(project.owner?.id) === String(viewer?.id);
    const visibleMembers = expanded ? members : members.slice(0, 1);
    const hasMore = members.length > 1;
    const mark = { ...seededProjects[0], id: project.id, name: project.name, slug: project.slug, description: project.description, stage: project.stage };
    const toggleExpanded = () => {
      if (!expanded) {
        previousScroll.current = window.scrollY;
        setExpanded(true);
        window.setTimeout(() => collabRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      } else {
        setExpanded(false);
        window.setTimeout(() => window.scrollTo({ top: previousScroll.current, behavior: "smooth" }), 80);
      }
    };
    const openInvite = () => { setSuccess(""); setError(""); setQuery(""); setSelectedUser(null); setInviteRole("editor"); setInviteOpen(true); };

    return (
      <div className="project-detail-inner">
        <section className="project-hero">
          <div className="project-hero-mark"><ProjectMark project={mark} size="lg"/></div>
          <div className="project-hero-copy">
            <div className="eyebrow">PROJECT · {project.stage.toUpperCase()}</div>
            <h1>{project.name}</h1>
            <p>{project.description || "A project built by people who care about making things."}</p>
            <div className="project-badges">
              <span className="project-badge">{project.stage}</span>
              <span className="project-badge">{project.githubUrl ? "Public project" : "Private project"}</span>
              {!(project.posts?.length) && <span className="project-badge accent">No updates yet</span>}
            </div>
          </div>
          <div className="project-hero-actions">
            {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer"><Github size={14} /> View on GitHub <ArrowUpRight size={13} /></a>}
          </div>
        </section>
        <div className="project-grid-top">
          <section className="project-card">
            <div className="project-card-head"><span className="project-card-icon">◌</span><h2>Project overview</h2></div>
            <p>{project.description || "This is your private project idea. Add a description to tell others what it’s about."}</p>
            {owner && <div className="project-overview-cta"><button className="project-secondary">Edit description</button></div>}
          </section>
          <section className="project-card">
            <div className="project-card-head"><span className="project-card-icon">↗</span><h2>Stats</h2></div>
            <div className="project-stats">
              <div className="project-stat"><strong>{project.posts?.length ?? 0}</strong><span>Updates</span></div>
              <div className="project-stat"><strong>—</strong><span>Followers</span></div>
              <div className="project-stat"><strong>{interestData.count}</strong><span>Interests</span></div>
            </div>
          </section>
          <section className="project-card">
            <div className="project-card-head"><span className="project-card-icon">▢</span><h2>Project details</h2></div>
            <div className="project-detail-list">
              <div className="project-detail-row">
                <span>Owner</span>
                <button onClick={() => { handleClose(); nav(`/profile/${encodeURIComponent(project.owner?.username ?? viewer?.username ?? "")}`); }}>
                  @{project.owner?.username}<ArrowUpRight size={12} />
                </button>
              </div>
              <div className="project-detail-row"><span>Created</span><span>{project.createdAt ? new Date(project.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}</span></div>
              <div className="project-detail-row"><span>Visibility</span><span>{project.githubUrl ? "Public" : "Private"}</span></div>
            </div>
          </section>
          <section className="project-card project-collabs" ref={collabRef}>
            <div className="project-card-head"><span className="project-card-icon">♧</span><h2>Collaborators ({members.length})</h2></div>
            <div className={`project-collab-list ${expanded ? "scrollable" : ""}`}>
              {visibleMembers.map(member =>
                <button key={member.user_id} className="project-collab-row" onClick={() => { handleClose(); nav(`/profile/${encodeURIComponent(member.username)}`); }}>
                  <Avatar user={{ ...seededProjects[0] as any, id: member.user_id, name: member.name, username: member.username, avatarUrl: member.avatar_url }} size="sm" />
                  <span className="project-collab-meta"><strong>{member.name}</strong><small>@{member.username}</small></span>
                  <span className={`project-role ${roleLabel(member.role, project.owner?.id, member.user_id).toLowerCase()}`}>{roleLabel(member.role, project.owner?.id, member.user_id)}</span>
                </button>
              )}
            </div>
            {hasMore && <button className="collab-toggle" onClick={toggleExpanded}>{expanded ? <>Show less <ChevronUp size={12} /></> : <>See more collaborators <ChevronDown size={12} /></>}</button>}
            {owner && <button className="project-invite-button" onClick={openInvite}><Plus size={13} /> Invite collaborator</button>}
            {expanded && owner && pending.length > 0 && (
              <>
                <div className="project-pending-title">PENDING INVITATIONS</div>
                {pending.map(item =>
                  <div className="project-pending-row" key={item.user_id}>
                    <span>@{item.username}</span>
                    <span><small>Pending</small> <button className="collab-toggle" onClick={() => void cancelInvitation(item.user_id)}>Cancel</button></span>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
        <div className="project-main-grid">
          <div>
            <section className="project-card project-build-card">
              <div className="project-card-head"><span className="project-card-icon">◫</span><h2>Build updates</h2></div>
              {project.posts?.length ? (
                <div className="project-updates">
                  {project.posts.map(post => <article className="project-update" key={post.id}><strong>{post.body}</strong><small>{new Date(post.created_at).toLocaleString()}</small></article>)}
                </div>
              ) : (
                <div className="project-empty">
                  <div className="project-empty-inner">
                    <div className="project-empty-icon">▤</div>
                    <h3>No build updates yet</h3>
                    <p>Share your progress with the community. Attach this project to a Nerdding post when you publish an update.</p>
                    <button className="project-primary" onClick={() => window.dispatchEvent(new CustomEvent("nerdding:open-composer"))}>Create a post</button>
                  </div>
                </div>
              )}
            </section>
            <section className="project-card project-quick">
              <div className="project-card-head"><span className="project-card-icon">ϟ</span><h2>Quick actions</h2></div>
              <div className="project-actions">
                <button onClick={() => window.dispatchEvent(new CustomEvent("nerdding:open-composer"))}>Add build note</button>
                {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer"><Github size={13} /> Open in GitHub</a>}
                <button onClick={async () => { try { await navigator.clipboard?.writeText(window.location.href); } catch {} }}><Share2 size={13} /> Share project</button>
              </div>
            </section>
          </div>
          <section className="project-card">
            <div className="project-card-head">
              <span className="project-card-icon">&lt;/&gt;</span>
              <h2>Latest commits</h2>
              {project.githubUrl && <a style={{ marginLeft: "auto", fontSize: 9, color: "#dc6138", textDecoration: "none", fontWeight: 800 }} href={project.githubUrl} target="_blank" rel="noreferrer">View all on GitHub →</a>}
            </div>
            {commits.length ? (
              <div className="project-commits">
                {commits.map(commit =>
                  <a key={commit.sha} className="project-commit" href={commit.url} target="_blank" rel="noreferrer">
                    <span className="project-commit-dot" />
                    <span className="project-commit-main"><strong>{commit.message}</strong><small>{commit.author} · {commit.date ? new Date(commit.date).toLocaleString() : ""}</small></span>
                    <ArrowUpRight size={13} className="project-commit-arrow" />
                  </a>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 10, color: "#91877f" }}>No GitHub commits available.</p>
            )}
          </section>
        </div>
        {error && <div className="project-inline-error">{error}</div>}
      </div>
    );
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <style>{styles}</style>
      <div className="project-detail-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) handleClose(); }}>
        <div className="project-detail-modal">
          <header className="project-detail-header">
            <div className="project-detail-header-left">
              <button className="project-back" onClick={handleClose}><ArrowLeft size={14} /> Back</button>
              <div className="project-search"><Search size={14} /><input placeholder="Search projects, posts, people..." aria-label="Search" /></div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
              {project && <ProjectInterestButton projectId={project.id} initiallyInterested={interestData.active} initialCount={interestData.count} />}
              <button className="project-detail-close" onClick={handleClose} aria-label="Close project details"><X size={16} /></button>
            </div>
          </header>
          <div className="project-detail-body-scroll">
            {renderContent()}
          </div>
        </div>
      </div>
      {inviteOpen && (
        <div className="project-invite-popover" onMouseDown={e => { if (e.currentTarget === e.target) setInviteOpen(false); }}>
          <section className="project-invite-modal">
            <div className="project-invite-head">
              <div><h3>Invite collaborator</h3><p>Add someone to this project</p></div>
              <button className="project-invite-close" onClick={() => setInviteOpen(false)}><X size={17} /></button>
            </div>
            <div className="project-search-wrap">
              <Search size={13} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search username / enter @username" autoFocus />
            </div>
            {suggestions.length > 0 && (
              <div className="project-user-options">
                {suggestions.map(user =>
                  <button className="project-user-option" key={user.id} onClick={() => { setSelectedUser(user); setSuggestions([]); setQuery(""); }}>
                    <Avatar user={{ ...seededProjects[0] as any, id: user.id, name: user.name, username: user.username, avatarUrl: user.avatarUrl }} size="sm" />
                    <span className="project-collab-meta"><strong>{user.name}</strong><small>@{user.username}</small></span>
                  </button>
                )}
              </div>
            )}
            {selectedUser && (
              <div className="project-selected-user">
                <Avatar user={{ ...seededProjects[0] as any, id: selectedUser.id, name: selectedUser.name, username: selectedUser.username, avatarUrl: selectedUser.avatarUrl }} size="sm" />
                <span className="project-collab-meta"><strong>{selectedUser.name}</strong><small>@{selectedUser.username}</small></span>
              </div>
            )}
            <div className="project-role-select">
              <label>Role</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value as "editor" | "viewer")}>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            {success && <div className="project-invite-success">{success}</div>}
            {error && <div className="project-inline-error">{error}</div>}
            <div className="project-invite-footer">
              <button onClick={() => setInviteOpen(false)}>Cancel</button>
              <button className="send" disabled={!selectedUser || busy} onClick={() => void invite()}>{busy ? <><Loader2 size={13} /> Sending…</> : "Send invite"}</button>
            </div>
          </section>
        </div>
      )}
    </>,
    document.body
  );
}

