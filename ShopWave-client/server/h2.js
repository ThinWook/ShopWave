/**
 * Simple HTTP/2 TLS reverse proxy for Next.js
 * - Terminates TLS and serves HTTP/2 (with HTTP/1.1 fallback)
 * - Proxies all traffic to the Next.js server (default: http://127.0.0.1:3000)
 *
 * Notes:
 * - Browsers require TLS for HTTP/2, so we generate a self-signed cert for local usage.
 * - In production, provide real cert/key via env or files and disable self-signed generation.
 */

const fs = require("fs");
const path = require("path");
const http2 = require("http2");
// We used to rely on http2-proxy, but to support on-the-fly Brotli/gzip compression
// we proxy manually using Node core http/https clients so we can transform responses.
const http = require("http");
const https = require("https");
const zlib = require("zlib");

// Optional: generate self-signed certificate for local dev
function getOrCreateDevCert(certDir) {
  const certPath = path.join(certDir, "dev-cert.pem");
  const keyPath = path.join(certDir, "dev-key.pem");

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    return {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    };
  }

  // Lazy import to avoid dependency at runtime if not used
  const selfsigned = require("selfsigned");
  const pems = selfsigned.generate(
    [
      { name: "commonName", value: "localhost" },
      { name: "organizationName", value: "Local Dev" },
    ],
    {
      algorithm: "rsa",
      days: 365,
      keySize: 2048,
      extensions: [
        {
          name: "subjectAltName",
          altNames: [
            { type: 2, value: "localhost" }, // DNS
            { type: 7, ip: "127.0.0.1" },
          ],
        },
      ],
    }
  );

  fs.mkdirSync(certDir, { recursive: true });
  fs.writeFileSync(certPath, pems.cert);
  fs.writeFileSync(keyPath, pems.private);
  return { cert: pems.cert, key: pems.private };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--port" || a === "-p") out.port = Number(args[++i]);
    else if (a === "--target" || a === "-t") out.target = args[++i];
    else if (a === "--cert") out.cert = args[++i];
    else if (a === "--key") out.key = args[++i];
    else if (a === "--no-selfsigned") out.noSelfSigned = true;
  }
  return out;
}

