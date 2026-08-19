"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import LiveMessagesRoute from "@/components/app/LiveMessagesRoute";
import LiveNotificationsRoute from "@/components/app/LiveNotificationsRoute";
import LiveChartsRoute from "@/components/app/LiveChartsRoute";
import LiveFundraisingRoute from "@/components/app/LiveFundraisingRoute";
import LiveSearchRoute from "@/components/app/LiveSearchRoute";
import DocumentationSurface from "@/components/public/DocumentationSurface";
import PostDetailSurface from "@/components/app/PostDetailSurface";
import ProfilePostPopupLayer from "@/components/app/ProfilePostPopupLayer";
import NerddingInteractionLayer from "@/components/app/NerddingInteractionLayer";
import NerddingProjectInteractionLayer from "@/components/app/NerddingProjectInteractionLayer";
import HashtagEnhancer from "@/components/social/HashtagEnhancer";
import AgentRouteShield from "@/components/agent/AgentRouteShield";
import AgentVerificationGate2 from "@/components/agent/AgentVerificationGate2";
import AgentVerificationRedirect from "@/components/agent/AgentVerificationRedirect";
import AgentLoginLink from "@/components/agent/AgentLoginLink";
import AgentPendingNotice from "@/components/agent/AgentPendingNotice";
import RouteVisualFixLayer from "@/components/app/RouteVisualFixLayer";
import SiteFooter from "@/components/app/SiteFooter";
import { getSavedUser } from "@/lib/api";

export default function ClientAppGate() {
  const pathname = usePathname();
  const profile = Boolean(pathname?.startsWith("/profile/"));
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [footerTarget, setFooterTarget] = useState<HTMLElement | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [searchParams] = useState("");
  const hasActivePost = Boolean(activePostId);

  const documentation = false;
  const documentationSlug = "";
  const messages = false;
  const notifications = false;
  const charts = false;
  const fundraising = false;
  const search = false;
  const newProject = false;

  useEffect(() => {
    setPortalTarget(document.getElementById("app-content") ?? document.body);
    setFooterTarget(document.getElementById("site-footer") ?? null);
  }, []);

  useEffect(() => {
    const handleOpenPost = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.postId && !profile) setActivePostId(detail.postId);
    };
    window.addEventListener("nerdding:open-post", handleOpenPost);
    return () => window.removeEventListener("nerdding:open-post", handleOpenPost);
  }, [profile]);

  return <>
    {portalTarget && createPortal(<div className="client-app-overlay-root">
      {newProject && <div />}
      {messages && <LiveMessagesRoute />}
      {notifications && <LiveNotificationsRoute />}
      {charts && <LiveChartsRoute />}
      {fundraising && <LiveFundraisingRoute />}
      {search && <LiveSearchRoute query={searchParams} />}
      {documentation && <DocumentationSurface slug={documentationSlug} />}
      {hasActivePost && !profile && <PostDetailSurface postId={activePostId} onClose={() => setActivePostId(null)} isPanel={true} />}
    </div>, portalTarget)}
    {footerTarget && createPortal(<SiteFooter />, footerTarget)}
    {!profile && <ProfilePostPopupLayer />}
    {!profile && <NerddingInteractionLayer />}
    <NerddingProjectInteractionLayer />
    <HashtagEnhancer />
    <AgentRouteShield />
    <AgentVerificationGate2 />
    <AgentVerificationRedirect />
    <AgentLoginLink />
    <AgentPendingNotice />
    <RouteVisualFixLayer />
  </>;
}
