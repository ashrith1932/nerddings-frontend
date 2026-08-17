export default function Loading() {
  return (
    <main className="app-loading" aria-label="Loading">
      <div className="loading-shell">
        <div className="loading-sidebar">
          <div className="loading-logo shimmer" />
          {Array.from({ length: 6 }).map((_, i) => <div className="loading-nav shimmer" key={i} />)}
        </div>
        <div className="loading-main">
          <div className="loading-header shimmer" />
          <div className="loading-tabs shimmer" />
          <div className="loading-composer shimmer" />
          <div className="loading-post shimmer" />
          <div className="loading-post shimmer" />
        </div>
      </div>
      <style>{`
        .app-loading{min-height:100vh;background:#f7f4ee;color:#191612}.loading-shell{display:flex;min-height:100vh}.loading-sidebar{width:244px;flex:0 0 244px;border-right:1px solid #ded7ce;background:#fbf8f3;padding:22px 16px}.loading-logo{height:34px;width:145px;border-radius:9px;margin:7px 10px 28px}.loading-nav{height:42px;border-radius:10px;margin:7px 0}.loading-main{flex:1;min-width:0;padding:0 28px 60px;max-width:1100px;margin:0 auto}.loading-header{height:62px;border-radius:0 0 12px 12px;margin-bottom:25px}.loading-tabs{height:45px;width:55%;border-radius:8px;margin-bottom:12px}.loading-composer{height:60px;border-radius:12px;margin-bottom:12px}.loading-post{height:210px;border-radius:12px;margin-bottom:10px}.shimmer{background:linear-gradient(90deg,#eee8df 25%,#faf7f1 50%,#eee8df 75%);background-size:200% 100%;animation:loading-shimmer 1.15s ease-in-out infinite}@keyframes loading-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@media(max-width:700px){.loading-sidebar{width:76px;flex-basis:76px;padding:14px 10px}.loading-logo{width:42px;margin-left:6px}.loading-nav{height:38px}.loading-main{padding:0 12px}.loading-header{height:52px}.loading-tabs{width:80%}}@media(prefers-reduced-motion:reduce){.shimmer{animation:none}}
      `}</style>
    </main>
  );
}
