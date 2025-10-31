import { api } from "../utils/apiClient";
import { saveTokens, clearTokens, type Tokens } from "../utils/tokenStorage";

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string | number;
  refreshTokenExpiresAt: string | number;
};

export type User = {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  avatarUrl?: string | null;
  // Optional profile/address fields if backend provides them
  country?: string;
  cityState?: string; // combined city + state/province
  postalCode?: string;
  taxId?: string;
  address?: string; // freeform address line
};

export async function login(email: string, password: string): Promise<User> {
  const raw = await api.post<any>("/api/v1/auth/login", { email, password });
  const tokens = normalizeTokensFromLogin(raw);
  if (!tokens.accessToken || !tokens.refreshToken) {
    throw new Error("Phản hồi đăng nhập không hợp lệ: thiếu token");
  }
  saveTokens(tokens);
  try {
    const me = await api.get<User>("/api/v1/auth/me");
    return me;
  } catch (e: any) {
    // nếu token không dùng được hoặc không phải Admin thì xoá token cho sạch
    clearTokens();
    throw e;
  }
}

export async function me(): Promise<User> {
  return api.get<User>("/api/v1/auth/me");
}

function normalizeTokensFromLogin(raw: any): Tokens {
  // Try common key variants
  const base = raw?.data ?? raw?.result ?? raw?.payload ?? raw;
  const tokensNode = base?.tokens ?? base;
  let accessToken: string | undefined = tokensNode?.accessToken ?? tokensNode?.token ?? tokensNode?.access_token ?? tokensNode?.jwt;
  let refreshToken: string | undefined = tokensNode?.refreshToken ?? tokensNode?.refresh_token;

  let accessTokenExpiresAt = tokensNode?.accessTokenExpiresAt ?? tokensNode?.access_token_expires_at ?? tokensNode?.expiresAt ?? tokensNode?.expires_at;
  let refreshTokenExpiresAt = tokensNode?.refreshTokenExpiresAt ?? tokensNode?.refresh_token_expires_at ?? tokensNode?.refreshExpiresAt ?? tokensNode?.refresh_expires_at;

  const now = Date.now();

  // If only *In seconds are provided
  const accessIn = tokensNode?.accessTokenExpiresIn ?? tokensNode?.expiresIn ?? tokensNode?.access_token_expires_in;
  const refreshIn = tokensNode?.refreshTokenExpiresIn ?? tokensNode?.refreshExpiresIn ?? tokensNode?.refresh_token_expires_in;

  if (accessTokenExpiresAt == null && typeof accessIn === "number") {
    accessTokenExpiresAt = now + accessIn * 1000;
  }
  if (refreshTokenExpiresAt == null && typeof refreshIn === "number") {
    refreshTokenExpiresAt = now + refreshIn * 1000;
  }

  // Coerce string timestamps
  const accessAt = typeof accessTokenExpiresAt === "string" ? Date.parse(accessTokenExpiresAt) : Number(accessTokenExpiresAt);
  const refreshAt = typeof refreshTokenExpiresAt === "string" ? Date.parse(refreshTokenExpiresAt) : Number(refreshTokenExpiresAt);

  // Fallback defaults if backend didn't provide (15m access, 7d refresh)
  const fallbackAccess = now + 15 * 60 * 1000;
  const fallbackRefresh = now + 7 * 24 * 60 * 60 * 1000;

  // Strip 'Bearer ' prefix if present
  const stripBearer = (t?: string) => (typeof t === "string" ? t.replace(/^Bearer\s+/i, "") : t);
  accessToken = stripBearer(accessToken);
  refreshToken = stripBearer(refreshToken);

  return {
    accessToken: String(accessToken || ""),
    refreshToken: String(refreshToken || ""),
    accessTokenExpiresAt: Number.isFinite(accessAt) && accessAt > 0 ? accessAt : fallbackAccess,
    refreshTokenExpiresAt: Number.isFinite(refreshAt) && refreshAt > 0 ? refreshAt : fallbackRefresh,
  };
}
