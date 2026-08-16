import { getAuthToken } from "@/lib/api";

export type RealtimeMessage = {
  type:
    | "auth.success"
    | "auth.error"
    | "connection.connecting"
    | "connection.open"
    | "connection.closed"
    | "message.sent"
    | "message.new"
    | "message.delivered"
    | "message.read"
    | "message.failed"
    | "error"
    | "pong"
    | string;
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
  deliveredAt?: string | null;
  readAt?: string | null;
  userId?: string;
  error?: string;
  replay?: boolean;
};

export type OutgoingRealtimeMessage = {
  clientMessageId: string;
  recipientId: string;
  ciphertext: string;
  iv: string;
  senderKey: string;
  recipientKey: string;
  encryptionVersion: number;
};

type ControlMessage =
  | {
      type: "message.delivered";
      messageId: string;
      clientMessageId?: string;
    }
  | {
      type: "message.read";
      messageId: string;
      clientMessageId?: string;
    }
  | { type: "conversation.read"; conversationId: string };

type Listener = (event: RealtimeMessage) => void;

const listeners = new Set<Listener>();
const messageQueue: OutgoingRealtimeMessage[] = [];
const controlQueue: ControlMessage[] = [];

let socket: WebSocket | null = null;
let reconnectTimer: number | null = null;
let heartbeatTimer: number | null = null;
let reconnectDelay = 1000;
let authenticated = false;
let explicitlyDisconnected = false;

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

function ready() {
  return (
    socket !== null &&
    socket.readyState === WebSocket.OPEN &&
    authenticated
  );
}

function rawSend(payload: unknown) {
  if (!ready()) {
    return false;
  }

  try {
    socket!.send(JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error("[Realtime] send failed", error);
    return false;
  }
}

function stopHeartbeat() {
  if (heartbeatTimer !== null && typeof window !== "undefined") {
    window.clearInterval(heartbeatTimer);
  }

  heartbeatTimer = null;
}

function startHeartbeat() {
  stopHeartbeat();

  if (typeof window === "undefined") {
    return;
  }

  heartbeatTimer = window.setInterval(() => {
    if (ready()) {
      try {
        socket!.send(JSON.stringify({ type: "ping" }));
      } catch {
        socket?.close();
      }
    }
  }, 20000);
}

function flushQueues() {
  if (!ready()) {
    return;
  }

  while (messageQueue.length > 0) {
    const payload = messageQueue[0];

    if (!rawSend({ type: "message.send", ...payload })) {
      return;
    }

    messageQueue.shift();
  }

  while (controlQueue.length > 0) {
    const payload = controlQueue[0];

    if (!rawSend(payload)) {
      return;
    }

    controlQueue.shift();
  }
}

function scheduleReconnect() {
  if (
    explicitlyDisconnected ||
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
  if (typeof window === "undefined") {
    return;
  }

  explicitlyDisconnected = false;

  const token = getAuthToken();

  if (!token) {
    return;
  }

  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  authenticated = false;
  stopHeartbeat();

  emit({ type: "connection.connecting" });

  let url: string;

  try {
    url = getRealtimeUrl();
  } catch (error) {
    emit({
      type: "auth.error",
      error:
        error instanceof Error
          ? error.message
          : "Realtime URL is unavailable.",
    });
    scheduleReconnect();
    return;
  }

  try {
    socket = new WebSocket(url);
  } catch (error) {
    console.error("[Realtime] WebSocket creation failed", error);
    scheduleReconnect();
    return;
  }

  const currentSocket = socket;

  currentSocket.onopen = () => {
    if (socket !== currentSocket) {
      currentSocket.close();
      return;
    }

    reconnectDelay = 1000;
    emit({ type: "connection.open" });

    try {
      currentSocket.send(
        JSON.stringify({
          type: "auth",
          token,
        }),
      );
    } catch {
      currentSocket.close();
    }
  };

  currentSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(String(event.data)) as RealtimeMessage;

      if (data.type === "auth.success") {
        authenticated = true;
        reconnectDelay = 1000;
        startHeartbeat();
      }

      if (data.type === "auth.error") {
        authenticated = false;
        stopHeartbeat();
      }

      emit(data);

      if (data.type === "auth.success") {
        flushQueues();
      }
    } catch (error) {
      console.error("[Realtime] invalid WebSocket event", error);
    }
  };

  currentSocket.onclose = () => {
    if (socket !== currentSocket) {
      return;
    }

    authenticated = false;
    stopHeartbeat();
    socket = null;

    emit({ type: "connection.closed" });
    scheduleReconnect();
  };

  currentSocket.onerror = (error) => {
    console.error("[Realtime] WebSocket error", error);
    currentSocket.close();
  };
}

export function disconnectRealtime() {
  explicitlyDisconnected = true;
  authenticated = false;
  stopHeartbeat();

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

export function sendRealtimeMessage(payload: OutgoingRealtimeMessage) {
  if (rawSend({ type: "message.send", ...payload })) {
    return;
  }

  if (
    !messageQueue.some(
      (item) => item.clientMessageId === payload.clientMessageId,
    )
  ) {
    messageQueue.push(payload);
  }

  connectRealtime();
}

function queueControl(payload: ControlMessage) {
  if (rawSend(payload)) {
    return;
  }

  const duplicate = controlQueue.some((item) => {
    if (item.type !== payload.type) {
      return false;
    }

    if (
      "messageId" in item &&
      "messageId" in payload
    ) {
      return item.messageId === payload.messageId;
    }

    if (
      "conversationId" in item &&
      "conversationId" in payload
    ) {
      return item.conversationId === payload.conversationId;
    }

    return false;
  });

  if (!duplicate) {
    controlQueue.push(payload);
  }

  connectRealtime();
}

export function sendDelivered(
  messageId: string,
  clientMessageId?: string,
) {
  queueControl({
    type: "message.delivered",
    messageId,
    ...(clientMessageId
      ? { clientMessageId }
      : {}),
  });
}

export function sendRead(
  messageId: string,
  clientMessageId?: string,
) {
  queueControl({
    type: "message.read",
    messageId,
    ...(clientMessageId
      ? { clientMessageId }
      : {}),
  });
}

export function sendConversationRead(conversationId: string) {
  queueControl({
    type: "conversation.read",
    conversationId,
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("online", connectRealtime);

  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      connectRealtime();
    }
  });
}
