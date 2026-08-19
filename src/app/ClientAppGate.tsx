"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NerddingApp } from "@/components/layout/NerddingApp";
import { ProfileSurface, SettingsSurface } from "@/components/app/NerddingRouteSurfaces";
import ProjectDetailSurface from "@/components/app/ProjectDetailSurface";
import PostDetailSurface from "@/components/app/PostDetailSurface";
import ProjectSurface from "@/components/app/ProjectSurface";
import NerddingInteractionLayer from "@/components/app/NerddingInteractionLayer";
import NerddingProjectInteractionLayer from "@/components/app/NerddingProjectInteractionLayer";
import ProfilePostPopupLayer from "@/components/app/ProfilePostPopupLayer";
import RouteVisualFixLayer from "@/components/app/RouteVisualFixLayer";
import MainContentLayoutFix from "@/components/app/MainContentLayoutFix";
import { LiveHomeRoute, LiveMessagesRoute, LiveNotificationsRoute, LiveChartsRoute, LiveFundraisingRoute, LiveSearchRoute } from "@/components/app/LiveDataRoutes";
import { ExploreRoute, EventsRoute } from "@/components/app/DiscoveryRoutes";
import DocumentationSurface, { DocumentationSettingsCard } from "@/components/public/DocumentationSurface";
import SiteFooter from "@/components/app/SiteFooter";
import FeedUpdatePrompt from "@/components/social/FeedUpdatePrompt";
import HashtagEnhancer from "@/components/social/HashtagEnhancer";
import "@/components/app/nerdding-route-surfaces.css";
import AgentVerificationGate2 from "@/components/agent/AgentVerificationGate2";
import AgentVerificationRedirect from "@/components/agent/AgentVerificationRedirect";
import AgentRouteShield from "@/components/agent/AgentRouteShield";
import AgentLoginLink from "@/components/agent/AgentLoginLink";
import AgentPendingNotice from "@/components/agent/AgentPendingNotice";
import { apiFetch } from "@/lib/api";

const MESSAGE_CACHE_PREFIX = "nerdding.messages.v2.";

function repairMessageCache() {
  if (typeof window === "undefined") return;
  const remove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key?.startsWith(MESSAGE_CACHE_PREFIX)) continue;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) remove.push(key);
    } catch {
      remove.push(key);
    }
  }
  remove.forEach((key) => window.localStorage.removeItem(key));
}

function AppSkeleton() {
  return (
    <div className="client-app-skeleton" aria-hidden="true">
      <style>{`.client-app-skeleton{min-height:100dvh;display:grid;grid-template-columns:244px minmax(0,1fr);background:#f8f6f2}.client-app-skeleton-sidebar{padding:24px 14px;border-right:1px solid #e4ded5;background:#fbfaf7}.client-app-skeleton-logo,.client-app-skeleton-nav,.client-app-skeleton-topbar,.client-app-skeleton-card{background:#e8e3dc;position:relative;overflow:hidden}.client-app-skeleton-logo{height:30px;width:125px;border-radius:8px;margin:3px 10px 28px}.client-app-skeleton-nav{height:40px;border-radius:10px;margin:7px 4px}.client-app-skeleton-topbar{height:66px;border-bottom:1px solid #e4ded5;background:#fbfaf7}.client-app-skeleton-content{width:min(1150px,calc(100% - 48px));margin:28px auto;display:grid;gap:14px}.client-app-skeleton-card{height:150px;border-radius:15px}.client-app-skeleton-card.large{height:250px}.client-app-skeleton-logo:after,.client-app-skeleton-nav:after,.client-app-skeleton-topbar:after,.client-app-skeleton-card:after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);animation:client-app-shimmer 1.15s infinite}@keyframes client-app-shimmer{to{transform:translateX(100%)}}@media(max-width:760px){.client-app-skeleton{display:block}.client-app-skeleton-sidebar{display:none}.client-app-skeleton-content{width:calc(100% - 20px);margin:18px auto}}`}</style>
      <aside className="client-app-skeleton-sidebar">
        <div className="client-app-skeleton-logo" />
        {Array.from({ length: 9 }, (_, i) => (
          <div className="client-app-skeleton-nav" key={i} />
        ))}
      </aside>
      <main>
        <div className="client-app-skeleton-topbar" />
        <div className="client-app-skeleton-content">
          <div className="client-app-skeleton-card large" />
          <div className="client-app-skeleton-card" />
          <div className="client-app-skeleton-card" />
        </div>
      </main>
    </div>
  );
}

