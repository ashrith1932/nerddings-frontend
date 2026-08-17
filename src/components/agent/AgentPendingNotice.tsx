"use client";

import { useEffect, useState } from "react";
import { Clock3, X } from "lucide-react";
import { apiFetch, getAuthToken } from "@/lib/api";

export default function AgentPendingNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!getAuthToken() || window.location.pathname !== "/agent/verification") return;
      try {
        const response = await apiFetch<{ data: { status?: string } | null }>("/agent-verification/me");
        if (!cancelled) setVisible(response.data?.status === "pending_review");
      } catch {
        if (!cancelled) setVisible(false);
      }
    };
    void check();
    const timer = window.setInterval(() => void check(), 15000);
    const route = () => void check();
    window.addEventListener("popstate", route);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("popstate", route);
    };
  }, []);

  if (!visible) return null;
  return <div className="agent-pending-notice" role="status">
    <div className="agent-pending-icon"><Clock3 size={18} /></div>
    <div className="agent-pending-copy"><strong>Verification pending</strong><p>Your domain is verified. Your application is now with the Nerdding team.</p><small>Review usually takes about 5–7 business days. You will be notified when the decision is made.</small></div>
    <button onClick={() => setVisible(false)} aria-label="Dismiss"><X size={15} /></button>
  </div>;
}
