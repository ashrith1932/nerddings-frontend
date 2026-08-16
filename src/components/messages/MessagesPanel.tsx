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
  connectRealtime,
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
    sending,
    setSending,
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

  useEffect(() => {
    activeConversationRef.current =
      activeConversationId;
  }, [activeConversationId]);

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
    connectRealtime();

    const unsubscribe =
      subscribeRealtime(
        async (
          event: RealtimeMessage,
        ) => {
          /*
           * Server accepted our message.
           */
          if (
            event.type ===
              "message.sent" &&
            event.message &&
            event.clientMessageId
          ) {
            const serverMessage =
              event.message;

            setMessages(
              (current) =>
                current.map(
                  (message) =>
                    message.clientMessageId ===
                    event.clientMessageId
                      ? {
                          ...message,

                          id: serverMessage.id,

                          conversationId:
                            serverMessage.conversationId,

                          ciphertext:
                            serverMessage.ciphertext,

                          iv: serverMessage.iv,

                          senderKey:
                            serverMessage.senderKey,

                          recipientKey:
                            serverMessage.recipientKey,

                          encryptionVersion:
                            serverMessage.encryptionVersion,

                          createdAt:
                            serverMessage.createdAt,

                          status:
                            "sent",

                          optimistic:
                            false,
                        }
                      : message,
                ),
            );

            return;
          }

          /*
           * A message from another user.
           */
          if (
            event.type ===
              "message.new" &&
            event.message
          ) {
            const incoming =
              event.message;

            /*
             * Don't add our own message
             * twice.
             */
            if (
              incoming.senderId ===
              currentUser?.id
            ) {
              return;
            }

            let text =
              "Encrypted message";

            try {
              text =
                await decryptMessage(
                  incoming,
                );
            } catch {
              text =
                "Unable to decrypt message";
            }

            const newMessage: UiMessage =
              {
                ...incoming,
                text,
                status:
                  incoming.readAt
                    ? "read"
                    : "delivered",
              };

            sendDelivered(
              incoming.id,
            );

            if (
              incoming.conversationId ===
              activeConversationRef.current
            ) {
              sendRead(
                incoming.id,
              );
            }

            setMessages(
              (current) => {
                if (
                  current.some(
                    (message) =>
                      message.id ===
                      incoming.id,
                  )
                ) {
                  return current;
                }

                const updated =
                  [
                    ...current,
                    newMessage,
                  ];

                saveCachedMessages(
                  incoming.conversationId,
                  updated,
                );

                return updated;
              },
            );

            /*
             * If the conversation wasn't
             * selected, refresh its preview.
             */
            setConversations(
              (current) =>
                current.map(
                  (
                    conversation,
                  ) =>
                    conversation.id ===
                    incoming.conversationId
                      ? {
                          ...conversation,
                          lastMessage:
                            incoming,
                        }
                      : conversation,
                ),
            );

            /*
             * If this is a conversation
             * we don't know about yet,
             * reload the list.
             */
            if (
              !conversations.some(
                (conversation) =>
                  conversation.id ===
                  incoming.conversationId,
              )
            ) {
              try {
                const response =
                  await apiFetch<{
                    data: Conversation[];
                  }>(
                    "/messages",
                  );

                setConversations(
                  response.data,
                );
              } catch {
                // Ignore background refresh errors.
              }
            }

            return;
          }

          if (
            event.type ===
            "message.delivered" &&
            event.messageId
          ) {
            setMessages(
              (current) =>
                current.map(
                  (message) =>
                    message.id ===
                    event.messageId
                      ? {
                          ...message,
                          status:
                            message.status ===
                            "read"
                              ? "read"
                              : "delivered",
                          deliveredAt:
                            event.deliveredAt ??
                            message.deliveredAt ??
                            null,
                        }
                      : message,
                ),
            );

            return;
          }

          if (
            event.type ===
            "message.read" &&
            event.messageId
          ) {
            setMessages(
              (current) =>
                current.map(
                  (message) =>
                    message.id ===
                    event.messageId
                      ? {
                          ...message,
                          status: "read",
                          readAt:
                            event.readAt ??
                            message.readAt ??
                            null,
                        }
                      : message,
                ),
            );

            return;
          }

          /*
           * Authentication succeeded.
           */
          if (
            event.type ===
            "auth.success"
          ) {
            setRealtimeConnected(
              true,
            );

            return;
          }

          /*
           * Connection/auth error.
           */
          if (
            event.type ===
            "auth.error"
          ) {
            setRealtimeConnected(
              false,
            );

            return;
          }

          if (
            event.type ===
            "message.failed"
          ) {
            setMessages(
              (current) =>
                current.map(
                  (message) =>
                    message.clientMessageId ===
                    event.clientMessageId
                      ? {
                          ...message,
                          status:
                            "failed",
                        }
                      : message,
                ),
            );

            setSending(
              false,
            );

            return;
          }

          if (
            event.type ===
            "pong"
          ) {
            setRealtimeConnected(
              true,
            );
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

        const decrypted =
          await Promise.all(
            response.data.map(
              async (
                message,
              ) => {
                let text =
                  "Encrypted message";

                try {
                  text =
                    await decryptMessage(
                      message,
                    );
                } catch {
                  text =
                    "Unable to decrypt message";
                }

                return {
                  ...message,
                  text,
                  status:
                    message.senderId ===
                    currentUser?.id
                      ? message.readAt
                        ? "read"
                        : message.deliveredAt
                          ? "delivered"
                          : "sent"
                      : "delivered",
                } satisfies UiMessage;
              },
            ),
          );

        setMessages(
          decrypted,
        );

        saveCachedMessages(
          conversationId as string,
          decrypted,
        );

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

    setMessages(
      (current) => {
        const updated =
          [
            ...current,
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

    setSending(
      true,
    );

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
    } finally {
      setSending(
        false,
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
    <div
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
              padding:
                30,
              color:
                "#888",
            }}
          >
            Loading conversations...
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
                <div
                  style={{
                    margin:
                      "auto",
                    color:
                      "#888",
                  }}
                >
                  Loading messages...
                </div>
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
                          style={{
                            maxWidth:
                              "70%",
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

                            {own &&
                              message.status ===
                                "sending" && (
                                <>
                                  <Loader2
                                    size={
                                      11
                                    }
                                    className="animate-spin"
                                  />

                                  Sending...
                                </>
                              )}

                            {own &&
                              message.status ===
                                "sent" && (
                                <Check
                                  size={12}
                                />
                              )}

                            {own &&
                              message.status ===
                                "delivered" && (
                                <CheckCheck
                                  size={13}
                                />
                              )}

                            {own &&
                              message.status ===
                                "read" && (
                                <CheckCheck
                                  size={13}
                                  strokeWidth={3}
                                />
                              )}

                            {own &&
                              message.status ===
                                "failed" && (
                                <span
                                  style={{
                                    color:
                                      "#ef4444",
                                  }}
                                >
                                  Failed
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  },
                )
              )}
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
                disabled={
                  sending
                }
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
                  !input.trim() ||
                  sending
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
                    input.trim() &&
                    !sending
                      ? "#111"
                      : "#ddd",
                  color:
                    "#fff",
                  display:
                    "grid",
                  placeItems:
                    "center",
                  cursor:
                    input.trim() &&
                    !sending
                      ? "pointer"
                      : "default",
                }}
              >
                {sending ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Send
                    size={18}
                  />
                )}
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
  );
}