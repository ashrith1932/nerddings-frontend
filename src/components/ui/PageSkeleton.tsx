"use client";

import { useEffect, useState } from "react";
import "./page-skeleton.css";

export default function PageSkeleton() {
  const [visible, setVisible] = useState(true);
  const [path, setPath] = useState("/");

  useEffect(() => {
    setPath(window.location.pathname);
    const timer = window.setTimeout(() => setVisible(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const profile = path.startsWith("/profile");
  const fundraising = path.startsWith("/fundraising");

  return (
    <div className="page-skeleton" aria-hidden="true">
      <div className="page-skeleton-content">
        <div className="page-skeleton-header"><div className="page-skeleton-title shimmer" /><div className="page-skeleton-search shimmer" /></div>
        {profile ? (
          <div className="page-skeleton-profile">
            <div className="page-skeleton-profile-cover shimmer" />
            <div className="page-skeleton-profile-head"><div className="page-skeleton-avatar shimmer" /><div className="page-skeleton-profile-copy"><div className="page-skeleton-name shimmer" /><div className="page-skeleton-line shimmer" /><div className="page-skeleton-line short shimmer" /></div><div className="page-skeleton-button shimmer" /></div>
            <div className="page-skeleton-stats shimmer" />
            <div className="page-skeleton-profile-grid"><div className="page-skeleton-card profile-card shimmer" /><div className="page-skeleton-card profile-card shimmer" /><div className="page-skeleton-card profile-card shimmer" /></div>
          </div>
        ) : fundraising ? (
          <div className="page-skeleton-fundraising"><div className="page-skeleton-fund-head"><div><div className="page-skeleton-name shimmer" /><div className="page-skeleton-line shimmer" /></div><div className="page-skeleton-button shimmer" /></div><div className="page-skeleton-rule shimmer" /><div className="page-skeleton-filters"><div className="page-skeleton-filter wide shimmer" /><div className="page-skeleton-filter shimmer" /><div className="page-skeleton-filter shimmer" /><div className="page-skeleton-filter shimmer" /></div><div className="page-skeleton-fund-grid"><div className="page-skeleton-main-column"><div className="page-skeleton-card fund-card shimmer" /><div className="page-skeleton-card fund-card shimmer" /></div><div className="page-skeleton-card fund-rail shimmer" /></div></div>
        ) : (
          <div className="page-skeleton-grid"><div className="page-skeleton-main-column"><div className="page-skeleton-tabs shimmer" /><div className="page-skeleton-card composer shimmer" /><div className="page-skeleton-card post shimmer" /><div className="page-skeleton-card post short-post shimmer" /></div><div className="page-skeleton-side-column"><div className="page-skeleton-card rail shimmer" /><div className="page-skeleton-card rail small-rail shimmer" /></div></div>
        )}
      </div>
    </div>
  );
}
