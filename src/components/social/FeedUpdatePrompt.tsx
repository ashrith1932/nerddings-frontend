"use client";

import { useEffect, useState } from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function FeedUpdatePrompt(){
  const [count,setCount]=useState(0); const [loading,setLoading]=useState(false); const [since,setSince]=useState<string|null>(null);
  useEffect(()=>{let alive=true;const bootstrap=async()=>{try{const response=await apiFetch<any>("/social/feed?mode=for-you");const posts=response.data??[];if(alive&&posts[0]?.createdAt)setSince(posts[0].createdAt)}catch{}};void bootstrap();const poll=window.setInterval(async()=>{if(!alive)return;try{const query=since?`/social/feed/new-count?mode=for-you&since=${encodeURIComponent(since)}`:"/social/feed/new-count?mode=for-you";const response=await apiFetch<any>(query);if(alive)setCount(Math.max(0,Number(response.data?.count??0)))}catch{}},12000);return()=>{alive=false;window.clearInterval(poll)}},[since]);
  if(count<=0)return null;
  const refresh=()=>{setLoading(true);window.location.reload()};
  return <div className="nerdd-feed-update-prompt"><style>{`.nerdd-feed-update-prompt{position:fixed;top:82px;left:50%;transform:translateX(-50%);z-index:850;display:flex;align-items:center;gap:8px;background:#211d19;color:#fff;border-radius:999px;padding:9px 14px;box-shadow:0 12px 35px rgba(0,0,0,.2);font-size:10px;font-weight:800;cursor:pointer;border:1px solid rgba(255,255,255,.12)}.nerdd-feed-update-prompt:hover{transform:translateX(-50%) translateY(-1px);box-shadow:0 15px 40px rgba(0,0,0,.24)}.nerdd-feed-update-prompt span{opacity:.88}.nerdd-feed-update-prompt svg{flex:0 0 auto}@media(max-width:600px){.nerdd-feed-update-prompt{top:70px;font-size:9px;padding:8px 12px}}`}</style><button onClick={refresh} disabled={loading}>{loading?<Loader2 size={14} className="nerdd-spin"/>:<ArrowDown size={14}/>}<span>{loading?"Refreshing…":`New ${count} ${count===1?"post":"posts"}`}</span></button></div>;
}
