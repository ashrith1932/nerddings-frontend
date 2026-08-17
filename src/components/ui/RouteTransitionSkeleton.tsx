"use client";

import { useEffect, useState } from "react";

export default function RouteTransitionSkeleton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    const show = () => {
      if (timer) window.clearTimeout(timer);
      setVisible(true);
      timer = window.setTimeout(() => setVisible(false), 620);
    };

    window.addEventListener("popstate", show);
    window.addEventListener("nerdding:route-loading", show);
    return () => {
      window.removeEventListener("popstate", show);
      window.removeEventListener("nerdding:route-loading", show);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="route-skeleton-overlay" aria-hidden="true">
      <div className="route-skeleton-content">
        <div className="route-skeleton-header"><div className="route-skeleton-title" /><div className="route-skeleton-search" /></div>
        <div className="route-skeleton-grid">
          <main className="route-skeleton-main"><div className="route-skeleton-tabs" /><div className="route-skeleton-container composer" /><div className="route-skeleton-container post" /><div className="route-skeleton-container post-small" /></main>
          <aside className="route-skeleton-side"><div className="route-skeleton-container rail" /><div className="route-skeleton-container rail-small" /></aside>
        </div>
      </div>
      <style jsx>{`
        .route-skeleton-overlay{--sk-a:#eee8df;--sk-b:#faf7f1;position:fixed;top:75px;left:244px;right:0;bottom:0;z-index:9999;pointer-events:none;background:var(--paper,#f9f7f2);padding:28px 42px 60px;overflow:hidden;isolation:isolate}
        .route-skeleton-content{width:min(1150px,100%);margin:0 auto}
        .route-skeleton-header{height:34px;display:flex;gap:18px;align-items:center;margin-bottom:22px}
        .route-skeleton-title,.route-skeleton-search,.route-skeleton-tabs,.route-skeleton-container{background:linear-gradient(90deg,var(--sk-a) 20%,var(--sk-b) 50%,var(--sk-a) 80%);background-size:200% 100%;animation:routeShimmer 1.1s ease-in-out infinite;border:1px solid var(--line,#e7e0d6);border-radius:10px}
        .route-skeleton-title{height:28px;width:180px}.route-skeleton-search{height:34px;width:min(340px,40%);margin-left:auto}.route-skeleton-grid{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:22px}.route-skeleton-main,.route-skeleton-side{display:flex;flex-direction:column;gap:12px}.route-skeleton-tabs{height:42px;width:55%}.route-skeleton-container.composer{height:58px}.route-skeleton-container.post{height:220px}.route-skeleton-container.post-small{height:170px}.route-skeleton-container.rail{height:145px}.route-skeleton-container.rail-small{height:105px}
        :global(:root[data-theme="dark"]) .route-skeleton-overlay{--sk-a:#2a2520;--sk-b:#39322c}
        @keyframes routeShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @media(max-width:900px){.route-skeleton-overlay{top:62px;left:0;bottom:63px;padding:20px 15px 35px}.route-skeleton-grid{grid-template-columns:1fr}.route-skeleton-side{display:none}}
        @media(max-width:560px){.route-skeleton-overlay{padding:15px 13px 25px}.route-skeleton-search{width:90px}.route-skeleton-tabs{width:80%}}
        @media(prefers-reduced-motion:reduce){.route-skeleton-title,.route-skeleton-search,.route-skeleton-tabs,.route-skeleton-container{animation:none}}
      `}</style>
    </div>
  );
}
