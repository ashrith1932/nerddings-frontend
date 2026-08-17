"use client";

import { useEffect, useState } from "react";
import { NerddingApp } from "@/components/layout/NerddingApp";
import ReliableSocialEnhancer from "@/components/social/ReliableSocialEnhancer";
import SocialProfileRedirector from "@/components/social/SocialProfileRedirector";
import LiveNavCounts from "@/components/social/LiveNavCounts";
import AgentVerificationGate2 from "@/components/agent/AgentVerificationGate2";
import AgentVerificationRedirect from "@/components/agent/AgentVerificationRedirect";
import AgentRouteShield from "@/components/agent/AgentRouteShield";
import AgentLoginLink from "@/components/agent/AgentLoginLink";
import AgentPendingNotice from "@/components/agent/AgentPendingNotice";
import ProfileEditorOverlay from "@/components/profile/ProfileEditorOverlay";
import CreateSurface from "@/components/app/CreateSurface";
import ProjectSurface from "@/components/app/ProjectSurface";
import RouteSkeleton from "@/components/app/RouteSkeleton";

const MESSAGE_CACHE_PREFIX = "nerdding.messages.v2.";
function repairMessageCache(){if(typeof window==="undefined")return;const remove:string[]=[];for(let i=0;i<window.localStorage.length;i++){const key=window.localStorage.key(i);if(!key?.startsWith(MESSAGE_CACHE_PREFIX))continue;try{const raw=window.localStorage.getItem(key);if(!raw)continue;const parsed=JSON.parse(raw);if(!Array.isArray(parsed))remove.push(key)}catch{remove.push(key)}}for(const key of remove)window.localStorage.removeItem(key)}
function AppSkeleton(){return <><style>{`.client-app-skeleton{min-height:100dvh;display:grid;grid-template-columns:244px minmax(0,1fr);background:#f8f6f2}.client-app-skeleton-sidebar{padding:24px 14px;border-right:1px solid #e4ded5;background:#fbfaf7}.client-app-skeleton-logo,.client-app-skeleton-nav,.client-app-skeleton-topbar,.client-app-skeleton-card{background:#e8e3dc;position:relative;overflow:hidden}.client-app-skeleton-logo{height:30px;width:125px;border-radius:8px;margin:3px 10px 28px}.client-app-skeleton-nav{height:40px;border-radius:10px;margin:7px 4px}.client-app-skeleton-topbar{height:66px;border-bottom:1px solid #e4ded5;background:#fbfaf7}.client-app-skeleton-content{width:min(1150px,calc(100% - 48px));margin:28px auto;display:grid;gap:14px}.client-app-skeleton-card{height:150px;border-radius:15px}.client-app-skeleton-card.large{height:250px}.client-app-skeleton-logo:after,.client-app-skeleton-nav:after,.client-app-skeleton-topbar:after,.client-app-skeleton-card:after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);animation:client-app-shimmer 1.15s infinite}@keyframes client-app-shimmer{to{transform:translateX(100%)}}@media(max-width:760px){.client-app-skeleton{display:block}.client-app-skeleton-sidebar{display:none}.client-app-skeleton-content{width:calc(100% - 20px);margin:18px auto}}`}</style><div className="client-app-skeleton" aria-hidden="true"><aside className="client-app-skeleton-sidebar"><div className="client-app-skeleton-logo"/>{Array.from({length:8},(_,i)=><div className="client-app-skeleton-nav" key={i}/>)}</aside><main><div className="client-app-skeleton-topbar"/><div className="client-app-skeleton-content"><div className="client-app-skeleton-card large"/><div className="client-app-skeleton-card"/><div className="client-app-skeleton-card"/></div></main></div></>}
export default function ClientAppGate(){const[ready,setReady]=useState(false);useEffect(()=>{repairMessageCache();setReady(true)},[]);if(!ready)return <AppSkeleton/>;return <><NerddingApp/><AgentRouteShield/><ReliableSocialEnhancer/><SocialProfileRedirector/><LiveNavCounts/><AgentVerificationGate2/><AgentVerificationRedirect/><AgentLoginLink/><AgentPendingNotice/><ProfileEditorOverlay/><CreateSurface/><ProjectSurface/><RouteSkeleton/></>}
