"use client";

import { useEffect, useState } from "react";

export default function RouteTransitionSkeleton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hideTimer: number | undefined;
    const show = () => {
      if (hideTimer) window.clearTimeout(hideTimer);
      setVisible(true);
      hideTimer = window.setTimeout(() => setVisible(false), 420);
    };

    window.addEventListener("popstate", show);
    return () => {
      window.removeEventListener("popstate", show);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="route-skeleton-overlay" aria-hidden="true">
      <div className="route-skeleton-card">
        <div className="route-skeleton-line route-skeleton-title" />
        <div className="route-skeleton-line route-skeleton-wide" />
        <div className="route-skeleton-line route-skeleton-medium" />
        <div className="route-skeleton-block" />
        <div className="route-skeleton-block route-skeleton-small" />
      </div>
      <style jsx>{`
        .route-skeleton-overlay{position:fixed;inset:0;z-index:9999;pointer-events:none;background:rgba(247,244,238,.48);backdrop-filter:blur(1px);display:flex;align-items:flex-start;justify-content:center;padding:86px 18px 18px;animation:routeFade .12s ease-out}
        .route-skeleton-card{width:min(760px,calc(100vw - 36px));padding:18px;border:1px solid rgba(222,215,206,.9);border-radius:14px;background:rgba(255,253,250,.82);box-shadow:0 12px 40px rgba(25,22,18,.06)}
        .route-skeleton-line,.route-skeleton-block{background:linear-gradient(90deg,#eee8df 25%,#faf7f1 50%,#eee8df 75%);background-size:200% 100%;animation:routeShimmer .9s linear infinite;border-radius:8px}
        .route-skeleton-title{width:32%;height:18px;margin-bottom:16px}.route-skeleton-wide{width:78%;height:11px;margin-bottom:9px}.route-skeleton-medium{width:54%;height:11px;margin-bottom:18px}.route-skeleton-block{width:100%;height:96px}.route-skeleton-small{height:58px;margin-top:10px;width:88%}
        @keyframes routeShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes routeFade{from{opacity:0}to{opacity:1}}
        @media(prefers-reduced-motion:reduce){.route-skeleton-line,.route-skeleton-block{animation:none}}
      `}</style>
    </div>
  );
}
