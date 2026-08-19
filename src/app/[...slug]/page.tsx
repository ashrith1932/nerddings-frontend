import dynamic from "next/dynamic";

const NerddingApp = dynamic(
  () => import("@/components/layout/NerddingApp").then((module) => module.default),
  { ssr: false },
);

export default function CatchAllPage() {
  return <NerddingApp />;
}
