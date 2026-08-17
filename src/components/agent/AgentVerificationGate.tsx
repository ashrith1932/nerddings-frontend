"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clipboard, Globe2, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { BrandMark, Wordmark } from "@/components/brand/BrandMark";
import { apiFetch, getAuthToken, getSavedUser, saveAuthSession, startOAuth, type ApiUser } from "@/lib/api";

type RequestData = {
  id: string;
  organizationName: string;
  organizationType: string;
  website: string;
  domain: string;
  country: string;
  description: string;
  dnsRecordName: string;
  dnsRecordValue: string;
  dnsVerified: boolean;
  status: "pending_dns" | "pending_review" | "approved" | "rejected";
  verificationNote?: string | null;
};

type QueueItem = RequestData & { applicant: { id: string; name: string; username: string; email: string } };

const shellStyle: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 100000, overflow: "auto", background: "#f7f4ee", color: "#191612" };
const cardStyle: React.CSSProperties = { background: "#fffdf9", border: "1px solid #ded7ce", borderRadius: 16, padding: 26, boxShadow: "0 18px 55px rgba(25,22,18,.08)" };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #d8d0c7", borderRadius: 10, padding: "12px 13px", background: "#fff", color: "#191612", font: "inherit" };
const buttonStyle: React.CSSProperties = { border: 0, borderRadius: 10, padding: "11px 16px", cursor: "pointer", fontWeight: 700 };

function Field({ label, value, onChange, placeholder, type = "text", textarea = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; textarea?: boolean }) {
  return <label style={{ display: "grid", gap: 7, fontSize: 12, fontWeight: 700, letterSpacing: ".03em" }}><span>{label}</span>{textarea ? <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} style={{ ...inputStyle, resize: "vertical" }} /> : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={inputStyle} />}</label>;
}

function AuthButton({ provider }: { provider: "google" | "github" }) {
  return <button style={{ ...buttonStyle, width: "100%", background: "#191612", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }} onClick={() => startOAuth(provider)}>Continue with {provider === "google" ? "Google" : "GitHub"} <ArrowRight size={15} /></button>;
}

