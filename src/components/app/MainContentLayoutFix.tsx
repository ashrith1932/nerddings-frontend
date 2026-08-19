"use client";

const css = `
@media (min-width: 1100px) {
  /* Fixed sidebar + fixed topbar define the shell. The app-main column
     starts below the 75px topbar instead of sliding underneath it. */
  .app-shell > .topbar {
    position: fixed !important;
    top: 0 !important;
    left: 244px !important;
    right: 0 !important;
    width: auto !important;
    margin: 0 !important;
    z-index: 900 !important;
  }

  .app-main {
    min-width: 0 !important;
    width: calc(100% - 244px) !important;
    margin-left: 244px !important;
    padding-top: 75px !important;
  }

  .app-main > .page-content {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 31px 42px 72px !important;
    min-width: 0 !important;
    overflow-x: clip !important;
  }

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

.topbar { z-index: 900 !important; }
.page-content { position: relative; z-index: 1; }
.home-live-root, .home-live-grid, .home-feed, .post-card { min-width: 0; }

/* Profile Build Notes reuse Home post markup. Home mounts these rules inside
   HomeFeedSurface, so Profile needs the same structural CSS independently. */
body[data-app-route^="/profile"] .profile-section-content .home-post {
  display: block !important;
  width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box !important;
  margin: 0 0 11px !important;
  padding: 15px 16px 8px !important;
  border: 1px solid var(--line, #ddd6cc) !important;
  border-radius: 12px !important;
  background: var(--card, #fff) !important;
  box-shadow: none !important;
  text-align: left !important;
  overflow: hidden !important;
  cursor: pointer !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-post:hover {
  border-color: #c6bdb3 !important;
  box-shadow: 0 8px 22px rgba(31,27,24,.06) !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-post-head {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 10px !important;
  width: 100% !important;
  min-width: 0 !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-author {
  display: flex !important;
  align-items: center !important;
  gap: 9px !important;
  min-width: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  text-align: left !important;
  color: inherit !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-author > span:last-child {
  display: flex !important;
  flex-direction: column !important;
  min-width: 0 !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-author strong {
  display: block !important;
  font-size: 12px !important;
  line-height: 1.25 !important;
  font-weight: 700 !important;
  white-space: nowrap !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-author small {
  display: block !important;
  margin-top: 2px !important;
  color: #938980 !important;
  font-size: 10px !important;
  line-height: 1.2 !important;
  white-space: nowrap !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-avatar,
body[data-app-route^="/profile"] .profile-section-content .profile-tab-avatar {
  display: inline-grid !important;
  place-items: center !important;
  flex: 0 0 42px !important;
  width: 42px !important;
  height: 42px !important;
  min-width: 42px !important;
  min-height: 42px !important;
  overflow: hidden !important;
  border-radius: 50% !important;
  background: #e9e3db !important;
  color: #2b2622 !important;
  font-size: 12px !important;
  font-weight: 800 !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-avatar img,
body[data-app-route^="/profile"] .profile-section-content .profile-tab-avatar img {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  object-fit: cover !important;
  border-radius: 50% !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-more {
  width: 30px !important;
  height: 30px !important;
  flex: 0 0 30px !important;
  display: grid !important;
  place-items: center !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 8px !important;
  background: transparent !important;
  color: #948a81 !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-post-copy {
  margin: 13px 0 !important;
  color: var(--ink, #201c19) !important;
  font-size: 14px !important;
  line-height: 1.62 !important;
  white-space: pre-wrap !important;
  overflow-wrap: anywhere !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-media {
  display: grid !important;
  gap: 5px !important;
  overflow: hidden !important;
  border-radius: 10px !important;
  margin-bottom: 9px !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-media-2,
body[data-app-route^="/profile"] .profile-section-content .home-media-3,
body[data-app-route^="/profile"] .profile-section-content .home-media-4 {
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-media img,
body[data-app-route^="/profile"] .profile-section-content .home-media video {
  display: block !important;
  width: 100% !important;
  height: 220px !important;
  max-width: none !important;
  object-fit: cover !important;
  background: #eee9e2 !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-media-1 img,
body[data-app-route^="/profile"] .profile-section-content .home-media-1 video {
  height: 330px !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-project,
body[data-app-route^="/profile"] .profile-section-content .home-link {
  width: 100% !important;
  box-sizing: border-box !important;
  border: 1px solid var(--line, #ddd6cc) !important;
  border-radius: 9px !important;
  padding: 10px !important;
  background: #faf7f2 !important;
  color: inherit !important;
  text-align: left !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-project span {
  display: flex !important;
  flex-direction: column !important;
  min-width: 0 !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-project strong { font-size: 11px !important; }
body[data-app-route^="/profile"] .profile-section-content .home-project small { display: block !important; margin-top: 3px !important; color: #8e847a !important; font-size: 10px !important; }
body[data-app-route^="/profile"] .profile-section-content .home-link { display: block !important; margin-top: 7px !important; color: #6d645c !important; font-size: 10px !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
body[data-app-route^="/profile"] .profile-section-content .home-actions {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  width: 100% !important;
  min-width: 0 !important;
  padding-top: 6px !important;
  border-top: 1px solid #eee8e1 !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-actions-left,
body[data-app-route^="/profile"] .profile-section-content .home-actions-right {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  min-width: 0 !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-actions-right { margin-left: auto !important; padding-left: 18px !important; }
body[data-app-route^="/profile"] .profile-section-content .home-actions button {
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
  padding: 6px 4px !important;
  border: 0 !important;
  border-radius: 7px !important;
  background: transparent !important;
  color: #7d736b !important;
  font-size: 10px !important;
  white-space: nowrap !important;
}
body[data-app-route^="/profile"] .profile-section-content .home-views {
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  color: #7d736b !important;
  font-size: 10px !important;
  white-space: nowrap !important;
}
body[data-app-route^="/profile"] .profile-section-content .nerdd-quote {
  width: 100% !important;
  box-sizing: border-box !important;
  margin: 0 0 10px !important;
  padding: 11px !important;
  border: 1px solid #d9d2c9 !important;
  border-radius: 11px !important;
  background: #faf7f2 !important;
}
body[data-app-route^="/profile"] .profile-section-content .nerdd-quote-avatar {
  width: 29px !important;
  height: 29px !important;
  flex: 0 0 29px !important;
  overflow: hidden !important;
  border-radius: 50% !important;
}
body[data-app-route^="/profile"] .profile-section-content .nerdd-quote-avatar img { width: 100% !important; height: 100% !important; object-fit: cover !important; }
body[data-app-route^="/profile"] .profile-section-content .nerdd-quote-head { display: flex !important; align-items: center !important; gap: 8px !important; }
body[data-app-route^="/profile"] .profile-section-content .nerdd-quote-head > span:last-child { display: flex !important; flex-direction: column !important; }
body[data-app-route^="/profile"] .profile-section-content .nerdd-quote-text { margin-top: 8px !important; color: #332e29 !important; font-size: 11px !important; line-height: 1.5 !important; white-space: pre-wrap !important; }

@media (max-width: 1099px) {
  .app-main > .page-content { width: 100% !important; max-width: none !important; margin: 0 !important; }
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
  .app-shell > .topbar { position: sticky !important; left: auto !important; right: auto !important; width: auto !important; }
  .topbar { z-index: 900 !important; }
  .app-main { padding-top: 0 !important; }
  .app-main > .page-content { padding: 20px 15px 80px !important; }
  body[data-app-route="/home"] .home-live-grid { width: 100% !important; }
}
`;

export default function MainContentLayoutFix(){
  return <style>{css}</style>;
}
