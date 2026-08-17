import { NerddingApp } from "@/components/layout/NerddingApp";
import SocialEnhancer from "@/components/social/SocialEnhancer";
import SocialProfileRedirector from "@/components/social/SocialProfileRedirector";
import LiveNavCounts from "@/components/social/LiveNavCounts";
import AgentVerificationGate2 from "@/components/agent/AgentVerificationGate2";
import AgentVerificationRedirect from "@/components/agent/AgentVerificationRedirect";

export default function CatchAllPage() {
  return <><NerddingApp /><SocialEnhancer /><SocialProfileRedirector /><LiveNavCounts /><AgentVerificationGate2 /><AgentVerificationRedirect /></>;
}
