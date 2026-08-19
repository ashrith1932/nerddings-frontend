export type AgentVerificationStatus = "pending_dns" | "pending_review" | "approved" | "rejected";

export type User = {
  id: string;
  name: string;
  username: string;
  email?: string;
  accountType: "user" | "agent";
  avatarUrl?: string | null;
  onboardingCompleted?: boolean;
  bio?: string | null;
  location?: string | null;
  agentVerificationStatus?: AgentVerificationStatus | null;
  agentVerificationId?: string | null;
};
