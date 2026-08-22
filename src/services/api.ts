const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

function resolveApiBaseUrl() {
  if (!configuredApiUrl) return null;

  const normalized = configuredApiUrl.replace(/\/+$/, "");
  try {
    const url = new URL(normalized);
    const pathname = url.pathname.replace(/\/+$/, "");

    // Frontend service methods use API-relative paths such as /social/feed.
    // Accept both the documented https://host/api/v1 form and a bare backend
    // origin so a small deployment/environment mismatch does not break every
    // request in the application.
    if (!pathname || pathname === "") {
      url.pathname = "/api/v1";
    } else if (pathname === "/api") {
      url.pathname = "/api/v1";
    } else if (pathname.endsWith("/api/v1")) {
      url.pathname = pathname;
    } else {
      url.pathname = `${pathname}/api/v1`;
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    // Keep the original validation/error behaviour for malformed values.
    return normalized;
  }
}

const apiBaseUrl = resolveApiBaseUrl();

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
  const requestPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${apiBaseUrl}${requestPath}`, { ...init, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) } });
  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const body = await response.json() as { error?: string; message?: string };
        if (body.error || body.message) message = body.error || body.message || message;
      } else {
        const text = await response.text();
        if (text.trim()) message = `${message}: ${text.slice(0, 180)}`;
      }
    } catch {}
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
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
