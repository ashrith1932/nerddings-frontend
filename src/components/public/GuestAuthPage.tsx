"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Github, LockKeyhole } from "lucide-react";
import { BrandMark, Wordmark } from "@/components/brand/BrandMark";
import PublicAboutSection from "@/components/public/PublicAboutSection";
import { getAuthToken, startOAuth } from "@/lib/api";

function navigate(href: string) {
  window.history.pushState({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function LegalLinks() {
  const open = (path: string) => {
    const from = `${window.location.pathname}${window.location.search}`;
    navigate(`${path}?from=${encodeURIComponent(from)}`);
  };

  return (
    <div className="legal-links">
      <button onClick={() => open("/privacy")}>Privacy</button>
      <span>·</span>
      <button onClick={() => open("/terms")}>Terms</button>
      <span>·</span>
      <button onClick={() => open("/community-guidelines")}>Guidelines</button>
      <span>·</span>
      <button onClick={() => open("/cookies")}>Cookies</button>
    </div>
  );
}

function OAuthButtons() {
  const [error, setError] = useState("");

  const begin = (provider: "google" | "github") => {
    try {
      startOAuth(provider);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "OAuth is not configured");
    }
  };

  return (
    <div className="oauth-stack">
      <button type="button" className="oauth-button" onClick={() => begin("google")}>
        <span className="oauth-google">G</span>
        <span>Continue with Google</span>
        <ArrowRight size={15} />
      </button>
      <button type="button" className="oauth-button" onClick={() => begin("github")}>
        <Github size={17} />
        <span>Continue with GitHub</span>
        <ArrowRight size={15} />
      </button>
      {error && <p className="auth-error">{error}</p>}
    </div>
  );
}

export default function GuestAuthPage({ register = false }: { register?: boolean }) {
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (getAuthToken()) {
      window.location.replace("/home");
      return;
    }
    setCheckingSession(false);
  }, []);

  if (checkingSession) {
    return <div className="auth-callback" aria-hidden="true" />;
  }

  return (
    <div className="public-entry-page">
      <div className="login-page">
        <div className="login-art">
          <div className="login-art-top">
            <Wordmark />
          </div>

          <div className="login-art-copy">
            <span className="eyebrow">THE SOCIAL NETWORK FOR</span>

            <h1>
              People
              <br />
              <i>building</i>
              <br />
              the future.
            </h1>

            <p>
              Build in public. Find your people.
              <br />
              Make something worth finding.
            </p>
          </div>

          <div className="login-art-symbol">
            <BrandMark size={190} inverted />
          </div>

          <small>nerdding.com · 2026</small>
        </div>

        <div className="login-panel">
          <div className="login-panel-top">
            <button className="login-back" onClick={() => navigate("/home")}>
              <ArrowLeft size={15} />
              Back to Nerdding
            </button>

            <span>
              {register ? "Already a member?" : "New to Nerdding?"}{" "}
              <button onClick={() => navigate(register ? "/login" : "/register")}>
                {register ? "Sign in" : "Create account"}
              </button>
            </span>
          </div>

          <div className="login-content">
            <BrandMark size={43} />

            <div className="eyebrow">
              {register ? "JOIN NERDDING" : "WELCOME TO NERDDING"}
            </div>

            <h1>
              {register ? (
                <>
                  Make your
                  <br />
                  <i>signal.</i>
                </>
              ) : (
                <>
                  Good to have
                  <br />
                  <i>you here.</i>
                </>
              )}
            </h1>

            <p>
              {register
                ? "Start with a secure provider, then shape your builder profile."
                : "Sign in securely and keep building your network."}
            </p>

            <OAuthButtons />

            <div className="oauth-divider">
              <span>ONE SECURE ACCOUNT</span>
            </div>

            <div className="login-benefits">
              <span>✓ No passwords to remember</span>
              <span>✓ Your profile is yours</span>
              <span>✓ Choose Builder or Agent next</span>
            </div>

            <small className="login-note">
              <LockKeyhole size={13} />
              Authentication is handled securely by your OAuth provider.
            </small>
          </div>

          <div className="login-footer">
            By continuing, you agree to Nerdding’s <LegalLinks />
          </div>
        </div>
      </div>

      <PublicAboutSection />
    </div>
  );
}
