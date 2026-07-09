self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  if (u.pathname.startsWith("/api/")) return; // market data: always fresh
  e.respondWith(
    caches.open("tb-v1").then(async (c) => {
      try {
        const r = await fetch(e.request);
        if (r.ok && u.origin === location.origin) c.put(e.request, r.clone());
        return r;
      } catch {
        const m = await c.match(e.request);
        return m || Response.error();
      }
    })
  );
});
