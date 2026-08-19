"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import PostDetailSurface from "@/components/app/PostDetailSurface";

const css = `
.profile-post-detail-slot{width:100%;min-width:0}
.profile-inline-active-post{width:100%;min-width:0;max-height:min(70vh,760px);overflow:hidden;border:1px solid var(--line,#ddd6cc);border-radius:12px;background:var(--card,#fff);box-shadow:0 5px 18px rgba(31,27,24,.05);animation:profile-panel-in .3s ease-out}
.profile-inline-active-post .home-modal{width:100%;max-height:min(70vh,760px);background:var(--card,#fff);border:0;border-radius:0;box-shadow:none;overflow:hidden;display:flex;flex-direction:column}
.profile-inline-active-post .home-modal-head{height:60px;flex:0 0 60px;border-bottom:1px solid var(--line,#ddd6cc);display:flex;align-items:center;justify-content:space-between;padding:0 15px;background:var(--card,#fff);position:sticky;top:0;z-index:2}
.profile-inline-active-post .home-modal-head span{font-size:8px;letter-spacing:.14em;color:#978d84;font-weight:800;display:block}
.profile-inline-active-post .home-modal-head h2{font-size:17px;margin:3px 0 0;color:var(--ink,#201c19)}
.profile-inline-active-post .home-modal-head button{width:32px;height:32px;border:1px solid var(--line,#ddd6cc);background:none;color:#8e847a;border-radius:50%;display:grid;place-items:center;cursor:pointer}
.profile-inline-active-post .home-modal-scroll{max-height:calc(min(70vh,760px) - 60px);overflow-y:auto;overscroll-behavior:contain;padding:14px}
.profile-inline-active-post .nerdd-route-surface{position:relative!important;inset:auto!important;z-index:auto!important;width:100%!important;min-height:0!important;padding:0!important;overflow:visible!important;background:transparent!important}
.profile-inline-active-post .post-detail-view{max-width:none!important;padding:0!important}
.profile-inline-active-post .post-detail-view>.back-button{display:none!important}
.profile-inline-active-post .post-detail-card{border:1px solid var(--line,#ddd6cc);border-radius:10px;padding:12px;background:var(--card,#fff);box-shadow:none}
.profile-inline-active-post .post-detail-card-head{display:flex;align-items:center;gap:10px}
.profile-inline-active-post .post-detail-copy{font-size:13px;line-height:1.6;white-space:pre-wrap;margin:13px 0}
.profile-inline-active-post .post-detail-comments{margin-top:14px}
.profile-inline-active-post .post-detail-compose{margin-top:10px}
.profile-inline-active-post .post-detail-comments h2{font-size:14px;margin:4px 0 9px}
.profile-inline-active-post .threaded-comment-children{margin-left:16px;padding-left:12px}
.profile-inline-active-post .threaded-comment-row{padding:7px 0}
@keyframes profile-panel-in{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
@media(max-width:920px){.profile-inline-active-post{max-height:none}.profile-inline-active-post .home-modal{max-height:none}.profile-inline-active-post .home-modal-scroll{max-height:none}}
`;

export default function ProfilePostPopupLayer(){
  const [postId,setPostId]=useState<string|null>(null);
  const [path,setPath]=useState(() => typeof window === "undefined" ? "/" : window.location.pathname);
  const [target,setTarget]=useState<HTMLElement|null>(null);

  useEffect(()=>{
    const onPop=()=>setPath(window.location.pathname);
    window.addEventListener("popstate",onPop);
    return()=>window.removeEventListener("popstate",onPop);
  },[]);

  useEffect(()=>{
    if(!path.startsWith("/profile/")){
      setTarget(null);
      setPostId(null);
      return;
    }
    const findTarget=()=>setTarget(document.querySelector<HTMLElement>(".profile-post-detail-slot"));
    findTarget();
    const frame=window.requestAnimationFrame(findTarget);
    return()=>window.cancelAnimationFrame(frame);
  },[path]);

  useEffect(()=>{
    const onOpen=(event:Event)=>{
      if(!window.location.pathname.startsWith("/profile/"))return;
      const id=(event as CustomEvent<{postId?:string}>).detail?.postId;
      if(id)setPostId(String(id));
    };
    window.addEventListener("nerdding:open-profile-post",onOpen as EventListener);
    return()=>window.removeEventListener("nerdding:open-profile-post",onOpen as EventListener);
  },[]);

  if(!postId||!target)return null;
  const close=()=>setPostId(null);
  return createPortal(<><style>{css}</style><section className="home-active-post profile-inline-active-post" role="dialog" aria-label="Active post"><div className="home-modal"><header className="home-modal-head"><div><span>POST DETAIL</span><h2>Active post</h2></div><button onClick={close} aria-label="Close post"><X size={18}/></button></header><div className="home-modal-scroll"><PostDetailSurface postId={postId}/></div></div></section></>,target);
}
