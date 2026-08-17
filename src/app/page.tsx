import { NerddingApp } from "@/components/layout/NerddingApp";
import SocialEnhancer from "@/components/social/SocialEnhancer";
import SocialProfileRedirector from "@/components/social/SocialProfileRedirector";
import LiveNavCounts from "@/components/social/LiveNavCounts";
import ProfileEditorOverlay from "@/components/profile/ProfileEditorOverlay";

export default function Page() {
  return <><NerddingApp /><SocialEnhancer /><SocialProfileRedirector /><LiveNavCounts /><ProfileEditorOverlay /></>;
}