async function main() {
  const {
    port = Number(process.env.H2_PORT) || 3443,
    target = process.env.H2_TARGET || "http://127.0.0.1:3000",
    cert: certFile,
    key: keyFile,
    noSelfSigned = false,
  } = parseArgs();

  let cert;
  let key;

  if (certFile && keyFile) {
    cert = fs.readFileSync(path.resolve(certFile));
    key = fs.readFileSync(path.resolve(keyFile));
  } else if (!noSelfSigned) {
    const creds = getOrCreateDevCert(path.join(__dirname, "certs"));
    cert = creds.cert;
    key = creds.key;
  } else {
    throw new Error(
      "TLS cert/key are required when self-signed generation is disabled"
    );
  }

  const targetUrl = new URL(target);

  const server = http2.createSecureServer(
    {
      key,
      cert,
      allowHTTP1: true, // allow HTTP/1.1 for clients that don't support h2 and for WS during dev
      // Stronger defaults can be configured here (ciphers, honorCipherOrder, etc.)
    },
    // HTTP/1.1 requests handler
    (req, res) => {
      const upstreamClient = targetUrl.protocol === "https:" ? https : http;

      // Build upstream request options
      const upstreamOptions = {
        protocol: targetUrl.protocol,
        hostname: targetUrl.hostname,
        port: Number(
          targetUrl.port || (targetUrl.protocol === "https:" ? 443 : 80)
        ),
        method: req.method,
        path: req.url,
        headers: sanitizeRequestHeaders(req.headers),
      };

      const upstreamReq = upstreamClient.request(
        upstreamOptions,
        (upstreamRes) => {
          try {
            handleProxyResponseWithCompression({
              clientReq: req,
              clientRes: res,
              upstreamRes,
            });
          } catch (err) {
            res.statusCode = 502;
            res.end(
              "Bad gateway: " + (err && err.message ? err.message : String(err))
            );
          }
        }
      );

      upstreamReq.on("error", (err) => {
        res.statusCode = 502;
        res.end("Bad gateway: " + err.message);
      });

      // Pipe request body to upstream
      req.pipe(upstreamReq);
    }
  );

  // HTTP/2 streams handler
  server.on("stream", (stream, headers) => {
    const upstreamClient = targetUrl.protocol === "https:" ? https : http;

    const method = headers[":method"] || "GET";
    const pathHeader = headers[":path"] || "/";

    const requestHeaders = sanitizeRequestHeaders(h2ToHttp1Headers(headers));

    const upstreamOptions = {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: Number(
        targetUrl.port || (targetUrl.protocol === "https:" ? 443 : 80)
      ),
      method,
      path: pathHeader,
      headers: requestHeaders,
    };

    const upstreamReq = upstreamClient.request(
      upstreamOptions,
      (upstreamRes) => {
        try {
          handleH2ProxyResponseWithCompression({
            clientStream: stream,
            clientHeaders: headers,
            upstreamRes,
          });
        } catch (err) {
          try {
            stream.respond({ ":status": 502 });
            stream.end(
              "Bad gateway: " + (err && err.message ? err.message : String(err))
            );
          } catch {}
        }
      }
    );

    upstreamReq.on("error", () => {
      try {
        stream.respond({ ":status": 502 });
        stream.end("Bad gateway");
      } catch {}
    });

    // Pipe request body (if any) to upstream
    stream.pipe(upstreamReq);
  });

  // Best-effort WS support when client negotiates HTTP/1.1 over TLS
  // Note: Http2SecureServer emits 'upgrade' for HTTP/1.1 connections when allowHTTP1 is true in modern Node versions
  server.on("upgrade", (req, socket, head) => {
    // Proxy raw upgrade to target (Next dev uses WS for HMR)
    // We implement a minimal passthrough using a standard TCP tunnel
    const net = require("net");
    const upstream = net.connect(
      Number(targetUrl.port || (targetUrl.protocol === "https:" ? 443 : 80)),
      targetUrl.hostname,
      () => {
        upstream.write(
          Buffer.concat([
            Buffer.from(
              `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n` +
                Object.entries(req.headers)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join("\r\n") +
                "\r\n\r\n"
            ),
            head,
          ])
        );
        upstream.pipe(socket);
        socket.pipe(upstream);
      }
    );
    upstream.on("error", () => socket.destroy());
  });

  server.listen(port, () => {
    const addr = server.address();
    const p = typeof addr === "object" && addr ? addr.port : port;
    console.log(
      `HTTP/2 proxy listening on https://localhost:${p} -> ${target}`
    );
    console.log("Note: Using a self-signed certificate for local development.");
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// --- Helpers: Compression and header management ---

function sanitizeRequestHeaders(headers) {
  // Remove hop-by-hop headers and those that should be set by Node/HTTP2
  const hopByHop = new Set([
    "connection",
    "keep-alive",
    "proxy-connection",
    "transfer-encoding",
    "upgrade",
  ]);
  const out = {};
  for (const [k, v] of Object.entries(headers || {})) {
    if (!k) continue;
    const lk = k.toLowerCase();
    if (hopByHop.has(lk)) continue;
    out[lk] = v;
  }
  return out;
}

function h2ToHttp1Headers(h2Headers) {
  const out = {};
  for (const [k, v] of Object.entries(h2Headers || {})) {
    if (k.startsWith(":")) continue; // pseudo headers are not valid in HTTP/1.1
    out[k] = v;
  }
  return out;
}

function shouldCompress({ statusCode, headers, method }) {
  if (!statusCode || statusCode < 200 || statusCode >= 300) return false;
  if (!headers) return false;
  if (method && method.toUpperCase() === "HEAD") return false;
  const contentEncoding = (headers["content-encoding"] || "")
    .toString()
    .toLowerCase();
  if (contentEncoding && contentEncoding !== "identity") return false; // already encoded
  const contentType = (headers["content-type"] || "").toString().toLowerCase();
  if (!isCompressibleContentType(contentType)) return false;
  const cl = Number(headers["content-length"] || 0);
  if (Number.isFinite(cl) && cl > 0 && cl < 1024) return false; // tiny payloads not worth it
  return true;
}

function isCompressibleContentType(ct) {
  if (!ct) return false;
  if (ct.includes("text/") && !ct.includes("event-stream")) return true; // text/* excluding SSE
  if (ct.includes("application/json")) return true;
  if (ct.includes("application/javascript") || ct.includes("text/javascript"))
    return true;
  if (ct.includes("application/xml") || ct.includes("text/xml")) return true;
  if (ct.includes("image/svg+xml")) return true;
  // Skip already compressed/binary types like images, pdf, woff2, etc.
  if (ct.includes("font/woff2")) return false;
  if (ct.includes("application/zip") || ct.includes("application/gzip"))
    return false;
  return false;
}

function negotiateEncoding(acceptEncodingHeader) {
  const ae = (acceptEncodingHeader || "").toString().toLowerCase();
  if (!ae) return null;
  // Prefer br, then gzip
  if (ae.includes("br")) return "br";
  if (ae.includes("gzip")) return "gzip";
  return null;
}

function setVaryHeader(headers) {
  const cur = headers["vary"] || "";
  const parts = new Set(
    cur
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  parts.add("Accept-Encoding");
  headers["vary"] = Array.from(parts).join(", ");
}

function acceptsHtml(acceptHeader) {
  const a = (acceptHeader || "").toString().toLowerCase();
  return a.includes("text/html");
}

function filterAndPrepareResponseHeaders(upHeaders) {
  const hopByHop = new Set([
    "connection",
    "keep-alive",
    "proxy-connection",
    "transfer-encoding",
    "upgrade",
  ]);
  const out = {};
  for (const [k, v] of Object.entries(upHeaders || {})) {
    if (!k) continue;
    const lk = k.toLowerCase();
    if (hopByHop.has(lk)) continue;
    // Node wants header values as string or array of strings
    out[lk] = Array.isArray(v) ? v : String(v);
  }
  // We will set content-length and content-encoding later if compressing
  delete out["content-length"];
  delete out["content-encoding"];
  return out;
}

function handleProxyResponseWithCompression({
  clientReq,
  clientRes,
  upstreamRes,
}) {
  const acceptEncoding = clientReq.headers["accept-encoding"];
  const encoding = negotiateEncoding(acceptEncoding);
  const method = clientReq.method || "GET";

  const headers = filterAndPrepareResponseHeaders(upstreamRes.headers);
  setVaryHeader(headers);

  // Apply caching policy if upstream did not specify one
  if (!headers["cache-control"]) {
    const u = new URL(clientReq.url, "https://localhost");
    if (
      u.pathname.startsWith("/_next/static/") ||
      u.pathname.startsWith("/banner/") ||
      /\.[a-f0-9]{6,}\.[a-z0-9]+$/i.test(u.pathname)
    ) {
      headers["cache-control"] = "public, max-age=31536000, immutable";
    } else if (acceptsHtml(clientReq.headers["accept"])) {
      headers["cache-control"] = "no-cache, must-revalidate";
    }
  }

  if (
    encoding &&
    shouldCompress({
      statusCode: upstreamRes.statusCode,
      headers: upstreamRes.headers,
      method,
    })
  ) {
    headers["content-encoding"] = encoding;
    clientRes.writeHead(upstreamRes.statusCode || 200, headers);
    const compressor =
      encoding === "br"
        ? zlib.createBrotliCompress({
            params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 },
          })
        : zlib.createGzip({ level: 6 });
    upstreamRes.pipe(compressor).pipe(clientRes);
  } else {
    // Pass-through without compression
    clientRes.writeHead(upstreamRes.statusCode || 200, headers);
    upstreamRes.pipe(clientRes);
  }
}

function handleH2ProxyResponseWithCompression({
  clientStream,
  clientHeaders,
  upstreamRes,
}) {
  const acceptEncoding = clientHeaders["accept-encoding"];
  const encoding = negotiateEncoding(acceptEncoding);
  const method = (clientHeaders[":method"] || "GET").toString();

  const headers = filterAndPrepareResponseHeaders(upstreamRes.headers);
  setVaryHeader(headers);

  // Apply caching policy if upstream did not specify one
  if (!headers["cache-control"]) {
    const path = (clientHeaders[":path"] || "/").toString();
    if (
      path.startsWith("/_next/static/") ||
      path.startsWith("/banner/") ||
      /\.[a-f0-9]{6,}\.[a-z0-9]+$/i.test(path)
    ) {
      headers["cache-control"] = "public, max-age=31536000, immutable";
    } else if (acceptsHtml(clientHeaders["accept"])) {
      headers["cache-control"] = "no-cache, must-revalidate";
    }
  }

  // Convert HTTP/1.1 headers to HTTP/2 format when responding
  const h2Headers = { ":status": upstreamRes.statusCode || 200, ...headers };

  if (
    encoding &&
    shouldCompress({
      statusCode: upstreamRes.statusCode,
      headers: upstreamRes.headers,
      method,
    })
  ) {
    h2Headers["content-encoding"] = encoding;
    clientStream.respond(h2Headers);
    const compressor =
      encoding === "br"
        ? zlib.createBrotliCompress({
            params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 },
          })
        : zlib.createGzip({ level: 6 });
    upstreamRes.pipe(compressor).pipe(clientStream);
  } else {
    clientStream.respond(h2Headers);
    upstreamRes.pipe(clientStream);
  }
}
