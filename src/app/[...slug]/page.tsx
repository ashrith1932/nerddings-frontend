import { NerddingApp } from "@/components/layout/NerddingApp";
import SocialEnhancer from "@/components/social/SocialEnhancer";
import SocialProfileRedirector from "@/components/social/SocialProfileRedirector";
import LiveNavCounts from "@/components/social/LiveNavCounts";
import AgentVerificationGate from "@/components/agent/AgentVerificationGate";
import AgentVerificationRedirect from "@/components/agent/AgentVerificationRedirect";

export default function CatchAllPage() {
  return <><NerddingApp /><SocialEnhancer /><SocialProfileRedirector /><LiveNavCounts /><AgentVerificationGate /><AgentVerificationRedirect /></>;
}
