import * as fs from "fs";
import * as path from "path";
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(__dirname)

const apiDir = path.join(__dirname, "../app/api");

function listEndpointsWithMethods(dir, base = "/api") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let results = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const newBase = `${base}/${entry.name}`;
      results = results.concat(listEndpointsWithMethods(fullPath, newBase));
    } else if (entry.isFile() && (entry.name === "route.ts" || entry.name === "route.js")) {
      const content = fs.readFileSync(fullPath, "utf-8");
      const methods = [];

      if (/export\s+const\s+GET/.test(content)) methods.push("GET");
      if (/export\s+const\s+POST/.test(content)) methods.push("POST");
      if (/export\s+const\s+PUT/.test(content)) methods.push("PUT");
      if (/export\s+const\s+DELETE/.test(content)) methods.push("DELETE");
      if (/export\s+const\s+PATCH/.test(content)) methods.push("PATCH");

      if (methods.length === 0) methods.push("UNKNOWN");

      results.push({ route: base, methods });
    }
  }

  return results;
}

const endpoints = listEndpointsWithMethods(apiDir);

console.log("📦 API Endpoints and Methods:");
endpoints.forEach((e) => {
  console.log(`➡️ ${e.route} [${e.methods.join(", ")}]`);
});
