"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, Check, ExternalLink, Github, Globe, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import "./social-experience.css";

export default function AgentExperience({slug}:{slug:string}){
 const [data,setData]=useState<any>(null);
 useEffect(()=>{apiFetch<any>(`/agents/${slug}`).then(r=>setData(r.data)).catch(()=>setData(null))},[slug]);
 if(!data)return <div className="page-view"><div className="skeleton profile-skeleton"/></div>;
 const a=data.agent;
 return <div className="page-view"><div className="profile-cover"><div className="cover-pattern"/></div><div className="profile-main"><Avatar user={{name:a.name,initials:a.name.slice(0,2),color:"#c85b2b",avatarUrl:a.logoUrl}} size="xl"/><div className="profile-info"><div className="profile-title"><div><h1>{a.name} {a.verified&&<Check size={17}/>}</h1><p>{a.type} · {a.domain??"Organization"}</p></div><div><button className="primary-btn">Follow</button></div></div><p className="bio">{a.description||"Official organization profile on Nerddings."}</p><div className="pills"><span><Users size={12}/> {data.followers} followers</span>{a.website&&<a href={a.website} target="_blank"><Globe size={12}/> Website</a>}</div></div></div><div className="profile-stats"><span><b>{data.projects?.length??0}</b> Projects</span><span><b>{data.posts??0}</b> Posts</span><span><b>{data.followers??0}</b> Followers</span></div><div className="project-grid">{(data.projects??[]).map((p:any)=><div className="project-tile" key={p.id}><div className="project-tile-top"><span>{p.stage}</span><ArrowUpRight size={15}/></div><h3>{p.name}</h3><p>{p.description}</p>{p.githubUrl&&<a className="github-label" href={p.githubUrl} target="_blank"><Github size={13}/> GitHub <ExternalLink size={11}/></a>}</div>)}</div></div>;
}
