import { NerddingApp } from "@/components/layout/NerddingApp";
import SocialEnhancer from "@/components/social/SocialEnhancer";
import SocialProfileRedirector from "@/components/social/SocialProfileRedirector";
import LiveNavCounts from "@/components/social/LiveNavCounts";
import PageSkeleton from "@/components/ui/PageSkeleton";

export default function Page() {
  return <><NerddingApp /><SocialEnhancer /><SocialProfileRedirector /><LiveNavCounts /><PageSkeleton /></>;
}
