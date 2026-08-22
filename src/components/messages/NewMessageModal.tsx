import { useEffect, useState, useRef } from "react";
import { Search, X, Loader2, MessageSquarePlus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";

type Contact = {
  id: string;
  name: string;
  username: string;
  accountType?: string;
  avatarUrl?: string | null;
};

export default function NewMessageModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (conversationId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const fetchContacts = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiFetch<{ data: Contact[] }>(`/messages/contacts?q=${encodeURIComponent(query.trim())}`);
        if (alive) setContacts(res.data || []);
      } catch (err) {
        if (alive) setError("Failed to load contacts.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      void fetchContacts();
    }, 300);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSelect = async (contactId: string) => {
    if (creating) return;
    setCreating(contactId);
    setError("");

    try {
      const res = await apiFetch<{ data: { status: string; conversationId?: string; id?: string } }>("/messages/requests", {
        method: "POST",
        body: JSON.stringify({ recipientId: contactId })
      });

      if (res.data.status === "accepted" && res.data.conversationId) {
        onSelect(res.data.conversationId);
      } else {
        alert("Message request sent!");
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start conversation.");
      setCreating(null);
    }
  };

  return (
    <div className="new-message-modal-overlay" onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "grid", placeItems: "center", zIndex: 999 }}>
      <div className="new-message-modal" onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, background: "#fffdf9", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "80vh", boxShadow: "0 10px 40px rgba(0,0,0,0.15)" }}>
        <header style={{ padding: "16px 20px", borderBottom: "1px solid #e7e0d6", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MessageSquarePlus size={20} color="#201c19" />
            <h2 style={{ margin: 0, fontSize: 18, color: "#201c19" }}>New Message</h2>
          </div>
          <button onClick={onClose} style={{ border: 0, background: "none", cursor: "pointer", color: "#80766e" }}><X size={22} /></button>
        </header>

        <div style={{ padding: 15, borderBottom: "1px solid #e7e0d6", background: "#f5f2ec" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "#858078" }} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search people or agents..."
              style={{ width: "100%", height: 40, padding: "0 15px 0 38px", border: "1px solid #ded8cf", borderRadius: 10, fontSize: 14, outline: 0, background: "#fff" }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", minHeight: 200, padding: 10 }}>
          {error && <div style={{ color: "#b53b25", padding: 15, textAlign: "center", fontSize: 13 }}>{error}</div>}
          
          {loading && contacts.length === 0 ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40, color: "#978d84" }}><Loader2 size={24} className="message-status-spin" /></div>
          ) : contacts.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#978d84", fontSize: 14 }}>No members found.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {contacts.map(contact => (
                <button
                  key={contact.id}
                  disabled={!!creating}
                  onClick={() => void handleSelect(contact.id)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, width: "100%", border: 0, background: "transparent", borderRadius: 8, cursor: creating ? "default" : "pointer", textAlign: "left", transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f0ece5"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Avatar user={contact} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#201c19", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{contact.name}</div>
                    <div style={{ fontSize: 13, color: "#80766e" }}>@{contact.username}</div>
                  </div>
                  {creating === contact.id && <Loader2 size={16} className="message-status-spin" color="#ef5b2a" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
