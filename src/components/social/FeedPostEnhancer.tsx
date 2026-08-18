"use client";

import { useEffect } from "react";
import { apiFetch } from "@/lib/api";

type Media = { publicUrl: string | null; mimeType: string };
type Post = {
  id: string;
  author: { name: string; username: string; avatarUrl?: string | null };
  text: string;
  createdAt: string;
  media?: Media[];
  quotePostId?: string | null;
};

const cache = new Map<string, Post | null>();
const pending = new Map<string, Promise<Post | null>>();

async function getPost(id: string) {
  if (cache.has(id)) return cache.get(id) ?? null;
  const existing = pending.get(id);
  if (existing) return existing;
  const request = apiFetch<{ data: Post }>(`/social/posts/${encodeURIComponent(id)}`)
    .then(response => {
      cache.set(id, response.data);
      return response.data;
    })
    .catch(() => {
      cache.set(id, null);
      return null;
    })
    .finally(() => pending.delete(id));
  pending.set(id, request);
  return request;
}

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function addQuotedPost(card: HTMLElement, quoted: Post) {
  if (card.querySelector(".nerdd-inline-quote")) return;
  const copy = card.querySelector<HTMLElement>(".home-post-copy");
  if (!copy) return;
  const media = card.querySelector<HTMLElement>(".home-media");
  const wrapper = document.createElement("div");
  wrapper.className = "nerdd-inline-quote";
  const avatar = quoted.author.avatarUrl
    ? `<img src="${escapeHtml(quoted.author.avatarUrl)}" alt="" />`
    : `<span>${escapeHtml((quoted.author.name || "N").split(/\\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase())}</span>`;
  const quoteMedia = (quoted.media ?? []).slice(0, 1).map(item => item.publicUrl
    ? item.mimeType.startsWith("video/")
      ? `<video src="${escapeHtml(item.publicUrl)}" controls preload="metadata"></video>`
      : `<img src="${escapeHtml(item.publicUrl)}" alt="" loading="lazy" />`
    : "").join("");
  wrapper.innerHTML = `<div class="nerdd-inline-quote-label">AMPLIFIED POST</div><div class="nerdd-inline-quote-author"><span class="nerdd-inline-quote-avatar">${avatar}</span><span><strong>${escapeHtml(quoted.author.name)}</strong><small>@${escapeHtml(quoted.author.username)}</small></span></div><div class="nerdd-inline-quote-text">${escapeHtml(quoted.text)}</div>${quoteMedia ? `<div class="nerdd-inline-quote-media">${quoteMedia}</div>` : ""}`;
  if (media) media.before(wrapper);
  else copy.after(wrapper);
}

function applyMedia(card: HTMLElement, detail: Post) {
  const media = detail.media ?? [];
  const images = Array.from(card.querySelectorAll<HTMLImageElement>(".home-media img"));
  const videos = Array.from(card.querySelectorAll<HTMLVideoElement>(".home-media video"));
  const elements = [...images, ...videos];
  elements.forEach((element, index) => {
    const url = media[index]?.publicUrl;
    if (url && element.src !== url) element.src = url;
  });
}

async function enhanceCard(card: HTMLElement) {
  const id = card.dataset.postId;
  if (!id || card.dataset.nerddFeedEnhanced === "1") return;
  card.dataset.nerddFeedEnhanced = "loading";
  const detail = await getPost(id);
  if (!detail) {
    card.dataset.nerddFeedEnhanced = "error";
    return;
  }
  applyMedia(card, detail);
  if (detail.quotePostId) {
    const quoted = await getPost(detail.quotePostId);
    if (quoted) addQuotedPost(card, quoted);
  }
  card.dataset.nerddFeedEnhanced = "1";
}

export default function FeedPostEnhancer() {
  useEffect(() => {
    let disposed = false;
    const run = () => {
      if (disposed) return;
      document.querySelectorAll<HTMLElement>(".home-post[data-post-id],.se-post[data-post-id],.social-post-card[data-post-id]").forEach(card => void enhanceCard(card));
    };
    run();
    const observer = new MutationObserver(run);
    observer.observe(document.body, { subtree: true, childList: true });
    const timer = window.setInterval(run, 1500);
    return () => {
      disposed = true;
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  return <style>{`
    .nerdd-inline-quote{margin:0 0 10px;padding:10px 11px;border:1px solid #ddd6cc;border-radius:10px;background:#faf7f2;overflow:hidden;cursor:pointer}
    .nerdd-inline-quote-label{font:800 8px/1 monospace;letter-spacing:.13em;color:#9a9087;margin-bottom:8px}
    .nerdd-inline-quote-author{display:flex;align-items:center;gap:8px}
    .nerdd-inline-quote-author>span:last-child{display:flex;flex-direction:column;min-width:0}
    .nerdd-inline-quote-author strong{font-size:10px;color:#201c19}
    .nerdd-inline-quote-author small{font-size:8px;color:#938980;margin-top:2px}
    .nerdd-inline-quote-avatar{width:28px;height:28px;display:grid;place-items:center;overflow:hidden;border-radius:50%;background:#e9e3db;color:#2b2622;font-size:8px;font-weight:800;flex:0 0 28px}
    .nerdd-inline-quote-avatar img{width:100%;height:100%;object-fit:cover}
    .nerdd-inline-quote-text{margin-top:8px;font-size:11px;line-height:1.5;color:#332e29;white-space:pre-wrap}
    .nerdd-inline-quote-media{margin-top:8px;border-radius:7px;overflow:hidden;max-height:170px}
    .nerdd-inline-quote-media img,.nerdd-inline-quote-media video{display:block;width:100%;height:150px;object-fit:cover;background:#eee9e2}
    @media(max-width:600px){.nerdd-inline-quote{margin-top:2px}.nerdd-inline-quote-media img,.nerdd-inline-quote-media video{height:140px}}
  `}</style>;
}
