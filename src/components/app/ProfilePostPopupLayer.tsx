"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { apiFetch } from "@/lib/api";
import PostDetailSurface from "@/components/app/PostDetailSurface";

const css = `
.profile-post-popup{position:fixed;inset:0;z-index:5000;background:rgba(25,20,16,.42);display:grid;place-items:center;padding:28px;overscroll-behavior:none}.profile-post-popup-panel{width:min(860px,calc(100vw - 56px));max-height:min(900px,calc(100dvh - 56px));background:#fffdf9;border:1px solid #ddd6cc;border-radius:18px;box-shadow:0 30px 100px rgba(0,0,0,.24);display:flex;flex-direction:column;overflow:hidden}.profile-post-popup-head{height:60px;flex:0 0 auto;border-bottom:1px solid #e8e1d9;display:flex;align-items:center;justify-content:space-between;padding:0 18px;background:#fffdf9}.profile-post-popup-head button{display:inline-flex;align-items:center;gap:7px;border:0;background:none;color:#766d65;font:inherit;font-size:12px;cursor:pointer;padding:7px 8px;border-radius:8px}.profile-post-popup-head button:hover{background:#f3eee7;color:#201c19}.profile-post-popup-close{width:38px;height:38px;border:1px solid #ddd6cc!important;border-radius:50%!important;display:grid!important;place-items:center!important;padding:0!important}.profile-post-popup-body{min-height:0;overflow:auto;background:#fffdf9}.profile-post-popup-body>.nerdd-route-surface{position:relative!important;inset:auto!important;z-index:auto!important;width:100%!important;min-height:0!important;height:auto!important;overflow:visible!important;background:transparent!important;padding:0 28px 32px!important}.profile-post-popup-body .post-detail-view{max-width:none!important}.profile-post-popup-body .post-detail-view>.back-button{display:none!important}.profile-post-popup-loading{min-height:420px;display:grid;place-items:center;color:#8e847c}.profile-post-popup-loading span{display:flex;align-items:center;gap:8px;font-size:12px}.profile-post-popup-body .post-detail-comments{margin-bottom:4px}.profile-post-popup-body .threaded-comment-children{margin-left:16px;padding-left:12px}.profile-post-popup-body .threaded-comment-row{padding:7px 0}
@media(max-width:760px){.profile-post-popup{padding:0;place-items:stretch}.profile-post-popup-panel{width:100%;height:100dvh;max-height:none;border:0;border-radius:0}.profile-post-popup-head{height:56px}.profile-post-popup-body>.nerdd-route-surface{padding:0 16px 24px!important}.profile-post-popup-close{width:34px;height:34px}.profile-post-popup-head button:first-child{font-size:11px}}
`;

export default function ProfilePostPopupLayer(){
  const [postId,setPostId]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  useEffect(()=>{
    const onClick=(event:MouseEvent)=>{
      const target=event.target as HTMLElement|null;
      const row=target?.closest<HTMLElement>(".profile-post-row");
      if(!row) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const rows=[...document.querySelectorAll<HTMLElement>(".profile-post-row")];
      const index=rows.indexOf(row);
      const username=window.location.pathname.split("/")[2] ?? "";
      if(index<0 || !username) return;
      setLoading(true);
      void apiFetch<any>(`/social/users/${encodeURIComponent(username)}/profile-live`).then(response=>{
        const post=response.data?.posts?.[index];
        if(post?.id) setPostId(String(post.id));
      }).finally(()=>setLoading(false));
    };
    document.addEventListener("click",onClick,true);
    return()=>document.removeEventListener("click",onClick,true);
  },[]);
  useEffect(()=>{
    const active=Boolean(postId||loading);
    if(!active) return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow=previous};
  },[postId,loading]);
  if(!postId&&!loading) return null;
  const close=()=>{setPostId(null);setLoading(false)};
  return createPortal(<><style>{css}</style><div className="profile-post-popup" role="dialog" aria-modal="true"><section className="profile-post-popup-panel"><header className="profile-post-popup-head"><button onClick={close}><ArrowLeft size={15}/> Back to profile</button><button className="profile-post-popup-close" onClick={close} aria-label="Close post"><X size={18}/></button></header><div className="profile-post-popup-body">{loading&&!postId?<div className="profile-post-popup-loading"><span><Loader2 size={16}/> Opening post…</span></div>:postId?<PostDetailSurface postId={postId}/>:null}</div></section></div></>,document.body);
}
