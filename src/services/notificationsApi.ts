import { apiFetch } from "@/services/api";

export async function getUnreadCount() {
  const response = await apiFetch<any>("/notifications");
  return Number(response?.unreadCount ?? response?.data?.unreadCount ?? 0);
}

export async function getNotifications() {
  const response = await apiFetch<any>("/notifications");
  return Array.isArray(response?.data) ? response.data : response?.data?.items ?? [];
}
