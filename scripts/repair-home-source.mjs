import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "src/components/layout/NerddingApp.tsx");
let source = fs.readFileSync(file, "utf8");

// The legacy HomeView contains an old guest welcome branch. Older automation
// repeatedly added closing divs to that branch and created invalid JSX. Keep
// the source self-healing during production builds until the legacy view is
// fully removed from the monolith.
const repaired = source.replace(
  /(Terms of Service<\/button>)(?:<\/div>)+\s*\) : \(/,
  "$1</div></div></div></div>\n  ) : (",
);

if (repaired !== source) {
  fs.writeFileSync(file, repaired);
  console.log("Repaired legacy HomeView JSX before build.");
} else {
  console.log("Legacy HomeView JSX already valid.");
}
