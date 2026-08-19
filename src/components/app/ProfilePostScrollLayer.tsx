"use client";

import { useEffect } from "react";

const POST_NODES = [
  ".home-post",
  ".profile-tab-loading-more",
  ".profile-tab-sentinel",
  ".profile-tab-end",
  ".profile-tab-skeleton-list",
];

export default function ProfilePostScrollLayer() {
  useEffect(() => {
    let disposed = false;
    let observer: MutationObserver | null = null;

    const mountScrollContainer = () => {
      if (disposed) return;
      const section = document.querySelector<HTMLElement>(".profile-section-content");
      if (!section) return;

      if (section.querySelector(":scope > .profile-posts-scroll")) return;

      const nodes = Array.from(section.children).filter((child) =>
        POST_NODES.some((selector) => child.matches(selector)),
      );
      if (!nodes.length) return;

      const scroll = document.createElement("div");
      scroll.className = "profile-posts-scroll";
      scroll.setAttribute("data-profile-post-scroll", "true");

      const firstPostIndex = nodes.reduce((min, node) => {
        const index = Array.prototype.indexOf.call(section.children, node);
        return Math.min(min, index);
      }, Number.POSITIVE_INFINITY);
      const anchor = section.children[firstPostIndex];
      if (!anchor) return;

      section.insertBefore(scroll, anchor);
      nodes.forEach((node) => scroll.appendChild(node));
    };

    const start = () => {
      mountScrollContainer();
      observer = new MutationObserver(() => {
        if (!document.querySelector(".profile-posts-scroll")) mountScrollContainer();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }

    return () => {
      disposed = true;
      observer?.disconnect();
    };
  }, []);

  return (
    <style>{`
      .profile-section-content {
        min-height: 0 !important;
      }

      .profile-posts-scroll {
        min-width: 0;
        min-height: 0;
        max-height: calc(100dvh - 260px);
        overflow-y: auto;
        overflow-x: hidden;
        overscroll-behavior: contain;
        padding-right: 4px;
        scrollbar-gutter: stable;
        scrollbar-width: thin;
      }

      .profile-posts-scroll > .home-post:last-of-type {
        margin-bottom: 0;
      }

      .profile-posts-scroll > .profile-tab-loading-more,
      .profile-posts-scroll > .profile-tab-sentinel,
      .profile-posts-scroll > .profile-tab-end {
        flex: 0 0 auto;
      }

      @media (max-width: 920px) {
        .profile-posts-scroll {
          max-height: calc(100dvh - 230px);
        }
      }

      @media (max-width: 700px) {
        .profile-posts-scroll {
          max-height: none;
          overflow: visible;
          padding-right: 0;
          scrollbar-gutter: auto;
        }
      }
    `}</style>
  );
}
