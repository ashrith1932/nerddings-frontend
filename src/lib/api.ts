const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export type ApiFundraising = {
  id: string;
  agentId: string;
  startupName: string;
  stage: "Pre-seed" | "Seed" | "Series A" | "Series B";
  industry: string;
  targetAmount: number;
  raisedAmount: number;
  currency: "INR" | "USD";
  investorCount: number;
  progress: number;
};

export type ApiUser = { id: string; name: string; username: string; email: string; accountType: "user" | "agent"; avatarUrl?: string | null };

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("nerdding.token");
}

export function saveAuthSession(session: { token: string; user: ApiUser }) {
  window.localStorage.setItem("nerdding.token", session.token);
  window.localStorage.setItem("nerdding.user", JSON.stringify(session.user));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("nerdding.token");
  window.localStorage.removeItem("nerdding.user");
}

export function getSavedUser(): ApiUser | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(window.localStorage.getItem("nerdding.user") ?? "null") as ApiUser | null; } catch { return null; }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!apiBaseUrl) throw new Error("API is not configured; set NEXT_PUBLIC_API_URL before using this action.");
  const token = getAuthToken();
  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) } });
  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try { const body = await response.json() as { error?: string }; if (body.error) message = body.error; } catch { /* use status */ }
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function uploadMedia(file: File) {
  const signed = await apiFetch<{ data: { signedUrl: string; path: string; contentType: string; publicUrl: string } }>("/uploads/signed-url", { method: "POST", body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }) });
  const uploaded = await fetch(signed.data.signedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!uploaded.ok) throw new Error("Media upload failed");
  return { path: signed.data.path, publicUrl: signed.data.publicUrl, mimeType: file.type };
}
