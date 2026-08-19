import { getUnreadCount as getNotificationUnreadCount } from "@/services/notificationsApi";
import { getUnreadCount as getMessageUnreadCount } from "@/services/messagesApi";

export async function getNavigationCounts() {
  const [notifications, messages] = await Promise.allSettled([
    getNotificationUnreadCount(),
    getMessageUnreadCount(),
  ]);
  return {
    notifications: notifications.status === "fulfilled" ? notifications.value : 0,
    messages: messages.status === "fulfilled" ? messages.value.unreadCount + messages.value.pendingRequests : 0,
  };
}
