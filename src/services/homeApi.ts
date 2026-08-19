import { apiFetch } from "@/services/api";

export async function getHomeProjectAssignments() {
  const response = await apiFetch<{ data?: any[] }>("/social/feed?mode=for-you");
  return Array.isArray(response?.data) ? response.data : [];
}
