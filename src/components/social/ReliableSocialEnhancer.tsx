"use client";

import { useEffect, useState } from "react";
import SocialEnhancer from "./SocialEnhancer";
import "./social-live-polish.css";

export default function ReliableSocialEnhancer() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let current: HTMLElement | null = null;
    const sync = () => {
      const next = document.querySelector<HTMLElement>(".page-content");
      if (next && next !== current) {
        current = next;
        setHost(next);
        setVersion((value) => value + 1);
      } else if (!next && current) {
        current = null;
        setHost(null);
      }
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", sync);
    };
  }, []);

  if (!host) return null;
  return <SocialEnhancer key={version} />;
}
