"use client";
import { useEffect } from "react";

function enhance(root: ParentNode){
  const nodes=root.querySelectorAll<HTMLElement>(".home-post-copy,.home-active-text,.live-search-item small,.home-modal-text,.notif-card-text");
  nodes.forEach(node=>{
    if(node.dataset.hashtagEnhanced==="1")return;
    const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
    const textNodes:Text[]=[];let current:Node|null;
    while((current=walker.nextNode())){
      if(current.parentElement?.closest("a,button"))continue;
      if(/(^|\s)(#[\p{L}\p{N}_]{1,64}|@[a-zA-Z0-9_]+)\b/u.test(current.textContent??"")) {
        textNodes.push(current as Text);
      }
    }
    for(const textNode of textNodes){
      const text=textNode.textContent??"";
      const fragment=document.createDocumentFragment();
      let last=0;
      const regex=/(^|\s)(#[\p{L}\p{N}_]{1,64}|@[a-zA-Z0-9_]+)\b/gu;
      let match:RegExpExecArray|null;
      while((match=regex.exec(text))){
        const start=match.index+(match[1]?.length??0);
        fragment.append(document.createTextNode(text.slice(last,start)));
        const token = match[2];
        if (token.startsWith('@')) {
          const username = token.slice(1);
          const btn = document.createElement("button");
          btn.style.cssText = "border:0;background:none;padding:0;color:#d35d34;font-weight:700;cursor:pointer;font-size:inherit";
          btn.textContent = token;
          btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.history.pushState({}, '', `/profile/${encodeURIComponent(username)}`);
            window.dispatchEvent(new PopStateEvent('popstate'));
          };
          fragment.append(btn);
        } else {
          const tag = token.slice(1).toLowerCase();
          const link = document.createElement("a");
          link.href = `/search?q=%23${encodeURIComponent(tag)}`;
          link.textContent = token;
          link.className = "nerdding-hashtag-link";
          link.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            window.history.pushState({}, "", `/search?q=%23${encodeURIComponent(tag)}`);
            window.dispatchEvent(new PopStateEvent("popstate"));
          });
          fragment.append(link);
        }
        last=regex.lastIndex;
      }
      fragment.append(document.createTextNode(text.slice(last)));
      textNode.parentNode?.replaceChild(fragment,textNode);
    }
    node.dataset.hashtagEnhanced="1";
  });
}

export default function HashtagEnhancer(){
  useEffect(()=>{enhance(document);const observer=new MutationObserver(()=>enhance(document));observer.observe(document.body,{subtree:true,childList:true});return()=>observer.disconnect()},[]);
  return <><style>{`.nerdding-hashtag-link{color:var(--accent,#d35d34);font-weight:700;text-decoration:none}.nerdding-hashtag-link:hover{text-decoration:underline}`}</style></>;
}
