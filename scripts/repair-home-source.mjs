import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const homeFile = path.join(root, "src/components/layout/NerddingApp.tsx");
let source = fs.readFileSync(homeFile, "utf8");
const repairedHome = source.replace(
  /(Terms of Service<\/button>)(?:<\/div>)+\s*\) : \(/,
  "$1</div></div></div></div>\n  ) : (",
);
if (repairedHome !== source) {
  fs.writeFileSync(homeFile, repairedHome);
  console.log("Repaired legacy HomeView JSX before build.");
}

const projectFile = path.join(root, "src/components/app/ProjectDetailSurface.tsx");
let projectSource = fs.readFileSync(projectFile, "utf8");
const repairedProject = projectSource.replace(
  /(<div className="project-skeleton-small"\/>){4}<\/div><\/div><\/div>;\n if\(!project\)return/,
  "$1$1$1$1</div></div></div></>;\n if(!project)return",
);
if (repairedProject !== projectSource) {
  fs.writeFileSync(projectFile, repairedProject);
  console.log("Repaired ProjectDetailSurface loading JSX before build.");
}

const feedFile = path.join(root, "src/components/social/HomeFeedSurface.tsx");
let feed = fs.readFileSync(feedFile, "utf8");
feed = feed.replace(".home-live-host>.view{display:none!important}", ".home-live-host .view{display:none!important}");
feed = feed.replace("saves: number; liked?", "saves: number; views?: number; liked?");

// Keep these source fragments literal. They contain JSX/JS template
// interpolation that must be written into HomeFeedSurface, not evaluated by
// this Node build-repair script.
const oldActions = '<div className="home-actions"><button className={post.liked ? "active" : ""} onClick={() => void action("like")}><Heart size={16} fill={post.liked ? "currentColor" : "none"} /><span>{post.likes}</span></button><button onClick={select}><MessageCircle size={16} /><span>{post.comments}</span></button><button className={post.reposted ? "active" : ""} onClick={() => void action("repost")}><Activity size={16} /><span>{post.reposts}</span></button><button className={post.saved ? "active" : ""} onClick={() => void action("save")}><Bookmark size={16} fill={post.saved ? "currentColor" : "none"} /></button><button onClick={select}><Quote size={16} /></button><button onClick={async () => { await navigator.clipboard?.writeText(`${window.location.origin}/post/${post.id}`); }}><Share2 size={16} /></button></div>';
const newActions = '<div className="home-actions"><div className="home-actions-left"><button className={post.liked ? "active" : ""} onClick={() => void action("like")}><Heart size={16} fill={post.liked ? "currentColor" : "none"} /><span>{post.likes}</span></button><button onClick={select}><MessageCircle size={16} /><span>{post.comments}</span></button><button className={post.reposted ? "active" : ""} onClick={() => void action("repost")}><Activity size={16} fill={post.reposted ? "currentColor" : "none"} /><span>{post.reposts}</span></button></div><div className="home-actions-right"><span title="Views">Views {post.views ?? 0}</span><button className={post.saved ? "active" : ""} onClick={() => void action("save")} title="Save"><Bookmark size={16} fill={post.saved ? "currentColor" : "none"} /><span>Save</span></button></div></div>';
if (feed.includes(oldActions)) {
  feed = feed.replace(oldActions, newActions);
} else {
  console.log("HomeFeedSurface action footer pattern not found.");
}

// Remove the redundant summary row above the action footer. The footer is the
// single source of truth for likes/comments/amplifies and views/save.
feed = feed.replace(/<div className="home-post-stats">.*?<\/div>/g, "");

// The global app stylesheet contains legacy flex rules that can collapse the
// action buttons into a vertical stack. Inject stronger, local rules into the
// HomeFeedSurface stylesheet so the footer is always a single horizontal row.
const actionCss = '.home-actions{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:space-between!important;flex-wrap:nowrap!important;gap:8px!important;min-width:0!important;width:100%!important}.home-actions-left,.home-actions-right{display:flex!important;flex-direction:row!important;align-items:center!important;flex-wrap:nowrap!important;gap:6px!important;min-width:0!important}.home-actions-left{flex:0 0 auto!important}.home-actions-right{margin-left:auto!important;flex:0 0 auto!important}.home-actions button{flex:0 0 auto!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important;min-width:auto!important;width:auto!important;height:30px!important;padding:6px 5px!important}.home-actions-right>span{display:inline-flex!important;align-items:center!important;white-space:nowrap!important;color:#7d736b!important;font-size:10px!important;padding:6px 4px!important}.home-actions-right button span{display:inline!important}.home-actions-right button svg{flex:0 0 auto!important}.home-post{min-width:0!important;overflow:hidden!important}@media(max-width:600px){.home-actions{gap:4px!important}.home-actions-left,.home-actions-right{gap:3px!important}.home-actions button{padding:5px 3px!important}.home-actions-right>span{padding:5px 3px!important}.home-actions button span{display:inline!important}.home-actions-right button span{display:inline!important}}';
feed = feed.replace('.home-actions button.active{color:var(--accent,#d85a2d)}', '.home-actions button.active{color:var(--accent,#d85a2d)}' + actionCss);

feed = feed.replace(
  '<div className="home-active-stats"><span>{current.likes} likes</span><span>{current.comments} comments</span><span>{current.reposts} nerddings</span></div>',
  '<div className="home-active-stats"><span>{current.likes} likes</span><span>{current.comments} comments</span><span>{current.reposts} amplifies</span><span>Views {current.views ?? 0}</span></div>',
);
fs.writeFileSync(feedFile, feed);
console.log("Polished HomeFeedSurface route/interaction markup before build.");