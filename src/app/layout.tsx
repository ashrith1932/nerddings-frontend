import type { Metadata } from "next";
import "./globals.css";
import "@/components/social/social-enhancer.css";
import "@/components/social/social-enhancer-overrides.css";
import "@/components/ui/container-skeleton.css";

export const metadata: Metadata = {
  title: "Nerddings — A Network for People Building Things",
  description: "Nerddings is a social network for students, developers, creators, founders, and organizations to share projects, discover people and ideas, connect with their network, explore events, and find opportunities.",
};

const productPolish = `
/* shared warm visual language */
:root{--nerdd-paper:#f8f6f2;--nerdd-card:#fffdf9;--nerdd-ink:#201c19;--nerdd-line:#ded7cf;--nerdd-muted:#756c64;--nerdd-subtle:#978d84}

/* Charts: compact rows inspired by the reference layout. */
body[data-nerdding-enhanced-route="/charts"] .live-data-route{position:relative;padding-right:306px;min-height:560px}
body[data-nerdding-enhanced-route="/charts"] .live-data-head,body[data-nerdding-enhanced-route="/charts"] .live-data-tabs{max-width:none}
body[data-nerdding-enhanced-route="/charts"] .live-data-card{background:var(--nerdd-card)!important;border:1px solid var(--nerdd-line)!important;border-radius:14px!important;overflow:hidden!important;box-shadow:0 3px 12px rgba(31,27,24,.035)!important}
body[data-nerdding-enhanced-route="/charts"] .live-data-row{min-height:78px!important;padding:0 18px!important;display:grid!important;grid-template-columns:30px 36px minmax(0,1fr) 54px 18px!important;gap:11px!important;border-bottom:1px solid #eee8e1!important;transition:background .18s ease,transform .18s ease,box-shadow .18s ease!important}
body[data-nerdding-enhanced-route="/charts"] .live-data-row:hover{background:#faf7f1!important;transform:translateX(2px)!important;box-shadow:inset 3px 0 0 #d35d34!important}
body[data-nerdding-enhanced-route="/charts"] .live-data-row>.home-avatar-sm{width:34px!important;height:34px!important;min-width:34px!important;border-radius:50%!important;overflow:hidden!important;background:#ece6dd!important}
body[data-nerdding-enhanced-route="/charts"] .live-data-row>.home-avatar-sm img{width:100%!important;height:100%!important;object-fit:cover!important;border-radius:50%!important}
body[data-nerdding-enhanced-route="/charts"] .live-data-rank{font-size:10px!important;color:#8c8279!important;font-weight:800!important}
body[data-nerdding-enhanced-route="/charts"] .live-data-row-main strong{font-size:12px!important;color:#201c19!important}
body[data-nerdding-enhanced-route="/charts"] .live-data-row-main>span:not(.live-data-progress){font-size:9px!important;color:#8f857c!important;margin-top:2px!important}
body[data-nerdding-enhanced-route="/charts"] .live-data-progress{max-width:150px!important;height:4px!important;background:#eee8df!important;margin-top:7px!important}
body[data-nerdding-enhanced-route="/charts"] .live-data-score{font-size:10px!important;color:#655d55!important;font-weight:800!important;text-align:right!important}
body[data-nerdding-enhanced-route="/charts"] .live-data-row:after{content:"›";font-size:19px;color:#8d837a;line-height:1}
body[data-nerdding-enhanced-route="/charts"] .live-data-route:after{content:"About Charts\\A\\ACharts are calculated using live proof-of-work, trust, engagement quality, consistency and impact.\\A\\ARankings update frequently as meaningful activity changes.\\A\\AHow it works\\A\\A✓  Proof\\A   Verifiable work matters\\A\\A✓  Trust\\A   Built through community\\A\\A↗  Activity\\A   Meaningful engagement\\A\\A✦  Impact\\A   Real-world outcomes";white-space:pre-wrap;position:absolute;top:116px;right:0;width:270px;box-sizing:border-box;padding:19px;border:1px solid var(--nerdd-line);border-radius:14px;background:var(--nerdd-card);color:#81776e;font-size:10px;line-height:1.7;box-shadow:0 4px 14px rgba(31,27,24,.035)}

/* Projects and project cards: clear surface hierarchy + hover motion. */
.project-card,.profile-project-live,.nerdd-proj-card{transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease!important}
.project-card:hover,.profile-project-live:hover,.nerdd-proj-card:hover{transform:translateY(-3px)!important;box-shadow:0 15px 30px rgba(31,27,24,.09)!important;border-color:#c8bfb6!important}
.nerdd-proj-page{width:min(1160px,calc(100vw - 64px))!important;margin:0 auto!important;padding:36px 0 72px!important;color:var(--nerdd-ink)!important;background:transparent!important}
.nerdd-proj-hero,.nerdd-proj-card{background:var(--nerdd-card)!important;border:1px solid var(--nerdd-line)!important;border-radius:15px!important}
.nerdd-proj-member:hover,.nerdd-proj-suggestions button:hover,.nerdd-proj-github:hover{background:#faf7f1!important;border-color:#c8bfb6!important}

/* Settings should live inside the same content column, not as a fixed full-screen surface. */
body[data-nerdding-enhanced-route^="/settings"] .nerdd-route-surface{position:relative!important;inset:auto!important;width:100%!important;min-height:0!important;height:auto!important;overflow:visible!important;padding:0 0 70px!important;background:transparent!important}
body[data-nerdding-enhanced-route^="/settings"] .settings-view{width:min(1150px,calc(100vw - 64px))!important;margin:0 auto!important}
body[data-nerdding-enhanced-route^="/settings"] .settings-panel{background:var(--nerdd-card)!important;border:1px solid var(--nerdd-line)!important;border-radius:14px!important;box-shadow:0 8px 24px rgba(31,27,24,.045)!important}
body[data-nerdding-enhanced-route^="/settings"] .settings-nav button:not(.settings-active):hover{background:#f3eee7!important;color:var(--nerdd-ink)!important}

/* Explore / Events should stay in the same light design language even if legacy theme styles are present. */
body[data-nerdding-enhanced-route="/explore"],body[data-nerdding-enhanced-route="/events"]{--paper:var(--nerdd-paper)!important;--card:var(--nerdd-card)!important;--ink:var(--nerdd-ink)!important;--line:var(--nerdd-line)!important;--muted:var(--nerdd-muted)!important;--subtle:var(--nerdd-subtle)!important;background:var(--nerdd-paper)!important;color:var(--nerdd-ink)!important}
body[data-nerdding-enhanced-route="/explore"] .page-content,body[data-nerdding-enhanced-route="/events"] .page-content{background:var(--nerdd-paper)!important;color:var(--nerdd-ink)!important}
body[data-nerdding-enhanced-route="/explore"] .page-content .view,body[data-nerdding-enhanced-route="/events"] .page-content .view{background:transparent!important;color:var(--nerdd-ink)!important}
body[data-nerdding-enhanced-route="/explore"] .trending-card,body[data-nerdding-enhanced-route="/explore"] .discover-card,body[data-nerdding-enhanced-route="/events"] .event-card,body[data-nerdding-enhanced-route="/events"] .event-create-card{background:var(--nerdd-card)!important;color:var(--nerdd-ink)!important;border:1px solid var(--nerdd-line)!important;border-radius:14px!important;box-shadow:0 4px 16px rgba(31,27,24,.04)!important}
body[data-nerdding-enhanced-route="/explore"] .trending-card:hover,body[data-nerdding-enhanced-route="/events"] .event-card:hover{transform:translateY(-3px)!important;box-shadow:0 15px 30px rgba(31,27,24,.09)!important}
body[data-nerdding-enhanced-route="/explore"] .trending-card-top{background:#f1ece4!important;color:var(--nerdd-ink)!important}
body[data-nerdding-enhanced-route="/events"] input,body[data-nerdding-enhanced-route="/events"] textarea,body[data-nerdding-enhanced-route="/explore"] input{background:var(--nerdd-card)!important;color:var(--nerdd-ink)!important;border-color:var(--nerdd-line)!important}

/* Consistent public/legal footer branding. */
.nerdd-global-footer-mark{background:transparent!important;color:var(--nerdd-ink)!important;width:auto!important;height:34px!important;border-radius:0!important;display:inline-flex!important;align-items:center!important;justify-content:flex-start!important}
.nerdd-global-footer-mark svg{display:none!important}
.nerdd-global-footer-mark:before{content:"n.";font-size:27px;font-weight:900;letter-spacing:-.08em;line-height:1;color:var(--nerdd-ink)}
.public-about-footer{position:relative;display:flex!important;justify-content:space-between!important;align-items:center!important;gap:18px!important;min-height:52px!important;color:#8c8279!important}
.public-about-footer:before{content:"n.  nerdding";font-weight:850;font-size:16px;letter-spacing:-.03em;color:var(--nerdd-ink);margin-right:auto}
.public-about-footer>span:first-of-type{display:none!important}
.public-about-footer>span:nth-of-type(2){font-size:10px}
.public-footer-links{display:flex;gap:12px}
body:has(.legal-page) .legal-page:after{content:"n.  nerdding   ·   Build · Prove · Connect · Grow";display:block;max-width:1150px;margin:50px auto 0;padding:20px 0;border-top:1px solid #dfd8cf;color:#81776f;font-size:10px;font-weight:700;letter-spacing:.01em}

/* App shell branding: use the same mark/wordmark visual language as the public brand. */
.logo-link{display:flex!important;align-items:center!important;gap:9px!important;background:none!important;border:0!important;color:var(--nerdd-ink)!important;font-family:'Space Grotesk',sans-serif!important;font-size:17px!important;font-weight:800!important;letter-spacing:-.04em!important;padding:4px 0!important;text-transform:lowercase!important}
.logo-link::before{content:"";width:28px;height:28px;border-radius:6px;background:#fff9e9;box-shadow:inset 0 0 0 1px rgba(23,20,17,.08);display:block;flex:0 0 28px;background-image:linear-gradient(45deg,transparent 0 46%,#171411 46% 54%,transparent 54%),linear-gradient(135deg,#171411 0 38%,transparent 38% 62%,#171411 62%)}

/* Slightly compact Home feed while preserving its internal scrolling/interaction model. */
body[data-app-route="/home"] .home-live-shell{max-width:1060px}
body[data-app-route="/home"] .home-live-grid{grid-template-columns:minmax(0,1fr) 380px;gap:20px}
body[data-app-route="/home"] .home-info-rail{width:380px}
@media(max-width:1100px){body[data-app-route="/home"] .home-live-grid{grid-template-columns:minmax(0,1fr) 360px}body[data-app-route="/home"] .home-info-rail{width:360px}}

@media(max-width:900px){body[data-nerdding-enhanced-route="/charts"] .live-data-route{padding-right:0}body[data-nerdding-enhanced-route="/charts"] .live-data-route:after{position:static;width:100%;margin-top:14px}body[data-nerdding-enhanced-route^="/settings"] .settings-view, .nerdd-proj-page{width:calc(100vw - 28px)!important}}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><style dangerouslySetInnerHTML={{ __html: productPolish }} />{children}</body></html>;
}
