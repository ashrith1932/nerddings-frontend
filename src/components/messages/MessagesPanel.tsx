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
  MessageCircle,
  MessageSquarePlus,
  Search,
  Send,
  Wifi,
  WifiOff,
} from "lucide-react";

import {
  apiFetch,
  getAuthToken,
  getSavedUser,
  type ApiUser,
} from "@/lib/api";
import {
  decryptMessage,
  encryptMessage,
  ensureMessagingIdentity,
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

type Participant = Pick<
  ApiUser,
  "id" | "name" | "username" | "accountType" | "avatarUrl"
> & {
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

function messageStatus(
  message: ServerMessage,
  own: boolean,
): MessageStatus {
  if (!own) {
    return "sent";
  }

  if (message.readAt) {
    return "read";
  }

  if (message.deliveredAt) {
    return "delivered";
  }

  return "sent";
}

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
        minWidth: size,
        borderRadius: "50%",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        background: "#e8e3da",
        color: "#201e1b",
        fontWeight: 800,
        fontSize: Math.max(12, size * 0.35),
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
        className="message-status-spin"
        aria-label="Sending"
      />
    );
  }

  if (status === "failed") {
    return (
      <span
        title="Failed to send"
        aria-label="Failed to send"
        style={{
          width: 14,
          height: 14,
          display: "grid",
          placeItems: "center",
          border: "1px solid currentColor",
          borderRadius: "50%",
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
        strokeWidth={2.6}
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
        style={{ color: "#20a9ff" }}
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
    <div className="conversation-skeleton-list">
      {Array.from({ length: 7 }, (_, index) => (
        <div className="conversation-skeleton-row" key={index}>
          <div className="skeleton skeleton-avatar" />
          <div className="skeleton-lines">
            <div
              className="skeleton skeleton-line"
              style={{ width: index % 2 ? "46%" : "36%" }}
            />
            <div
              className="skeleton skeleton-line"
              style={{ width: index % 3 ? "76%" : "56%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="chat-skeleton">
      {[
        ["other", "42%"],
        ["own", "55%"],
        ["other", "34%"],
        ["own", "68%"],
        ["other", "48%"],
        ["own", "39%"],
        ["other", "58%"],
      ].map(([side, width], index) => (
        <div
          key={index}
          className={
            side === "own"
              ? "skeleton-message own"
              : "skeleton-message other"
          }
        >
          <div
            className="skeleton skeleton-bubble"
            style={{ width }}
          />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <MessageCircle size={27} strokeWidth={1.7} />
      </div>
      <strong>No messages yet</strong>
      <span>
        Start the conversation and your message will appear here
        instantly.
      </span>
    </div>
  );
}

function mergeMessages(
  serverMessages: UiMessage[],
  current: UiMessage[],
) {
  const byId = new Map<string, UiMessage>();

  for (const message of serverMessages) {
    byId.set(message.id, message);
  }

  for (const message of current) {
    if (!message.optimistic) {
      const existing = byId.get(message.id);

      if (existing) {
        byId.set(message.id, {
          ...message,
          ...existing,
          text: message.text || existing.text,
        });
      } else {
        byId.set(message.id, message);
      }

      continue;
    }

    const persisted = [...byId.values()].find(
      (item) =>
        item.senderId === message.senderId &&
        Boolean(item.ciphertext) &&
        item.ciphertext === message.ciphertext,
    );

    if (!persisted) {
      byId.set(message.id, message);
    }
  }

  return [...byId.values()].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime(),
  );
}

import NewMessageModal from "./NewMessageModal";

export default function MessagesPanel() {
  const currentUser = getSavedUser();

  const [conversations, setConversations] = useState<
    Conversation[]
  >([]);
  const [activeConversationId, setActiveConversationId] =
    useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loadingConversations, setLoadingConversations] =
    useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [realtimeConnected, setRealtimeConnected] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);

  const activeConversationRef = useRef<string | null>(null);
  const currentUserRef = useRef(currentUser);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeConversationRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) =>
          conversation.id === activeConversationId,
      ) ?? null,
    [conversations, activeConversationId],
  );

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const name =
        conversation.participant?.name?.toLowerCase() ?? "";
      const username =
        conversation.participant?.username?.toLowerCase() ?? "";

      return (
        name.includes(query) ||
        username.includes(query)
      );
    });
  }, [conversations, search]);

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({
        behavior,
        block: "end",
      });
    });
  }

  async function refreshConversations(
    selectFirst = false,
  ) {
    const response = await apiFetch<{
      data: Conversation[];
    }>("/messages");

    setConversations(response.data);

    if (
      selectFirst &&
      response.data.length > 0
    ) {
      setActiveConversationId(
        response.data[0].id,
      );
    }

    return response.data;
  }

  /*
   * Pre-create/register the encryption identity in the background.
   * This removes the first-send RSA key-generation/API delay.
   */
  useEffect(() => {
    if (!currentUser || !getAuthToken()) {
      return;
    }

    void ensureMessagingIdentity().catch(
      (identityError) => {
        console.error(
          "[Messages] identity warmup failed",
          identityError,
        );
      },
    );
  }, [currentUser?.id]);

  /*
   * Load the conversation list.
   */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!getAuthToken()) {
        setLoadingConversations(false);
        return;
      }

      try {
        setLoadingConversations(true);
        const data = await refreshConversations();

        if (cancelled) {
          return;
        }

        if (
          data.length > 0 &&
          !activeConversationRef.current
        ) {
          setActiveConversationId(data[0].id);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load conversations.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingConversations(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * One realtime listener for the entire message page.
   */
  useEffect(() => {
    const unsubscribe = subscribeRealtime(
      (event: RealtimeMessage) => {
        if (event.type === "auth.success") {
          setRealtimeConnected(true);
          return;
        }

        if (
          event.type === "connection.connecting" ||
          event.type === "connection.open"
        ) {
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
          event.type === "message.failed" &&
          event.clientMessageId
        ) {
          setMessages((current) =>
            current.map((message) =>
              message.clientMessageId ===
              event.clientMessageId
                ? {
                    ...message,
                    status: "failed",
                  }
                : message,
            ),
          );

          setError(
            event.error ??
              "Message failed to send.",
          );
          return;
        }

        if (
          event.type === "message.sent" &&
          event.message &&
          event.clientMessageId
        ) {
          const serverMessage =
            event.message;

          setMessages((current) => {
            const updated = current.map(
              (message): UiMessage =>
                message.clientMessageId ===
                event.clientMessageId
                  ? {
                      ...message,
                      ...serverMessage,
                      id: serverMessage.id,
                      status:
                        message.status ===
                        "read"
                          ? "read"
                          : message.status ===
                              "delivered"
                            ? "delivered"
                            : messageStatus(
                                serverMessage,
                                true,
                              ),
                      deliveredAt:
                        serverMessage.deliveredAt ??
                        message.deliveredAt ??
                        null,
                      readAt:
                        serverMessage.readAt ??
                        message.readAt ??
                        null,
                      optimistic: false,
                      clientMessageId:
                        event.clientMessageId,
                    }
                  : message,
            );

            if (
              activeConversationRef.current ===
              serverMessage.conversationId
            ) {
              saveCachedMessages(
                serverMessage.conversationId,
                updated,
              );
            }

            return updated;
          });

          setConversations((current) =>
            current.map((conversation) =>
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
          const incoming = event.message;
          const isActive =
            incoming.conversationId ===
            activeConversationRef.current;

          /*
           * The browser has received the event, so acknowledge delivery
           * immediately. Never wait for decryption.
           */
          sendDelivered(incoming.id, event.clientMessageId);

          setConversations((current) => {
            const existing = current.find(
              (conversation) =>
                conversation.id ===
                incoming.conversationId,
            );

            if (!existing) {
              void refreshConversations();
              return current;
            }

            return [
              {
                ...existing,
                lastMessage: incoming,
              },
              ...current.filter(
                (conversation) =>
                  conversation.id !==
                  incoming.conversationId,
              ),
            ];
          });

          if (!isActive) {
            return;
          }

          const placeholder: UiMessage = {
            ...incoming,
            text: "Decrypting…",
            status: "delivered",
          };

          setMessages((current) => {
            const existingIndex =
              current.findIndex(
                (message) =>
                  message.id === incoming.id,
              );

            if (existingIndex >= 0) {
              const updated = [...current];

              updated[existingIndex] = {
                ...updated[existingIndex],
                ...placeholder,
              };

              return updated;
            }

            const updated = [...current, placeholder];

            saveCachedMessages(
              incoming.conversationId,
              updated,
            );

            return updated;
          });

          /*
           * This conversation is visible, so it is read immediately.
           */
          sendRead(incoming.id, event.clientMessageId);

          void decryptMessage(incoming)
            .then((text) => {
              setMessages((current) => {
                const updated = current.map(
                  (message) =>
                    message.id === incoming.id
                      ? {
                          ...message,
                          text,
                          status: "read" as MessageStatus,
                          readAt:
                            new Date().toISOString(),
                        }
                      : message,
                );

                saveCachedMessages(
                  incoming.conversationId,
                  updated,
                );

                return updated;
              });

              scrollToBottom();
            })
            .catch((decryptError) => {
              console.error(
                "[Messages] decrypt failed",
                decryptError,
              );
            });

          scrollToBottom();
          return;
        }

        if (
          event.type === "message.delivered" &&
          event.messageId
        ) {
          setMessages((current) => {
            const updated = current.map(
              (message): UiMessage =>
                message.id ===
                  event.messageId ||
                (event.clientMessageId !== undefined &&
                  message.clientMessageId ===
                    event.clientMessageId)
                  ? {
                      ...message,
                      status:
                        message.status === "read"
                          ? "read"
                          : "delivered",
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
          event.type === "message.read" &&
          event.messageId
        ) {
          setMessages((current) => {
            const updated = current.map(
              (message): UiMessage =>
                message.id ===
                  event.messageId ||
                (event.clientMessageId !== undefined &&
                  message.clientMessageId ===
                    event.clientMessageId)
                  ? {
                      ...message,
                      status:
                        "read" as MessageStatus,
                      readAt:
                        event.readAt ??
                        message.readAt ??
                        null,
                      deliveredAt:
                        message.deliveredAt ??
                        event.readAt ??
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
        }
      },
    );

    return unsubscribe;
  }, []);

  /*
   * Load the selected conversation. Cached messages are shown first,
   * then the server response is merged into them.
   */
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    const conversationId =
      activeConversationId;

    async function loadMessages() {
      const cached =
        loadCachedMessages<UiMessage>(
          conversationId,
        );

      if (cached.length > 0) {
        setMessages(cached);
        setLoadingMessages(false);
        scrollToBottom("auto");
      } else {
        setMessages([]);
        setLoadingMessages(true);
      }

      try {
        const response = await apiFetch<{
          data: ServerMessage[];
        }>(
          `/messages/${conversationId}`,
        );

        if (cancelled) {
          return;
        }

        const serverMessages =
          response.data.map(
            (message): UiMessage => ({
              ...message,
              text: "Decrypting…",
              status: messageStatus(
                message,
                message.senderId ===
                  currentUserRef.current?.id,
              ),
            }),
          );

        setMessages((current) => {
          const merged = mergeMessages(
            serverMessages,
            current,
          );

          saveCachedMessages(
            conversationId,
            merged,
          );

          return merged;
        });

        /*
         * Decryption is deliberately performed after rendering.
         */
        for (const message of response.data) {
          void decryptMessage(message)
            .then((text) => {
              if (cancelled) {
                return;
              }

              setMessages((current) => {
                const updated =
                  current.map(
                    (item) =>
                      item.id === message.id
                        ? {
                            ...item,
                            text,
                          }
                        : item,
                  );

                saveCachedMessages(
                  conversationId,
                  updated,
                );

                return updated;
              });
            })
            .catch((decryptError) => {
              console.error(
                "[Messages] decrypt failed",
                decryptError,
              );
            });
        }

        /*
         * Opening a conversation marks messages from the other user read.
         */
        sendConversationRead(
          conversationId,
        );

        scrollToBottom("auto");
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load messages.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    }

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [activeConversationId]);

  /*
   * IMPORTANT:
   * This function does no encryption/network work before putting the
   * optimistic message into React state. It is deliberately synchronous
   * up to the point where transmitMessage() is scheduled.
   */
  function handleSend() {
    const text = input.trim();
    const conversation =
      activeConversation;

    if (
      !text ||
      !conversation ||
      !currentUser
    ) {
      return;
    }

    const recipient =
      conversation.participant;

    if (!recipient?.id) {
      setError("Recipient not found.");
      return;
    }

    if (!recipient.messagingPublicKey) {
      setError(
        "This user has not enabled encrypted messaging yet.",
      );
      return;
    }

    const clientMessageId =
      crypto.randomUUID();

    const createdAt =
      new Date().toISOString();

    const optimistic: UiMessage = {
      id: clientMessageId,
      clientMessageId,
      conversationId:
        conversation.id,
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

    /*
     * These state updates happen before any await.
     */
    setError(null);
    setInput("");

    setMessages((current) => {
      const updated = [
        ...current,
        optimistic,
      ];

      saveCachedMessages(
        conversation.id,
        updated,
      );

      return updated;
    });

    scrollToBottom();

    /*
     * The expensive work is completely outside the input event.
     */
    void transmitMessage(
      optimistic,
      recipient.id,
      recipient.messagingPublicKey,
    );
  }

  async function transmitMessage(
    optimistic: UiMessage,
    recipientId: string,
    recipientPublicKey: string,
  ) {
    try {
      const encrypted =
        await encryptMessage(
          optimistic.text,
          recipientPublicKey,
        );

      setMessages((current) => {
        const updated = current.map(
          (message): UiMessage =>
            message.id === optimistic.id
              ? {
                  ...message,
                  ...encrypted,
                }
              : message,
        );

        saveCachedMessages(
          optimistic.conversationId,
          updated,
        );

        return updated;
      });

      sendRealtimeMessage({
        clientMessageId:
          optimistic.clientMessageId!,
        recipientId,
        ...encrypted,
      });
    } catch (sendError) {
      setMessages((current) => {
        const updated = current.map(
          (message): UiMessage =>
            message.id === optimistic.id
              ? {
                  ...message,
                  status: "failed",
                }
              : message,
        );

        saveCachedMessages(
          optimistic.conversationId,
          updated,
        );

        return updated;
      });

      setError(
        sendError instanceof Error
          ? sendError.message
          : "Message could not be sent.",
      );
    }
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    handleSend();
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSend();
    }
  }

  if (!currentUser) {
    return (
      <div className="messages-auth-required">
        Sign in to use messages.
      </div>
    );
  }

  return (
    <>
      <style>{`
        .messages-page {
          width: 100%;
          height: calc(100dvh - 86px);
          min-height: 520px;
          padding: 18px;
          box-sizing: border-box;
        }

        .messages-shell {
          height: 100%;
          width: 100%;
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(270px, 320px) minmax(0, 1fr);
          overflow: hidden;
          border: 1px solid #e5dfd5;
          border-radius: 22px;
          background: #fffdfa;
          box-shadow: 0 18px 55px rgba(35, 29, 23, .08);
        }

        .messages-sidebar {
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          background: #f6f2eb;
          border-right: 1px solid #e5dfd5;
        }

        .messages-sidebar-header {
          padding: 18px;
          border-bottom: 1px solid #e5dfd5;
        }

        .messages-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .messages-title {
          font-size: 22px;
          line-height: 1;
          font-weight: 850;
          letter-spacing: -.045em;
          color: #171513;
        }

        .realtime-state {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .05em;
          text-transform: uppercase;
        }

        .messages-search-wrap {
          position: relative;
        }

        .messages-search {
          width: 100%;
          height: 42px;
          box-sizing: border-box;
          border: 0;
          outline: 0;
          border-radius: 12px;
          background: #e9e4db;
          padding: 0 12px 0 40px;
          color: #211f1c;
          font-size: 13px;
        }

        .messages-search:focus {
          box-shadow: 0 0 0 2px rgba(32, 30, 27, .08);
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
          padding: 11px;
          margin-bottom: 3px;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 11px;
          text-align: left;
          cursor: pointer;
          transition: background .15s ease;
        }

        .conversation-row:hover {
          background: #ebe6dd;
        }

        .conversation-row.active {
          background: #e4ddd2;
        }

        .conversation-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #211f1c;
          font-size: 13px;
          font-weight: 800;
        }

        .conversation-preview {
          margin-top: 3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #8b857d;
          font-size: 11px;
        }

        .messages-chat {
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          background: #fffefa;
        }

        .chat-header {
          height: 68px;
          min-height: 68px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 18px;
          border-bottom: 1px solid #e8e2d8;
          background: rgba(255, 254, 250, .97);
        }

        .chat-header-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 14px;
          font-weight: 850;
          color: #211f1c;
        }

        .chat-header-username {
          margin-top: 3px;
          font-size: 10px;
          color: #8c867e;
        }

        .chat-live {
          margin-left: auto;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        .chat-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 20px clamp(12px, 4vw, 50px);
          background:
            radial-gradient(
              circle at 20% 0%,
              rgba(239, 233, 222, .5),
              transparent 32%
            ),
            #fffefa;
        }

        .message-row {
          width: 100%;
          display: flex;
          margin-bottom: 6px;
        }

        .message-row.own {
          justify-content: flex-end;
        }

        .message-row.other {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: min(72%, 620px);
          min-width: 58px;
          padding: 8px 11px 6px;
          border-radius: 17px;
          box-sizing: border-box;
          box-shadow: 0 1px 1px rgba(30, 25, 20, .045);
        }

        .message-bubble.own {
          background: #171513;
          color: #fff;
          border-bottom-right-radius: 5px;
        }

        .message-bubble.other {
          background: #eeeae3;
          color: #25221e;
          border-bottom-left-radius: 5px;
        }

        .message-text {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          font-size: 14px;
          line-height: 1.4;
        }

        .message-meta {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 4px;
          margin-top: 3px;
          min-height: 14px;
          font-size: 9px;
          opacity: .72;
        }

        .message-status-spin {
          animation: message-status-spin .8s linear infinite;
        }

        @keyframes message-status-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .composer {
          flex-shrink: 0;
          padding: 10px 12px max(10px, env(safe-area-inset-bottom));
          border-top: 1px solid #e8e2d8;
          background: #fffefa;
        }

        .composer-inner {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .composer-input {
          flex: 1;
          min-width: 0;
          height: 46px;
          box-sizing: border-box;
          border: 1px solid #ded8cf;
          outline: 0;
          border-radius: 15px;
          padding: 0 15px;
          background: #f5f2ec;
          color: #211f1c;
          font-size: 14px;
        }

        .composer-input:focus {
          background: #fff;
          border-color: #aaa298;
        }

        .send-button {
          width: 46px;
          height: 46px;
          min-width: 46px;
          border: 0;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #ef5b2a;
          color: #fff;
          cursor: pointer;
        }

        .send-button:disabled {
          opacity: .45;
          cursor: default;
        }

        .error-bar {
          flex-shrink: 0;
          padding: 7px 14px;
          background: #fff1ed;
          border-top: 1px solid #f2d0c7;
          color: #b53b25;
          font-size: 11px;
        }

        .skeleton {
          position: relative;
          overflow: hidden;
          background: #e3dfd7;
        }

        .skeleton::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, .75),
            transparent
          );
          animation: message-skeleton-shimmer 1.2s infinite;
        }

        @keyframes message-skeleton-shimmer {
          to {
            transform: translateX(100%);
          }
        }

        .conversation-skeleton-row {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 12px 10px;
        }

        .skeleton-avatar {
          width: 44px;
          height: 44px;
          min-width: 44px;
          border-radius: 50%;
        }

        .skeleton-lines {
          flex: 1;
          min-width: 0;
        }

        .skeleton-line {
          height: 10px;
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .chat-skeleton {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding: 10px 0 30px;
        }

        .skeleton-message {
          display: flex;
          width: 100%;
          margin-bottom: 13px;
        }

        .skeleton-message.own {
          justify-content: flex-end;
        }

        .skeleton-message.other {
          justify-content: flex-start;
        }

        .skeleton-bubble {
          height: 45px;
          max-width: 72%;
          border-radius: 17px;
        }

        .empty-state {
          height: 100%;
          display: grid;
          place-content: center;
          justify-items: center;
          text-align: center;
          color: #8b857d;
          padding: 30px;
        }

        .empty-icon {
          width: 58px;
          height: 58px;
          margin-bottom: 14px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #f0ece5;
          color: #625d56;
        }

        .empty-state strong {
          color: #211f1c;
          font-size: 16px;
          margin-bottom: 5px;
        }

        .empty-state span {
          max-width: 320px;
          font-size: 12px;
          line-height: 1.55;
        }

        .empty-conversations {
          padding: 42px 22px;
          text-align: center;
          color: #89837b;
          font-size: 12px;
          line-height: 1.55;
        }

        .mobile-back {
          display: none;
          width: 34px;
          height: 34px;
          border: 0;
          background: transparent;
          color: #211f1c;
          align-items: center;
          justify-content: center;
        }

        .messages-auth-required {
          min-height: 400px;
          display: grid;
          place-items: center;
          color: #777;
        }

        @media (max-width: 900px) {
          .messages-page {
            padding: 10px;
          }

          .messages-shell {
            grid-template-columns: 280px minmax(0, 1fr);
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
            display: block;
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

          .messages-shell.chat-open
            .messages-sidebar {
            display: none;
          }

          .messages-shell.chat-open
            .messages-chat {
            display: flex;
          }

          .mobile-back {
            display: flex;
          }

          .chat-header {
            height: 62px;
            min-height: 62px;
            padding: 0 10px;
          }

          .chat-scroll {
            padding: 15px 9px;
          }

          .message-bubble {
            max-width: 84%;
          }

          .composer {
            padding-left: 8px;
            padding-right: 8px;
          }
        }

        @media (max-width: 420px) {
          .message-bubble {
            max-width: 90%;
          }

          .messages-title {
            font-size: 20px;
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
              <div className="messages-sidebar-header">
              <div className="messages-title-row">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <div className="messages-title">
                      Messages
                    </div>
                    <div
                      className="realtime-state"
                      style={{
                        color:
                          realtimeConnected
                            ? "#13834b"
                            : "#8a847d",
                      }}
                    >
                      {realtimeConnected ? (
                        <Wifi size={12} />
                      ) : (
                        <WifiOff size={12} />
                      )}
                      {realtimeConnected
                        ? "Live"
                        : "Connecting"}
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsNewMessageOpen(true)}
                    style={{ background: '#201c19', color: '#fff', border: 0, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <MessageSquarePlus size={14} />
                    New
                  </button>
                </div>
              </div>

              {isNewMessageOpen && (
                <NewMessageModal 
                  onClose={() => setIsNewMessageOpen(false)} 
                  onSelect={(conversationId) => {
                    setIsNewMessageOpen(false);
                    void refreshConversations();
                    setActiveConversationId(conversationId);
                  }}
                />
              )}

              <div className="messages-search-wrap">
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: 13,
                    top: 13,
                    color: "#858078",
                  }}
                />

                <input
                  className="messages-search"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search messages"
                  aria-label="Search messages"
                />
              </div>
            </div>

            <div className="messages-list">
              {loadingConversations ? (
                <ConversationSkeleton />
              ) : filteredConversations.length ===
                0 ? (
                <div className="empty-conversations">
                  No conversations yet.
                  <br />
                  Send a request to start one.
                </div>
              ) : (
                filteredConversations.map(
                  (conversation) => {
                    const selected =
                      conversation.id ===
                      activeConversationId;

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
                          setActiveConversationId(
                            conversation.id,
                          )
                        }
                      >
                        <Avatar
                          participant={
                            conversation.participant
                          }
                        />

                        <div
                          style={{
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <div className="conversation-name">
                            {conversation
                              .participant
                              ?.name ??
                              "Unknown"}
                          </div>

                          <div className="conversation-preview">
                            {conversation.lastMessage
                              ? "Encrypted message"
                              : `@${
                                  conversation
                                    .participant
                                    ?.username ??
                                  ""
                                }`}
                          </div>
                        </div>
                      </button>
                    );
                  },
                )
              )}
            </div>
          </aside>

          <section className="messages-chat">
            {activeConversation ? (
              <>
                <header className="chat-header">
                  <button
                    type="button"
                    className="mobile-back"
                    aria-label="Back to conversations"
                    onClick={() =>
                      setActiveConversationId(
                        null,
                      )
                    }
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <Avatar
                    participant={
                      activeConversation.participant
                    }
                    size={42}
                  />

                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <div className="chat-header-name">
                      {activeConversation
                        .participant?.name ??
                        "Unknown"}
                    </div>

                    <div className="chat-header-username">
                      @
                      {activeConversation
                        .participant
                        ?.username ??
                        ""}
                    </div>
                  </div>

                  <div
                    className="chat-live"
                    style={{
                      color:
                        realtimeConnected
                          ? "#13834b"
                          : "#8a847d",
                    }}
                  >
                    {realtimeConnected
                      ? "Live"
                      : "Reconnecting"}
                  </div>
                </header>

                <div className="chat-scroll">
                  {loadingMessages &&
                  messages.length === 0 ? (
                    <ChatSkeleton />
                  ) : messages.length ===
                    0 ? (
                    <EmptyState />
                  ) : (
                    messages.map(
                      (message) => {
                        const own =
                          message.senderId ===
                          currentUser.id;

                        return (
                          <div
                            key={
                              message.id
                            }
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
                                  {formatTime(
                                    message.createdAt,
                                  )}
                                </span>

                                {own && (
                                  <StatusIcon
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

                  <div ref={endRef} />
                </div>

                {error && (
                  <div className="error-bar">
                    {error}
                  </div>
                )}

                <form
                  className="composer"
                  onSubmit={
                    handleSubmit
                  }
                >
                  <div className="composer-inner">
                    <input
                      className="composer-input"
                      value={input}
                      onChange={(event) =>
                        setInput(
                          event.target.value,
                        )
                      }
                      onKeyDown={
                        handleKeyDown
                      }
                      placeholder="Write an encrypted message…"
                      autoComplete="off"
                    />

                    <button
                      className="send-button"
                      type="submit"
                      disabled={
                        !input.trim()
                      }
                      aria-label="Send message"
                    >
                      <Send size={19} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <MessageCircle
                    size={28}
                    strokeWidth={1.7}
                  />
                </div>

                <strong>
                  Select a conversation
                </strong>

                <span>
                  Your encrypted
                  messages will appear
                  here.
                </span>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