function GateFrame({ children, title, eyebrow, onBack }: { children: React.ReactNode; title: string; eyebrow: string; onBack?: () => void }) {
  return <div style={shellStyle}><header style={{ height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 34px", borderBottom: "1px solid #ded7ce", background: "#fbf8f3", position: "sticky", top: 0, zIndex: 2 }}><button onClick={onBack} style={{ background: "none", border: 0, cursor: onBack ? "pointer" : "default" }}><Wordmark /></button>{onBack && <button style={{ ...buttonStyle, background: "transparent", border: "1px solid #d8d0c7", fontWeight: 600 }} onClick={onBack}><ArrowLeft size={14} /> Back</button>}</header><main style={{ maxWidth: 980, margin: "0 auto", padding: "54px 22px 80px" }}><div style={{ maxWidth: 700, marginBottom: 28 }}><div style={{ fontSize: 11, letterSpacing: ".16em", fontWeight: 800, color: "#e4572e" }}>{eyebrow}</div><h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(32px,5vw,54px)", lineHeight: 1.02, margin: "10px 0 12px" }}>{title}</h1></div>{children}</main></div>;
}

function AgentLogin() {
  return <GateFrame eyebrow="OFFICIAL AGENT ACCESS" title={<>Verify your organization.<br /><i>Earn the badge.</i></>} onBack={() => { window.history.pushState({}, "", "/home"); window.dispatchEvent(new PopStateEvent("popstate")); }}><div style={{ ...cardStyle, maxWidth: 520, display: "grid", gap: 13 }}><p style={{ margin: 0, color: "#665f57", lineHeight: 1.6 }}>Agent access is not granted by choosing “Agent” at login. Sign in with your identity provider first, then complete organization details, prove domain ownership, and wait for Nerdding’s verification team to approve the application.</p><AuthButton provider="google" /><AuthButton provider="github" /><div style={{ display: "flex", alignItems: "center", gap: 12, color: "#8a8178", fontSize: 11, marginTop: 4 }}><span style={{ height: 1, flex: 1, background: "#ded7ce" }} /><span>NO PASSWORDS</span><span style={{ height: 1, flex: 1, background: "#ded7ce" }} /></div><small style={{ color: "#8a8178", display: "flex", gap: 7, alignItems: "center" }}><LockKeyhole size={13} /> OAuth authenticates the person; DNS + team review verifies the organization.</small></div></GateFrame>;
}

function OnboardingGate() {
  const saved = getSavedUser();
  const [accountType, setAccountType] = useState<"user" | "agent">("user");
  const [name, setName] = useState(saved?.name ?? "");
  const [username, setUsername] = useState(saved?.username ?? "");
  const [interests, setInterests] = useState<string[]>([]);
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("Company");
  const [website, setWebsite] = useState("");
  const [domain, setDomain] = useState("");
  const [country, setCountry] = useState("India");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const interestOptions = ["AI & agents", "Climate tech", "Open source", "Product craft", "BioTech", "Indie hacking"];

  useEffect(() => {
    if (!getAuthToken()) return;
    apiFetch<{ data: RequestData | null }>("/agent-verification/me").then((response) => {
      if (response.data && ["pending_dns", "pending_review"].includes(response.data.status)) {
        window.history.replaceState({}, "", "/agent/verification");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    }).catch(() => undefined);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (accountType === "user") {
        const response = await apiFetch<{ data: ApiUser }>("/auth/onboarding", { method: "POST", body: JSON.stringify({ name, username, accountType: "user", interests }) });
        const token = getAuthToken(); if (token) saveAuthSession({ token, user: response.data });
        window.history.replaceState({}, "", "/home"); window.dispatchEvent(new PopStateEvent("popstate")); window.location.reload(); return;
      }
      const profile = await apiFetch<{ data: ApiUser }>("/auth/onboarding", { method: "POST", body: JSON.stringify({ name, username, accountType: "user", interests }) });
      const application = await apiFetch<{ data: RequestData }>("/agent-verification/apply", { method: "POST", body: JSON.stringify({ organizationName, organizationType, website, domain, country, description }) });
      const token = getAuthToken(); if (token) saveAuthSession({ token, user: { ...profile.data, agentVerificationStatus: application.data.status, agentVerificationId: application.data.id } });
      window.history.replaceState({}, "", "/agent/verification"); window.dispatchEvent(new PopStateEvent("popstate")); window.location.reload();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to complete setup."); }
    finally { setBusy(false); }
  };

  return <GateFrame eyebrow="STEP 1 · IDENTITY" title={accountType === "agent" ? <>Tell us about the <i>organization.</i></> : <>Tell us about <i>you.</i></>}><form onSubmit={submit} style={{ display: "grid", gap: 18 }}><div style={{ ...cardStyle, display: "grid", gap: 16 }}><div style={{ display: "grid", gap: 7 }}><span style={{ fontSize: 12, fontWeight: 800 }}>I’m joining as</span><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}><button type="button" onClick={() => setAccountType("user")} style={{ ...buttonStyle, background: accountType === "user" ? "#e4572e" : "#f1ece5", color: accountType === "user" ? "#fff" : "#2b2622" }}>Builder / user</button><button type="button" onClick={() => setAccountType("agent")} style={{ ...buttonStyle, background: accountType === "agent" ? "#e4572e" : "#f1ece5", color: accountType === "agent" ? "#fff" : "#2b2622" }}>Organization / Agent</button></div></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}><Field label="YOUR NAME" value={name} onChange={setName} placeholder="Your name" /><Field label="USERNAME" value={username} onChange={setUsername} placeholder="ashrith.builds" /></div>{accountType === "agent" && <><div style={{ height: 1, background: "#ded7ce" }} /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}><Field label="ORGANIZATION NAME" value={organizationName} onChange={setOrganizationName} placeholder="Acme Labs" /><label style={{ display: "grid", gap: 7, fontSize: 12, fontWeight: 700 }}><span>ORGANIZATION TYPE</span><select value={organizationType} onChange={(event) => setOrganizationType(event.target.value)} style={inputStyle}><option>Company</option><option>Startup</option><option>University</option><option>VC / Fund</option><option>Non-profit</option><option>Research lab</option><option>Community</option></select></label></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}><Field label="OFFICIAL WEBSITE" value={website} onChange={setWebsite} placeholder="https://example.com" type="url" /><Field label="DOMAIN" value={domain} onChange={setDomain} placeholder="example.com" /></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}><Field label="COUNTRY" value={country} onChange={setCountry} placeholder="India" /><Field label="ORGANIZATION DESCRIPTION" value={description} onChange={setDescription} placeholder="What does the organization do?" textarea /></div><div style={{ padding: 14, borderRadius: 10, background: "#f3eee7", display: "flex", gap: 10, alignItems: "flex-start" }}><Globe2 size={17} color="#e4572e" /><span style={{ fontSize: 12, lineHeight: 1.5 }}>After submission, Nerdding gives you a unique DNS TXT record. Add it to your domain, verify it, and the request enters the team verification chamber. You are <strong>not</strong> an Agent yet.</span></div></>}{accountType === "user" && <div><span style={{ fontSize: 12, fontWeight: 800 }}>WHAT ARE YOU CURIOUS ABOUT?</span><div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 9 }}>{interestOptions.map((interest) => <button key={interest} type="button" onClick={() => setInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest])} style={{ ...buttonStyle, padding: "8px 11px", background: interests.includes(interest) ? "#191612" : "#f1ece5", color: interests.includes(interest) ? "#fff" : "#2b2622", fontSize: 12 }}>{interest}</button>)}</div></div>}</div>{error && <div style={{ ...cardStyle, color: "#a52d16", borderColor: "#e2b6a8" }}>{error}</div>}<button disabled={busy} style={{ ...buttonStyle, background: "#e4572e", color: "#fff", justifySelf: "start", padding: "13px 18px" }}>{busy ? "Saving…" : accountType === "agent" ? "Submit organization for verification" : "Enter Nerdding"} <ArrowRight size={15} /></button></form></GateFrame>;
}

