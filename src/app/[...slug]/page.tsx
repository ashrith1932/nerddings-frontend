import dynamic from "next/dynamic";

const NerddingApp = dynamic(
  () => import("@/components/layout/NerddingApp").then((module) => module.default),
  { ssr: false },
);

const ProfileRouteOnly = dynamic(
  () => import("@/components/app/ProfileRouteOnly").then((module) => module.default),
  { ssr: false },
);

export default function CatchAllPage({ params }: { params: { slug?: string[] } }) {
  const slug = params.slug ?? [];
  if (slug[0] === "profile" && slug[1]) {
    return <ProfileRouteOnly username={decodeURIComponent(slug[1])} />;
  }
  return <NerddingApp />;
}
