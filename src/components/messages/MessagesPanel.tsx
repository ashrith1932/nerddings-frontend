"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Loader2,
  MessageCircle,
  Search,
  Send,
  Wifi,
  WifiOff,
} from "lucide-react";

import {
  apiFetch,
  getAuthToken,
  getSavedUser,
} from "@/lib/api";
import {
  decryptMessage,
  encryptMessage,
} from "@/lib/messaging";
import {
  sendConversationRead,
  sendDelivered,
  sendRead,
  sendRealtimeMessage,
  subscribeRealtime,
  type RealtimeMessage,
} from "@/lib/realtime";
import {
  loadCachedMessages,
  saveCachedMessages,
} from "@/lib/message-cache";

type Participant = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  accountType: "user" | "agent";
  messagingPublicKey?: string | null;
  messagingKeyVersion?: number;
};

type ServerMessage = {
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

type Conversation = {
  id: string;
  participant: Participant | null;
  lastMessage: ServerMessage | null;
};

type MessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

type UiMessage = ServerMessage & {
  text: string;
  status: MessageStatus;
  optimistic?: boolean;
  clientMessageId?: string;
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function Avatar({
  participant,
  size = 44,
}: {
  participant: Participant | null;
  size?: number;
}) {
  const initial =
    participant?.name?.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        background: "#ece9e2",
        color: "#211f1c",
        fontWeight: 800,
        fontSize: Math.max(12, size * 0.36),
      }}
    >
      {participant?.avatarUrl ? (
        <img
          src={participant.avatarUrl}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        initial
      )}
    </div>
  );
}

function StatusIcon({
  status,
}: {
  status: MessageStatus;
}) {
  if (status === "sending") {
    return (
      <Loader2
        size={13}
        strokeWidth={2.4}
        className="message-spin"
        aria-label="Sending"
      />
    );
  }

  if (status === "failed") {
    return (
      <span
        title="Failed to send"
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          border: "1.5px solid currentColor",
          fontSize: 9,
          fontWeight: 900,
        }}
      >
        !
      </span>
    );
  }

  if (status === "delivered") {
    return (
      <CheckCheck
        size={15}
        strokeWidth={2.5}
        aria-label="Delivered"
      />
    );
  }

  if (status === "read") {
    return (
      <CheckCheck
        size={15}
        strokeWidth={2.8}
        aria-label="Read"
        style={{ color: "#18a8ff" }}
      />
    );
  }

  return (
    <Check
      size={15}
      strokeWidth={2.5}
      aria-label="Sent"
    />
  );
}

