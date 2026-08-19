"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand/BrandMark";
import { apiFetch, saveAuthSession, saveAuthToken, type ApiUser } from "@/lib/api";

export default function OAuthCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      setError("OAuth sign-in did not return a session.");
      return;
    }

    saveAuthToken(token);

    apiFetch<{ data: ApiUser }>("/auth/me")
      .then((response) => {
        if (cancelled) return;
        saveAuthSession({ token, user: response.data });
        window.location.replace(response.data.onboardingCompleted === false ? "/onboarding" : "/home");
      })
      .catch(() => {
        if (!cancelled) setError("We could not finish signing you in. Please try again.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="auth-callback">
      <BrandMark size={48} />
      <h1>{error ? "Sign-in paused" : "Finishing your sign-in…"}</h1>
      <p>{error || "Securing your Nerdding profile."}</p>
      {error && (
        <button className="primary-button" onClick={() => window.location.replace("/login")}>
          Back to sign in
        </button>
      )}
    </main>
  );
}
