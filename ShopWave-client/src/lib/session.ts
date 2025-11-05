// Helper utilities to manage a guest session id for cart merging
export const SESSION_KEY = 'shopwave_session';

function generateUuidV4(): string {
  // RFC4122 version 4 UUID
  if (typeof crypto !== 'undefined' && (crypto as any).getRandomValues) {
    const buf = new Uint8Array(16);
    (crypto as any).getRandomValues(buf);
    // Set version bits (4) and variant bits (RFC4122)
    buf[6] = (buf[6] & 0x0f) | 0x40;
    buf[8] = (buf[8] & 0x3f) | 0x80;
    const hex: string[] = [];
    for (let i = 0; i < buf.length; i++) hex.push((buf[i] + 0x100).toString(16).substr(1));
    return `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`;
  }
  // Fallback (not cryptographically secure)
  const r = () => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `${r()}${r()}-${r()}-${r()}-${r()}-${r()}${r()}${r()}`;
}

export function readSessionId(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    // Prefer cookie if present (server-side can read it)
    const m = document.cookie.match(new RegExp('(?:^|; )' + SESSION_KEY + '=([^;]*)'));
    if (m && m[1]) return decodeURIComponent(m[1]);
    // Fallback to localStorage
    const ls = localStorage.getItem(SESSION_KEY);
    return ls || null;
  } catch {
    return null;
  }
}

export function writeSessionId(id: string) {
  try {
    if (typeof window === 'undefined') return;
    // Set a cookie so backend can read it (SameSite=Lax to allow POST from same-site)
    const isSecure = window.location.protocol === 'https:';
    const parts = [`${SESSION_KEY}=${encodeURIComponent(id)}`, 'Path=/', 'SameSite=Lax'];
    if (isSecure) parts.push('Secure');
    // Expire in 30 days
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    parts.push(`Expires=${expires}`);
    document.cookie = parts.join('; ');
    try { localStorage.setItem(SESSION_KEY, id); } catch { /* ignore */ }
  } catch {
    // noop
  }
}

export function clearSessionId() {
  try {
    if (typeof window === 'undefined') return;
    // Remove cookie by setting expiry in the past
    document.cookie = `${SESSION_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  } catch {
    // noop
  }
}

export function ensureSessionId(): string {
  let id = readSessionId();
  if (!id) {
    id = generateUuidV4();
    writeSessionId(id);
  }
  return id;
}

export default {
  ensureSessionId,
  readSessionId,
  writeSessionId,
  clearSessionId,
};
