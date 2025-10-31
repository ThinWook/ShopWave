export type Tokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number; // epoch ms
  refreshTokenExpiresAt: number; // epoch ms
};

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const ACCESS_TOKEN_EXPIRES_AT_KEY = "accessTokenExpiresAt";
const REFRESH_TOKEN_EXPIRES_AT_KEY = "refreshTokenExpiresAt";

export function saveTokens(tokens: Tokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, String(tokens.accessTokenExpiresAt));
  localStorage.setItem(REFRESH_TOKEN_EXPIRES_AT_KEY, String(tokens.refreshTokenExpiresAt));
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  localStorage.removeItem(REFRESH_TOKEN_EXPIRES_AT_KEY);
}

export function getTokens(): Tokens | null {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const accessTokenExpiresAt = localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  const refreshTokenExpiresAt = localStorage.getItem(REFRESH_TOKEN_EXPIRES_AT_KEY);
  if (!accessToken || !refreshToken || !accessTokenExpiresAt || !refreshTokenExpiresAt) return null;
  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: Number(accessTokenExpiresAt),
    refreshTokenExpiresAt: Number(refreshTokenExpiresAt),
  };
}

export function isAccessTokenExpired(tokens: Tokens | null) {
  if (!tokens) return true;
  const now = Date.now();
  // add small skew tolerance
  return now >= tokens.accessTokenExpiresAt - 5_000;
}

export function isRefreshTokenExpired(tokens: Tokens | null) {
  if (!tokens) return true;
  const now = Date.now();
  return now >= tokens.refreshTokenExpiresAt - 5_000;
}
