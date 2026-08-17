"use client";
import { useEffect,useState } from "react";
import { ArrowLeft,X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import ProjectDetailSurface from "@/components/app/ProjectDetailSurface";

export default function NerddingProjectInteractionLayer(){
  const [slug,setSlug]=useState<string|null>(null);
  const [mobile,setMobile]=useState(false);
  useEffect(()=>{
    const media=window.matchMedia("(max-width:760px)");
    const resize=()=>setMobile(media.matches); resize(); media.addEventListener?.("change",resize);
    const openEvent=(event:Event)=>{const detail=(event as CustomEvent<{slug?:string}>).detail;if(detail?.slug)setSlug(detail.slug)};
    const assign=async()=>{
      if(window.location.pathname!=="/home"&&window.location.pathname!=="/")return;
      try{
        const response=await apiFetch<any>("/social/feed?mode=for-you");
        const posts=response.data??[];
        document.querySelectorAll<HTMLElement>(".home-post").forEach((post,index)=>{
          const project=posts[index]?.project;
          const button=post.querySelector<HTMLElement>(".home-project");
          if(button&&project?.slug)button.dataset.projectSlug=String(project.slug);
        });
      }catch{}
    };
    const click=(event:MouseEvent)=>{
      const target=event.target as HTMLElement|null;
      const project=target?.closest<HTMLElement>(".home-project");
      if(!project)return;
      const value=project.dataset.projectSlug;
      if(!value)return;
      event.preventDefault(); event.stopPropagation(); setSlug(value);
    };
    document.addEventListener("click",click,true);
    window.addEventListener("nerdding:project-open",openEvent as EventListener);
    window.addEventListener("popstate",assign);
    window.addEventListener("nerdding:feed-refresh",assign);
    const timer=window.setTimeout(assign,300);
    return()=>{document.removeEventListener("click",click,true);window.removeEventListener("nerdding:project-open",openEvent as EventListener);window.removeEventListener("popstate",assign);window.removeEventListener("nerdding:feed-refresh",assign);window.clearTimeout(timer);media.removeEventListener?.("change",resize)};
  },[]);
  if(!slug)return null;
  return <div className="nerdd-project-interaction"><style>{`.nerdd-project-interaction{position:fixed;inset:0;z-index:3050;background:rgba(25,20,16,.42);display:flex;justify-content:flex-end}.nerdd-project-panel{width:min(760px,94vw);height:100%;overflow:auto;background:#fffdf9;border-left:1px solid #ddd6cc;box-shadow:-25px 0 80px rgba(0,0,0,.22);position:relative}.nerdd-project-close{position:fixed;right:calc(min(94vw,760px) + 18px);top:18px;width:38px;height:38px;border:1px solid #ddd6cc;border-radius:50%;background:#fff;display:grid;place-items:center;z-index:10}.nerdd-project-back{display:none;width:100%;position:sticky;top:0;z-index:10;align-items:center;gap:7px;border:0;border-bottom:1px solid #e8e1d9;background:#fffdf9;padding:15px 18px;font-weight:800}@media(max-width:760px){.nerdd-project-panel{width:100%;border:0}.nerdd-project-close{display:none}.nerdd-project-back{display:flex!important}}`}</style><section className="nerdd-project-panel">{mobile&&<button className="nerdd-project-back" onClick={()=>setSlug(null)}><ArrowLeft size={16}/> Back</button>}<button className="nerdd-project-close" onClick={()=>setSlug(null)}><X size={18}/></button><ProjectDetailSurface slug={slug}/></section></div>;
}
