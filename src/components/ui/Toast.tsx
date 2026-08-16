"use client";

import { Check, X } from "lucide-react";

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="toast" role="status">
      <span className="toast-check"><Check size={14} strokeWidth={3} /></span>
      <span>{message}</span>
      <button className="icon-btn icon-btn-quiet" onClick={onClose} aria-label="Close notification"><X size={15} /></button>
    </div>
  );
}
