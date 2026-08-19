"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import ProjectDetailSurface from "@/components/app/ProjectDetailSurface";
import YourNerddingsRoute from "@/components/app/YourNerddingsRoute";

export default function RouteVisualFixLayer() {
  const [mounted, setMounted] = useState(false); const [project, setProject] = useState<{ id?: string; slug?: string } | null>(null); const [nerddingsOpen, setNerddingsOpen] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!mounted) return;
    const onRoute = () => window.scrollTo({ top: 0, behavior: "smooth" });
    const onProject = (event: Event) => { const detail = (event as CustomEvent<{ id?: string; slug?: string }>).detail; if (detail?.id || detail?.slug) setProject(detail); };
    const onCloseProject = () => setProject(null);
    const onPop = () => { if (!window.location.pathname.startsWith("/profile")) setProject(null); setNerddingsOpen(window.location.pathname.startsWith("/nerddings")); };
    window.addEventListener("popstate", onRoute); window.addEventListener("popstate", onPop); window.addEventListener("nerdding:open-project-panel", onProject); window.addEventListener("nerdding:close-project-panel", onCloseProject); onPop();
    return () => { window.removeEventListener("popstate", onRoute); window.removeEventListener("popstate", onPop); window.removeEventListener("nerdding:open-project-panel", onProject); window.removeEventListener("nerdding:close-project-panel", onCloseProject); };
  }, [mounted]);

  useEffect(() => { document.body.dataset.appRoute = typeof window === "undefined" ? "" : window.location.pathname; return () => { delete document.body.dataset.appRoute; }; });

  if (!mounted) return <style>{`html{scrollbar-gutter:stable}.page-content{min-height:100vh;position:relative}.profile-post-detail-slot:empty{display:none!important}`}</style>;
  const pageContent = document.querySelector<HTMLElement>(".page-content");
  return <>
    <style>{`
      html{scrollbar-gutter:stable}.page-content{min-height:100vh;position:relative}.profile-post-detail-slot:empty{display:none!important}
      .profile-content-grid{display:grid!important;grid-template-columns:minmax(0,1fr) 360px!important;gap:24px!important;align-items:start!important;width:100%!important;margin:18px auto 0!important;min-width:0!important}.profile-section-content,.profile-right-rail,.profile-post-detail-slot,.profile-affiliations-rail{min-width:0!important;max-width:100%!important;box-sizing:border-box!important}.profile-section-content{min-height:0!important}.profile-right-rail{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:14px!important;align-self:start!important;width:100%!important}.profile-post-detail-slot:empty{display:none!important}
      .home-live-grid:has(.home-active-post){grid-template-columns:minmax(0,1fr) 420px!important}.home-info-rail:has(.home-active-post){width:420px!important;min-width:420px!important}.home-active-post{width:100%!important;max-width:420px!important;max-height:min(82vh,900px)!important}.profile-content-grid:has(.home-active-post){grid-template-columns:minmax(0,1fr) 420px!important}
      @media(max-width:920px){.profile-content-grid,.profile-content-grid:has(.home-active-post){grid-template-columns:1fr!important}.home-live-grid:has(.home-active-post){grid-template-columns:1fr!important}.home-info-rail:has(.home-active-post){width:100%!important;min-width:0!important}.home-active-post{max-width:100%!important}}
      @media(max-width:700px){.profile-posts-scroll-v3{max-height:none!important;overflow:visible!important}}
      .page-content-route-overlay{position:absolute;inset:0;z-index:90;background:var(--paper,#f9f7f2);overflow:auto;padding:4px 0 50px}.page-content-project-overlay{position:absolute;inset:0;z-index:95;background:rgba(25,20,16,.22);display:flex;align-items:flex-start;justify-content:center;padding:18px;overflow:auto}.page-content-project-panel{width:min(100%,1120px);min-height:calc(100% - 36px);background:#fffdf9;border:1px solid #ded7cf;border-radius:14px;box-shadow:0 24px 70px rgba(31,27,24,.16);overflow:auto;position:relative}.page-content-project-close{position:absolute;right:14px;top:14px;z-index:10;width:34px;height:34px;border:1px solid #ddd6cc;border-radius:50%;background:#fffdf9;color:#746b64;display:grid;place-items:center;cursor:pointer}
    `}</style>
    {pageContent && nerddingsOpen ? createPortal(<div className="page-content-route-overlay"><YourNerddingsRoute /></div>, pageContent) : null}
    {pageContent && project ? createPortal(<div className="page-content-project-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setProject(null); }}><div className="page-content-project-panel"><button className="page-content-project-close" aria-label="Close project" onClick={() => setProject(null)}><X size={17}/></button><ProjectDetailSurface slug={project.slug ?? ""} projectId={project.id} /></div></div>, pageContent) : null}
  </>;
}
