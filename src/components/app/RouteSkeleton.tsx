"use client";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import "./nerdding-enhancements.css";
export default function RouteSkeleton(){const[show,setShow]=useState(true);useEffect(()=>{let timer=window.setTimeout(()=>setShow(false),220);const onPop=()=>{setShow(true);window.clearTimeout(timer);timer=window.setTimeout(()=>setShow(false),220)};window.addEventListener("popstate",onPop);return()=>{window.clearTimeout(timer);window.removeEventListener("popstate",onPop)}},[]);if(!show)return null;return createPortal(<div className="nerdd-route-skeleton" aria-hidden="true"><aside><div className="nerdd-shim logo"/>{Array.from({length:8},(_,i)=><div className="nerdd-shim nav" key={i}/>)}</aside><main><div className="nerdd-shim top"/><div className="page"><div className="nerdd-shim title"/><div className="nerdd-shim hero"/><div className="nerdd-shim row"/><div className="nerdd-shim row"/></div></main></div>,document.body)}
