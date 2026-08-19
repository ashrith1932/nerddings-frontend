import { apiFetch } from "@/services/api";

export async function getUnreadCount() {
  const response = await apiFetch<{ data?: { unreadCount?: number; pendingRequests?: number } }>("/social/messages/unread-count");
  return { unreadCount: Number(response?.data?.unreadCount ?? 0), pendingRequests: Number(response?.data?.pendingRequests ?? 0) };
}
