import { NerddingApp } from "@/components/layout/NerddingApp";
import SocialEnhancer from "@/components/social/SocialEnhancer";
import SocialProfileRedirector from "@/components/social/SocialProfileRedirector";

export default function CatchAllPage() {
  return <><NerddingApp /><SocialEnhancer /><SocialProfileRedirector /></>;
}
