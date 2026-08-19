"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import PostDetailSurface from "@/components/app/PostDetailSurface";

const css = `
/* Profile rail mirrors the home live-grid geometry. */
.profile-content-grid{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(280px,350px)!important;align-items:start!important;gap:24px!important;width:100%!important;min-width:0!important}
.profile-section-content{width:100%!important;min-width:0!important}
.profile-right-rail{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:14px!important;align-self:start!important;width:100%!important;min-width:0!important}
.profile-right-rail>.profile-post-detail-slot{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;min-height:0!important;box-sizing:border-box!important}
.profile-right-rail>.profile-affiliations-rail{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}

/* The profile active post is an inline rail item, never a page-width/modal element. */
.profile-inline-active-post{position:static!important;inset:auto!important;grid-column:auto!important;grid-row:auto!important;display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;max-height:min(70vh,760px)!important;overflow:hidden!important;border:1px solid var(--line,#ddd6cc);border-radius:12px;background:var(--card,#fff);box-shadow:0 5px 18px rgba(31,27,24,.05);animation:profile-panel-in .3s ease-out}
.profile-inline-active-post .home-modal{position:static!important;inset:auto!important;width:100%!important;max-width:none!important;min-width:0!important;max-height:min(70vh,760px)!important;background:var(--card,#fff);border:0;border-radius:0;box-shadow:none;overflow:hidden;display:flex;flex-direction:column;box-sizing:border-box!important}
.profile-inline-active-post .home-modal-head{width:100%!important;box-sizing:border-box!important;height:60px;flex:0 0 60px;border-bottom:1px solid var(--line,#ddd6cc);display:flex;align-items:center;justify-content:space-between;padding:0 15px;background:var(--card,#fff);position:sticky;top:0;z-index:2}
.profile-inline-active-post .home-modal-head span{font-size:8px;letter-spacing:.14em;color:#978d84;font-weight:800;display:block}
.profile-inline-active-post .home-modal-head h2{font-size:17px;margin:3px 0 0;color:var(--ink,#201c19)}
.profile-inline-active-post .home-modal-head button{width:32px;height:32px;border:1px solid var(--line,#ddd6cc);background:none;color:#8e847a;border-radius:50%;display:grid;place-items:center;cursor:pointer}
.profile-inline-active-post .home-modal-scroll{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;max-height:calc(min(70vh,760px) - 60px);overflow-y:auto;overscroll-behavior:contain;padding:14px}
.profile-inline-active-post .post-detail-panel{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;max-height:none;background:transparent;border:0;border-radius:0;box-shadow:none;overflow:visible}
.profile-inline-active-post .post-detail-panel-header{width:100%!important;box-sizing:border-box!important;display:none!important}
.profile-inline-active-post .post-detail-panel-inner{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;padding:0!important;max-height:none!important;overflow:visible!important}
.profile-inline-active-post .post-detail-card{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;border:1px solid var(--line,#ddd6cc);border-radius:10px;padding:12px;background:var(--card,#fff);box-shadow:none}
.profile-inline-active-post .post-detail-card-head{display:flex;align-items:center;gap:10px;min-width:0}
.profile-inline-active-post .post-detail-card-head .post-detail-author-button{min-width:0;flex:1}
.profile-inline-active-post .post-detail-copy{font-size:13px;line-height:1.6;white-space:pre-wrap;margin:13px 0}
.profile-inline-active-post .post-detail-comments{margin-top:14px}
.profile-inline-active-post .post-detail-compose{margin-top:10px}
.profile-inline-active-post .post-detail-comments h2{font-size:14px;margin:4px 0 9px}
.profile-inline-active-post .threaded-comment-children{margin-left:16px;padding-left:12px}
.profile-inline-active-post .threaded-comment-row{padding:7px 0}

/* Profile build notes mirror the home .home-post structure. */
.profile-build-card.profile-post-row{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;background:var(--card,#fff);border:1px solid var(--line,#ddd6cc);border-radius:12px;padding:15px 16px 8px;margin-bottom:11px;transition:box-shadow .16s ease,border-color .16s ease;cursor:pointer;color:inherit}
.profile-build-card.profile-post-row:hover{border-color:#c6bdb3;box-shadow:0 8px 22px rgba(31,27,24,.06)}
.profile-build-card.profile-post-row .profile-build-head{display:flex!important;flex-direction:row!important;justify-content:space-between!important;align-items:center!important;width:100%!important;min-width:0!important;gap:10px}
.profile-build-card.profile-post-row .profile-build-author{display:flex!important;flex-direction:row!important;align-items:center!important;gap:9px!important;min-width:0!important;flex:1 1 auto!important}
.profile-build-card.profile-post-row .profile-build-author>div{display:flex!important;flex-direction:column!important;min-width:0!important;}
.profile-build-card.profile-post-row .profile-build-author strong{font-size:12px}
.profile-build-card.profile-post-row .profile-build-author small{font-size:10px;color:#938980;margin-top:2px}
.profile-build-card.profile-post-row .profile-build-head time{display:block!important;min-width:0!important;max-width:130px!important;flex:0 0 auto!important;font-size:10px;color:#938980;white-space:nowrap!important;text-align:right!important}
.profile-build-card.profile-post-row .profile-build-head time b{display:block!important;font:700 9px/1.25 'DM Mono',monospace!important;color:var(--muted)!important}
.profile-build-card.profile-post-row .profile-build-text{display:block!important;width:100%!important;font-size:14px;line-height:1.62;white-space:pre-wrap;margin:13px 0}
.profile-build-card.profile-post-row .profile-build-tags{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:6px!important;width:100%!important;margin-bottom:7px}
.profile-build-card.profile-post-row .profile-build-tags span{display:inline-flex!important;align-items:center;border:1px solid var(--line,#ddd6cc);background:#faf7f2;border-radius:9px;padding:7px 10px;font-size:10px;color:#6d645c}
.profile-build-card.profile-post-row .profile-build-link{display:block!important;width:100%!important;box-sizing:border-box!important;margin-top:7px;border:1px solid var(--line,#ddd6cc);background:#faf7f2;border-radius:9px;padding:10px;color:#6d645c;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-decoration:none}
.profile-build-card.profile-post-row .profile-build-actions{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:space-between!important;width:100%!important;box-sizing:border-box!important;border-top:1px solid #eee8e1;padding-top:6px;gap:8px;color:#7d736b;font-size:10px}
.profile-build-card.profile-post-row .profile-build-actions>span{display:flex!important;align-items:center!important;gap:5px!important;padding:6px 4px!important;white-space:nowrap!important;flex:0 0 auto!important}
.profile-build-card.profile-post-row .profile-build-spacer{display:block!important;flex:1 1 auto!important;margin-left:0!important}
.profile-build-card.profile-post-row .profile-tab-avatar{display:grid!important;place-items:center!important;width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;flex:0 0 40px!important;overflow:hidden!important;border-radius:50%!important;box-sizing:border-box!important}
.profile-build-card.profile-post-row .profile-tab-avatar img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;border-radius:50%!important}

@keyframes profile-panel-in{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
@media(max-width:920px){
  .profile-content-grid{grid-template-columns:minmax(0,1fr)!important;gap:16px!important}
  .profile-right-rail{width:100%!important}
  .profile-inline-active-post{max-height:none!important}
  .profile-inline-active-post .home-modal{max-height:none!important}
  .profile-inline-active-post .home-modal-scroll{max-height:none!important}
}
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
    const observer=new MutationObserver(findTarget);
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
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

  const close=()=>setPostId(null);
  return <><style>{css}</style>{postId&&target&&createPortal(<section className="home-active-post profile-inline-active-post" role="dialog" aria-label="Active post"><div className="home-modal"><header className="home-modal-head"><div><span>POST DETAIL</span><h2>Active post</h2></div><button onClick={close} aria-label="Close post"><X size={18}/></button></header><div className="home-modal-scroll"><PostDetailSurface postId={postId} isPanel={true}/></div></div></section>,target)}</>;
}
