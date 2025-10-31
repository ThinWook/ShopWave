// Helper utilities for resolving media URLs served by the backend.
// Ensures relative paths are converted to absolute using NEXT_PUBLIC_API_BASE_URL
// and provides a default placeholder when no URL is available.
export function resolveMediaUrl(url?: string | null) {
  // default placeholder shipped in public/
  const fallback = '/images/product/default.png';
  if (!url) return fallback;
  // already absolute
  if (/^https?:\/\//i.test(url)) return url;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  if (!base) {
    // If no base provided, return the relative path unchanged (may still work if served by same origin)
    return url;
  }
  // normalize slashes
  const baseClean = base.replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${baseClean}${path}`;
}

// Optional helper to check if an URL likely needs auth (simple heuristic).
export function isProtectedMediaUrl(url?: string | null) {
  if (!url) return false;
  // If the URL is under the API base it's probably protected in some setups
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  if (!base) return false;
  try {
    const u = new URL(url, base);
    return u.origin === new URL(base).origin && u.pathname.startsWith('/api');
  } catch {
    return false;
  }
}
