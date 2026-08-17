"use client";

import { useEffect, useState } from "react";
import "./page-skeleton.css";

export default function PageSkeleton() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="page-skeleton" aria-hidden="true">
      <div className="page-skeleton-content">
        <div className="page-skeleton-header">
          <div className="page-skeleton-title shimmer" />
          <div className="page-skeleton-search shimmer" />
        </div>
        <div className="page-skeleton-grid">
          <div className="page-skeleton-main-column">
            <div className="page-skeleton-tabs shimmer" />
            <div className="page-skeleton-card composer shimmer" />
            <div className="page-skeleton-card post shimmer" />
            <div className="page-skeleton-card post short-post shimmer" />
          </div>
          <div className="page-skeleton-side-column">
            <div className="page-skeleton-card rail shimmer" />
            <div className="page-skeleton-card rail small-rail shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
