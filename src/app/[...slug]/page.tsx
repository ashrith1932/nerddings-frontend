import { NerddingApp } from "@/components/layout/NerddingApp";
import SocialEnhancer from "@/components/social/SocialEnhancer";
import ReliableSocialEnhancer from "@/components/social/ReliableSocialEnhancer";
import SocialProfileRedirector from "@/components/social/SocialProfileRedirector";
import LiveNavCounts from "@/components/social/LiveNavCounts";
import AgentVerificationGate2 from "@/components/agent/AgentVerificationGate2";
import AgentVerificationRedirect from "@/components/agent/AgentVerificationRedirect";
import AgentLoginLink from "@/components/agent/AgentLoginLink";
import AgentPendingNotice from "@/components/agent/AgentPendingNotice";
import ProfileEditorOverlay from "@/components/profile/ProfileEditorOverlay";

export default function CatchAllPage() {
  return <><NerddingApp /><SocialEnhancer /><ReliableSocialEnhancer /><SocialProfileRedirector /><LiveNavCounts /><AgentVerificationGate2 /><AgentVerificationRedirect /><AgentLoginLink /><AgentPendingNotice /><ProfileEditorOverlay /></>;
}
