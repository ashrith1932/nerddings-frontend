import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const homeFile = path.join(root, "src/components/layout/NerddingApp.tsx");
let source = fs.readFileSync(homeFile, "utf8");

// The legacy HomeView contains an old guest welcome branch. Older automation
// repeatedly added closing divs to that branch and created invalid JSX. Keep
// the source self-healing during production builds until the legacy view is
// fully removed from the monolith.
const repairedHome = source.replace(
  /(Terms of Service<\/button>)(?:<\/div>)+\s*\) : \(/,
  "$1</div></div></div></div>\n  ) : (",
);

if (repairedHome !== source) {
  fs.writeFileSync(homeFile, repairedHome);
  console.log("Repaired legacy HomeView JSX before build.");
} else {
  console.log("Legacy HomeView JSX already valid.");
}

// ProjectDetailSurface has a loading-state fragment. Some generated versions
// omitted the fragment terminator and left a bare `</div>;`, which makes the
// TSX parser report an error at the following `className`. Repair the exact
// closing sequence so all three structural divs remain intact and the React
// fragment is closed correctly.
const projectFile = path.join(root, "src/components/app/ProjectDetailSurface.tsx");
let projectSource = fs.readFileSync(projectFile, "utf8");
const repairedProject = projectSource.replace(
  /(<div className="project-skeleton-small"\/>){4}<\/div><\/div><\/div>;\n if\(!project\)return/,
  "$1$1$1$1</div></div></div></>;\n if(!project)return",
);

if (repairedProject !== projectSource) {
  fs.writeFileSync(projectFile, repairedProject);
  console.log("Repaired ProjectDetailSurface loading JSX before build.");
} else {
  console.log("ProjectDetailSurface loading JSX already valid.");
}
