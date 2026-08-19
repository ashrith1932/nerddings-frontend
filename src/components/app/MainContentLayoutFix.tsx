"use client";

const css = `
@media (min-width: 1100px) {
  .app-main { min-width: 0 !important; width: calc(100% - 244px) !important; margin-left: 244px !important; }

  /* The fixed sidebar already owns the 244px left rail. Do not center the
     entire page-content canvas inside the remaining viewport. */
  .app-main > .page-content {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 31px 42px 72px !important;
    min-width: 0 !important;
    overflow-x: clip !important;
  }

  /* Remove the second global centering pass. Individual routes still own
     their internal widths/grids. */
  .app-main > .page-content > .view {
    width: 100% !important;
    max-width: 1320px !important;
    margin-left: 0 !important;
    margin-right: auto !important;
    min-width: 0 !important;
  }

  body[data-app-route="/home"] .home-live-root,
  body[data-app-route="/home"] .home-live-host { min-width: 0 !important; }

  body[data-app-route="/home"] .home-live-shell {
    width: 100% !important;
    max-width: 1320px !important;
    margin: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  body[data-app-route="/home"] .home-live-grid {
    width: 100% !important;
    max-width: 1320px !important;
    margin: 0 !important;
    grid-template-columns: minmax(0, 1fr) 360px !important;
    align-items: start !important;
    column-gap: 24px !important;
  }

  body[data-app-route="/home"] .home-live-grid > :first-child {
    min-width: 0 !important;
    width: 100% !important;
  }

  body[data-app-route="/home"] .home-live-grid.with-active {
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
  .app-main > .page-content {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
  }
  .app-main > .page-content > .view { width: 100% !important; max-width: none !important; margin: 0 !important; }
  .right-rail { width: 320px; min-width: 280px; }
  body[data-app-route="/home"] .home-live-grid { grid-template-columns: minmax(0,1fr) minmax(280px,320px) !important; }
}

@media (max-width: 920px) {
  .right-rail { display: none !important; }
  body[data-app-route="/home"] .home-live-grid,
  body[data-app-route="/home"] .home-live-grid.with-active { grid-template-columns: minmax(0,1fr) !important; padding-right: 0 !important; }
}

@media (max-width: 760px) {
  .topbar { position: sticky !important; }
  .app-main > .page-content { padding: 20px 15px 80px !important; }
  body[data-app-route="/home"] .home-live-grid { width: 100% !important; }
}
`;

export default function MainContentLayoutFix(){
  return <style>{css}</style>;
}
