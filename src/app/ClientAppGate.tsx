"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NerddingApp } from "@/components/layout/NerddingApp";
import { ProfileSurface, SettingsSurface } from "@/components/app/NerddingRouteSurfaces";
import ProjectDetailSurface from "@/components/app/ProjectDetailSurface";
import PostDetailSurface from "@/components/app/PostDetailSurface";
import ProjectSurface from "@/components/app/ProjectSurface";
import { apiFetch } from "@/lib/api";
import "@/components/app/nerdding-route-surfaces.css";
import AgentVerificationGate2 from "@/components/agent/AgentVerificationGate2";
import AgentVerificationRedirect from "@/components/agent/AgentVerificationRedirect";
import AgentRouteShield from "@/components/agent/AgentRouteShield";
import AgentLoginLink from "@/components/agent/AgentLoginLink";
import AgentPendingNotice from "@/components/agent/AgentPendingNotice";

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
      <style>{`\n        .client-app-skeleton{min-height:100dvh;display:grid;grid-template-columns:244px minmax(0,1fr);background:#f8f6f2}\n        .client-app-skeleton-sidebar{padding:24px 14px;border-right:1px solid #e4ded5;background:#fbfaf7}\n        .client-app-skeleton-logo,.client-app-skeleton-nav,.client-app-skeleton-topbar,.client-app-skeleton-card{background:#e8e3dc;position:relative;overflow:hidden}\n        .client-app-skeleton-logo{height:30px;width:125px;border-radius:8px;margin:3px 10px 28px}\n        .client-app-skeleton-nav{height:40px;border-radius:10px;margin:7px 4px}\n        .client-app-skeleton-topbar{height:66px;border-bottom:1px solid #e4ded5;background:#fbfaf7}\n        .client-app-skeleton-content{width:min(1150px,calc(100% - 48px));margin:28px auto;display:grid;gap:14px}\n        .client-app-skeleton-card{height:150px;border-radius:15px}.client-app-skeleton-card.large{height:250px}\n        .client-app-skeleton-logo:after,.client-app-skeleton-nav:after,.client-app-skeleton-topbar:after,.client-app-skeleton-card:after{content:\"\";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);animation:client-app-shimmer 1.15s infinite}\n        @keyframes client-app-shimmer{to{transform:translateX(100%)}}\n        @media(max-width:760px){.client-app-skeleton{display:block}.client-app-skeleton-sidebar{display:none}.client-app-skeleton-content{width:calc(100% - 20px);margin:18px auto}}\n      `}</style>
      <aside className="client-app-skeleton-sidebar">
        <div className="client-app-skeleton-logo" />
        {Array.from({ length: 9 }, (_, i) => <div className="client-app-skeleton-nav" key={i} />)}
      </aside>
      <main><div className="client-app-skeleton-topbar" /><div className="client-app-skeleton-content"><div className="client-app-skeleton-card large" /><div className="client-app-skeleton-card" /><div className="client-app-skeleton-card" /></div></main>
    </div>
  );
}

export default function ClientAppGate() {
  const [ready, setReady] = useState(false);
  const [path, setPath] = useState(() => typeof window === "undefined" ? "/" : window.location.pathname);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    repairMessageCache();
    const onPop = () => setPath(window.location.pathname);
    const onComment = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest(".social-actions button") as HTMLButtonElement | null;
      if (!button) return;
      const parent = button.parentElement;
      if (!parent || parent.querySelectorAll("button")[1] !== button) return;
      const card = button.closest(".social-post-card") as HTMLElement | null;
      const copy = card?.querySelector(".social-post-copy")?.textContent?.trim();
      if (!copy) return;
      event.preventDefault();
      event.stopPropagation();
      try {
        const json = await apiFetch<{ data: Array<{ id: string; text?: string }> }>("/social/feed?mode=for-you");
        const match = (json.data ?? []).find((post) => post.text?.trim() === copy);
        if (match?.id) {
          window.history.pushState({}, "", `/post/${match.id}`);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      } catch {
        // The post surface will show its own error state if the backend is unavailable.
      }
    };
    window.addEventListener("popstate", onPop);
    document.addEventListener("click", onComment, true);
    setReady(true);
    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("click", onComment, true);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const target = document.querySelector(".app-main .page-content") as HTMLElement | null;
    setPortalTarget(target);
    document.body.dataset.nerddingEnhancedRoute = path;
    return () => { delete document.body.dataset.nerddingEnhancedRoute; };
  }, [ready, path]);

  if (!ready) return <AppSkeleton />;

  const profile = path.startsWith("/profile/");
  const settings = path.startsWith("/settings");
  const project = path.startsWith("/project/") && path !== "/project/new";
  const post = path.startsWith("/post/");
  const newProject = path === "/project/new";

  return (
    <>
      <style>{`\n        .nerdding-enhanced-route{width:100%}\n        .nerdding-enhanced-route > .nerdd-route-surface{position:relative;inset:auto;z-index:auto;width:100%;min-height:100%;overflow:visible;padding:0 0 72px}\n        .nerdding-enhanced-route .view{max-width:none}\n        body[data-nerdding-enhanced-route^="/profile/"] .page-content > .profile-view,\n        body[data-nerdding-enhanced-route^="/settings"] .page-content > .settings-view,\n        body[data-nerdding-enhanced-route^="/project/"] .page-content > .project-view{display:none!important}\n        .create-popover .create-option:nth-of-type(n+3){display:none}\n      `}</style>
      <NerddingApp />
      {portalTarget && createPortal(
        <div className="nerdding-enhanced-route">
          {profile && <ProfileSurface username={decodeURIComponent(path.split("/")[2] || "")} />}
          {settings && <SettingsSurface />}
          {project && <ProjectDetailSurface slug={decodeURIComponent(path.split("/")[2] || "")} />}
          {post && <PostDetailSurface postId={decodeURIComponent(path.split("/")[2] || "")} />}
          {newProject && <ProjectSurface />}
        </div>,
        portalTarget,
      )}
      <AgentRouteShield />
      <AgentVerificationGate2 />
      <AgentVerificationRedirect />
      <AgentLoginLink />
      <AgentPendingNotice />
    </>
  );
}
