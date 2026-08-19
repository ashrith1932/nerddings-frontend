"use client";

import Sidebar from "@/components/shell/Sidebar";
import Topbar from "@/components/shell/Topbar";
import CreateMenu from "@/components/shell/CreateMenu";
import SiteFooter from "@/components/shared/SiteFooter";

export default function AppShell({ path, menuOpen, onToggleMenu, onCloseMenu, children }: { path: string; menuOpen: boolean; onToggleMenu: () => void; onCloseMenu: () => void; children?: React.ReactNode }) {
  return <>
    <Sidebar path={path} onCreate={onToggleMenu} />
    <Topbar path={path} onMenu={onToggleMenu} />
    <CreateMenu open={menuOpen} onClose={onCloseMenu} />
    <main className="app-main">
      <div className="page-content">{children}</div>
      <SiteFooter />
    </main>
  </>;
}
