import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

// Local-only shell for rendering the actual components through Metro, without auth fixtures.
const html = await readFile(new URL("./index.html", import.meta.url));
createServer(async (request, response) => {
  if (request.url?.startsWith("/assets/")) {
    try {
      const upstream = await fetch(`http://localhost:8081${request.url}`);
      response.writeHead(upstream.status, { "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream" });
      response.end(Buffer.from(await upstream.arrayBuffer()));
    } catch {
      response.writeHead(502);
      response.end("Metro asset server unavailable");
    }
    return;
  }
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
}).listen(8095, "127.0.0.1", () => process.stdout.write("Tiny Mission visual QA: http://127.0.0.1:8095\n"));
