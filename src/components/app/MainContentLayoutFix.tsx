"use client";

const css = `
/* Desktop shell: navigation | primary feed | independent right rail. */
@media (min-width: 1100px) {
  .app-main { min-width: 0 !important; }
  .page-content { min-width: 0 !important; overflow-x: clip !important; }

  /* Home owns its own content grid; scope it by the route data attribute only. */
  body[data-nerdding-enhanced-route="/home"] .home-live-root,
  body[data-nerdding-enhanced-route="/home"] .home-live-host {
    min-width: 0 !important;
  }

  body[data-nerdding-enhanced-route="/home"] .home-live-grid {
    width: min(100%, 1320px) !important;
    margin: 0 auto !important;
    grid-template-columns: minmax(0, 1fr) 360px !important;
    align-items: start !important;
    column-gap: 24px !important;
  }

  body[data-nerdding-enhanced-route="/home"] .home-live-grid > :first-child {
    min-width: 0 !important;
    width: 100% !important;
  }

  body[data-nerdding-enhanced-route="/home"] .home-live-grid.with-active {
    grid-template-columns: minmax(0, 1fr) 360px !important;
    padding-right: 0 !important;
  }

  .right-rail {
    width: 360px !important;
    min-width: 360px !important;
    max-width: 360px !important;
    align-self: start !important;
    margin-top: 0 !important;
  }
}

.topbar { position: sticky !important; top: 0 !important; z-index: 900 !important; }
.page-content { position: relative; z-index: 1; }
.home-live-root, .home-live-grid, .home-feed, .post-card { min-width: 0; }

@media (max-width: 1099px) {
  .right-rail { width: 320px; min-width: 280px; }
  body[data-nerdding-enhanced-route="/home"] .home-live-grid { grid-template-columns: minmax(0,1fr) minmax(280px,320px) !important; }
}

@media (max-width: 920px) {
  .right-rail { display: none !important; }
  body[data-nerdding-enhanced-route="/home"] .home-live-grid,
  body[data-nerdding-enhanced-route="/home"] .home-live-grid.with-active { grid-template-columns: minmax(0,1fr) !important; padding-right: 0 !important; }
}

@media (max-width: 760px) {
  .topbar { position: sticky !important; }
  body[data-nerdding-enhanced-route="/home"] .home-live-grid { width: 100% !important; }
}
`;

export default function MainContentLayoutFix(){
  return <style>{css}</style>;
}
