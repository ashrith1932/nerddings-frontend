import { apiFetch } from "@/services/api";

export async function getFollowing(userId: string) {
  const response = await apiFetch<{ data?: { active?: boolean } }>(`/users/${encodeURIComponent(userId)}/following`);
  return Boolean(response?.data?.active);
}

export async function toggleFollowing(userId: string) {
  const response = await apiFetch<{ data?: { active?: boolean } }>(`/users/${encodeURIComponent(userId)}/follow`, { method: "POST" });
  return Boolean(response?.data?.active);
}

export async function updateProfile(patch: Record<string, unknown>) {
  return apiFetch("/settings/profile", { method: "PATCH", body: JSON.stringify(patch) });
}
