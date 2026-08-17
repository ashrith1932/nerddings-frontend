"use client";
import { useEffect } from "react";

function enhance(root: ParentNode){
  const nodes=root.querySelectorAll<HTMLElement>(".home-post-copy,.home-active-text,.live-search-item small");
  nodes.forEach(node=>{
    if(node.dataset.hashtagEnhanced==="1")return;
    const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
    const textNodes:Text[]=[];let current:Node|null;while((current=walker.nextNode())){if(current.parentElement?.closest("a,button"))continue;if(/(^|\s)#([\p{L}\p{N}_]{1,64})\b/u.test(current.textContent??""))textNodes.push(current as Text)}
    for(const textNode of textNodes){
      const text=textNode.textContent??"";const fragment=document.createDocumentFragment();let last=0;const regex=/(^|\s)#([\p{L}\p{N}_]{1,64})\b/gu;let match:RegExpExecArray|null;
      while((match=regex.exec(text))){const start=match.index+(match[1]?.length??0);fragment.append(document.createTextNode(text.slice(last,start)));const tag=match[2].toLowerCase();const link=document.createElement("a");link.href=`/search?q=%23${encodeURIComponent(tag)}`;link.textContent=`#${match[2]}`;link.className="nerdding-hashtag-link";link.addEventListener("click",event=>{event.preventDefault();window.history.pushState({},"",`/search?q=%23${encodeURIComponent(tag)}`);window.dispatchEvent(new PopStateEvent("popstate"));});fragment.append(link);last=regex.lastIndex;}
      fragment.append(document.createTextNode(text.slice(last)));textNode.parentNode?.replaceChild(fragment,textNode);
    }
    node.dataset.hashtagEnhanced="1";
  });
}

export default function HashtagEnhancer(){
  useEffect(()=>{enhance(document);const observer=new MutationObserver(()=>enhance(document));observer.observe(document.body,{subtree:true,childList:true});return()=>observer.disconnect()},[]);
  return <style>{`.nerdding-hashtag-link{color:var(--accent,#d35d34);font-weight:700;text-decoration:none}.nerdding-hashtag-link:hover{text-decoration:underline}`}</style>;
}
