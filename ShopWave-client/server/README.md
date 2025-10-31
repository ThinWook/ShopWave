# HTTP/2 reverse proxy for Next.js

This folder contains a small Node.js HTTP/2 TLS reverse proxy that sits in front of the Next.js server.

- Local dev: uses a self-signed certificate so browsers can negotiate HTTP/2 over https.
- Production: provide a real certificate and key and pass `--no-selfsigned` with `--cert` and `--key`.

## Response compression (Brotli + gzip)

The proxy performs on-the-fly compression with Brotli (`br`) when supported by the client, and falls back to gzip when Brotli is not available. Next.js' built-in compression is disabled (`compress: false` in `next.config.ts`) to avoid double-compression. The proxy automatically skips already-encoded responses and non-compressible content types.

What gets compressed:

- text/\* (except Server-Sent Events `text/event-stream`)
- application/json, application/javascript, xml, and SVG

What isn’t compressed:

- images, fonts (e.g., woff2), archives (zip/gzip), and anything the upstream already encodes

## Scripts

- `npm run dev:h2` — starts Next.dev on :3000 and the HTTP/2 proxy on https://localhost:3443
- `npm run start:h2` — starts Next.start on :3000 and the HTTP/2 proxy on https://localhost:3443 (requires `--cert` and `--key` in env or adjust script)

## Custom certs

If you have your own TLS certificate and key files, you can run the proxy manually:

```powershell
node server/h2.js -p 3443 -t http://127.0.0.1:3000 --cert C:\path\to\cert.pem --key C:\path\to\key.pem
```

For local development with a browser, you will need to trust the generated self-signed cert or click through the warning page once.

## Verify compression locally

Use PowerShell to verify `Content-Encoding: br` (or gzip when Brotli isn't supported):

```powershell
# Start the proxy + dev server
npm run dev:h2

# In a separate PowerShell window, test a route that returns HTML/JSON/JS/CSS
curl -sik https://localhost:3443/ -H "Accept-Encoding: br,gzip" | Select-String "Content-Encoding"
```

You should see `Content-Encoding: br`. If you only advertise gzip (`-H "Accept-Encoding: gzip"`), you'll see gzip. If you don't send an `Accept-Encoding` header, you should see no `Content-Encoding` header for compressible payloads.

## Production notes

- If you terminate TLS and HTTP/2 at a fronting proxy (e.g., Nginx/Envoy/Cloudflare) that already adds Brotli, you can run the Node proxy without compression or bypass it entirely—ensure you don’t double-compress.
- If you keep this Node proxy in front, supply real cert/key files and run `npm run start:h2` or invoke `server/h2.js` with `--no-selfsigned --cert ... --key ...`.
