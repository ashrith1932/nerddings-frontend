const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export function startOAuth(provider: "google" | "github") {
  if (!apiBaseUrl) throw new Error("API is not configured; set NEXT_PUBLIC_API_URL before using OAuth.");
  window.location.assign(`${apiBaseUrl}/auth/oauth/${provider}`);
}

export type ApiFundraising = { id: string; agentId: string; startupName: string; stage: "Pre-seed" | "Seed" | "Series A" | "Series B"; industry: string; targetAmount: number; raisedAmount: number; currency: "INR" | "USD"; investorCount: number; progress: number };
export type AgentVerificationStatus = "pending_dns" | "pending_review" | "approved" | "rejected";
export type ApiUser = { id: string; name: string; username: string; email: string; accountType: "user" | "agent"; avatarUrl?: string | null; onboardingCompleted: boolean; agentVerificationStatus?: AgentVerificationStatus | null; agentVerificationId?: string | null };

export function getAuthToken(): string | null { return typeof window === "undefined" ? null : window.localStorage.getItem("nerdding.token"); }
export function saveAuthToken(token: string) { if (typeof window !== "undefined") window.localStorage.setItem("nerdding.token", token); }
export function saveAuthSession(session: { token: string; user: ApiUser }) { if (typeof window !== "undefined") { window.localStorage.setItem("nerdding.token", session.token); window.localStorage.setItem("nerdding.user", JSON.stringify(session.user)); } }
export function clearAuthSession() { if (typeof window !== "undefined") { window.localStorage.removeItem("nerdding.token"); window.localStorage.removeItem("nerdding.user"); } }
export function getSavedUser(): ApiUser | null { if (typeof window === "undefined") return null; try { const raw = window.localStorage.getItem("nerdding.user"); return raw ? JSON.parse(raw) as ApiUser : null; } catch { return null; } }

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

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!apiBaseUrl) throw new Error("API is not configured; set NEXT_PUBLIC_API_URL before using this action.");
  const token = getAuthToken();
  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) } });
  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try { const body = await response.json() as { error?: string }; if (body.error) message = body.error; } catch {}
    const error = new Error(message) as Error & { status?: number }; error.status = response.status; throw error;
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function uploadMedia(file: File) {
  if (!file.type.match(/^(image|video)\//)) throw new Error("Only images and videos can be uploaded.");
  if (file.size > 25 * 1024 * 1024) throw new Error("Images and videos must be under 25 MB.");
  const signed = await apiFetch<{ data: { signedUrl: string; path: string; contentType: string; publicUrl: string } }>("/uploads/signed-url", { method: "POST", body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }) });
  const uploaded = await fetch(signed.data.signedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!uploaded.ok) throw new Error("Media upload failed");
  return { path: signed.data.path, publicUrl: signed.data.publicUrl, mimeType: file.type };
}
