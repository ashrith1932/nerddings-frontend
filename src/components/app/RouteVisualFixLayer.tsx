"use client";

import { useEffect, useState } from "react";

/**
 * RouteVisualFixLayer
 * Handles visual fixes and smooth transitions when routes change
 * - Manages layout adjustments
 * - Handles scroll positioning
 * - Prevents layout shift issues
 */
export default function RouteVisualFixLayer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Fix for smooth scrolling on route change
    const handleRouteChange = () => {
      // Scroll to top on route changes
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Fix layout shift by adjusting body classes
      document.documentElement.classList.remove("route-transitioning");
      document.documentElement.classList.add("route-transitioned");

      // Reset after transition
      setTimeout(() => {
        document.documentElement.classList.remove("route-transitioned");
      }, 300);
    };

    // Listen for route changes
    window.addEventListener("popstate", handleRouteChange);

    // Clean up navigation links to trigger scroll fix
    const handleNavigationStart = () => {
      document.documentElement.classList.add("route-transitioning");
    };

    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("a[href]")) {
        const href = target.closest("a[href]")?.getAttribute("href");
        if (href && !href.startsWith("#") && !href.includes("://")) {
          handleNavigationStart();
        }
      }
    });

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, [mounted]);

  return (
    <style>{`
      /* Smooth route transitions */
      html.route-transitioning {
        opacity: 0.98;
      }

      html.route-transitioned {
        scroll-behavior: smooth;
      }

      /* Fix layout shift on sidebar presence */
      .nerdding-enhanced-route {
        overflow-x: hidden;
      }

      /* Prevent content jump */
      .page-content {
        min-height: 100vh;
      }

      /* Smooth side panel entrance */
      .nerdding-side-panel {
        animation: slideInPanel 0.3s ease-out;
      }

      @keyframes slideInPanel {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      /* Fix scrollbar width shifts */
      html {
        scrollbar-gutter: stable;
      }

      /* Prevent flash of unstyled content */
      body[data-nerdding-enhanced-route] {
        opacity: 1;
      }

      /* Profile is rendered one level below .nerdding-enhanced-route, so the
         generic .nerdd-route-surface fixed positioning must be neutralized here. */
      .nerdd-route-surface:has(.profile-section-tabs-wrap) {
        position: relative !important;
        inset: auto !important;
        z-index: auto !important;
        width: 100% !important;
        min-height: 0 !important;
        height: auto !important;
        overflow: visible !important;
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
      }

      .nerdd-route-surface:has(.profile-section-tabs-wrap) > .view.profile-view {
        width: min(100%, 1320px) !important;
        max-width: 1320px !important;
        margin: 0 auto !important;
      }

      /* The empty active-post slot must not create a grid row or a gap. */
      .profile-post-detail-slot:empty {
        display: none !important;
      }

      /* Match Home's outer live-grid sizing exactly. */
      .profile-content-grid {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) 360px !important;
        column-gap: 24px !important;
        align-items: start !important;
        width: min(100%, 1320px) !important;
        margin: 18px auto 0 !important;
        min-width: 0 !important;
      }

      .profile-section-content,
      .profile-right-rail,
      .profile-post-detail-slot,
      .profile-affiliations-rail {
        min-width: 0 !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }

      .profile-right-rail {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 14px !important;
        align-self: start !important;
        width: 100% !important;
      }

      @media (max-width: 920px) {
        .profile-content-grid {
          grid-template-columns: minmax(0, 1fr) !important;
          column-gap: 0 !important;
          gap: 16px !important;
        }
      }
    `}</style>
  );
}