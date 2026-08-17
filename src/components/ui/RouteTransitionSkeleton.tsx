"use client";

import { useEffect, useState } from "react";

export default function RouteTransitionSkeleton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    const show = () => {
      if (timer) window.clearTimeout(timer);
      setVisible(true);
      timer = window.setTimeout(() => setVisible(false), 700);
    };

    const onPopState = () => show();
    const onRouteLoading = () => show();

    window.addEventListener("popstate", onPopState);
    window.addEventListener("nerdding:route-loading", onRouteLoading);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("nerdding:route-loading", onRouteLoading);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="route-skeleton-overlay" aria-hidden="true">
      <div className="route-skeleton-content">
        <div className="route-skeleton-header">
          <div className="route-skeleton-title" />
          <div className="route-skeleton-search" />
        </div>
        <div className="route-skeleton-grid">
          <main className="route-skeleton-main">
            <div className="route-skeleton-tabs" />
            <div className="route-skeleton-container composer" />
            <div className="route-skeleton-container post" />
            <div className="route-skeleton-container post-small" />
          </main>
          <aside className="route-skeleton-side">
            <div className="route-skeleton-container rail" />
            <div className="route-skeleton-container rail-small" />
          </aside>
        </div>
      </div>
      <style jsx>{`
        .route-skeleton-overlay{position:fixed;top:64px;left:244px;right:0;bottom:72px;z-index:9999;pointer-events:none;background:rgba(247,244,238,.9);padding:18px 24px;overflow:hidden}
        .route-skeleton-content{width:min(1180px,100%);margin:0 auto}
        .route-skeleton-header{display:flex;gap:18px;align-items:center;margin-bottom:16px}
        .route-skeleton-title,.route-skeleton-search,.route-skeleton-tabs,.route-skeleton-container{background:linear-gradient(90deg,#eee8df 25%,#faf7f1 50%,#eee8df 75%);background-size:200% 100%;animation:routeShimmer .9s linear infinite;border:1px solid rgba(222,215,206,.75);border-radius:12px}
        .route-skeleton-title{height:28px;width:180px}.route-skeleton-search{height:34px;width:280px;margin-left:auto}.route-skeleton-grid{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:18px}.route-skeleton-main,.route-skeleton-side{display:flex;flex-direction:column;gap:10px}.route-skeleton-tabs{height:42px;width:55%}.route-skeleton-container.composer{height:58px}.route-skeleton-container.post{height:220px}.route-skeleton-container.post-small{height:170px}.route-skeleton-container.rail{height:145px}.route-skeleton-container.rail-small{height:105px}
        @keyframes routeShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @media(max-width:900px){.route-skeleton-overlay{left:76px;padding:14px 16px}.route-skeleton-grid{grid-template-columns:1fr}.route-skeleton-side{display:none}}
        @media(max-width:560px){.route-skeleton-overlay{left:0;bottom:62px;padding:12px}.route-skeleton-search{width:90px}.route-skeleton-tabs{width:80%}}
        @media(prefers-reduced-motion:reduce){.route-skeleton-title,.route-skeleton-search,.route-skeleton-tabs,.route-skeleton-container{animation:none}}
      `}</style>
    </div>
  );
}
