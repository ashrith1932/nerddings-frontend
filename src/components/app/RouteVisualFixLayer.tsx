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
    `}</style>
  );
}