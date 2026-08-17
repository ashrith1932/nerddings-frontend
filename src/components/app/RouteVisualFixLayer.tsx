"use client";

import { useEffect } from "react";

const routeKey = () => {
  const path = window.location.pathname;
  if (path === "/home" || path === "/") return "home";
  if (path === "/charts") return "charts";
  if (path === "/search" || path.startsWith("/search")) return "search";
  if (path === "/explore") return "explore";
  if (path === "/events") return "events";
  if (path === "/settings") return "settings";
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

/* Reply threads: make nested replies read like a conversation tree. */
.home-comment-body>.home-comment{position:relative;margin-top:8px!important;margin-bottom:0!important;padding-left:18px!important}
.home-comment-body>.home-comment::before{content:"";position:absolute;left:0;top:0;bottom:10px;width:1px;background:#d9d1c8}
.home-comment-body>.home-comment::after{content:"";position:absolute;left:0;top:17px;width:12px;border-top:1px solid #d9d1c8}
.post-comments-tree{position:relative;margin:4px 0 0 28px;padding-left:18px}
.post-comments-tree::before{content:"";position:absolute;left:2px;top:0;bottom:8px;width:1px;background:#d9d1c8}
.post-comments-tree>.post-comment-node{position:relative}
.post-comments-tree>.post-comment-node::before{content:"";position:absolute;left:-16px;top:20px;width:14px;border-top:1px solid #d9d1c8}
.post-comment-node+.post-comment-node{margin-top:4px}

/* Full-page project detail: project navigation should never use the old right drawer. */
body[data-nerdding-enhanced-route^="/project/"] .nerdd-project-interaction{display:none!important}
body[data-nerdding-enhanced-route^="/project/"] .nerdding-enhanced-route>.nerdd-route-surface{width:100%!important;max-width:none!important;position:relative!important;left:auto!important;right:auto!important}

@media(max-width:850px){body[data-nerdding-route="home"] .home-live-grid.with-active{padding-right:0!important}body[data-nerdding-route="home"] .home-active-post{top:70px!important;right:10px!important;left:10px!important;width:auto!important;height:calc(100vh - 80px)!important}}
`;

export default function RouteVisualFixLayer(){
  useEffect(() => {
    const sync = () => {
      const key = routeKey();
      document.body.dataset.nerddingRoute = key;
      const content = document.querySelector<HTMLElement>(".page-content");
      if (content) content.dataset.nerddingRoute = key;
      const overlayOpen = Boolean(document.querySelector(".home-composer-backdrop,.event-modal,.project-invite-popover,.modal-backdrop"));
      document.body.classList.toggle("nerdd-overlay-open", overlayOpen);
    };
    sync();
    const pop = () => window.setTimeout(sync,0);
    window.addEventListener("popstate",pop);
    const observer = new MutationObserver(sync);
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","style"]});
    return () => { window.removeEventListener("popstate",pop); observer.disconnect(); document.body.removeAttribute("data-nerdding-route"); document.body.classList.remove("nerdd-overlay-open"); };
  },[]);
  return <style>{css}</style>;
}
