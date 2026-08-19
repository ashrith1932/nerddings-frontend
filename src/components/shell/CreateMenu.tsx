"use client";

import { Plus, X } from "lucide-react";

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function CreateMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <div className="create-popover">
    <div className="create-popover-head"><span className="eyebrow">MAKE SOMETHING</span><button className="icon-btn" onClick={onClose} aria-label="Close create menu"><X size={17} /></button></div>
    <button className="create-option" onClick={() => { onClose(); window.dispatchEvent(new CustomEvent("nerdding:open-composer")); }}><span><strong>Create a post</strong><small>Share a build update or idea</small></span><Plus size={15} /></button>
    <button className="create-option" onClick={() => { onClose(); navigate("/project/new"); }}><span><strong>Create a project</strong><small>Give your work a home</small></span><Plus size={15} /></button>
    <button className="create-option" onClick={() => { onClose(); navigate("/events?create=1"); }}><span><strong>Create an event</strong><small>Bring your community together</small></span><Plus size={15} /></button>
  </div>;
}