function ConversationSkeleton() {
  return (
    <div
      aria-label="Loading conversations"
      style={{ padding: "10px 0" }}
    >
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            padding: "15px 18px",
          }}
        >
          <div className="message-skeleton avatar-skeleton" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="message-skeleton"
              style={{
                width: index % 2 ? "48%" : "38%",
                height: 11,
                borderRadius: 8,
                marginBottom: 9,
              }}
            />
            <div
              className="message-skeleton"
              style={{
                width: index % 3 ? "78%" : "60%",
                height: 10,
                borderRadius: 8,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div
      aria-label="Loading messages"
      style={{
        width: "100%",
        maxWidth: 780,
        margin: "0 auto",
        padding: "30px 4px",
      }}
    >
      {Array.from({ length: 8 }).map((_, index) => {
        const own = index % 2 === 1;
        const width = [38, 58, 45, 68, 34, 53, 42, 61][index];

        return (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: own ? "flex-end" : "flex-start",
              marginBottom: 16,
            }}
          >
            <div
              className="message-skeleton"
              style={{
                width: `${width}%`,
                height: index % 3 === 0 ? 54 : 43,
                maxWidth: "75%",
                borderRadius: own
                  ? "18px 18px 5px 18px"
                  : "18px 18px 18px 5px",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function EmptyChat() {
  return (
    <div
      style={{
        margin: "auto",
        textAlign: "center",
        maxWidth: 340,
        padding: 28,
        color: "#8c8881",
      }}
    >
      <div
        style={{
          width: 58,
          height: 58,
          margin: "0 auto 14px",
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: "#f1eee8",
          color: "#5f5a53",
        }}
      >
        <MessageCircle size={27} strokeWidth={1.8} />
      </div>
      <div
        style={{
          color: "#211f1c",
          fontWeight: 800,
          fontSize: 17,
          marginBottom: 6,
        }}
      >
        No messages yet
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.55 }}>
        Start the conversation. Your first message will appear here instantly.
      </div>
    </div>
  );
}

function mergeMessages(
  serverMessages: UiMessage[],
  current: UiMessage[],
) {
  const result = new Map<string, UiMessage>();

  for (const message of serverMessages) {
    result.set(message.id, message);
  }

  for (const message of current) {
    if (!message.optimistic) {
      if (!result.has(message.id)) result.set(message.id, message);
      continue;
    }

    /*
     * Keep an optimistic message only if the server has not already
     * returned the same ciphertext. This prevents a GET racing with
     * message.sent from creating a duplicate bubble.
     */
    const alreadyPersisted =
      message.ciphertext &&
      [...result.values()].some(
        (item) =>
          item.senderId === message.senderId &&
          item.ciphertext === message.ciphertext,
      );

    if (!alreadyPersisted && !result.has(message.id)) {
      result.set(message.id, message);
    }
  }

  return [...result.values()].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime(),
  );
}

export default function MessagesPanel() {
  const currentUser = getSavedUser();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] =
    useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeConversationRef = useRef<string | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeConversationRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const activeConversation =
    conversations.find((item) => item.id === activeConversationId) ?? null;

  const filteredConversations = conversations.filter((conversation) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    const name = conversation.participant?.name?.toLowerCase() ?? "";
    const username =
      conversation.participant?.username?.toLowerCase() ?? "";

    return name.includes(query) || username.includes(query);
  });

  useEffect(() => {
    if (!activeConversationId) return;

    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [messages.length, activeConversationId]);

  /*
   * Initial conversation load.
   */
  useEffect(() => {
    if (!getAuthToken()) {
      setLoadingConversations(false);
      return;
    }

    let cancelled = false;

    async function loadConversations() {
      try {
        setLoadingConversations(true);

        const response = await apiFetch<{
          data: Conversation[];
        }>("/messages");

        if (cancelled) return;

        conversationsRef.current = response.data;
        setConversations(response.data);

        if (response.data.length > 0) {
          setActiveConversationId((current) => current ?? response.data[0].id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load conversations.",
          );
        }
      } finally {
        if (!cancelled) setLoadingConversations(false);
      }
    }

    void loadConversations();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * One permanent realtime subscription for this page.
   */
  useEffect(() => {
    const unsubscribe = subscribeRealtime(async (event: RealtimeMessage) => {
      if (event.type === "auth.success") {
        setRealtimeConnected(true);
        return;
      }

      if (
        event.type === "connection.closed" ||
        event.type === "auth.error"
      ) {
        setRealtimeConnected(false);
        return;
      }

      if (
        event.type === "message.sent" &&
        event.message &&
        event.clientMessageId
      ) {
        const serverMessage = event.message;
        const clientMessageId = event.clientMessageId;

        setMessages((current) => {
          const updated = current.map((message) =>
            message.clientMessageId === clientMessageId
              ? {
                  ...message,
                  ...serverMessage,
                  id: serverMessage.id,
                  status: (serverMessage.readAt
                    ? "read"
                    : serverMessage.deliveredAt
                      ? "delivered"
                      : "sent") as MessageStatus,
                  optimistic: false,
                  clientMessageId,
                }
              : message,
          );

          saveCachedMessages(serverMessage.conversationId, updated);
          return updated;
        });

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === serverMessage.conversationId
              ? { ...conversation, lastMessage: serverMessage }
              : conversation,
          ),
        );

        return;
      }

      if (event.type === "message.new" && event.message) {
        const incoming = event.message;
        const isActive =
          incoming.conversationId === activeConversationRef.current;

        /*
         * Delivery is acknowledged immediately after the event reaches
         * this browser. Decryption never blocks this acknowledgement.
         */
        sendDelivered(incoming.id);

        if (isActive) {
          const placeholder: UiMessage = {
            ...incoming,
            text: "Decrypting…",
            status: incoming.readAt ? "read" : "delivered",
          };

          setMessages((current) => {
            if (current.some((message) => message.id === incoming.id)) {
              return current;
            }

            const updated = [...current, placeholder].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
            );

            saveCachedMessages(incoming.conversationId, updated);
            return updated;
          });

          /*
           * The conversation is already open, so this message is read
           * immediately after it has been displayed.
           */
          sendRead(incoming.id);

          void decryptMessage(incoming).then((text) => {
            setMessages((current) =>
              current.map((message) =>
                message.id === incoming.id ? { ...message, text } : message,
              ),
            );
          });
        }

        /*
         * Move the conversation to the top and update its preview.
         */
        setConversations((current) => {
          const existing = current.find(
            (conversation) => conversation.id === incoming.conversationId,
          );

          if (!existing) return current;

          return [
            { ...existing, lastMessage: incoming },
            ...current.filter(
              (conversation) =>
                conversation.id !== incoming.conversationId,
            ),
          ];
        });

        return;
      }

      if (event.type === "message.delivered" && event.messageId) {
        setMessages((current) => {
          const updated = current.map((message): UiMessage => {
            if (message.id !== event.messageId) {
              return message;
            }

            const nextStatus: MessageStatus =
              message.status === "read"
                ? "read"
                : "delivered";

            return {
              ...message,
              status: nextStatus,
              deliveredAt:
                event.deliveredAt ??
                message.deliveredAt ??
                null,
            };
          });

          if (activeConversationRef.current) {
            saveCachedMessages(activeConversationRef.current, updated);
          }

          return updated;
        });

        return;
      }

      if (event.type === "message.read" && event.messageId) {
  setMessages((current): UiMessage[] => {
    const updated = current.map((message): UiMessage => {
      if (message.id !== event.messageId) {
        return message;
      }

      return {
        ...message,
        status: "read" as MessageStatus,
        readAt: event.readAt ?? message.readAt ?? null,
        deliveredAt:
          message.deliveredAt ??
          event.readAt ??
          null,
      };
    });

    if (activeConversationRef.current) {
      saveCachedMessages(
        activeConversationRef.current,
        updated,
      );
    }

    return updated;
  });

  return;
}

      if (event.type === "message.failed" && event.clientMessageId) {
        setMessages((current) =>
          current.map((message) =>
            message.clientMessageId === event.clientMessageId
              ? { ...message, status: "failed" }
              : message,
          ),
        );

        setError(event.error ?? "Message failed to send.");
      }
    });

    return unsubscribe;
  }, []);

  /*
   * Load a selected conversation.
   */
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function loadMessages() {
      const conversationId = activeConversationId;

      if (!conversationId) {
        return;
      }

      const cached = loadCachedMessages<UiMessage>(conversationId);

      if (cached.length) {
        setMessages(cached);
      } else {
        setMessages([]);
      }

      try {
        setLoadingMessages(cached.length === 0);

        const response = await apiFetch<{
          data: ServerMessage[];
        }>(`/messages/${conversationId}`);

        if (cancelled) return;

        const serverMessages: UiMessage[] = response.data.map((message) => ({
          ...message,
          text: "Decrypting…",
          status:
            message.senderId === currentUser?.id
              ? message.readAt
                ? "read"
                : message.deliveredAt
                  ? "delivered"
                  : "sent"
              : "delivered",
        }));

        setMessages((current) => {
          const merged = mergeMessages(serverMessages, current);
          saveCachedMessages(conversationId, merged);
          return merged;
        });

        /*
         * Background decryption. Bubbles are already rendered.
         */
        for (const message of response.data) {
          void decryptMessage(message).then((text) => {
            if (cancelled) return;

            setMessages((current) =>
              current.map((item) =>
                item.id === message.id ? { ...item, text } : item,
              ),
            );
          });
        }

        sendConversationRead(conversationId);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load messages.",
          );
        }
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    }

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [activeConversationId, currentUser?.id]);

  async function sendMessage() {
    const text = input.trim();

    if (!text || !activeConversation || !currentUser) return;

    const recipient = activeConversation.participant;

    if (!recipient?.id) {
      setError("Recipient not found.");
      return;
    }

    if (!recipient.messagingPublicKey) {
      setError("This user has not enabled encrypted messaging yet.");
      return;
    }

    const clientMessageId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    /*
     * CRITICAL:
     * Render the message BEFORE encryption/network work.
     * This is what removes the visible send lag.
     */
    const optimistic: UiMessage = {
      id: clientMessageId,
      clientMessageId,
      conversationId: activeConversation.id,
      senderId: currentUser.id,
      ciphertext: null,
      iv: null,
      senderKey: null,
      recipientKey: null,
      encryptionVersion: 1,
      deliveredAt: null,
      readAt: null,
      createdAt,
      text,
      status: "sending",
      optimistic: true,
    };

    setError(null);
    setInput("");

    setMessages((current) => {
      const updated = [...current, optimistic];
      saveCachedMessages(activeConversation.id, updated);
      return updated;
    });

    /*
     * Encryption happens after the bubble has appeared.
     */
    try {
      const encrypted = await encryptMessage(
        text,
        recipient.messagingPublicKey,
      );

      /*
       * Preserve the optimistic bubble while the WebSocket is
       * offline/connecting. realtime.ts queues the actual packet.
       */
      setMessages((current) => {
        const updated = current.map((message) =>
          message.clientMessageId === clientMessageId
            ? {
                ...message,
                ...encrypted,
              }
            : message,
        );

        saveCachedMessages(activeConversation.id, updated);
        return updated;
      });

      sendRealtimeMessage({
        clientMessageId,
        recipientId: recipient.id,
        ...encrypted,
      });
    } catch (err) {
      setMessages((current) =>
        current.map((message) =>
          message.clientMessageId === clientMessageId
            ? { ...message, status: "failed" }
            : message,
        ),
      );

      setError(
        err instanceof Error
          ? err.message
          : "Message could not be encrypted.",
      );
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  if (!currentUser) {
    return (
      <div
        style={{
          minHeight: 360,
          display: "grid",
          placeItems: "center",
          padding: 32,
          color: "#777",
        }}
      >
        Sign in to use messages.
      </div>
    );
  }

  return (
    <>
      <style>{`
        .messages-page {
          width: 100%;
          min-width: 0;
          height: calc(100dvh - 96px);
          min-height: 560px;
          padding: 22px;
          box-sizing: border-box;
        }

        .messages-shell {
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr);
          overflow: hidden;
          border: 1px solid #e6e1d8;
          border-radius: 22px;
          background: #fbfaf7;
          box-shadow: 0 16px 50px rgba(34, 29, 23, .07);
        }

        .messages-sidebar {
          min-width: 0;
          min-height: 0;
          overflow: hidden;
          border-right: 1px solid #e6e1d8;
          background: #f6f3ed;
          display: flex;
          flex-direction: column;
        }

        .messages-sidebar-top {
          padding: 20px 18px 14px;
          border-bottom: 1px solid #e6e1d8;
        }

        .messages-search {
          height: 42px;
          width: 100%;
          box-sizing: border-box;
          border: 0;
          outline: 0;
          border-radius: 12px;
          background: #ebe7df;
          padding: 0 12px 0 40px;
          color: #25221e;
          font-size: 14px;
        }

        .messages-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 8px;
        }

        .conversation-row {
          width: 100%;
          border: 0;
          border-radius: 14px;
          padding: 12px 10px;
          background: transparent;
          text-align: left;
          display: flex;
          gap: 11px;
          align-items: center;
          cursor: pointer;
          transition: background .15s ease, transform .15s ease;
        }

        .conversation-row:hover {
          background: #ebe7df;
        }

        .conversation-row.active {
          background: #e7e1d7;
        }

        .messages-chat {
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          background: #fffefa;
        }

        .chat-header {
          min-height: 72px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 20px;
          border-bottom: 1px solid #e8e2d8;
          background: rgba(255, 254, 250, .96);
        }

        .chat-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 22px clamp(14px, 3vw, 42px);
          background:
            radial-gradient(circle at 20% 10%, rgba(245,240,231,.55), transparent 30%),
            #fffefa;
        }

        .message-row {
          width: 100%;
          display: flex;
          margin-bottom: 7px;
        }

        .message-row.own {
          justify-content: flex-end;
        }

        .message-row.other {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: min(68%, 640px);
          min-width: 52px;
          padding: 9px 12px 7px;
          border-radius: 17px;
          box-sizing: border-box;
          box-shadow: 0 1px 1px rgba(20, 18, 15, .04);
        }

        .message-bubble.own {
          background: #171513;
          color: #fff;
          border-bottom-right-radius: 5px;
        }

        .message-bubble.other {
          background: #eeeae3;
          color: #24211e;
          border-bottom-left-radius: 5px;
        }

        .message-text {
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 14px;
          line-height: 1.42;
        }

        .message-meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          margin-top: 4px;
          font-size: 10px;
          opacity: .7;
          line-height: 14px;
        }

        .composer {
          flex-shrink: 0;
          padding: 12px 14px max(12px, env(safe-area-inset-bottom));
          border-top: 1px solid #e8e2d8;
          background: #fffefa;
        }

        .composer-inner {
          display: flex;
          gap: 8px;
          align-items: center;
          max-width: 980px;
          margin: 0 auto;
        }

        .composer-input {
          flex: 1;
          min-width: 0;
          height: 46px;
          border: 1px solid #ded8ce;
          outline: none;
          border-radius: 15px;
          background: #f5f2ec;
          padding: 0 15px;
          font-size: 14px;
          color: #211f1c;
        }

        .composer-input:focus {
          border-color: #aaa398;
          background: #fff;
        }

        .send-button {
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          border: 0;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #ef5b2a;
          color: #fff;
          cursor: pointer;
        }

        .send-button:disabled {
          background: #d8d3ca;
          cursor: default;
        }

        .message-skeleton {
          position: relative;
          overflow: hidden;
          background: #e7e3dc;
        }

        .message-skeleton::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.75),
            transparent
          );
          animation: messageShimmer 1.25s infinite;
        }

        .avatar-skeleton {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        @keyframes messageShimmer {
          100% { transform: translateX(100%); }
        }

        .message-spin {
          animation: messageSpin .9s linear infinite;
        }

        @keyframes messageSpin {
          to { transform: rotate(360deg); }
        }

        .mobile-back {
          display: none;
          width: 34px;
          height: 34px;
          border: 0;
          background: transparent;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #211f1c;
        }

        @media (max-width: 900px) {
          .messages-page {
            padding: 12px;
          }

          .messages-shell {
            grid-template-columns: 280px minmax(0, 1fr);
            border-radius: 16px;
          }

          .message-bubble {
            max-width: 78%;
          }
        }

        @media (max-width: 700px) {
          .messages-page {
            height: calc(100dvh - 58px);
            min-height: 0;
            padding: 0;
          }

          .messages-shell {
            position: relative;
            display: block;
            height: 100%;
            border: 0;
            border-radius: 0;
            box-shadow: none;
          }

          .messages-sidebar {
            width: 100%;
            height: 100%;
            border-right: 0;
          }

          .messages-chat {
            width: 100%;
            height: 100%;
            display: none;
          }

          .messages-shell.chat-open .messages-sidebar {
            display: none;
          }

          .messages-shell.chat-open .messages-chat {
            display: flex;
          }

          .mobile-back {
            display: flex;
          }

          .message-bubble {
            max-width: 84%;
          }

          .chat-header {
            min-height: 62px;
            padding: 0 12px;
          }

          .chat-scroll {
            padding: 16px 10px;
          }

          .composer {
            padding-left: 9px;
            padding-right: 9px;
          }
        }

        @media (max-width: 420px) {
          .message-bubble {
            max-width: 90%;
          }

          .messages-sidebar-top {
            padding: 14px 12px 10px;
          }
        }
      `}</style>

      <div className="messages-page">
        <div
          className={
            activeConversationId
              ? "messages-shell chat-open"
              : "messages-shell"
          }
        >
          <aside className="messages-sidebar">
            <div className="messages-sidebar-top">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 13,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 850,
                      letterSpacing: "-.04em",
                    }}
                  >
                    Messages
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginTop: 4,
                      fontSize: 11,
                      color: realtimeConnected ? "#14864c" : "#8d8982",
                    }}
                  >
                    {realtimeConnected ? (
                      <Wifi size={13} />
                    ) : (
                      <WifiOff size={13} />
                    )}
                    {realtimeConnected ? "Live" : "Connecting…"}
                  </div>
                </div>
              </div>

              <div style={{ position: "relative" }}>
                <Search
                  size={17}
                  style={{
                    position: "absolute",
                    left: 13,
                    top: 12,
                    color: "#858078",
                  }}
                />
                <input
                  className="messages-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search messages"
                  aria-label="Search messages"
                />
              </div>
            </div>

            <div className="messages-list">
              {loadingConversations ? (
                <ConversationSkeleton />
              ) : filteredConversations.length === 0 ? (
                <div
                  style={{
                    padding: "42px 24px",
                    textAlign: "center",
                    color: "#89847d",
                    fontSize: 13,
                    lineHeight: 1.55,
                  }}
                >
                  No conversations yet.
                  <br />
                  Send a request to start one.
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const selected =
                    conversation.id === activeConversationId;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      className={
                        selected
                          ? "conversation-row active"
                          : "conversation-row"
                      }
                      onClick={() =>
                        setActiveConversationId(conversation.id)
                      }
                    >
                      <Avatar participant={conversation.participant} />

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "#24211e",
                          }}
                        >
                          {conversation.participant?.name ?? "Unknown"}
                        </div>

                        <div
                          style={{
                            marginTop: 3,
                            fontSize: 12,
                            color: "#8a857d",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {conversation.lastMessage
                            ? "Encrypted message"
                            : `@${conversation.participant?.username ?? ""}`}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="messages-chat">
            {activeConversation ? (
              <>
                <header className="chat-header">
                  <button
                    className="mobile-back"
                    type="button"
                    aria-label="Back to conversations"
                    onClick={() => setActiveConversationId(null)}
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <Avatar
                    participant={activeConversation.participant}
                    size={42}
                  />

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 850,
                        fontSize: 15,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {activeConversation.participant?.name}
                    </div>
                    <div
                      style={{
                        color: "#8a857d",
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      @{activeConversation.participant?.username}
                    </div>
                  </div>

                  <div
                    style={{
                      marginLeft: "auto",
                      fontSize: 10,
                      color: realtimeConnected ? "#14864c" : "#8c8881",
                    }}
                  >
                    {realtimeConnected ? "LIVE" : "RECONNECTING"}
                  </div>
                </header>

                <div className="chat-scroll">
                  {loadingMessages && messages.length === 0 ? (
                    <ChatSkeleton />
                  ) : messages.length === 0 ? (
                    <EmptyChat />
                  ) : (
                    messages.map((message) => {
                      const own = message.senderId === currentUser.id;

                      return (
                        <div
                          key={message.id}
                          className={
                            own
                              ? "message-row own"
                              : "message-row other"
                          }
                        >
                          <div
                            className={
                              own
                                ? "message-bubble own"
                                : "message-bubble other"
                            }
                          >
                            <div className="message-text">
                              {message.text}
                            </div>

                            <div className="message-meta">
                              <span>
                                {formatTime(message.createdAt)}
                              </span>

                              {own && (
                                <StatusIcon status={message.status} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  <div ref={endRef} />
                </div>

                {error && (
                  <div
                    style={{
                      padding: "7px 16px",
                      color: "#c53b24",
                      background: "#fff3ef",
                      borderTop: "1px solid #f1d3cb",
                      fontSize: 12,
                    }}
                  >
                    {error}
                  </div>
                )}

                <form className="composer" onSubmit={handleSubmit}>
                  <div className="composer-inner">
                    <input
                      className="composer-input"
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Write an encrypted message…"
                      autoComplete="off"
                    />

                    <button
                      className="send-button"
                      type="submit"
                      disabled={!input.trim()}
                      aria-label="Send message"
                    >
                      <Send size={19} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "grid",
                  placeItems: "center",
                  color: "#8b867f",
                  textAlign: "center",
                  padding: 30,
                }}
              >
                <div>
                  <MessageCircle
                    size={44}
                    strokeWidth={1.5}
                    style={{ marginBottom: 10 }}
                  />
                  <div
                    style={{
                      color: "#292621",
                      fontWeight: 800,
                      fontSize: 16,
                    }}
                  >
                    Select a conversation
                  </div>
                  <div style={{ fontSize: 12, marginTop: 5 }}>
                    Your encrypted messages will appear here.
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}