import { clearTokens, getTokens, isAccessTokenExpired, isRefreshTokenExpired, saveTokens, type Tokens } from "./tokenStorage";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

let refreshingPromise: Promise<string | null> | null = null;

type RequestInitEx = RequestInit & { skipAuth?: boolean };

async function request(input: string, init?: RequestInitEx): Promise<Response> {
  const url = input.startsWith("http") ? input : `${BASE_URL}${input}`;
  let tokens = getTokens();
  const method = (init?.method || "GET").toUpperCase();
  const hasBody = !!init?.body;
  const isAuthEndpoint = /\/api\/v1\/auth\/(login|refresh)\b/.test(url);
  const skipAuth = Boolean(init?.skipAuth);

  // If access token expired but refresh not, try refresh before request (skip for auth endpoints)
  if (!isAuthEndpoint && isAccessTokenExpired(tokens) && !isRefreshTokenExpired(tokens)) {
    await refreshAccessToken();
    tokens = getTokens();
  }

  const headers = new Headers(init?.headers || {});
  headers.set("Accept", "application/json");
  // Only set JSON content-type when body is plain JSON (not FormData)
  const isFormData = typeof FormData !== "undefined" && (init?.body instanceof FormData);
  if (method !== "GET" && hasBody && !isFormData) {
    headers.set("Content-Type", "application/json");
  }
  if (!isAuthEndpoint && !skipAuth && tokens?.accessToken) {
    headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }

  const res = await fetch(url, { ...init, headers });
  if (res.status !== 401 || isAuthEndpoint) return res;

  // If unauthorized, try refresh once and retry
  const newToken = await refreshAccessToken();
  if (!newToken) return res; // refresh failed

  const retryHeaders = new Headers(init?.headers || {});
  retryHeaders.set("Accept", "application/json");
  if (method !== "GET" && hasBody && !isFormData) {
    retryHeaders.set("Content-Type", "application/json");
  }
  if (!skipAuth) {
    retryHeaders.set("Authorization", `Bearer ${newToken}`);
  }

  return fetch(url, { ...init, headers: retryHeaders });
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshingPromise) return refreshingPromise;
  refreshingPromise = (async () => {
    try {
      const tokens = getTokens();
      if (!tokens || isRefreshTokenExpired(tokens)) {
        clearTokens();
        return null;
      }
      const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
      if (!res.ok) {
        clearTokens();
        return null;
      }
      const parsed = await res.json();
      const body = parsed?.data ?? parsed; // support envelope { data: {...} }
      const accessToken = body.accessToken ?? body.token ?? body.access_token;
      const refreshToken = body.refreshToken ?? body.refresh_token ?? tokens.refreshToken;
      let accessAt = body.accessTokenExpiresAt ?? body.access_token_expires_at ?? body.expiresAt ?? body.expires_at;
      let refreshAt = body.refreshTokenExpiresAt ?? body.refresh_token_expires_at ?? body.refreshExpiresAt ?? body.refresh_expires_at;
      const now = Date.now();
      const accessIn = body.accessTokenExpiresIn ?? body.expiresIn ?? body.access_token_expires_in;
      const refreshIn = body.refreshTokenExpiresIn ?? body.refreshExpiresIn ?? body.refresh_token_expires_in;
      if (accessAt == null && typeof accessIn === "number") accessAt = now + accessIn * 1000;
      if (refreshAt == null && typeof refreshIn === "number") refreshAt = now + refreshIn * 1000;
      const updated: Tokens = {
        accessToken: String(accessToken || ""),
        refreshToken: String(refreshToken || tokens.refreshToken),
        accessTokenExpiresAt: typeof accessAt === "string" ? Date.parse(accessAt) : Number(accessAt ?? now + 15 * 60 * 1000),
        refreshTokenExpiresAt: typeof refreshAt === "string" ? Date.parse(refreshAt) : Number(refreshAt ?? tokens.refreshTokenExpiresAt),
      };
      saveTokens(updated);
      return updated.accessToken;
    } catch {
      clearTokens();
      return null;
    } finally {
      refreshingPromise = null;
    }
  })();
  return refreshingPromise;
}

export const api = {
  async get<T>(path: string, init?: RequestInitEx): Promise<T> {
    const res = await request(path, { method: "GET", ...(init || {}) });
    if (!res.ok) throw await buildError(res);
    const json = await res.json();
    const payload = json && typeof json === "object" && "data" in json ? json.data : json;
    return payload as T;
  },
  async post<T>(path: string, body?: unknown, init?: RequestInitEx): Promise<T> {
    const res = await request(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, ...(init || {}) });
    if (!res.ok) throw await buildError(res);
    const json = await res.json();
    const payload = json && typeof json === "object" && "data" in json ? json.data : json;
    return payload as T;
  },
  async raw(path: string, init?: RequestInitEx): Promise<Response> {
    return request(path, init);
  },
};

async function buildError(res: Response) {
  let message = res.statusText;
  try {
    const data = await res.json();
    message = (data?.message as string) || message;
  } catch {
    // ignore parsing error; default to status text
  }
  const err = new Error(message);
  // @ts-expect-error add extra fields
  err.status = res.status;
  return err;
}