export default function ClientAppGate() {
  const [ready, setReady] = useState(false);
  const [path, setPath] = useState(() => (typeof window === "undefined" ? "/" : window.location.pathname));
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [footerTarget, setFooterTarget] = useState<HTMLElement | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);

  useEffect(() => {
    repairMessageCache();
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    setReady(true);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const handleOpenPost = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.postId) setActivePostId(detail.postId);
    };
    window.addEventListener("nerdding:open-post", handleOpenPost);
    return () => window.removeEventListener("nerdding:open-post", handleOpenPost);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const target = document.querySelector(".app-main .page-content") as HTMLElement | null;
    const footer = document.querySelector(".app-main") as HTMLElement | null;
    setPortalTarget(target);
    setFooterTarget(footer);
    document.body.dataset.nerddingEnhancedRoute = path;
    return () => {
      delete document.body.dataset.nerddingEnhancedRoute;
    };
  }, [ready, path]);

  useEffect(() => {
    if (!ready) return;
    const refresh = async () => {
      const status = document.querySelector<HTMLElement>(".status-chip");
      if (status) status.style.display = "none";
      document.querySelectorAll<HTMLElement>(".nav-item b").forEach((badge) => {
        badge.style.display = "none";
      });
      const token = window.localStorage.getItem("nerdding.token");
      if (!token) return;
      try {
        const [notifications, messages] = await Promise.allSettled([
          apiFetch<any>("/notifications"),
          apiFetch<any>("/social/messages/unread-count"),
        ]);
        const counts = {
          Messages:
            messages.status === "fulfilled"
              ? Number(messages.value?.data?.unreadCount ?? 0) + Number(messages.value?.data?.pendingRequests ?? 0)
              : 0,
          Notifications:
            notifications.status === "fulfilled" ? Number(notifications.value?.unreadCount ?? 0) : 0,
        };
        document.querySelectorAll<HTMLElement>(".nav-item").forEach((item) => {
          const label = item.querySelector("span")?.textContent?.trim() as keyof typeof counts | undefined;
          if (!label || !(label in counts)) return;
          const count = counts[label];
          let badge = item.querySelector<HTMLElement>("b");
          if (count <= 0) {
            badge?.remove();
            return;
          }
          if (!badge) {
            badge = document.createElement("b");
            item.appendChild(badge);
          }
          badge.textContent = count > 99 ? "99+" : String(count);
          badge.style.display = "inline-flex";
        });
      } catch {}
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(timer);
  }, [ready, path]);

  if (!ready) return <AppSkeleton />;

  const profile = path.startsWith("/profile/");
  const settings = path.startsWith("/settings");
  const project = path.startsWith("/project/") && path !== "/project/new";
  const post = path.startsWith("/post/");
  const newProject = path === "/project/new";
  const home = path === "/home" || path === "/";
  const explore = path === "/explore";
  const events = path === "/events";
  const messages = path.startsWith("/messages");
  const notifications = path.startsWith("/notifications");
  const charts = path.startsWith("/charts");
  const fundraising = path.startsWith("/fundraising");
  const search = path.startsWith("/search");
  const documentation = path === "/documentation" || path.startsWith("/documentation/") || path === "/privacy" || path === "/terms" || path === "/community-guidelines" || path === "/cookies";
  const documentationSlug = path.startsWith("/documentation/")
    ? decodeURIComponent(path.split("/")[2] || "about")
    : path === "/privacy"
      ? "privacy"
      : path === "/terms"
        ? "terms"
        : path === "/community-guidelines"
          ? "community-guidelines"
          : path === "/cookies"
            ? "cookies"
            : "about";
  const searchParams = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("q") ?? "";

  const hasActivePost = activePostId && (home || explore);
  const layoutClass = hasActivePost ? "nerdding-enhanced-route" : "nerdding-enhanced-route full-width";

  return (
    <>
      <MainContentLayoutFix />
      <style>{`
        .nerdding-enhanced-route{width:100%}
        .nerdding-enhanced-route>.nerdd-route-surface{position:relative;inset:auto;z-index:auto;width:100%;min-height:100%;overflow:visible;padding:0}
        .nerdding-feed-column{width:100%}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap){position:relative!important;inset:auto!important;z-index:auto!important;width:100%!important;min-height:0!important;height:auto!important;overflow:visible!important;padding:0!important;margin:0!important;background:transparent!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap)>.view{max-width:1320px!important;margin:0 auto!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .profile-content-grid{width:100%!important;max-width:1320px!important;margin:0 auto!important;display:grid!important;grid-template-columns:minmax(0,1fr) 360px!important;column-gap:24px!important;align-items:start!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-post{display:block!important;width:100%!important;box-sizing:border-box!important;background:var(--card,#fff)!important;border:1px solid var(--line,#ddd6cc)!important;border-radius:12px!important;padding:15px 16px 8px!important;margin-bottom:11px!important;cursor:pointer!important;color:var(--ink,#201c19)!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-post:hover{border-color:#c6bdb3!important;box-shadow:0 8px 22px rgba(31,27,24,.06)!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-post-head{display:flex!important;justify-content:space-between!important;align-items:center!important;width:100%!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-author{display:flex!important;align-items:center!important;gap:9px!important;border:0!important;background:none!important;padding:0!important;text-align:left!important;color:inherit!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-author>span{display:flex!important;flex-direction:column!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-author strong{font-size:12px!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-author small{font-size:10px!important;color:#938980!important;margin-top:2px!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-avatar{display:inline-grid!important;place-items:center!important;flex:0 0 auto!important;overflow:hidden!important;border-radius:50%!important;background:#e9e3db!important;color:#2b2622!important;font-weight:800!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-avatar img{width:100%!important;height:100%!important;object-fit:cover!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-avatar-md{width:42px!important;height:42px!important;font-size:12px!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-more{width:30px!important;height:30px!important;border:0!important;background:none!important;color:#948a81!important;display:grid!important;place-items:center!important;border-radius:8px!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-post-copy{font-size:14px!important;line-height:1.62!important;white-space:pre-wrap!important;margin:13px 0!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-actions{border-top:1px solid #eee8e1!important;padding-top:6px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-actions-left,.nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-actions-right{display:flex!important;align-items:center!important;gap:6px!important;min-width:0!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-actions-right{margin-left:auto!important;padding-left:18px!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-actions button{border:0!important;background:none!important;color:#7d736b!important;display:flex!important;align-items:center!important;gap:5px!important;padding:6px 4px!important;font-size:10px!important;border-radius:7px!important;white-space:nowrap!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-views{display:inline-flex!important;align-items:center!important;gap:4px!important;white-space:nowrap!important;color:#7d736b!important;font-size:10px!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-media{display:grid!important;gap:5px!important;overflow:hidden!important;border-radius:10px!important;margin-bottom:9px!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-media-2,.nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-media-3,.nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-media-4{grid-template-columns:repeat(2,1fr)!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-media img,.nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-media video{width:100%!important;height:220px!important;object-fit:cover!important;background:#eee9e2!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-media-1 img,.nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-media-1 video{height:330px!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-project,.nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-link{width:100%!important;box-sizing:border-box!important;border:1px solid var(--line,#ddd6cc)!important;background:#faf7f2!important;border-radius:9px!important;padding:10px!important;text-align:left!important;display:flex!important;color:inherit!important;text-decoration:none!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-project span{display:flex!important;flex-direction:column!important;min-width:0!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-project strong{font-size:11px!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-project small{font-size:10px!important;color:#8e847a!important;margin-top:3px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .home-link{margin-top:7px!important;color:#6d645c!important;font-size:10px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .nerdd-quote{border:1px solid #d9d2c9!important;background:#faf7f2!important;border-radius:11px!important;padding:11px!important;margin:0 0 10px!important;cursor:pointer!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .nerdd-quote-label{font-size:8px!important;font-weight:800!important;letter-spacing:.13em!important;color:#9a9087!important;margin-bottom:8px!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .nerdd-quote-head{display:flex!important;align-items:center!important;gap:8px!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .nerdd-quote-head>span:last-child{display:flex!important;flex-direction:column!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .nerdd-quote-avatar{width:29px!important;height:29px!important;border-radius:50%!important;overflow:hidden!important;display:grid!important;place-items:center!important;background:#e9e3db!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .nerdd-quote-avatar img{width:100%!important;height:100%!important;object-fit:cover!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .nerdd-quote-text{font-size:11px!important;line-height:1.5!important;white-space:pre-wrap!important;margin-top:8px!important;color:#332e29!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .nerdd-quote-media{margin-top:8px!important;border-radius:8px!important;overflow:hidden!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .nerdd-quote-media img,.nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .nerdd-quote-media video{display:block!important;width:100%!important;height:170px!important;object-fit:cover!important;background:#eee9e2!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .profile-right-rail{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:14px!important;align-self:start!important;width:100%!important;min-width:0!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .profile-post-detail-slot{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .profile-post-detail-slot:empty{display:none!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .profile-right-rail>.profile-affiliations-rail{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
        .nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .profile-active-post,.nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .profile-inline-active-post{position:static!important;inset:auto!important;width:100%!important;max-width:100%!important;min-width:0!important;grid-column:auto!important;grid-row:auto!important;box-sizing:border-box!important}
        @media(max-width:920px){.nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .profile-content-grid{grid-template-columns:minmax(0,1fr)!important;gap:16px!important}.nerdding-feed-column>.nerdd-route-surface:has(.profile-section-tabs-wrap) .profile-right-rail{width:100%!important}}
        .status-chip{display:none!important}.create-popover .create-option:nth-of-type(n+3){display:none}.settings-enhanced-stack{width:100%}
      `}</style>
      <NerddingApp />
      {portalTarget &&
        createPortal(
          <div className={layoutClass}>
            <div className="nerdding-feed-column">
              {home && (
                <>
                  <LiveHomeRoute />
                  <FeedUpdatePrompt />
                </>
              )}
              {explore && <ExploreRoute />}
              {events && <EventsRoute />}
              {profile && <ProfileSurface username={decodeURIComponent(path.split("/")[2] || "")} />}
              {settings && (
                <div className="settings-enhanced-stack">
                  <SettingsSurface />
                  <DocumentationSettingsCard />
                </div>
              )}
              {project && <ProjectDetailSurface slug={decodeURIComponent(path.split("/")[2] || "")} />}
              {post && <PostDetailSurface postId={decodeURIComponent(path.split("/")[2] || "")} />}
              {newProject && <ProjectSurface />}
              {messages && <LiveMessagesRoute />}
              {notifications && <LiveNotificationsRoute />}
              {charts && <LiveChartsRoute />}
              {fundraising && <LiveFundraisingRoute />}
              {search && <LiveSearchRoute query={searchParams} />}
              {documentation && <DocumentationSurface slug={documentationSlug} />}
            </div>

            {hasActivePost && (
              <PostDetailSurface
                postId={activePostId}
                onClose={() => setActivePostId(null)}
                isPanel={true}
              />
            )}
          </div>,
          portalTarget
        )}
      {footerTarget && createPortal(<SiteFooter />, footerTarget)}
      {profile && <ProfilePostPopupLayer />}
      {!profile && <NerddingInteractionLayer />}
      <NerddingProjectInteractionLayer />
      <HashtagEnhancer />
      <AgentRouteShield />
      <AgentVerificationGate2 />
      <AgentVerificationRedirect />
      <AgentLoginLink />
      <AgentPendingNotice />
      <RouteVisualFixLayer />
    </>
  );
}
