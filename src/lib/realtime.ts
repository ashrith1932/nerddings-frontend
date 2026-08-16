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
    createdAt: string;
  };
  userId?: string;
  online?: boolean;
  error?: string;
};

type Listener = (
  event: RealtimeMessage,
) => void;

const listeners = new Set<Listener>();

let socket: WebSocket | null = null;
let reconnectTimer: number | null =
  null;

let reconnectDelay = 1000;

function getRealtimeUrl() {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured.",
    );
  }

  const url =
    apiUrl.replace(/^http/, "ws");

  return `${url}/messages/ws`;
}

function emit(event: RealtimeMessage) {
  for (const listener of listeners) {
    listener(event);
  }
}

function scheduleReconnect() {
  if (reconnectTimer !== null) {
    return;
  }

  reconnectTimer =
    window.setTimeout(() => {
      reconnectTimer = null;
      connectRealtime();
    }, reconnectDelay);

  reconnectDelay = Math.min(
    reconnectDelay * 2,
    10000,
  );
}

export function connectRealtime() {
  if (typeof window === "undefined") {
    return;
  }

  const token = getAuthToken();

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

  socket = new WebSocket(
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

  socket.onmessage = (event) => {
    try {
      const data =
        JSON.parse(
          event.data,
        ) as RealtimeMessage;

      emit(data);
    } catch {
      console.error(
        "Invalid realtime event",
      );
    }
  };

  socket.onclose = () => {
    socket = null;
    scheduleReconnect();
  };

  socket.onerror = () => {
    socket?.close();
  };
}

export function disconnectRealtime() {
  if (reconnectTimer !== null) {
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
    listeners.delete(listener);
  };
}

export function sendRealtimeMessage(
  payload: {
    clientMessageId: string;
    recipientId: string;
    ciphertext: string;
    iv: string;
    senderKey: string;
    recipientKey: string;
    encryptionVersion: number;
  },
) {
  if (
    !socket ||
    socket.readyState !== WebSocket.OPEN
  ) {
    connectRealtime();

    throw new Error(
      "Realtime connection is not ready.",
    );
  }

  socket.send(
    JSON.stringify({
      type: "message.send",
      ...payload,
    }),
  );
}