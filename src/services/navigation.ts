import { apiFetch } from "@/services/httpClient";

export async function getNavigationCounts() {
  const [notifications, messages] = await Promise.allSettled([
    apiFetch<any>("/notifications"),
    apiFetch<any>("/social/messages/unread-count"),
  ]);

  return {
    notifications: notifications.status === "fulfilled"
      ? Number(notifications.value?.unreadCount ?? notifications.value?.data?.unreadCount ?? 0)
      : 0,
    messages: messages.status === "fulfilled"
      ? Number(messages.value?.data?.unreadCount ?? 0) + Number(messages.value?.data?.pendingRequests ?? 0)
      : 0,
  };
}
