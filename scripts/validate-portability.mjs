import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const bad = /[A-Z]:\\|iCloudDrive|node:fs|from ['"]fs['"]|from ['"]path['"]/i;
function scan(dir){for(const name of readdirSync(dir)){if(["node_modules",".git"].includes(name))continue;const p=join(dir,name);if(statSync(p).isDirectory())scan(p);else if(/\.(ts|mjs|json|md)$/.test(name)&&bad.test(readFileSync(p,"utf8")))throw new Error(`Portability issue in ${p}`);}}
scan(join(process.cwd(), "src")); console.log("Portability scan passed.");
