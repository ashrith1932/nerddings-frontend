"use client";

import { useEffect, useState } from "react";

export default function AgentLoginLink() {
  const [show, setShow] = useState(false);
  useEffect(() => { const sync = () => setShow(window.location.pathname === "/login"); sync(); window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync); }, []);
  if (!show) return null;
  return <button onClick={() => { window.history.pushState({}, "", "/agent/login"); window.dispatchEvent(new PopStateEvent("popstate")); }} style={{ position: "fixed", right: 24, bottom: 24, zIndex: 9999, border: "1px solid #d8d0c7", background: "#fffdf9", color: "#191612", borderRadius: 999, padding: "10px 14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 30px rgba(25,22,18,.1)" }}>Organization / Agent access →</button>;
}
