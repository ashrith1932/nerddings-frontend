"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { apiFetch } from "@/lib/api";
import PostDetailSurface from "@/components/app/PostDetailSurface";

const css = `
.active-post-side-layer{position:fixed;inset:0;z-index:5000;background:rgba(25,20,16,.42);display:flex;align-items:stretch;justify-content:flex-end;overscroll-behavior:none}.active-post-side-panel{width:min(560px,42vw);min-width:430px;height:100%;background:#fffdf9;border-left:1px solid #ddd6cc;box-shadow:-25px 0 80px rgba(0,0,0,.22);display:flex;flex-direction:column;overflow:hidden}.active-post-side-head{height:66px;flex:0 0 auto;border-bottom:1px solid #e8e1d9;display:flex;align-items:center;justify-content:space-between;padding:0 18px;background:#fffdf9}.active-post-side-head button{display:inline-flex;align-items:center;gap:7px;border:0;background:none;color:#766d65;font:inherit;font-size:12px;cursor:pointer;padding:7px 8px;border-radius:8px}.active-post-side-head button:hover{background:#f3eee7;color:#201c19}.active-post-side-close{width:38px;height:38px;border:1px solid #ddd6cc!important;border-radius:50%!important;display:grid!important;place-items:center!important;padding:0!important}.active-post-side-body{min-height:0;overflow:auto;background:#fffdf9}.active-post-side-body>.nerdd-route-surface{position:relative!important;inset:auto!important;z-index:auto!important;width:100%!important;min-height:100%!important;height:auto!important;overflow:visible!important;background:transparent!important;padding:0 18px 32px!important}.active-post-side-body .post-detail-view{max-width:none!important}.active-post-side-body .post-detail-view>.back-button{display:none!important}.active-post-side-loading{min-height:420px;display:grid;place-items:center;color:#8e847c}.active-post-side-loading span{display:flex;align-items:center;gap:8px;font-size:12px}.active-post-side-body .post-detail-comments{margin-bottom:4px}.active-post-side-body .threaded-comment-children{margin-left:16px;padding-left:12px}.active-post-side-body .threaded-comment-row{padding:7px 0}
@media(max-width:760px){.active-post-side-layer{background:rgba(25,20,16,.32);align-items:flex-end}.active-post-side-panel{width:100%;min-width:0;height:min(88dvh,820px);border:1px solid #ddd6cc;border-bottom:0;border-radius:20px 20px 0 0}.active-post-side-head{height:58px}.active-post-side-body>.nerdd-route-surface{padding:0 14px 24px!important}.active-post-side-close{width:34px;height:34px}.active-post-side-head button:first-child{font-size:11px}}
`;

export default function ProfilePostPopupLayer(){
  const [postId,setPostId]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    const open=(id:string)=>{if(!id)return;setLoading(true);setPostId(id);setLoading(false)};
    const onOpen=(event:Event)=>{const id=(event as CustomEvent<{postId?:string}>).detail?.postId;if(id)open(String(id))};
    const onClick=(event:MouseEvent)=>{
      const target=event.target as HTMLElement|null;
      if(!target||target.closest(".active-post-side-layer"))return;
      const profileRow=target.closest<HTMLElement>(".profile-post-row");
      const homePost=target.closest<HTMLElement>(".home-post");
      if(!profileRow&&!homePost)return;
      if(target.closest("button,a,input,textarea,video,.home-author,.home-project,.home-link")&&!target.closest(".nerdd-quote"))return;
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      setLoading(true);
      if(profileRow){
        const rows=[...document.querySelectorAll<HTMLElement>(".profile-post-row")];
        const index=rows.indexOf(profileRow);const username=window.location.pathname.split("/")[2]??"";
        if(index<0||!username){setLoading(false);return}
        void apiFetch<any>(`/social/users/${encodeURIComponent(username)}/profile-live`).then(r=>{const post=r.data?.posts?.[index];if(post?.id)setPostId(String(post.id))}).finally(()=>setLoading(false));
        return;
      }
      const mode=document.querySelector(".home-live-tabs button.active")?.textContent?.toLowerCase().includes("network")?"network":"for-you";
      const cards=[...document.querySelectorAll<HTMLElement>(".home-post")];const index=homePost?cards.indexOf(homePost):-1;
      if(index<0){setLoading(false);return}
      const quote=Boolean(target.closest(".nerdd-quote"));
      void apiFetch<any>(`/social/feed?mode=${mode}`).then(r=>{const post=r.data?.[index];const id=quote?(post?.quotePost?.id??post?.quotePostId):post?.id;if(id)setPostId(String(id))}).finally(()=>setLoading(false));
    };
    document.addEventListener("click",onClick,true);window.addEventListener("nerdding:open-post",onOpen as EventListener);
    return()=>{document.removeEventListener("click",onClick,true);window.removeEventListener("nerdding:open-post",onOpen as EventListener)};
  },[]);

  useEffect(()=>{const active=Boolean(postId||loading);if(!active)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=previous}},[postId,loading]);
  if(!postId&&!loading)return null;
  const close=()=>{setPostId(null);setLoading(false)};
  return createPortal(<><style>{css}</style><div className="active-post-side-layer" role="dialog" aria-modal="true" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><section className="active-post-side-panel" onMouseDown={e=>e.stopPropagation()}><header className="active-post-side-head"><button onClick={close}><ArrowLeft size={15}/> Back to feed</button><button className="active-post-side-close" onClick={close} aria-label="Close post"><X size={18}/></button></header><div className="active-post-side-body">{loading&&!postId?<div className="active-post-side-loading"><span><Loader2 size={16}/> Opening post…</span></div>:postId?<PostDetailSurface postId={postId}/>:null}</div></section></div></>,document.body);
}
