"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Check,
  CheckCheck,
  Loader2,
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
  sendRealtimeMessage,
  sendDelivered,
  sendRead,
  sendConversationRead,
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

type Conversation = {
  id: string;
  participant: Participant | null;
  lastMessage: {
    id: string;
    senderId: string;
    ciphertext?: string | null;
    iv?: string | null;
    senderKey?: string | null;
    recipientKey?: string | null;
    encryptionVersion: number;
    deliveredAt?: string | null;
    readAt?: string | null;
    createdAt: string;
  } | null;
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

type MessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

type UiMessage =
  | ServerMessage & {
      text: string;
      status: MessageStatus;
      optimistic?: boolean;
      clientMessageId?: string;
    };

function formatTime(
  value: string,
) {
  try {
    return new Date(
      value,
    ).toLocaleTimeString(
      [],
      {
        hour: "numeric",
        minute: "2-digit",
      },
    );
  } catch {
    return "";
  }
}


function SkeletonRow() {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: "14px 18px",
      }}
    >
      <div
        className="message-skeleton"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="message-skeleton"
          style={{
            width: "42%",
            height: 12,
            borderRadius: 6,
            marginBottom: 9,
          }}
        />
        <div
          className="message-skeleton"
          style={{
            width: "78%",
            height: 10,
            borderRadius: 5,
          }}
        />
      </div>
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 620,
        margin: "auto",
        padding: "24px 8px",
      }}
    >
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          style={{
            display: "flex",
            justifyContent:
              item % 2 === 0 ? "flex-start" : "flex-end",
            marginBottom: 18,
          }}
        >
          <div
            className="message-skeleton"
            style={{
              width:
                item % 3 === 0
                  ? "48%"
                  : item % 3 === 1
                    ? "62%"
                    : "38%",
              height: 46,
              borderRadius:
                item % 2 === 0
                  ? "18px 18px 18px 4px"
                  : "18px 18px 4px 18px",
            }}
          />
        </div>
      ))}
    </div>
  );
}

function MessageStatus({
  status,
}: {
  status: MessageStatus;
}) {
  if (status === "sending") {
    return (
      <Loader2
        size={12}
        className="animate-spin"
        aria-label="Sending"
      />
    );
  }

  if (status === "failed") {
    return (
      <span
        style={{
          color: "#ef4444",
          fontWeight: 700,
        }}
      >
        !
      </span>
    );
  }

  if (status === "delivered") {
    return (
      <CheckCheck
        size={14}
        strokeWidth={2.4}
      />
    );
  }

  if (status === "read") {
    return (
      <CheckCheck
        size={14}
        strokeWidth={3}
      />
    );
  }

  return (
    <Check
      size={14}
      strokeWidth={2.4}
    />
  );
}

