"use client";

import { useEffect, useState } from "react";
import MainContentLayoutFix from "@/components/shell/MainContentLayoutFix";
import AppShell from "@/components/shell/AppShell";
import AppRouter from "@/components/pages/AppRouter";
import AppRuntime from "@/components/runtime/AppRuntime";
import "@/components/app/nerdding-route-surfaces.css";

export function NerddingApp() {
  const [path, setPath] = useState(() => typeof window === "undefined" ? "/home" : window.location.pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onPopState = () => {
      setPath(window.location.pathname);
      setMenuOpen(false);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return <>
    <MainContentLayoutFix />
    <AppShell path={path} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((value) => !value)} onCloseMenu={() => setMenuOpen(false)}>
      <AppRouter path={path} />
    </AppShell>
    <AppRuntime path={path} />
  </>;
}

export default NerddingApp;
