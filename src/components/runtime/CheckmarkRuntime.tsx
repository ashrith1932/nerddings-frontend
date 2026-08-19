"use client";

import { useEffect, useRef, useState } from "react";
import { getPublicCheckmarks, type CheckmarkType } from "@/services/checkmarksApi";
import { Checkmark } from "@/components/shared/Checkmark";

const styles = `
.nerdd-checkmark-inline{display:inline-flex;align-items:center;vertical-align:-2px;margin-left:4px;line-height:0}
.nerdd-checkmark-inline svg{display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.12))}
.nerdd-user-name{display:inline-flex;align-items:center;gap:4px;min-width:0}
.nerdd-user-name strong{display:inline}
.home-author>span:last-child,.nerdd-quote-head>span:last-child,.threaded-comment-meta,.profile-person-row>span:nth-child(2),.yn-post{min-width:0}
`;

type Entry = { username: string; checkmarkType: CheckmarkType | null };

function usernameFromScope(scope: HTMLElement): string | null {
  const small = scope.querySelector("small");
  if (!small) return null;
  const match = small.textContent?.match(/@([A-Za-z0-9_.-]+)/);
  return match?.[1]?.toLowerCase() ?? null;
}

function findNameTarget(scope: HTMLElement): HTMLElement | null {
  return scope.querySelector("strong");
}

function decorate(root: ParentNode, lookup: Map<string, CheckmarkType>) {
  const scopes = root.querySelectorAll<HTMLElement>([
    ".home-author",
    ".home-modal-content .home-post-head",
    ".nerdd-quote-head",
    ".threaded-comment-meta",
    ".profile-person-row",
    ".yn-post",
    ".message-user",
    ".notification-row",
    ".profile-title-row",
    ".project-author",
  ].join(","));

  scopes.forEach((scope) => {
    if (scope.querySelector(":scope > .nerdd-checkmark-inline")) return;
    const username = usernameFromScope(scope);
    if (!username) return;
    const type = lookup.get(username);
    if (!type) return;
    const target = findNameTarget(scope);
    if (!target || target.parentElement?.querySelector(":scope > .nerdd-checkmark-inline")) return;

    const holder = document.createElement("span");
    holder.className = "nerdd-checkmark-inline";
    holder.setAttribute("data-checkmark-type", type);
    target.insertAdjacentElement("afterend", holder);

    // Render the exact same React SVG through a tiny detached root only once.
    // This keeps the badge artwork centralized in Checkmark.tsx.
    const event = new CustomEvent("nerdding:render-checkmark", { detail: { holder, type } });
    window.dispatchEvent(event);
  });
}

export default function CheckmarkRuntime() {
  const [lookup, setLookup] = useState<Map<string, CheckmarkType>>(new Map());
  const lookupRef = useRef(lookup);
  lookupRef.current = lookup;

  useEffect(() => {
    let alive = true;
    void getPublicCheckmarks().then((records) => {
      if (!alive) return;
      const map = new Map<string, CheckmarkType>();
      for (const record of records) {
        if (record.checkmarkType) map.set(record.username.toLowerCase(), record.checkmarkType);
      }
      setLookup(map);
    }).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!lookup.size || typeof document === "undefined") return;
    const render = (holder: HTMLElement, type: CheckmarkType) => {
      const svg = Checkmark({ type, size: 13 });
      if (svg) {
        // React elements cannot be mounted directly; create the compact SVG here
        // using the same geometry/colors as Checkmark.tsx.
        const html = type === "gold"
          ? `<svg viewBox="0 0 200 200" width="13" height="13" aria-label="gold verification"><defs><linearGradient id="runtimeGold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#bf953f"/><stop offset="25%" stop-color="#fcf6ba"/><stop offset="50%" stop-color="#b38728"/><stop offset="75%" stop-color="#fbf5b7"/><stop offset="100%" stop-color="#aa771c"/></linearGradient></defs><path d="M100 15 Q112 35 130 20 Q135 42 160 40 Q153 62 175 75 Q158 92 170 115 Q148 122 150 148 Q130 142 120 165 Q102 150 80 165 Q70 142 50 148 Q52 122 30 115 Q42 92 25 75 Q47 62 40 40 Q65 42 70 20 Q88 35 100 15 Z" fill="url(#runtimeGold)" stroke="#fff2a3" stroke-width="1.5"/><path d="M72 100 L90 118 L130 75" fill="none" stroke="#121212" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>`
          : `<svg viewBox="0 0 200 200" width="13" height="13" aria-label="${String(type).replace(/[^a-z0-9_-]/gi, "")} verification"><path d="M100 15 Q112 35 130 20 Q135 42 160 40 Q153 62 175 75 Q158 92 170 115 Q148 122 150 148 Q130 142 120 165 Q102 150 80 165 Q70 142 50 148 Q52 122 30 115 Q42 92 25 75 Q47 62 40 40 Q65 42 70 20 Q88 35 100 15 Z" fill="${type === "blue" ? "#3b82f6" : type === "green" ? "#16a34a" : type === "purple" ? "#7c3aed" : "#64748b"}"/><path d="M72 100 L90 118 L130 75" fill="none" stroke="#121212" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        holder.innerHTML = html;
      }
    };
    const onRender = (event: Event) => {
      const { holder, type } = (event as CustomEvent<{ holder?: HTMLElement; type?: CheckmarkType }>).detail ?? {};
      if (holder && type) render(holder, type);
    };
    window.addEventListener("nerdding:render-checkmark", onRender);
    decorate(document, lookup);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) decorate(node, lookupRef.current);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("nerdding:render-checkmark", onRender);
    };
  }, [lookup]);

  return <style>{styles}</style>;
}