export default function MessagesPanel() {
  const currentUser =
    getSavedUser();

  const [
    conversations,
    setConversations,
  ] = useState<
    Conversation[]
  >([]);

  const [
    activeConversationId,
    setActiveConversationId,
  ] = useState<
    string | null
  >(null);

  const [
    messages,
    setMessages,
  ] = useState<
    UiMessage[]
  >([]);

  const [
    input,
    setInput,
  ] = useState("");

  const [
    loadingConversations,
    setLoadingConversations,
  ] = useState(true);

  const [
    loadingMessages,
    setLoadingMessages,
  ] = useState(false);

  const [
    realtimeConnected,
    setRealtimeConnected,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const activeConversationRef =
    useRef<string | null>(null);

  const conversationsRef =
    useRef<Conversation[]>([]);

  const pendingMessagesRef =
    useRef(
      new Map<string, UiMessage>(),
    );

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  useEffect(() => {
    activeConversationRef.current =
      activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    conversationsRef.current =
      conversations;
  }, [conversations]);

  const activeConversation =
    useMemo(
      () =>
        conversations.find(
          (conversation) =>
            conversation.id ===
            activeConversationId,
        ) ?? null,
      [
        conversations,
        activeConversationId,
      ],
    );

  useEffect(() => {
    if (!activeConversationId) {
      return;
    }

    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [
    activeConversationId,
    messages.length,
  ]);

  /*
   * ------------------------------------------------
   * Load conversations
   * ------------------------------------------------
   */
  useEffect(() => {
    if (!getAuthToken()) {
      setLoadingConversations(
        false,
      );

      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoadingConversations(
          true,
        );

        const response =
          await apiFetch<{
            data: Conversation[];
          }>(
            "/messages",
          );

        if (!cancelled) {
          conversationsRef.current =
            response.data;

          setConversations(
            response.data,
          );

          if (
            response.data.length >
              0 &&
            !activeConversationId
          ) {
            setActiveConversationId(
              response.data[0]
                .id,
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load conversations.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingConversations(
            false,
          );
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * ------------------------------------------------
   * Realtime connection
   * ------------------------------------------------
   */
  useEffect(() => {
    const unsubscribe =
      subscribeRealtime(
        async (event: RealtimeMessage) => {
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
            const serverMessage =
              event.message;

            pendingMessagesRef.current.delete(
              event.clientMessageId,
            );

            setMessages((current) => {
              const updated =
                current.map(
                  (message) =>
                    message.clientMessageId ===
                    event.clientMessageId
                      ? ({
                          ...message,
                          ...serverMessage,
                          status: (
                            serverMessage.readAt
                              ? "read"
                              : serverMessage.deliveredAt
                                ? "delivered"
                                : "sent"
                          ) as MessageStatus,
                          optimistic: false,
                        } as UiMessage)
                      : message,
                );

              saveCachedMessages(
                serverMessage.conversationId,
                updated,
              );

              return updated;
            });

            setConversations((current) =>
              current.map(
                (conversation) =>
                  conversation.id ===
                  serverMessage.conversationId
                    ? {
                        ...conversation,
                        lastMessage:
                          serverMessage,
                      }
                    : conversation,
              ),
            );

            return;
          }

          if (
            event.type === "message.new" &&
            event.message
          ) {
            const incoming =
              event.message;

            const isActive =
              incoming.conversationId ===
              activeConversationRef.current;

            /*
             * IMPORTANT:
             * Insert the incoming message into React
             * BEFORE decrypting it. RSA/AES WebCrypto
             * is asynchronous, so the UI should not wait
             * for decryption before showing the bubble.
             */
            const newMessage: UiMessage =
              {
                ...incoming,
                text:
                  "Decrypting...",
                status:
                  incoming.readAt
                    ? "read"
                    : "delivered",
              };

            /*
             * Delivery means the recipient's browser
             * received the realtime event. Do this
             * immediately.
             */
            sendDelivered(
              incoming.id,
            );

            if (isActive) {
              setMessages((current) => {
                if (
                  current.some(
                    (message) =>
                      message.id ===
                      incoming.id,
                  )
                ) {
                  return current;
                }

                const updated = [
                  ...current,
                  newMessage,
                ];

                saveCachedMessages(
                  incoming.conversationId,
                  updated,
                );

                return updated;
              });

              /*
               * The chat is already open, so mark
               * the message as read immediately.
               */
              sendRead(
                incoming.id,
              );
            }

            /*
             * Decrypt AFTER the bubble has been rendered.
             */
            void decryptMessage(
              incoming,
            )
              .then((text) => {
                setMessages((current) =>
                  current.map(
                    (message) =>
                      message.id ===
                      incoming.id
                        ? {
                            ...message,
                            text,
                          }
                        : message,
                  ),
                );
              })
              .catch(() => {
                setMessages((current) =>
                  current.map(
                    (message) =>
                      message.id ===
                      incoming.id
                        ? {
                            ...message,
                            text:
                              "Unable to decrypt this message on this device",
                          }
                        : message,
                  ),
                );
              });

            /*
             * Move the conversation to the top and
             * update its preview.
             */
            setConversations((current) => {
              const existing =
                current.find(
                  (conversation) =>
                    conversation.id ===
                    incoming.conversationId,
                );

              if (!existing) {
                return current;
              }

              return [
                {
                  ...existing,
                  lastMessage:
                    incoming,
                },
                ...current.filter(
                  (conversation) =>
                    conversation.id !==
                    incoming.conversationId,
                ),
              ];
            });

            if (
              !conversationsRef.current.some(
                (conversation) =>
                  conversation.id ===
                  incoming.conversationId,
              )
            ) {
              try {
                const response =
                  await apiFetch<{
                    data: Conversation[];
                  }>("/messages");

                conversationsRef.current =
                  response.data;

                setConversations(
                  response.data,
                );
              } catch {
                // The realtime message itself was received.
              }
            }

            return;
          }

          if (
            event.type ===
              "message.delivered" &&
            event.messageId
          ) {
            setMessages((current) => {
              const updated =
                current.map(
                  (message) =>
                    message.id ===
                    event.messageId
                      ? {
                          ...message,
                          status: (
                            message.status ===
                            "read"
                              ? "read"
                              : "delivered"
                          ) as MessageStatus,
                          deliveredAt:
                            event.deliveredAt ??
                            message.deliveredAt ??
                            null,
                        }
                      : message,
                );

              if (
                activeConversationRef.current
              ) {
                saveCachedMessages(
                  activeConversationRef.current,
                  updated,
                );
              }

              return updated;
            });

            return;
          }

          if (
            event.type ===
              "message.read" &&
            event.messageId
          ) {
            setMessages((current) => {
              const updated =
                current.map(
                  (message) =>
                    message.id ===
                    event.messageId
                      ? {
                          ...message,
                          status: "read" as MessageStatus,
                          readAt:
                            event.readAt ??
                            message.readAt ??
                            null,
                        }
                      : message,
                );

              if (
                activeConversationRef.current
              ) {
                saveCachedMessages(
                  activeConversationRef.current,
                  updated,
                );
              }

              return updated;
            });

            return;
          }

          if (
            event.type ===
            "message.failed"
          ) {
            setMessages((current) =>
              current.map(
                (message) =>
                  message.clientMessageId ===
                  event.clientMessageId
                    ? {
                        ...message,
                        status: "failed",
                      }
                    : message,
              ),
            );

            pendingMessagesRef.current.delete(
              event.clientMessageId ?? "",
            );

            return;
          }
        },
      );

    return unsubscribe;
  }, []);
  /*
   * ------------------------------------------------
   * Load active conversation
   *
   * CACHE FIRST
   * NETWORK SECOND
   * ------------------------------------------------
   */
  useEffect(() => {
    const conversationId =
      activeConversationId;

    if (!conversationId) {
      setMessages([]);

      return;
    }

    let cancelled = false;

    async function loadMessages() {
      /*
       * First show cached messages.
       */
      const cached =
        loadCachedMessages<UiMessage>(
          conversationId as string,
        );

      if (
        cached.length >
        0
      ) {
        setMessages(
          cached,
        );
      }

      try {
        setLoadingMessages(
          cached.length === 0,
        );

        const response =
          await apiFetch<{
            data: ServerMessage[];
          }>(
            `/messages/${conversationId}`,
          );

        if (cancelled) {
          return;
        }

        /*
         * Render the server messages immediately.
         * Decryption happens after the bubbles are
         * already visible.
         */
        const placeholders =
          response.data.map(
            (message) =>
              ({
                ...message,
                text:
                  "Decrypting...",
                status:
                  message.senderId ===
                  currentUser?.id
                    ? message.readAt
                      ? "read"
                      : message.deliveredAt
                        ? "delivered"
                        : "sent"
                    : "delivered",
              }) satisfies UiMessage,
          );

        setMessages((current) => {
          const pending = current.filter(
            (message) =>
              message.optimistic &&
              message.clientMessageId &&
              pendingMessagesRef.current.has(
                message.clientMessageId,
              ),
          );

          const byId =
            new Map<string, UiMessage>();

          for (const message of placeholders) {
            byId.set(
              message.id,
              message,
            );
          }

          for (const message of pending) {
            if (!byId.has(message.id)) {
              byId.set(
                message.id,
                message,
              );
            }
          }

          const merged =
            Array.from(
              byId.values(),
            ).sort(
              (a, b) =>
                new Date(
                  a.createdAt,
                ).getTime() -
                new Date(
                  b.createdAt,
                ).getTime(),
            );

          saveCachedMessages(
            conversationId as string,
            merged,
          );

          return merged;
        });

        /*
         * Decrypt in the background and update only
         * the text. The message bubble is already on
         * screen.
         */
        for (const message of response.data) {
          void decryptMessage(message)
            .then((text) => {
              setMessages((current) =>
                current.map(
                  (item) =>
                    item.id === message.id
                      ? {
                          ...item,
                          text,
                        }
                      : item,
                ),
              );
            })
            .catch(() => {
              setMessages((current) =>
                current.map(
                  (item) =>
                    item.id === message.id
                      ? {
                          ...item,
                          text:
                            "Unable to decrypt this message on this device",
                        }
                      : item,
                ),
              );
            });
        }

        sendConversationRead(
          conversationId as string,
        );
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load messages.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingMessages(
            false,
          );
        }
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [
    activeConversationId,
  ]);

  /*
   * ------------------------------------------------
   * Send
   * ------------------------------------------------
   */
  async function sendMessage() {
    const text =
      input.trim();

    if (
      !text ||
      !activeConversation ||
      !currentUser
    ) {
      return;
    }

    const recipient =
      activeConversation.participant;

    if (
      !recipient?.id
    ) {
      setError(
        "Recipient not found.",
      );

      return;
    }

    const recipientPublicKey =
      recipient.messagingPublicKey;

    if (!recipientPublicKey) {
      setError(
        "This user has not enabled encrypted messaging yet.",
      );

      return;
    }

    const clientMessageId =
      crypto.randomUUID();

    /*
     * ---------------------------------------------
     * OPTIMISTIC UI
     *
     * This happens immediately.
     * We do NOT wait for the server.
     * ---------------------------------------------
     */
    const optimistic: UiMessage =
      {
        id:
          clientMessageId,

        clientMessageId,

        conversationId:
          activeConversation.id,

        senderId:
          currentUser.id,

        text,

        status:
          "sending",

        createdAt:
          new Date().toISOString(),

        encryptionVersion:
          1,

        optimistic:
          true,
      };

    pendingMessagesRef.current.set(
      clientMessageId,
      optimistic,
    );

    setMessages(
      (current) => {
        const updated = [
          ...current.filter(
            (message) =>
              message.clientMessageId !==
              clientMessageId,
          ),
          optimistic,
        ];

        saveCachedMessages(
          activeConversation.id,
          updated,
        );

        return updated;
      },
    );

    /*
     * Clear input immediately.
     */
    setInput("");

    setError(
      null,
    );

    try {
      /*
       * Encrypt locally.
       */
      if (!recipient.messagingPublicKey) {
        throw new Error("Recipient messaging public key is not available");
      }

      const encrypted =
        await encryptMessage(
          text,
          recipient.messagingPublicKey,
        );

      /*
       * Send through WebSocket.
       */
      sendRealtimeMessage({
        clientMessageId,

        recipientId:
          recipient.id,

        ...encrypted,
      });

      /*
       * We DON'T set sent here.
       *
       * The server sends message.sent
       * when it has actually stored it.
       */
    } catch (error) {
      setMessages(
        (current) =>
          current.map(
            (message) =>
              message.clientMessageId ===
              clientMessageId
                ? {
                    ...message,
                    status:
                      "failed",
                  }
                : message,
          ),
      );

      setError(
        error instanceof Error
          ? error.message
          : "Message could not be sent.",
      );
    }
  }

  function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    void sendMessage();
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      void sendMessage();
    }
  }

  /*
   * ------------------------------------------------
   * Not authenticated
   * ------------------------------------------------
   */
  if (!currentUser) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: "center",
        }}
      >
        Sign in to use messages.
      </div>
    );
  }

  /*
   * ------------------------------------------------
   * UI
   * ------------------------------------------------
   */
  return (
    <>
      <style>{`
        .messages-shell {
          display: grid;
          grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
          height: calc(100dvh - 80px);
          min-height: 520px;
          border: 1px solid rgba(0,0,0,.08);
          border-radius: 20px;
          overflow: hidden;
          background: #fff;
        }

        .messages-list {
          min-width: 0;
          overflow-y: auto;
          border-right: 1px solid rgba(0,0,0,.08);
        }

        .messages-chat {
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .messages-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: clamp(14px, 3vw, 28px);
          scroll-behavior: smooth;
        }

        .message-bubble {
          max-width: min(72%, 680px);
        }

        .mobile-back {
          display: none !important;
        }

        .message-composer {
          padding: 12px 16px;
          padding-bottom: max(12px, env(safe-area-inset-bottom));
        }

        .message-input {
          min-width: 0;
        }

        .message-skeleton {
          position: relative;
          overflow: hidden;
          background: #e9e9e9;
        }

        .message-skeleton::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.72),
            transparent
          );
          animation: messageShimmer 1.35s infinite;
        }

        @keyframes messageShimmer {
          100% { transform: translateX(100%); }
        }

        @media (max-width: 900px) {
          .messages-shell {
            grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
            border-radius: 14px;
          }

          .message-bubble {
            max-width: 82%;
          }
        }

        @media (max-width: 700px) {
          .messages-shell {
            display: block !important;
            height: calc(100dvh - 60px);
            min-height: 0;
            border: 0;
            border-radius: 0;
            position: relative;
          }

          .messages-list {
            display: block;
            height: 100%;
            border-right: 0;
          }

          .messages-chat {
            display: none !important;
            height: 100%;
          }

          .messages-shell.chat-open .messages-list {
            display: none !important;
          }

          .messages-shell.chat-open .messages-chat {
            display: flex !important;
          }

          .message-bubble {
            max-width: 88%;
          }

          .mobile-back {
            display: flex !important;
          }
        }
      `}</style>

      <div
        className={
          activeConversationId
            ? "messages-shell chat-open"
            : "messages-shell"
        }
        style={{
          display: "grid",
        gridTemplateColumns:
          "300px 1fr",
        height:
          "calc(100vh - 80px)",
        minHeight: 600,
        border:
          "1px solid rgba(0,0,0,.08)",
        borderRadius: 20,
        overflow:
          "hidden",
        background:
          "#fff",
      }}
    >
      {/* -----------------------------------------
          CONVERSATIONS
      ----------------------------------------- */}
      <aside
        className="messages-list"
        style={{
          borderRight:
            "1px solid rgba(0,0,0,.08)",
          overflowY:
            "auto",
        }}
      >
        <div
          style={{
            padding:
              "20px",
            borderBottom:
              "1px solid rgba(0,0,0,.06)",
          }}
        >
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
            }}
          >
            <strong
              style={{
                fontSize:
                  20,
              }}
            >
              Messages
            </strong>

            <span
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap: 5,
                fontSize:
                  12,
                color:
                  realtimeConnected
                    ? "#16a34a"
                    : "#999",
              }}
            >
              {realtimeConnected ? (
                <Wifi
                  size={14}
                />
              ) : (
                <WifiOff
                  size={14}
                />
              )}

              {realtimeConnected
                ? "Live"
                : "Connecting"}
            </span>
          </div>
        </div>

        {loadingConversations ? (
          <div
            style={{
              padding: "10px 0",
            }}
            aria-label="Loading conversations"
          >
            {Array.from({ length: 6 }).map(
              (_, index) => (
                <SkeletonRow
                  key={index}
                />
              ),
            )}
          </div>
        ) : conversations.length ===
          0 ? (
          <div
            style={{
              padding:
                30,
              color:
                "#888",
            }}
          >
            No conversations yet.
          </div>
        ) : (
          conversations.map(
            (
              conversation,
            ) => {
              const selected =
                conversation.id ===
                activeConversationId;

              return (
                <button
                  key={
                    conversation.id
                  }
                  onClick={() =>
                    setActiveConversationId(
                      conversation.id,
                    )
                  }
                  style={{
                    width:
                      "100%",
                    border:
                      "none",
                    textAlign:
                      "left",
                    background:
                      selected
                        ? "rgba(0,0,0,.05)"
                        : "transparent",
                    padding:
                      "16px 20px",
                    cursor:
                      "pointer",
                    display:
                      "flex",
                    gap: 12,
                    alignItems:
                      "center",
                  }}
                >
                  <div
                    style={{
                      width:
                        42,
                      height:
                        42,
                      borderRadius:
                        "50%",
                      background:
                        "#eee",
                      display:
                        "grid",
                      placeItems:
                        "center",
                      overflow:
                        "hidden",
                      flexShrink:
                        0,
                    }}
                  >
                    {conversation
                      .participant
                      ?.avatarUrl ? (
                      <img
                        src={
                          conversation
                            .participant
                            .avatarUrl
                        }
                        alt=""
                        style={{
                          width:
                            "100%",
                          height:
                            "100%",
                          objectFit:
                            "cover",
                        }}
                      />
                    ) : (
                      conversation
                        .participant
                        ?.name
                        ?.charAt(
                          0,
                        )
                        .toUpperCase()
                    )}
                  </div>

                  <div
                    style={{
                      minWidth:
                        0,
                      flex:
                        1,
                    }}
                  >
                    <strong>
                      {
                        conversation
                          .participant
                          ?.name
                      }
                    </strong>

                    <div
                      style={{
                        fontSize:
                          13,
                        color:
                          "#888",
                        marginTop:
                          3,
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      @{conversation
                        .participant
                        ?.username}
                    </div>
                  </div>
                </button>
              );
            },
          )
        )}
      </aside>

      {/* -----------------------------------------
          CHAT
      ----------------------------------------- */}
      <section
        className="messages-chat"
        style={{
          display:
            "flex",
          flexDirection:
            "column",
          minWidth:
            0,
        }}
      >
        {activeConversation ? (
          <>
            {/* Header */}
            <header
              style={{
                height:
                  70,
                padding:
                  "0 22px",
                borderBottom:
                  "1px solid rgba(0,0,0,.08)",
                display:
                  "flex",
                alignItems:
                  "center",
                gap: 12,
              }}
            >
              <button
                className="mobile-back"
                type="button"
                onClick={() =>
                  setActiveConversationId(
                    null,
                  )
                }
                aria-label="Back to conversations"
                style={{
                  border: 0,
                  background: "transparent",
                  padding: 4,
                  display: "none",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={20} />
              </button>

              <div
                style={{
                  width:
                    40,
                  height:
                    40,
                  borderRadius:
                    "50%",
                  background:
                    "#eee",
                  display:
                    "grid",
                  placeItems:
                    "center",
                  overflow:
                    "hidden",
                }}
              >
                {activeConversation
                  .participant
                  ?.avatarUrl ? (
                  <img
                    src={
                      activeConversation
                        .participant
                        .avatarUrl
                    }
                    alt=""
                    style={{
                      width:
                        "100%",
                      height:
                        "100%",
                      objectFit:
                        "cover",
                    }}
                  />
                ) : (
                  activeConversation
                    .participant
                    ?.name
                    ?.charAt(
                      0,
                    )
                    .toUpperCase()
                )}
              </div>

              <div>
                <strong>
                  {
                    activeConversation
                      .participant
                      ?.name
                  }
                </strong>

                <div
                  style={{
                    fontSize:
                      12,
                    color:
                      "#888",
                  }}
                >
                  @
                  {
                    activeConversation
                      .participant
                      ?.username
                  }
                </div>
              </div>
            </header>

            {/* Messages */}
            <div
              className="messages-scroll"
              style={{
                flex:
                  1,
                overflowY:
                  "auto",
                padding:
                  24,
                display:
                  "flex",
                flexDirection:
                  "column",
                gap: 10,
              }}
            >
              {loadingMessages &&
              messages.length ===
                0 ? (
                <MessageSkeleton />
              ) : messages.length ===
                0 ? (
                <div
                  style={{
                    margin:
                      "auto",
                    color:
                      "#888",
                    textAlign:
                      "center",
                  }}
                >
                  <strong>
                    No messages yet
                  </strong>

                  <div
                    style={{
                      marginTop:
                        6,
                    }}
                  >
                    Start the conversation.
                  </div>
                </div>
              ) : (
                messages.map(
                  (
                    message,
                  ) => {
                    const own =
                      message.senderId ===
                      currentUser.id;

                    return (
                      <div
                        key={
                          message.id
                        }
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            own
                              ? "flex-end"
                              : "flex-start",
                        }}
                      >
                        <div
                          className="message-bubble"
                          style={{
                            padding:
                              "10px 14px",
                            borderRadius:
                              own
                                ? "18px 18px 4px 18px"
                                : "18px 18px 18px 4px",
                            background:
                              own
                                ? "#111"
                                : "#f1f1f1",
                            color:
                              own
                                ? "#fff"
                                : "#111",
                          }}
                        >
                          <div
                            style={{
                              whiteSpace:
                                "pre-wrap",
                              wordBreak:
                                "break-word",
                            }}
                          >
                            {
                              message.text
                            }
                          </div>

                          <div
                            style={{
                              display:
                                "flex",
                              justifyContent:
                                "flex-end",
                              alignItems:
                                "center",
                              gap: 5,
                              marginTop:
                                5,
                              fontSize:
                                10,
                              opacity:
                                0.65,
                            }}
                          >
                            {formatTime(
                              message.createdAt,
                            )}

                            {own && (
                              <MessageStatus
                                status={
                                  message.status
                                }
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  },
                )
              )}

              <div
                ref={messagesEndRef}
                style={{
                  height: 1,
                  flexShrink: 0,
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  padding:
                    "8px 20px",
                  color:
                    "#dc2626",
                  fontSize:
                    13,
                }}
              >
                {error}
              </div>
            )}

            {/* Composer */}
            <form
              className="message-composer"
              onSubmit={
                handleSubmit
              }
              style={{
                padding:
                  16,
                borderTop:
                  "1px solid rgba(0,0,0,.08)",
                display:
                  "flex",
                gap: 10,
              }}
            >
              <input
                className="message-input"
                value={input}
                onChange={(
                  event,
                ) =>
                  setInput(
                    event
                      .target
                      .value,
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                placeholder="Write a message..."
                disabled={false}
                style={{
                  flex:
                    1,
                  height:
                    46,
                  border:
                    "1px solid #ddd",
                  borderRadius:
                    14,
                  padding:
                    "0 15px",
                  outline:
                    "none",
                  fontSize:
                    14,
                }}
              />

              <button
                type="submit"
                disabled={
                  !input.trim()
                }
                style={{
                  width:
                    46,
                  height:
                    46,
                  border:
                    "none",
                  borderRadius:
                    14,
                  background:
                    input.trim()
                      ? "#111"
                      : "#ddd",
                  color:
                    "#fff",
                  display:
                    "grid",
                  placeItems:
                    "center",
                  cursor:
                    input.trim()
                      ? "pointer"
                      : "default",
                }}
              >
                <Send
                  size={18}
                />
              </button>
            </form>
          </>
        ) : (
          <div
            style={{
              flex:
                1,
              display:
                "grid",
              placeItems:
                "center",
              color:
                "#888",
            }}
          >
            Select a conversation
          </div>
        )}
      </section>
      </div>
    </>
  );
}