"use client";

import { useEffect, useState } from "react";
import "./page-skeleton.css";

export default function PageSkeleton() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const show = () => {
      setVisible(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), 320);
    };

    // The first paint gets a short skeleton instead of flashing an incomplete page.
    timer = setTimeout(() => setVisible(false), 420);
    window.addEventListener("popstate", show);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("popstate", show);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="page-skeleton" aria-hidden="true">
      <div className="page-skeleton-bar page-skeleton-top" />
      <div className="page-skeleton-layout">
        <aside className="page-skeleton-sidebar">
          <div className="page-skeleton-logo" />
          <div className="page-skeleton-nav" />
          <div className="page-skeleton-nav short" />
          <div className="page-skeleton-nav" />
          <div className="page-skeleton-nav short" />
          <div className="page-skeleton-nav" />
        </aside>
        <main className="page-skeleton-main">
          <div className="page-skeleton-title" />
          <div className="page-skeleton-card large" />
          <div className="page-skeleton-card" />
          <div className="page-skeleton-card" />
        </main>
        <aside className="page-skeleton-right">
          <div className="page-skeleton-card" />
          <div className="page-skeleton-card" />
        </aside>
      </div>
    </div>
  );
}
