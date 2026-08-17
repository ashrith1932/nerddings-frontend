"use client";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { apiFetch, getSavedUser } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import "./social-experience.css";

export default function ComposeOnly(){
 const [text,setText]=useState(""); const [busy,setBusy]=useState(false);
 const publish=async()=>{if(!text.trim()||busy)return;setBusy(true);try{await apiFetch("/posts",{method:"POST",body:JSON.stringify({body:text.trim(),media:[]})});window.history.pushState({},"","/home");window.dispatchEvent(new PopStateEvent("popstate"));window.location.reload()}finally{setBusy(false)}};
 const u=getSavedUser();
 return <div className="overlay"><div className="composer"><header><button onClick={()=>{window.history.back()}}><ArrowLeft size={18}/></button><b>Create post</b><span/></header><div className="composer-user"><Avatar user={{name:u?.name??"Member",initials:(u?.name??"M").slice(0,2),color:"#c85b2b",avatarUrl:u?.avatarUrl??undefined}} size="sm"/><span>Posting to your network</span></div><textarea autoFocus value={text} onChange={e=>setText(e.target.value)} maxLength={5000} placeholder="What are you building, learning, or shipping?"/><footer><span>{text.length}/5000</span><button disabled={!text.trim()||busy} onClick={()=>void publish()}>{busy?"Publishing…":"Publish"}<ArrowUpRight size={15}/></button></footer></div></div>
}
