"use client";

import { useEffect, useState } from "react";

/**
 * RouteVisualFixLayer
 * Handles visual fixes and smooth transitions when routes change.
 */
export default function RouteVisualFixLayer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleRouteChange = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.documentElement.classList.remove("route-transitioning");
      document.documentElement.classList.add("route-transitioned");
      setTimeout(() => {
        document.documentElement.classList.remove("route-transitioned");
      }, 300);
    };

    window.addEventListener("popstate", handleRouteChange);
    const handleNavigationStart = () => {
      document.documentElement.classList.add("route-transitioning");
    };
    const onDocumentClick = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const href = target?.closest("a[href]")?.getAttribute("href");
      if (href && !href.startsWith("#") && !href.includes("://")) {
        handleNavigationStart();
      }
    };
    document.addEventListener("click", onDocumentClick);

    const eligible = (node: Element) =>
      node.matches(
        ".home-post, .profile-tab-loading-more, .profile-tab-sentinel, .profile-tab-end, .profile-tab-skeleton-list",
      );

    const wrapProfilePosts = () => {
      const containers = Array.from(
        document.querySelectorAll<HTMLElement>(".profile-section-content"),
      );

      containers.forEach((container) => {
        let wrapper = container.querySelector<HTMLElement>(
          ":scope > .profile-posts-scroll",
        );

        const directEligible = Array.from(container.children).filter(eligible);

        if (!wrapper) {
          if (!directEligible.length) return;
          wrapper = document.createElement("div");
          wrapper.className = "profile-posts-scroll";
          wrapper.setAttribute("data-profile-post-scroll", "true");
          container.insertBefore(wrapper, directEligible[0]);
        }

        directEligible.forEach((node) => wrapper!.appendChild(node));
      });
    };

    wrapProfilePosts();
    const observer = new MutationObserver(() => {
      wrapProfilePosts();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      document.removeEventListener("click", onDocumentClick);
      observer.disconnect();
    };
  }, [mounted]);

  return (
    <style>{`
      html.route-transitioning { opacity: 0.98; }
      html.route-transitioned { scroll-behavior: smooth; }
      .page-content { min-height: 100vh; }
      .nerdding-side-panel { animation: slideInPanel 0.3s ease-out; }
      @keyframes slideInPanel {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      html { scrollbar-gutter: stable; }
      body[data-nerdding-enhanced-route] { opacity: 1; }

      .profile-post-detail-slot:empty { display: none !important; }
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
      .profile-section-content {
        min-height: 0 !important;
        overflow: hidden !important;
      }
      .profile-posts-scroll {
        min-width: 0 !important;
        min-height: 0 !important;
        max-height: calc(100dvh - 170px) !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        overscroll-behavior: contain !important;
        padding-right: 4px !important;
        scrollbar-gutter: stable !important;
      }
      .profile-posts-scroll > .home-post:last-of-type {
        margin-bottom: 0 !important;
      }
      .profile-right-rail {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 14px !important;
        align-self: start !important;
        width: 100% !important;
      }

      .home-live-grid:has(> .home-active-post),
      .home-live-grid:has(.home-info-rail > .home-active-post) {
        grid-template-columns: minmax(0, 1fr) 420px !important;
      }
      .home-info-rail:has(> .home-active-post) {
        width: 420px !important;
        min-width: 420px !important;
      }
      .home-active-post {
        width: 100% !important;
        max-width: 420px !important;
        max-height: min(82vh, 900px) !important;
      }
      .home-active-post .home-modal {
        width: 100% !important;
        max-height: min(82vh, 900px) !important;
      }
      .home-active-post .home-modal-scroll {
        max-height: calc(min(82vh, 900px) - 60px) !important;
      }
      .profile-content-grid:has(.profile-active-post) {
        grid-template-columns: minmax(0, 1fr) 420px !important;
      }
      .profile-active-post {
        width: 100% !important;
        max-width: 420px !important;
      }

      @media (max-width: 1100px) {
        .home-live-grid:has(.home-info-rail > .home-active-post) {
          grid-template-columns: minmax(0, 1fr) 390px !important;
        }
        .home-info-rail:has(> .home-active-post) {
          width: 390px !important;
          min-width: 390px !important;
        }
        .home-active-post,
        .profile-active-post {
          max-width: 390px !important;
        }
        .profile-content-grid:has(.profile-active-post) {
          grid-template-columns: minmax(0, 1fr) 390px !important;
        }
      }

      @media (max-width: 920px) {
        .profile-content-grid,
        .profile-content-grid:has(.profile-active-post) {
          grid-template-columns: minmax(0, 1fr) !important;
          column-gap: 0 !important;
          gap: 16px !important;
        }
        .home-live-grid:has(.home-info-rail > .home-active-post) {
          grid-template-columns: minmax(0, 1fr) !important;
        }
        .home-info-rail:has(> .home-active-post) {
          width: 100% !important;
          min-width: 0 !important;
        }
        .home-active-post,
        .profile-active-post {
          max-width: 100% !important;
        }
        .profile-posts-scroll {
          max-height: calc(100dvh - 230px) !important;
        }
      }

      @media (max-width: 700px) {
        .profile-posts-scroll {
          max-height: none !important;
          overflow: visible !important;
          padding-right: 0 !important;
          scrollbar-gutter: auto !important;
        }
      }
    `}</style>
  );
}
