import { getAuthToken } from "@/lib/api";

export type RealtimeMessage = {
  type: string;
  clientMessageId?: string;
  message?: {
    id: string;
    conversationId: string;
    senderId: string;
    ciphertext?: string | null;
    iv?: string | null;
    senderKey?: string | null;
    recipientKey?: string | null;
    encryptionVersion: number;
    deliveredAt?: string | null;
    readAt?: string | null;
    createdAt: string;
  };
  messageId?: string;
  deliveredAt?: string;
  readAt?: string;
  userId?: string;
  online?: boolean;
  error?: string;
};

type Listener = (event: RealtimeMessage) => void;

type QueuedMessage = {
  clientMessageId: string;
  recipientId: string;
  ciphertext: string;
  iv: string;
  senderKey: string;
  recipientKey: string;
  encryptionVersion: number;
};

type QueuedControl =
  | { type: "message.delivered"; messageId: string }
  | { type: "message.read"; messageId: string }
  | { type: "conversation.read"; conversationId: string };

const listeners = new Set<Listener>();
const messageQueue: QueuedMessage[] = [];
const controlQueue: QueuedControl[] = [];

let socket: WebSocket | null = null;
let reconnectTimer: number | null = null;
let reconnectDelay = 1000;
let manuallyDisconnected = false;
let authenticated = false;

function emit(event: RealtimeMessage) {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (error) {
      console.error("[Realtime] listener error", error);
    }
  }
}

function getRealtimeUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return `${apiUrl.replace(/^http/, "ws")}/messages/ws`;
}

function isOpen() {
  return (
    socket !== null &&
    socket.readyState === WebSocket.OPEN &&
    authenticated
  );
}

function safeSend(payload: unknown) {
  if (!isOpen()) return false;

  try {
    socket!.send(JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

function flushQueues() {
  if (!isOpen()) return;

  while (messageQueue.length) {
    const payload = messageQueue[0];
    if (!safeSend({ type: "message.send", ...payload })) return;
    messageQueue.shift();
  }

  while (controlQueue.length) {
    const payload = controlQueue[0];
    if (!safeSend(payload)) return;
    controlQueue.shift();
  }
}

function scheduleReconnect() {
  if (
    manuallyDisconnected ||
    reconnectTimer !== null ||
    typeof window === "undefined"
  ) {
    return;
  }

  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connectRealtime();
  }, reconnectDelay);

  reconnectDelay = Math.min(reconnectDelay * 2, 10000);
}

export function connectRealtime() {
  if (typeof window === "undefined" || manuallyDisconnected) return;

  const token = getAuthToken();
  if (!token) return;

  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  authenticated = false;

  emit({ type: "connection.connecting" });

  try {
    socket = new WebSocket(getRealtimeUrl());
  } catch (error) {
    console.error("[Realtime] WebSocket creation failed", error);
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    reconnectDelay = 1000;

    socket?.send(
      JSON.stringify({
        type: "auth",
        token,
      }),
    );
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(String(event.data)) as RealtimeMessage;

      if (data.type === "auth.success") {
        authenticated = true;
        reconnectDelay = 1000;
      } else if (data.type === "auth.error") {
        authenticated = false;
      }

      emit(data);

      if (data.type === "auth.success") {
        flushQueues();
      }
    } catch (error) {
      console.error("[Realtime] Invalid WebSocket event", error);
    }
  };

  socket.onclose = () => {
    authenticated = false;
    socket = null;

    emit({ type: "connection.closed" });
    scheduleReconnect();
  };

  socket.onerror = (error) => {
    console.error("[Realtime] WebSocket error", error);
    socket?.close();
  };
}

export function disconnectRealtime() {
  manuallyDisconnected = true;
  authenticated = false;

  if (reconnectTimer !== null && typeof window !== "undefined") {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  socket?.close();
  socket = null;
}

export function subscribeRealtime(listener: Listener) {
  listeners.add(listener);
  connectRealtime();

  return () => {
    listeners.delete(listener);
  };
}

export function sendRealtimeMessage(payload: QueuedMessage) {
  if (safeSend({ type: "message.send", ...payload })) return;

  const duplicate = messageQueue.some(
    (item) => item.clientMessageId === payload.clientMessageId,
  );

  if (!duplicate) {
    messageQueue.push(payload);
  }

  connectRealtime();
}

function queueControl(payload: QueuedControl) {
  if (safeSend(payload)) return;

  const duplicate = controlQueue.some(
    (item) =>
      item.type === payload.type &&
      ("messageId" in item ? item.messageId : undefined) ===
        ("messageId" in payload ? payload.messageId : undefined) &&
      ("conversationId" in item ? item.conversationId : undefined) ===
        ("conversationId" in payload ? payload.conversationId : undefined),
  );

  if (!duplicate) controlQueue.push(payload);

  connectRealtime();
}

export function sendDelivered(messageId: string) {
  queueControl({ type: "message.delivered", messageId });
}

export function sendRead(messageId: string) {
  queueControl({ type: "message.read", messageId });
}

export function sendConversationRead(conversationId: string) {
  queueControl({ type: "conversation.read", conversationId });
}
