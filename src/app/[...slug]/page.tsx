import dynamic from "next/dynamic";

const NerddingApp = dynamic(
  () => import("@/components/layout/NerddingApp").then((module) => module.default),
  { ssr: false },
);

// All routes — including /profile/* and /project/* — go through the unified
// NerddingApp shell. This ensures the sidebar, topbar, and runtime are always
// present regardless of how the user arrives (direct URL or client navigation).
export default function CatchAllPage() {
  return <NerddingApp />;
}
