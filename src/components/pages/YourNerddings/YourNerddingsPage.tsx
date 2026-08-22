"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, ArrowUpRight, MessageCircle } from "lucide-react";
import { apiFetch, getSavedUser } from "@/lib/api";
import { VerifiedMark } from "@/components/ui/Avatar";
import VerifiedName from "@/components/ui/VerifiedName";
import { PostCard, ActivePostModal, homeFeedStyles, fetchDetail } from "@/components/social/HomeFeedSurface";
import ProjectPreviewInline from "@/components/projects/ProjectPreviewInline";

type FeedPost = any; // We can use 'any' or import it if needed, but since we map directly, any is fine for local state
type Person = { id: string; name: string; username: string; accountType?: string; verified?: boolean; avatarUrl?: string | null };

const initials = (name?: string) => (name || "N").split(/\s+/).filter(Boolean).map((x) => x[0]).join("").slice(0, 2).toUpperCase();

export default function YourNerddingsRoute() {
  const [saved, setSaved] = useState<FeedPost[]>([]);
  const [following, setFollowing] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [projectSlug, setProjectSlug] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      apiFetch<{ data: FeedPost[] }>("/social/feed?mode=saved").catch(() => ({ data: [] })),
      apiFetch<{ data: { following: Person[] } }>("/nerddings").catch(() => ({ data: { following: [] } }))
    ]).then(([savedRes, nerddingsRes]) => {
      if (!alive) return;
      setSaved(savedRes.data ?? []);
      setFollowing(nerddingsRes.data.following ?? []);
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const openPost = async (id: string) => {
    const existing = saved.find(p => p.id === id);
    if (existing) {
      setSelectedPostId(id);
      setProjectSlug(null);
      return;
    }
    const detail = await fetchDetail(id);
    if (!detail) return;
    const normalized: FeedPost = { ...detail, authorId: detail.author.id };
    setSaved(cur => cur.some(p => p.id === id) ? cur : [...cur, normalized]);
    setSelectedPostId(id);
    setProjectSlug(null);
  };

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{postId?:string;fromHistory?:boolean}>).detail;
      if (detail?.postId) void openPost(detail.postId);
    };
    const onProj = (event: Event) => {
      const slug = (event as CustomEvent<{slug?:string}>).detail?.slug;
      if (slug) setProjectSlug(slug);
    };
    window.addEventListener("nerdding:open-post", onOpen);
    window.addEventListener("nerdding:open-project-inline", onProj);
    return () => {
      window.removeEventListener("nerdding:open-post", onOpen);
      window.removeEventListener("nerdding:open-project-inline", onProj);
    }
  }, [saved]);

  const changed = (id: string, patch: Partial<FeedPost>) => setSaved(cur => cur.map(p => p.id === id ? { ...p, ...patch } : p));
  const selected = useMemo(() => selectedPostId ? (saved.find(p => p.id === selectedPostId) ?? null) : null, [saved, selectedPostId]);

  const css = `.your-nerddings-route{min-height:calc(100dvh - 130px);padding:4px 0 50px;background:var(--paper,#f9f7f2)}.your-nerddings-route .yn-head{margin-bottom:18px}.your-nerddings-route h1{font:700 28px 'Space Grotesk',sans-serif;margin:3px 0 6px;color:#201c19}.your-nerddings-route p{font-size:11px;color:#8d837a}.your-nerddings-route .yn-grid{display:grid;grid-template-columns:minmax(0,1fr) 420px;gap:18px;align-items:start}.your-nerddings-route .yn-card{background:#fffdf9;border:1px solid #ded7cf;border-radius:14px;overflow:hidden}.your-nerddings-route .yn-card-head{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid #eee8e1}.your-nerddings-route .yn-card-head strong{font:700 13px 'Space Grotesk',sans-serif}.your-nerddings-route .yn-item{display:flex;align-items:center;gap:11px;padding:13px 16px;border-bottom:1px solid #eee8e1;width:100%;border:0;border-bottom:1px solid #eee8e1;background:none;text-align:left;cursor:pointer}.your-nerddings-route .yn-item:last-child{border-bottom:0}.your-nerddings-route .yn-avatar{width:36px;height:36px;flex:0 0 36px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:#ebe5dd;font-size:10px;font-weight:800}.your-nerddings-route .yn-avatar img{width:100%;height:100%;object-fit:cover}.your-nerddings-route .yn-copy{min-width:0;flex:1}.your-nerddings-route .yn-copy strong{font-size:11px;color:#29241f;display:flex;align-items:center;gap:4px}.your-nerddings-route .yn-copy small{display:block;margin-top:3px;font-size:9px;color:#938980}.your-nerddings-route .yn-empty{padding:42px 20px;text-align:center;color:#948a81;font-size:10px}.your-nerddings-route .yn-error{padding:28px;text-align:center;color:#b64a30;font-size:11px}.your-nerddings-route .yn-skeleton{height:74px;border-bottom:1px solid #eee8e1;background:linear-gradient(90deg,#fffdf9 25%,#f1ece5 37%,#fffdf9 63%);background-size:400% 100%;animation:ynShimmer 1.2s infinite}@keyframes ynShimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
  @media(max-width:1100px){.your-nerddings-route .yn-grid{grid-template-columns:minmax(0,1fr) 390px}}
  @media(max-width:920px){.your-nerddings-route .yn-grid{grid-template-columns:1fr}}`;

  return (
    <div className="your-nerddings-route">
      <style>{css}</style>
      <style>{homeFeedStyles}</style>
      <div className="yn-head">
        <div className="eyebrow">YOUR ACTIVITY</div>
        <h1>Your Nerddings</h1>
        <p>Your saved posts and people you follow.</p>
      </div>
      {error ? <div className="yn-error">{error}</div> : (
        <div className="yn-grid">
          {/* LEFT: Saved posts */}
          <main className="home-feed-column" style={{maxHeight:'calc(100dvh - 130px)'}}>
            {loading ? Array.from({ length: 3 }, (_, i) => <div className="yn-skeleton" key={i} style={{marginBottom:11, borderRadius:12, height:140}} />) :
              saved.length ? saved.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  selected={selectedPostId === post.id} 
                  select={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)} 
                  openPost={openPost} 
                  onChanged={changed} 
                />
              )) : (
                <div className="yn-empty">
                  <MessageCircle size={20} style={{margin:'0 auto 10px', display:'block'}} />
                  <strong>No saved posts</strong>
                  <div style={{marginTop:4}}>You haven't saved any posts yet.</div>
                </div>
              )
            }
          </main>

          {/* RIGHT: Post detail panel OR project preview OR following list */}
          {projectSlug ? (
            <ProjectPreviewInline slug={projectSlug} onClose={() => setProjectSlug(null)} onOpenFull={() => {
              setProjectSlug(null);
              window.history.pushState({}, "", `/project/${encodeURIComponent(projectSlug)}`);
              window.dispatchEvent(new PopStateEvent("popstate"));
            }} />
          ) : selected ? (
            <ActivePostModal key={selected.id} post={selected} close={() => setSelectedPostId(null)} openPost={openPost} />
          ) : (
            <aside className="yn-card">
              <div className="yn-card-head">
                <strong><Users size={14} /> Following</strong>
                <span>{following.length}</span>
              </div>
              {loading ? Array.from({ length: 4 }, (_, i) => <div className="yn-skeleton" key={i} />) :
                following.length ? following.map((person) => (
                  <button className="yn-item" key={person.id} onClick={() => { window.history.pushState({}, "", `/profile/${encodeURIComponent(person.username)}`); window.dispatchEvent(new PopStateEvent("popstate")); }}>
                    <span className="yn-avatar">{person.avatarUrl ? <img src={person.avatarUrl} alt="" /> : initials(person.name)}</span>
                    <span className="yn-copy">
                      <strong><VerifiedName name={person.name} verified={person.verified} /></strong>
                      <small>@{person.username}</small>
                    </span>
                    <ArrowUpRight size={14} />
                  </button>
                )) : <div className="yn-empty"><Users size={20} style={{margin:'0 auto 10px', display:'block'}}/><div>You are not following anyone yet.</div></div>
              }
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
