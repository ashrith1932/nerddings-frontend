"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import ProjectDetailSurface from "@/components/app/ProjectDetailSurface";
import YourNerddingsRoute from "@/components/app/YourNerddingsRoute";

export default function RouteVisualFixLayer() {
  const [mounted, setMounted] = useState(false);
  const [pageContent, setPageContent] = useState<HTMLElement | null>(null);
  const [project, setProject] = useState<{ slug: string } | null>(null);
  const [nerddingsOpen, setNerddingsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPageContent(document.querySelector<HTMLElement>(".page-content"));
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const syncRoute = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setPageContent(document.querySelector<HTMLElement>(".page-content"));
      setNerddingsOpen(window.location.pathname.startsWith("/nerddings"));
    };

    const onProject = (event: Event) => {
      const detail = (event as CustomEvent<{ slug?: string }>).detail;
      if (detail?.slug) setProject({ slug: detail.slug });
    };

    const onCloseProject = () => setProject(null);

    window.addEventListener("popstate", syncRoute);
    window.addEventListener("nerdding:open-project-panel", onProject);
    window.addEventListener("nerdding:close-project-panel", onCloseProject);
    syncRoute();

    return () => {
      window.removeEventListener("popstate", syncRoute);
      window.removeEventListener("nerdding:open-project-panel", onProject);
      window.removeEventListener("nerdding:close-project-panel", onCloseProject);
    };
  }, [mounted]);

  if (!mounted) {
    return <style>{`html{scrollbar-gutter:stable}.page-content{min-height:100vh;position:relative}`}</style>;
  }

  return (
    <>
      <style>{`
        html { scrollbar-gutter: stable; }
        .page-content { min-height: 100vh; position: relative; }
        .profile-post-detail-slot:empty { display: none !important; }

        /* Profile UI is intentionally owned by its b6bd910 baseline styles.
           Do not override its grid, rail width, tabs, or active-post geometry here. */
        .page-content-route-overlay {
          position: absolute;
          inset: 0;
          z-index: 90;
          background: var(--paper, #f9f7f2);
          overflow: auto;
          padding: 4px 0 50px;
        }

        .page-content-project-overlay {
          position: absolute;
          inset: 0;
          z-index: 95;
          background: rgba(25, 20, 16, .22);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 18px;
          overflow: auto;
        }

        .page-content-project-panel {
          width: min(100%, 1120px);
          min-height: calc(100% - 36px);
          background: #fffdf9;
          border: 1px solid #ded7cf;
          border-radius: 14px;
          box-shadow: 0 24px 70px rgba(31, 27, 24, .16);
          overflow: auto;
          position: relative;
        }

        .page-content-project-close {
          position: absolute;
          right: 14px;
          top: 14px;
          z-index: 10;
          width: 34px;
          height: 34px;
          border: 1px solid #ddd6cc;
          border-radius: 50%;
          background: #fffdf9;
          color: #746b64;
          display: grid;
          place-items: center;
          cursor: pointer;
        }
      `}</style>

      {pageContent && nerddingsOpen
        ? createPortal(
            <div className="page-content-route-overlay">
              <YourNerddingsRoute />
            </div>,
            pageContent,
          )
        : null}

      {pageContent && project
        ? createPortal(
            <div
              className="page-content-project-overlay"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setProject(null);
              }}
            >
              <div className="page-content-project-panel">
                <button
                  className="page-content-project-close"
                  aria-label="Close project"
                  onClick={() => setProject(null)}
                >
                  <X size={17} />
                </button>
                <ProjectDetailSurface slug={project.slug} />
              </div>
            </div>,
            pageContent,
          )
        : null}
    </>
  );
}
