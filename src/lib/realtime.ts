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

type Listener = (
  event: RealtimeMessage,
) => void;

const listeners =
  new Set<Listener>();

let socket:
  WebSocket | null = null;

let reconnectTimer:
  number | null = null;

let reconnectDelay = 1000;

let manuallyDisconnected = false;

type QueuedMessage = {
  clientMessageId: string;
  recipientId: string;

  ciphertext: string;
  iv: string;

  senderKey: string;
  recipientKey: string;

  encryptionVersion: number;
};

const messageQueue:
  QueuedMessage[] = [];

function getRealtimeUrl() {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured.",
    );
  }

  const url =
    apiUrl.replace(
      /^http/,
      "ws",
    );

  return `${url}/messages/ws`;
}

function emit(
  event: RealtimeMessage,
) {
  for (
    const listener of listeners
  ) {
    try {
      listener(event);
    } catch (error) {
      console.error(
        "[Realtime] listener error",
        error,
      );
    }
  }
}

function flushQueue() {
  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    return;
  }

  while (
    messageQueue.length > 0
  ) {
    const message =
      messageQueue.shift();

    if (!message) {
      break;
    }

    socket.send(
      JSON.stringify({
        type:
          "message.send",

        ...message,
      }),
    );
  }
}

function scheduleReconnect() {
  if (
    manuallyDisconnected
  ) {
    return;
  }

  if (
    reconnectTimer !== null
  ) {
    return;
  }

  reconnectTimer =
    window.setTimeout(
      () => {
        reconnectTimer = null;

        connectRealtime();
      },
      reconnectDelay,
    );

  reconnectDelay =
    Math.min(
      reconnectDelay * 2,
      10000,
    );
}

export function connectRealtime() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  manuallyDisconnected = false;

  const token =
    getAuthToken();

  if (!token) {
    return;
  }

  if (
    socket &&
    (
      socket.readyState ===
        WebSocket.OPEN ||
      socket.readyState ===
        WebSocket.CONNECTING
    )
  ) {
    return;
  }

  socket =
    new WebSocket(
      getRealtimeUrl(),
    );

  socket.onopen = () => {
    reconnectDelay = 1000;

    socket?.send(
      JSON.stringify({
        type: "auth",
        token,
      }),
    );
  };

  socket.onmessage = (
    event,
  ) => {
    try {
      const data =
        JSON.parse(
          event.data,
        ) as RealtimeMessage;

      emit(data);

      /*
       * Server authenticated us.
       */
      if (
        data.type ===
        "auth.success"
      ) {
        flushQueue();
      }
    } catch {
      console.error(
        "[Realtime] Invalid event",
      );
    }
  };

  socket.onclose = () => {
    socket = null;

    scheduleReconnect();
  };

  socket.onerror = (
    error,
  ) => {
    console.error(
      "[Realtime] WebSocket error",
      error,
    );

    socket?.close();
  };
}

export function disconnectRealtime() {
  manuallyDisconnected = true;

  if (
    reconnectTimer !== null
  ) {
    window.clearTimeout(
      reconnectTimer,
    );

    reconnectTimer = null;
  }

  socket?.close();

  socket = null;
}

export function subscribeRealtime(
  listener: Listener,
) {
  listeners.add(listener);

  connectRealtime();

  return () => {
    listeners.delete(
      listener,
    );
  };
}

export function sendRealtimeMessage(
  payload: QueuedMessage,
) {
  /*
   * If connected, send immediately.
   */
  if (
    socket &&
    socket.readyState ===
      WebSocket.OPEN
  ) {
    socket.send(
      JSON.stringify({
        type:
          "message.send",

        ...payload,
      }),
    );

    return;
  }

  /*
   * Otherwise queue it.
   *
   * This is important when the
   * connection is reconnecting.
   */
  const alreadyQueued =
    messageQueue.some(
      (item) =>
        item.clientMessageId ===
        payload.clientMessageId,
    );

  if (
    !alreadyQueued
  ) {
    messageQueue.push(
      payload,
    );
  }

  connectRealtime();
}

export function sendDelivered(
  messageId: string,
) {
  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    return;
  }

  socket.send(
    JSON.stringify({
      type:
        "message.delivered",

      messageId,
    }),
  );
}

export function sendRead(
  messageId: string,
) {
  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    return;
  }

  socket.send(
    JSON.stringify({
      type:
        "message.read",

      messageId,
    }),
  );
}

export function sendConversationRead(
  conversationId: string,
) {
  if (
    !socket ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    return;
  }

  socket.send(
    JSON.stringify({
      type:
        "conversation.read",

      conversationId,
    }),
  );
}