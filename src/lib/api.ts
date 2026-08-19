import { apiFetch, uploadMedia } from "@/services/httpClient";

export { apiFetch, uploadMedia };

export function startOAuth(provider: "google" | "github") {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) throw new Error("API is not configured; set NEXT_PUBLIC_API_URL before using OAuth.");
  window.location.assign(`${base}/auth/oauth/${provider}`);
}

export type ApiFundraising = { id: string; agentId: string; startupName: string; stage: "Pre-seed" | "Seed" | "Series A" | "Series B"; industry: string; targetAmount: number; raisedAmount: number; currency: "INR" | "USD"; investorCount: number; progress: number };
export type AgentVerificationStatus = "pending_dns" | "pending_review" | "approved" | "rejected";
export type ApiUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  accountType: "user" | "agent";
  avatarUrl?: string | null;
  onboardingCompleted: boolean;
  agentVerificationStatus?: AgentVerificationStatus | null;
  agentVerificationId?: string | null;
};

export function getAuthToken(): string | null { return typeof window === "undefined" ? null : window.localStorage.getItem("nerdding.token"); }
export function saveAuthToken(token: string) { if (typeof window !== "undefined") window.localStorage.setItem("nerdding.token", token); }
export function saveAuthSession(session: { token: string; user: ApiUser }) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("nerdding.token", session.token);
  window.localStorage.setItem("nerdding.user", JSON.stringify(session.user));
}
export function clearAuthSession() { if (typeof window !== "undefined") { window.localStorage.removeItem("nerdding.token"); window.localStorage.removeItem("nerdding.user"); } }
export function getSavedUser(): ApiUser | null {
  if (typeof window === "undefined") return null;
  try { const raw = window.localStorage.getItem("nerdding.user"); return raw ? JSON.parse(raw) as ApiUser : null; } catch { return null; }
}

export async function fetchCurrentUser(): Promise<ApiUser> {
  const token = getAuthToken();
  if (!token) throw new Error("No Nerddings authentication token found.");
  const response = await apiFetch<{ data: ApiUser }>("/auth/me");
  if (!response?.data) throw new Error("The server did not return the authenticated user.");
  return response.data;
}

export async function refreshAuthUser(): Promise<ApiUser | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const user = await fetchCurrentUser();
    window.localStorage.setItem("nerdding.user", JSON.stringify(user));
    return user;
  } catch (error) {
    const status = error instanceof Error && "status" in error ? (error as Error & { status?: number }).status : undefined;
    if (status === 401 || status === 404) clearAuthSession();
    throw error;
  }
}
