"use client";

const css = `
/* Stable application shell shared by every route. */
.app-main{min-width:0!important}
.page-content{min-width:0!important;overflow-x:clip!important;position:relative;z-index:1}
.topbar{position:fixed!important;top:0!important;left:244px!important;right:0!important;width:auto!important;margin:0!important;z-index:900!important}

@media (min-width:1100px){
  .app-main{width:calc(100% - 244px)!important;margin-left:244px!important;padding-top:75px!important}
  .app-main>.page-content{width:100%!important;max-width:none!important;margin:0!important;padding:31px 42px 72px!important;min-width:0!important;overflow-x:clip!important}
  .app-main>.page-content>.view{width:100%!important;max-width:1320px!important;margin-left:0!important;margin-right:auto!important;min-width:0!important}
}

/* Home visual baseline: readable feed with a 360px right rail. */
.home-live-root,.home-live-grid,.home-feed-column{min-width:0!important}
.home-live-shell{max-width:1120px!important;margin:0 auto!important;padding:4px 0 40px!important}
.home-live-grid{width:min(100%,1320px)!important;margin:0 auto!important;grid-template-columns:minmax(0,1fr) 360px!important;gap:24px!important;align-items:start!important}
.home-live-grid>:first-child{min-width:0!important;width:100%!important}
.home-feed-column{max-height:calc(100dvh - 170px)!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;padding-right:4px!important;scrollbar-gutter:stable!important}
.home-info-rail{width:360px!important;min-width:360px!important;max-width:360px!important;display:flex!important;flex-direction:column!important;gap:14px!important}
.home-live-grid:has(.home-active-post){grid-template-columns:minmax(0,1fr) 360px!important}
.home-info-rail:has(.home-active-post){width:360px!important;min-width:360px!important}
.home-active-post{width:100%!important;max-width:360px!important;max-height:min(70vh,760px)!important}
.home-active-post .home-modal{width:100%!important;max-height:min(70vh,760px)!important}
.home-active-post .home-modal-scroll{max-height:calc(min(70vh,760px) - 60px)!important;overflow-y:auto!important}

/* Profile visual baseline matching Home. */
.profile-content-grid{display:grid!important;grid-template-columns:minmax(0,1fr) 360px!important;gap:24px!important;align-items:start!important;width:min(100%,1320px)!important;margin:18px auto 0!important;min-width:0!important}
.profile-section-content,.profile-right-rail,.profile-post-detail-slot,.profile-affiliations-rail{min-width:0!important;max-width:100%!important;box-sizing:border-box!important}
.profile-section-content{min-height:0!important;overflow:hidden!important}
.profile-right-rail{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:14px!important;align-self:start!important;width:100%!important}
.profile-right-rail>.profile-affiliations-rail{position:sticky!important;top:94px!important}
.profile-posts-scroll{min-width:0!important;min-height:0!important;max-height:calc(100dvh - 170px)!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;padding-right:4px!important;scrollbar-gutter:stable!important}
.profile-content-grid:has(.home-active-post),.profile-content-grid:has(.profile-active-post){grid-template-columns:minmax(0,1fr) 360px!important}
.profile-active-post{width:100%!important;max-width:360px!important}
.profile-section-tabs{display:flex!important;gap:26px!important;border-bottom:1px solid #e3ddd5!important;margin-bottom:18px!important}
.profile-section-tabs button{font-family:'Space Grotesk',sans-serif!important;font-size:12px!important;font-weight:700!important;background:none!important;border:0!important;padding:11px 0 12px!important;color:#8b8178!important;position:relative!important}
.profile-section-tabs button.active{color:#201c19!important}
.profile-section-tabs button.active:after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:3px;border-radius:8px;background:#201c19}
.profile-tab-search{display:flex!important;align-items:center!important;gap:8px!important;border:1px solid #ddd6cc!important;border-radius:10px!important;background:#fffdf9!important;padding:9px 11px!important;margin-bottom:14px!important}
.profile-tab-search input{border:0!important;outline:0!important;flex:1!important;background:transparent!important;font:inherit!important;font-size:12px!important}

/* Profile Build Notes reuse Home markup but need standalone structure styles. */
.profile-page .profile-section-content .home-post{display:block!important;width:100%!important;box-sizing:border-box!important;margin:0 0 11px!important;padding:15px 16px 8px!important;border:1px solid var(--line,#ddd6cc)!important;border-radius:12px!important;background:var(--card,#fff)!important;box-shadow:none!important;text-align:left!important;overflow:hidden!important;cursor:pointer!important}
.profile-page .profile-section-content .home-post:hover{border-color:#c6bdb3!important;box-shadow:0 8px 22px rgba(31,27,24,.06)!important}
.profile-page .profile-section-content .home-post-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;width:100%!important}
.profile-page .home-author{display:flex!important;align-items:center!important;gap:9px!important;min-width:0!important;padding:0!important;border:0!important;background:transparent!important;color:inherit!important}
.profile-page .home-author>span:last-child{display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;min-width:0!important;text-align:left!important}
.profile-page .home-author strong{font-size:12px!important;line-height:1.25!important;font-weight:700!important;white-space:nowrap!important}
.profile-page .home-author small{display:block!important;margin-top:2px!important;color:#938980!important;font-size:10px!important;line-height:1.2!important;white-space:nowrap!important}
.profile-page .home-project,.profile-page .home-link{width:100%!important;border:1px solid var(--line)!important;background:#faf7f2!important;border-radius:9px!important;padding:10px!important;text-align:left!important;display:flex!important;align-items:center!important;gap:12px!important;color:inherit!important;text-decoration:none!important;margin-top:15px!important;transition: .2s!important}
.profile-page .home-project:hover,.profile-page .home-link:hover{border-color:#c4b9ab!important;background:#fffbf2!important}
.profile-page .home-project span{display:flex!important;flex-direction:column!important;min-width:0!important;flex:1!important}
.profile-page .home-project strong{font-size:12px!important;display:block!important}
.profile-page .home-project small{font-size:10px!important;color:#d85a2d!important;margin-top:3px!important;display:block!important}
.profile-page .home-link{margin-top:7px!important;font-size:10px!important}
.profile-page .profile-section-content .home-avatar,.profile-page .profile-section-content .profile-tab-avatar{display:inline-grid!important;place-items:center!important;flex:0 0 42px!important;width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important;overflow:hidden!important;border-radius:50%!important;background:#e9e3db!important;color:#2b2622!important;font-size:12px!important;font-weight:800!important}
.profile-page .profile-section-content .home-avatar img,.profile-page .profile-section-content .profile-tab-avatar img{display:block!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;border-radius:50%!important}
.profile-page .profile-section-content .home-post-copy{margin:13px 0!important;color:var(--ink,#201c19)!important;font-size:14px!important;line-height:1.62!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important}
.profile-page .profile-section-content .home-actions{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;width:100%!important;padding-top:6px!important;border-top:1px solid #eee8e1!important}
.profile-page .profile-section-content .home-actions-left,.profile-page .profile-section-content .home-actions-right{display:flex!important;align-items:center!important;gap:6px!important;min-width:0!important}
.profile-page .profile-section-content .home-actions-right{margin-left:auto!important;padding-left:18px!important}
.profile-page .profile-section-content .home-actions button{display:flex!important;align-items:center!important;gap:5px!important;padding:6px 4px!important;border:0!important;border-radius:7px!important;background:transparent!important;color:#7d736b!important;font-size:10px!important;white-space:nowrap!important}
.profile-page .profile-section-content .home-views{display:inline-flex!important;align-items:center!important;gap:4px!important;color:#7d736b!important;font-size:10px!important;white-space:nowrap!important}
.profile-page .profile-section-content .nerdd-quote{width:100%!important;box-sizing:border-box!important;margin:0 0 10px!important;padding:11px!important;border:1px solid #d9d2c9!important;border-radius:11px!important;background:#faf7f2!important}
.profile-page .profile-section-content .nerdd-quote-head{display:flex!important;align-items:center!important;gap:8px!important}
.profile-page .profile-section-content .nerdd-quote-avatar{width:29px!important;height:29px!important;flex:0 0 29px!important;overflow:hidden!important;border-radius:50%!important}
.profile-page .profile-section-content .nerdd-quote-avatar img{width:100%!important;height:100%!important;object-fit:cover!important}

/* Sidebar branding: match the application's actual BrandMark/Wordmark proportions. */
.logo-link{display:flex!important;align-items:center!important;gap:9px!important;width:100%!important;border:0!important;background:none!important;padding:4px 8px!important;color:#171411!important;font-family:'Space Grotesk',sans-serif!important;font-weight:800!important;letter-spacing:-.04em!important;font-size:20px!important}

@media(max-width:1099px){.right-rail{width:320px!important;min-width:280px!important}.home-live-grid{grid-template-columns:minmax(0,1fr) minmax(280px,320px)!important}.home-info-rail{width:320px!important;min-width:280px!important;max-width:320px!important}.profile-content-grid{grid-template-columns:minmax(0,1fr) 320px!important}}
@media(max-width:920px){.right-rail{display:none!important}.home-live-grid,.profile-content-grid{grid-template-columns:1fr!important}.home-info-rail{display:none!important}.home-active-post,.profile-active-post{max-width:100%!important}}
@media(max-width:760px){.app-shell>.topbar{position:sticky!important;left:auto!important;right:auto!important;width:auto!important}.app-main{padding-top:0!important}.app-main>.page-content{padding:20px 15px 80px!important}.home-live-grid{width:100%!important}.home-feed-column,.profile-posts-scroll{max-height:none!important;overflow:visible!important;padding-right:0!important;scrollbar-gutter:auto!important}}
`;

export default function MainContentLayoutFix(){return <style>{css}</style>}
