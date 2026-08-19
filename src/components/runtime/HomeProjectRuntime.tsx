"use client";
import { useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function NerddingProjectInteractionLayer(){
  useEffect(()=>{
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
      event.preventDefault(); event.stopPropagation();
      window.history.pushState({},"",`/project/${encodeURIComponent(value)}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    };
    document.addEventListener("click",click,true);
    window.addEventListener("popstate",assign);
    window.addEventListener("nerdding:feed-refresh",assign);
    const timer=window.setTimeout(assign,300);
    return()=>{document.removeEventListener("click",click,true);window.removeEventListener("popstate",assign);window.removeEventListener("nerdding:feed-refresh",assign);window.clearTimeout(timer)};
  },[]);
  return null;
}
