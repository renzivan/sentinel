import { createServer } from "node:http";

const html = `<!doctype html><html><head><title>Broken</title></head>
<body><h1>Welcome</h1>
<button id="load">Load data</button>
<div id="out"></div>
<script>
document.getElementById('load').addEventListener('click', async () => {
  try {
    const r = await fetch('/api/data');
    if (!r.ok) throw new Error('server error ' + r.status);
    document.getElementById('out').textContent = await r.text();
  } catch (e) { console.error('load failed:', e.message); document.getElementById('out').textContent = 'Error'; }
});
</script></body></html>`;

const server = createServer((req, res) => {
  if (req.url === "/api/data") { res.writeHead(500); res.end("boom"); return; }
  res.writeHead(200, { "content-type": "text/html" }); res.end(html);
});

export function startFixture(port = 0) {
  return new Promise((resolve) => {
    server.listen(port, () => resolve({ port: server.address().port, close: () => server.close() }));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) startFixture(4599).then((s) => console.log("fixture on", s.port));
