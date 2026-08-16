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

let authenticated = false;

type QueuedMessage = {
  clientMessageId: string;
  recipientId: string;

  ciphertext: string;
  iv: string;

  senderKey: string;
  recipientKey: string;

  encryptionVersion: number;
};

type QueuedControl = {
  type:
    | "message.delivered"
    | "message.read"
    | "conversation.read";

  messageId?: string;
  conversationId?: string;
};

const messageQueue:
  QueuedMessage[] = [];

const controlQueue:
  QueuedControl[] = [];

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

function isOpen() {
  return (
    socket !== null &&
    socket.readyState ===
      WebSocket.OPEN &&
    authenticated
  );
}

function flushQueues() {
  if (!isOpen()) {
    return;
  }

  while (
    messageQueue.length > 0
  ) {
    const message =
      messageQueue[0];

    socket!.send(
      JSON.stringify({
        type:
          "message.send",
        ...message,
      }),
    );

    messageQueue.shift();
  }

  while (
    controlQueue.length > 0
  ) {
    const control =
      controlQueue[0];

    socket!.send(
      JSON.stringify(control),
    );

    controlQueue.shift();
  }
}

function scheduleReconnect() {
  if (
    manuallyDisconnected ||
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

  authenticated = false;

  emit({
    type:
      "connection.connecting",
  });

  socket =
    new WebSocket(
      getRealtimeUrl(),
    );

  socket.onopen = () => {
    reconnectDelay = 1000;

    /*
     * Authentication must happen before
     * any queued message is sent.
     */
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

      /*
       * Set this before emitting the event so
       * subscribers can immediately send
       * delivery/read acknowledgements.
       */
      if (
        data.type ===
        "auth.success"
      ) {
        authenticated = true;
        reconnectDelay = 1000;
      }

      if (
        data.type ===
        "auth.error"
      ) {
        authenticated = false;
      }

      emit(data);

      if (
        data.type ===
        "auth.success"
      ) {
        flushQueues();
      }
    } catch (error) {
      console.error(
        "[Realtime] Invalid event",
        error,
      );
    }
  };

  socket.onclose = () => {
    authenticated = false;
    socket = null;

    emit({
      type:
        "connection.closed",
    });

    scheduleReconnect();
  };

  socket.onerror = (
    error,
  ) => {
    console.error(
      "[Realtime] WebSocket error",
      error,
    );

    /*
     * onclose will perform the actual
     * reconnect.
     */
    socket?.close();
  };
}

export function disconnectRealtime() {
  manuallyDisconnected = true;
  authenticated = false;

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
   * Never send merely because the WebSocket
   * is OPEN. It must also have completed JWT
   * authentication.
   */
  if (isOpen()) {
    socket!.send(
      JSON.stringify({
        type:
          "message.send",
        ...payload,
      }),
    );

    return;
  }

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

function queueControl(
  payload: QueuedControl,
) {
  if (isOpen()) {
    socket!.send(
      JSON.stringify(payload),
    );

    return;
  }

  /*
   * Avoid duplicate delivery/read events.
   */
  const duplicate =
    controlQueue.some(
      (item) =>
        item.type ===
          payload.type &&
        item.messageId ===
          payload.messageId &&
        item.conversationId ===
          payload.conversationId,
    );

  if (!duplicate) {
    controlQueue.push(
      payload,
    );
  }

  connectRealtime();
}

export function sendDelivered(
  messageId: string,
) {
  queueControl({
    type:
      "message.delivered",
    messageId,
  });
}

export function sendRead(
  messageId: string,
) {
  queueControl({
    type:
      "message.read",
    messageId,
  });
}

export function sendConversationRead(
  conversationId: string,
) {
  queueControl({
    type:
      "conversation.read",
    conversationId,
  });
}