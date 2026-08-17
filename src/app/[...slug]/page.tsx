import { NerddingApp } from "@/components/layout/NerddingApp";
import SocialEnhancer from "@/components/social/SocialEnhancer";
import SocialProfileRedirector from "@/components/social/SocialProfileRedirector";
import LiveNavCounts from "@/components/social/LiveNavCounts";
import PageSkeleton from "@/components/ui/PageSkeleton";
import RouteTransitionSkeleton from "@/components/ui/RouteTransitionSkeleton";

export default function CatchAllPage() {
  return <><NerddingApp /><SocialEnhancer /><SocialProfileRedirector /><LiveNavCounts /><PageSkeleton /><RouteTransitionSkeleton /></>;
}
