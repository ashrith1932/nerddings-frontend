"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Check, Loader2, X } from "lucide-react";
import { apiFetch, getAuthToken, getSavedUser, saveAuthSession, uploadMedia } from "@/lib/api";
import "./profile-polish.css";

export default function ProfileEditorOverlay() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [name, setName] = useState("");

  const isOwnProfile = () => {
    const saved = getSavedUser();
    const username = decodeURIComponent(window.location.pathname.split("/").filter(Boolean)[1] ?? "");
    return Boolean(saved?.username && username && saved.username.toLowerCase() === username.toLowerCase());
  };

  useEffect(() => {
    setMounted(true);
    const sync = () => {
      if (!isOwnProfile()) {
        setOpen(false);
        return;
      }
      const saved = getSavedUser();
      setAvatarUrl(saved?.avatarUrl ?? null);
      setName(saved?.name ?? "");
    };
    const timer = window.setTimeout(sync, 250);
    window.addEventListener("popstate", sync);
    window.addEventListener("nerdding:auth-updated", sync as EventListener);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("popstate", sync);
      window.removeEventListener("nerdding:auth-updated", sync as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!mounted || !isOwnProfile()) return;
    let cancelled = false;
    const attach = () => {
      if (cancelled) return;
      const host = document.querySelector(".social-enhancer-content .se-profile-title");
      if (!host) return;
      host.classList.add("se-own-profile-title");
      if (!host.querySelector(".se-edit-profile-button")) {
        const button = document.createElement("button");
        button.className = "se-edit-profile-button";
        button.type = "button";
        button.textContent = "Edit profile";
        button.addEventListener("click", () => setOpen(true));
        host.appendChild(button);
      }
    };
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });
    attach();
    const timer = window.setTimeout(attach, 500);
    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [mounted]);

  if (!mounted || !open || !isOwnProfile()) return null;

  const save = async () => {
    setBusy(true);
    setMessage("");
    try {
      const response = await apiFetch<{ data: { id: string; avatarUrl?: string | null; name?: string } }>("/settings/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), avatarUrl }),
      });

      // The PATCH response is authoritative. Do not make /auth/me a required
      // second request before reloading; a transient auth/read failure must not
      // make a successfully written profile look like it was lost.
      const saved = getSavedUser();
      const token = getAuthToken();
      if (saved && token) {
        saveAuthSession({
          token,
          user: {
            ...saved,
            name: response.data.name ?? name.trim(),
            avatarUrl: response.data.avatarUrl ?? avatarUrl,
          },
        });
      }

      setAvatarUrl(response.data.avatarUrl ?? avatarUrl ?? null);
      setName(response.data.name ?? name.trim());
      setMessage("Profile updated.");
      window.dispatchEvent(new CustomEvent("nerdding:auth-updated"));
      window.setTimeout(() => window.location.reload(), 450);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update your profile.");
    } finally {
      setBusy(false);
    }
  };

  const choosePhoto = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const uploaded = await uploadMedia(file);
      setAvatarUrl(uploaded.publicUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Photo upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="se-profile-editor-backdrop" onMouseDown={(event) => event.currentTarget === event.target && !busy && setOpen(false)}>
      <section className="se-profile-editor" role="dialog" aria-modal="true" aria-label="Edit profile">
        <header><div><small>PROFILE</small><h2>Edit your profile</h2></div><button className="se-profile-editor-close" onClick={() => !busy && setOpen(false)} aria-label="Close"><X size={18} /></button></header>
        <div className="se-profile-editor-photo">
          <div className="se-profile-editor-avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{name.slice(0, 1).toUpperCase() || "N"}</span>}</div>
          <label className="se-profile-photo-button"><Camera size={15} /> Change photo<input type="file" accept="image/*" onChange={(event) => void choosePhoto(event.target.files?.[0])} /></label>
          <small>JPG, PNG or WebP · up to 25 MB</small>
        </div>
        <label><span>Name</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={160} /></label>
        {message && <div className="se-profile-editor-message"><Check size={14} /> {message}</div>}
        <footer><button className="se-profile-editor-cancel" onClick={() => !busy && setOpen(false)}>Cancel</button><button className="se-profile-editor-save" disabled={busy || !name.trim()} onClick={() => void save()}>{busy ? <><Loader2 className="se-spin" size={15} /> Saving…</> : <>Save changes</>}</button></footer>
      </section>
    </div>,
    document.body,
  );
}
