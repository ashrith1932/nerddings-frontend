"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import ProfileSectionTabs from "@/components/app/ProfileSectionTabs";

const routeKey = () => {
  const path = window.location.pathname;
  if (path === "/home" || path === "/") return "home";
  if (path === "/charts") return "charts";
  if (path === "/search" || path.startsWith("/search")) return "search";
  if (path === "/explore") return "explore";
  if (path === "/events") return "events";
  if (path === "/settings") return "settings";
  if (path.startsWith("/profile/")) return "profile";
  return "other";
};

const css = `
body[data-nerdding-route="home"] .page-content > .view,
body[data-nerdding-route="charts"] .page-content > .view,
body[data-nerdding-route="search"] .page-content > .view,
body[data-nerdding-route="explore"] .page-content > .view,
body[data-nerdding-route="events"] .page-content > .view,
body[data-nerdding-route="settings"] .page-content > .view{display:none!important}
body[data-nerdding-route="home"] .home-live-host .view{display:none!important}
body[data-nerdding-route="charts"] .charts-context-card:first-child{margin-top:0}
body[data-nerdding-route="charts"] .live-data-row-main{text-align:center}
body[data-nerdding-route="charts"] .live-data-row-main strong,body[data-nerdding-route="charts"] .live-data-row-main>span:not(.live-data-progress){text-align:center}
body[data-nerdding-route="charts"] .live-data-row{min-height:72px}
body[data-nerdding-route="search"] .live-search-item{min-height:58px}
body[data-nerdding-route="search"] .live-search-item>.home-avatar-sm{width:34px!important;height:34px!important;min-width:34px!important;max-width:34px!important;border-radius:50%!important;overflow:hidden!important}
body[data-nerdding-route="search"] .live-search-item>.home-avatar-sm img{width:100%!important;height:100%!important;object-fit:cover!important}
body[data-nerdding-route="search"] .live-search-item strong{font-size:11px}
body[data-nerdding-route="search"] .live-search-item small{font-size:9px}
body[data-nerdding-route="home"] .home-composer>.home-avatar-sm,body[data-nerdding-route="home"] .home-compose-user>.home-avatar-sm{width:36px!important;height:36px!important;min-width:36px!important;max-width:36px!important;border-radius:50%!important;overflow:hidden!important;flex:0 0 36px!important}
body[data-nerdding-route="home"] .home-composer>.home-avatar-sm img,body[data-nerdding-route="home"] .home-compose-user>.home-avatar-sm img{width:100%!important;height:100%!important;object-fit:cover!important}
body[data-nerdding-route="home"] .home-live-grid.with-active{grid-template-columns:minmax(0,1fr)!important;padding-right:408px!important}
body[data-nerdding-route="home"] .home-active-post{position:fixed!important;top:84px!important;right:18px!important;width:min(390px,calc(100vw - 36px))!important;height:calc(100vh - 104px)!important;min-height:0!important;z-index:1200!important}
body[data-nerdding-route="home"] .home-active-scroll{overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;scrollbar-gutter:stable}
body[data-nerdding-route="home"] .home-active-content .home-avatar-md{width:42px!important;height:42px!important;min-width:42px!important;max-width:42px!important;border-radius:50%!important;flex:0 0 42px!important}
body[data-nerdding-route="home"] .home-post-stats{display:none!important}
body[data-nerdding-route="home"] .home-active-post{overscroll-behavior:contain}
body[data-nerdding-route="home"] .home-composer-backdrop{overflow:hidden!important}
body.nerdd-overlay-open{overflow:hidden}
body[data-nerdding-route="home"] .home-live-root{z-index:1!important}
body[data-nerdding-route="explore"] .event-modal-card{max-height:calc(100vh - 40px);overflow:auto;overscroll-behavior:contain}
body[data-nerdding-route="explore"] .event-modal-card .post-detail-view{max-width:none!important;padding:0!important}
body[data-nerdding-route="explore"] .event-modal-card .back-button{display:none!important}
body[data-nerdding-route="explore"] .event-modal-card .post-detail-card{border:0!important;box-shadow:none!important;border-radius:0!important;padding:8px 0 10px!important}
body[data-nerdding-route="explore"] .event-modal-card .post-detail-comments{border-radius:0!important;box-shadow:none!important;border-left:0!important;border-right:0!important}
body[data-nerdding-route="explore"] .discovery-post{cursor:pointer}
.home-comment-body>.home-comment{position:relative;margin-top:8px!important;margin-bottom:0!important;padding-left:18px!important}
.home-comment-body>.home-comment::before{content:"";position:absolute;left:0;top:0;bottom:10px;width:1px;background:#d9d1c8}
.home-comment-body>.home-comment::after{content:"";position:absolute;left:0;top:17px;width:12px;border-top:1px solid #d9d1c8}
.post-comments-tree{position:relative;margin:4px 0 0 28px;padding-left:18px}
.post-comments-tree::before{content:"";position:absolute;left:2px;top:0;bottom:8px;width:1px;background:#d9d1c8}
.post-comments-tree>.post-comment-node{position:relative}
.post-comments-tree>.post-comment-node::before{content:"";position:absolute;left:-16px;top:20px;width:14px;border-top:1px solid #d9d1c8}
.post-comment-node+.post-comment-node{margin-top:4px}
body[data-nerdding-enhanced-route^="/project/"] .nerdd-project-interaction{display:none!important}
body[data-nerdding-enhanced-route^="/project/"] .nerdding-enhanced-route>.nerdd-route-surface{width:100%!important;max-width:none!important;position:relative!important;left:auto!important;right:auto!important}

/* The profile now uses one compact tabbed content surface under the identity block. */
body[data-nerdding-route="profile"] .profile-stats{display:none!important}
body[data-nerdding-route="profile"] .profile-body{display:none!important}
body[data-nerdding-route="profile"] .profile-view{padding-bottom:42px}
.profile-section-tabs-wrap{margin-top:18px;border-top:1px solid var(--line,#ded7cf)}
.profile-section-tabs{display:flex;align-items:stretch;gap:0;border-bottom:1px solid var(--line,#ded7cf);overflow-x:auto;scrollbar-width:none}
.profile-section-tabs::-webkit-scrollbar{display:none}
.profile-section-tabs button{appearance:none;border:0;background:transparent;color:var(--muted);padding:14px 18px 12px;min-width:112px;display:flex;align-items:center;justify-content:center;gap:7px;position:relative;cursor:pointer;font:inherit;font-size:11px;font-weight:700;white-space:nowrap}
.profile-section-tabs button b{font-family:'DM Mono',monospace;font-size:9px;color:var(--subtle);font-weight:700}
.profile-section-tabs button.active{color:var(--ink)}
.profile-section-tabs button.active::after{content:"";position:absolute;left:14px;right:14px;bottom:-1px;height:3px;border-radius:99px;background:var(--ink)}
.profile-section-content{padding-top:18px}
.profile-builds-list{display:grid;gap:12px;max-width:860px}
.profile-build-card{border:1px solid var(--line);border-radius:13px;background:var(--card);padding:16px;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
.profile-build-card:hover{transform:translateY(-2px);border-color:#c9c0b7;box-shadow:0 12px 28px rgba(31,27,24,.07)}
.profile-build-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
.profile-build-author{display:flex;gap:10px;align-items:center;min-width:0}
.profile-build-author>div{display:flex;flex-direction:column;min-width:0}
.profile-build-author strong{font-size:11px;color:var(--ink)}
.profile-build-author small{margin-top:3px;font-size:9px;color:var(--subtle)}
.profile-build-head time{flex:0 0 auto;font-family:'DM Mono',monospace;color:var(--subtle);font-size:9px;line-height:1.3;padding-top:2px;text-align:right}
.profile-build-text{margin:13px 0 10px;font-size:13px;line-height:1.65;color:var(--ink);white-space:pre-wrap}
.profile-build-tags{display:flex;flex-wrap:wrap;gap:6px}
.profile-build-tags span{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;background:#f5f0e9;color:#7e746c;font-size:9px}
.profile-build-link{display:block;margin-top:9px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;color:var(--muted);font-size:10px;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.profile-build-actions{display:flex;align-items:center;gap:14px;margin-top:13px;padding-top:10px;border-top:1px solid var(--line);color:var(--muted);font-size:9px}
.profile-build-actions>span{display:inline-flex;align-items:center;gap:5px}
.profile-build-spacer{flex:1}
.profile-build-muted{display:inline-flex;align-items:center;gap:5px}
.profile-projects-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.profile-project-card-modern{appearance:none;border:1px solid var(--line);border-radius:12px;background:var(--card);padding:16px;text-align:left;cursor:pointer;min-height:165px;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
.profile-project-card-modern:hover{transform:translateY(-2px);border-color:#c9c0b7;box-shadow:0 12px 28px rgba(31,27,24,.07)}
.profile-project-card-top{display:flex;align-items:center;justify-content:space-between;color:var(--subtle);font-size:9px;text-transform:capitalize}
.profile-project-card-modern h3{font-family:'Space Grotesk';font-size:17px;margin:15px 0 7px;color:var(--ink)}
.profile-project-card-modern p{margin:0 0 15px;color:var(--muted);font-size:11px;line-height:1.5}
.profile-project-card-modern small{color:var(--subtle);font-family:'DM Mono';font-size:8px}
.profile-people-list{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--card);max-width:860px}
.profile-person-row{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line)}
.profile-person-row:last-child{border-bottom:0}
.profile-person-main{display:flex;align-items:center;gap:10px;flex:1;min-width:0;background:transparent;border:0;text-align:left;cursor:pointer;color:inherit}
.profile-person-main>span:last-child{display:flex;flex-direction:column;min-width:0}
.profile-person-main strong{font-size:11px}.profile-person-main small{margin-top:2px;font-size:9px;color:var(--subtle)}.profile-person-main em{font-style:normal;color:var(--muted);font-size:9px;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.profile-person-arrow{width:30px;height:30px;border:1px solid var(--line);border-radius:8px;background:transparent;display:grid;place-items:center;color:var(--muted);cursor:pointer}
.profile-tab-avatar{display:inline-grid;place-items:center;flex:0 0 auto;overflow:hidden;border-radius:50%;background:#e9e3db;color:#2b2622;font-weight:800;font-size:10px}
.profile-tab-avatar img{width:100%;height:100%;object-fit:cover}
.profile-affiliation-list{display:grid;gap:12px;max-width:860px}
.profile-affiliation-modern{border:1px solid var(--line);border-radius:12px;background:var(--card);padding:16px}
.profile-affiliation-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.profile-affiliation-name{display:flex;gap:9px;align-items:center}.profile-affiliation-name>span:last-child{display:flex;flex-direction:column}.profile-affiliation-name strong{font-size:12px}.profile-affiliation-name small{margin-top:2px;font-size:9px;color:var(--subtle)}
.profile-affiliation-badge{width:36px;height:36px;border-radius:10px;background:#f3eee6;display:grid;place-items:center;font-weight:800;color:var(--accent)}
.profile-verified-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:999px;background:#eef7ea;color:#3f7a3a;font-size:8px;font-weight:800}
.profile-affiliation-modern>p{margin:12px 0 0;color:var(--muted);font-size:10px}
.profile-affiliation-timeline{margin:14px 0 0 8px;padding-left:16px;border-left:1px solid var(--line);display:grid;gap:10px}
.profile-affiliation-timeline>div{position:relative;display:flex;gap:8px}.profile-affiliation-timeline i{position:absolute;left:-21px;top:4px;width:8px;height:8px;border-radius:50%;border:2px solid var(--accent);background:var(--card)}
.profile-affiliation-timeline span{display:flex;flex-direction:column}.profile-affiliation-timeline strong{font-size:10px}.profile-affiliation-timeline small{margin-top:2px;color:var(--subtle);font-size:8px}
.profile-tab-empty,.profile-tabs-loading{border:1px dashed var(--line);border-radius:12px;background:var(--card);min-height:180px;display:grid;place-items:center;align-content:center;text-align:center;gap:7px;color:var(--subtle);padding:20px}.profile-tab-empty strong{color:var(--ink);font-size:12px}.profile-tab-empty span{font-size:10px}.profile-tabs-loading span{width:100%;height:120px;border-radius:12px;background:#ece7df;position:relative;overflow:hidden}.profile-tabs-loading span::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.72),transparent);animation:profile-tabs-shimmer 1.1s infinite}@keyframes profile-tabs-shimmer{to{transform:translateX(100%)}}
@media(max-width:760px){.profile-section-tabs button{min-width:96px;padding-left:11px;padding-right:11px}.profile-projects-grid{grid-template-columns:1fr}.profile-build-head time{font-size:8px}.profile-build-card{padding:14px}.profile-person-main em{display:none}}

@media(max-width:850px){body[data-nerdding-route="home"] .home-live-grid.with-active{padding-right:0!important}body[data-nerdding-route="home"] .home-active-post{top:70px!important;right:10px!important;left:10px!important;width:auto!important;height:calc(100vh - 80px)!important}}
`;

