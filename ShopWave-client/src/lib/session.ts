const GUEST_ORDER_ACCESS_TOKEN_KEY = 'shopwave_guest_order_access_token';
const GUEST_ORDER_ACCESS_TOKEN_EXPIRES_AT_KEY = 'shopwave_guest_order_access_token_expires_at';

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function parseExpiryToIso(expiresAt?: string | Date): string | null {
  if (!expiresAt) return null;
  if (expiresAt instanceof Date) {
    const ms = expiresAt.getTime();
    return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
  }
  const ms = Date.parse(expiresAt);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

export function setGuestOrderAccessToken(token: string, expiresAt?: string | Date): void {
  if (!canUseSessionStorage()) return;
  const value = (token || '').trim();
  if (!value) {
    clearGuestOrderAccessToken();
    return;
  }
  sessionStorage.setItem(GUEST_ORDER_ACCESS_TOKEN_KEY, value);
  const normalizedExpiry = parseExpiryToIso(expiresAt);
  if (normalizedExpiry) {
    sessionStorage.setItem(GUEST_ORDER_ACCESS_TOKEN_EXPIRES_AT_KEY, normalizedExpiry);
  } else {
    sessionStorage.removeItem(GUEST_ORDER_ACCESS_TOKEN_EXPIRES_AT_KEY);
  }
}

export function getGuestOrderAccessToken(): string | null {
  if (!canUseSessionStorage()) return null;
  const token = sessionStorage.getItem(GUEST_ORDER_ACCESS_TOKEN_KEY);
  return token && token.trim() ? token : null;
}

export function clearGuestOrderAccessToken(): void {
  if (!canUseSessionStorage()) return;
  sessionStorage.removeItem(GUEST_ORDER_ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(GUEST_ORDER_ACCESS_TOKEN_EXPIRES_AT_KEY);
}

export function isGuestOrderAccessTokenExpired(): boolean {
  if (!canUseSessionStorage()) return true;
  const token = getGuestOrderAccessToken();
  if (!token) return true;

  const expiresAtRaw = sessionStorage.getItem(GUEST_ORDER_ACCESS_TOKEN_EXPIRES_AT_KEY);
  if (!expiresAtRaw) return false;

  const expiresAtMs = Date.parse(expiresAtRaw);
  if (!Number.isFinite(expiresAtMs)) return false;

  return Date.now() >= expiresAtMs;
}

export default {
  setGuestOrderAccessToken,
  getGuestOrderAccessToken,
  clearGuestOrderAccessToken,
  isGuestOrderAccessTokenExpired,
};