function VerificationStatusView() {
  const [request, setRequest] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = async () => { setLoading(true); try { const response = await apiFetch<{ data: RequestData | null }>("/agent-verification/me"); setRequest(response.data); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load verification status."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const verify = async () => { if (!request) return; setBusy(true); setMessage(""); try { const response = await apiFetch<{ data: RequestData }>(`/agent-verification/${request.id}/verify-dns`, { method: "POST" }); setRequest(response.data); } catch (error) { setMessage(error instanceof Error ? error.message : "DNS verification failed."); } finally { setBusy(false); } };
  const copy = async (value: string) => { await navigator.clipboard?.writeText(value); setMessage("Copied to clipboard."); };
  if (loading) return <GateFrame eyebrow="AGENT VERIFICATION" title={<>Checking your <i>verification.</i></>}><div style={cardStyle}>Loading verification status…</div></GateFrame>;
  if (!request) return <GateFrame eyebrow="AGENT VERIFICATION" title={<>No active <i>application.</i></>}><div style={cardStyle}>Start again from onboarding to submit your organization.</div></GateFrame>;
  const statusText = request.status === "pending_dns" ? "Domain ownership required" : request.status === "pending_review" ? "Waiting for Nerdding review" : request.status === "approved" ? "Agent approved" : "Application not approved";
  return <GateFrame eyebrow="AGENT VERIFICATION CHAMBER" title={<>{statusText}. <i>{request.organizationName}</i></>} onBack={() => { window.history.pushState({}, "", "/home"); window.dispatchEvent(new PopStateEvent("popstate")); }}><div style={{ display: "grid", gap: 16 }}><div style={{ ...cardStyle, display: "grid", gap: 12 }}><div style={{ display: "flex", gap: 12, alignItems: "center" }}><span style={{ width: 42, height: 42, borderRadius: 12, display: "grid", placeItems: "center", background: request.status === "approved" ? "#e9f5ec" : "#f3eee7", color: request.status === "approved" ? "#237a3a" : "#e4572e" }}>{request.status === "approved" ? <Check size={20} /> : <ShieldCheck size={20} />}</span><div><strong>{request.domain}</strong><small style={{ display: "block", color: "#81786f" }}>{request.organizationType} · {request.country}</small></div></div>{request.status === "pending_dns" && <><p style={{ margin: 0, lineHeight: 1.6 }}>Add this TXT record to your DNS provider. We only move your application to the team chamber after the record is found.</p><div style={{ display: "grid", gap: 9 }}><strong style={{ fontSize: 11 }}>RECORD NAME</strong><div style={{ display: "flex", gap: 8 }}><code style={{ ...inputStyle, flex: 1 }}>{request.dnsRecordName}</code><button onClick={() => void copy(request.dnsRecordName)} style={{ ...buttonStyle, background: "#191612", color: "#fff" }}><Clipboard size={15} /></button></div><strong style={{ fontSize: 11 }}>TXT VALUE</strong><div style={{ display: "flex", gap: 8 }}><code style={{ ...inputStyle, flex: 1, wordBreak: "break-all" }}>{request.dnsRecordValue}</code><button onClick={() => void copy(request.dnsRecordValue)} style={{ ...buttonStyle, background: "#191612", color: "#fff" }}><Clipboard size={15} /></button></div></div><button disabled={busy} onClick={() => void verify()} style={{ ...buttonStyle, background: "#e4572e", color: "#fff", justifySelf: "start" }}>{busy ? "Checking DNS…" : "Verify DNS record"} <ArrowRight size={15} /></button></>}{request.status === "pending_review" && <div style={{ padding: 15, borderRadius: 10, background: "#f3eee7", lineHeight: 1.6 }}>DNS ownership is confirmed. Your application is now in the <strong>verification chamber</strong>. Our team must approve it before your Agent profile is created.</div>}{request.status === "approved" && <div style={{ padding: 15, borderRadius: 10, background: "#e9f5ec", color: "#237a3a", lineHeight: 1.6 }}>Approved. Sign in again if you still see the old Builder session; your next session will carry Agent privileges.</div>}{request.status === "rejected" && <div style={{ padding: 15, borderRadius: 10, background: "#f8e9e5", color: "#8c2c1b", lineHeight: 1.6 }}><strong>Review note:</strong> {request.verificationNote ?? "The team could not approve this application."}</div>}{message && <small style={{ color: request.status === "rejected" ? "#8c2c1b" : "#756d65" }}>{message}</small>}</div></div></GateFrame>;
}

function ReviewChamber() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const load = async () => { try { const response = await apiFetch<{ data: QueueItem[] }>("/agent-verification/review-queue"); setQueue(response.data); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to open the verification chamber."); } };
  useEffect(() => { void load(); }, []);
  const review = async (id: string, decision: "approve" | "reject") => { setBusy(id); try { await apiFetch(`/agent-verification/${id}/review`, { method: "POST", body: JSON.stringify({ decision, note: note[id] ?? "" }) }); setQueue((current) => current.filter((item) => item.id !== id)); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Review failed."); } finally { setBusy(""); } };
  return <GateFrame eyebrow="NERDDING INTERNAL" title={<>Agent verification <i>chamber.</i></>} onBack={() => { window.history.pushState({}, "", "/home"); window.dispatchEvent(new PopStateEvent("popstate")); }}><div style={{ display: "grid", gap: 14 }}>{error && <div style={{ ...cardStyle, color: "#8c2c1b" }}>{error}</div>}{queue.length ? queue.map((item) => <article key={item.id} style={{ ...cardStyle, display: "grid", gap: 14 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}><div><div style={{ fontSize: 11, letterSpacing: ".1em", color: "#e4572e", fontWeight: 800 }}>DNS VERIFIED · READY FOR REVIEW</div><h2 style={{ margin: "6px 0" }}>{item.organizationName}</h2><p style={{ margin: 0, color: "#70685f" }}>{item.organizationType} · {item.domain} · {item.country}</p></div><span style={{ padding: "7px 10px", borderRadius: 999, background: "#e9f5ec", color: "#237a3a", fontSize: 11, fontWeight: 800 }}>DOMAIN VERIFIED</span></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}><div><strong>Applicant</strong><p>{item.applicant.name} · @{item.applicant.username}<br />{item.applicant.email}</p></div><div><strong>Website</strong><p>{item.website}</p></div></div><p style={{ margin: 0, lineHeight: 1.6 }}>{item.description}</p><textarea value={note[item.id] ?? ""} onChange={(event) => setNote((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Internal review note (optional)" rows={3} style={{ ...inputStyle, resize: "vertical" }} /><div style={{ display: "flex", gap: 8 }}><button disabled={busy === item.id} onClick={() => void review(item.id, "approve")} style={{ ...buttonStyle, background: "#237a3a", color: "#fff" }}><Check size={15} /> Approve Agent</button><button disabled={busy === item.id} onClick={() => void review(item.id, "reject")} style={{ ...buttonStyle, background: "#f3eee7", color: "#8c2c1b" }}><X size={15} /> Reject</button></div></article>) : <div style={{ ...cardStyle, textAlign: "center", padding: 50 }}><ShieldCheck size={28} /><h3>No applications waiting for review.</h3><p style={{ color: "#81786f" }}>Only DNS-verified applications appear here.</p></div>}</div></GateFrame>;
}

export default function AgentVerificationGate() {
  const [path, setPath] = useState(() => typeof window === "undefined" ? "/" : window.location.pathname);
  useEffect(() => { const sync = () => setPath(window.location.pathname); window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync); }, []);
  useEffect(() => {
    const active = path === "/onboarding" || path === "/agent/login" || path === "/agent/verification" || path === "/verification-chamber";
    document.documentElement.classList.toggle("agent-gate-active", active);
    return () => document.documentElement.classList.remove("agent-gate-active");
  }, [path]);
  const active = useMemo(() => path === "/onboarding" || path === "/agent/login" || path === "/agent/verification" || path === "/verification-chamber", [path]);
  if (!active) return null;
  if (path === "/agent/login") return <AgentLogin />;
  if (path === "/verification-chamber") return <ReviewChamber />;
  if (path === "/agent/verification") return <VerificationStatusView />;
  return <OnboardingGate />;
}