export default function RouteVisualFixLayer(){
  const [profileMount,setProfileMount]=useState<HTMLElement|null>(null);
  const [profileUsername,setProfileUsername]=useState("");
  useEffect(() => {
    const sync = () => {
      const key = routeKey();
      document.body.dataset.nerddingRoute = key;
      const content = document.querySelector<HTMLElement>(".page-content");
      if (content) content.dataset.nerddingRoute = key;
      const overlayOpen = Boolean(document.querySelector(".home-composer-backdrop,.event-modal,.project-invite-popover,.modal-backdrop"));
      document.body.classList.toggle("nerdd-overlay-open", overlayOpen);
      if (key === "profile") {
        const profile = document.querySelector<HTMLElement>(".profile-view");
        const header = profile?.querySelector<HTMLElement>(".profile-header");
        if (profile && header) {
          let mount = profile.querySelector<HTMLElement>(":scope > .profile-section-tabs-mount");
          if (!mount) { mount = document.createElement("div"); mount.className = "profile-section-tabs-mount"; header.insertAdjacentElement("afterend", mount); }
          setProfileMount(mount);
          setProfileUsername(decodeURIComponent(window.location.pathname.split("/")[2] || ""));
        }
      } else { setProfileMount(null); setProfileUsername(""); }
    };
    sync();
    const pop = () => window.setTimeout(sync,0);
    window.addEventListener("popstate",pop);
    const observer = new MutationObserver(sync);
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","style"]});
    return () => { window.removeEventListener("popstate",pop); observer.disconnect(); document.body.removeAttribute("data-nerdding-route"); document.body.classList.remove("nerdd-overlay-open"); };
  },[]);
  return <><style>{css}</style>{profileMount && profileUsername ? createPortal(<ProfileSectionTabs username={profileUsername}/>,profileMount) : null}</>;
}
