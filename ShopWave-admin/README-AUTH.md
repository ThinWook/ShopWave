# Auth flow (Admin)

Base URL: VITE_API_BASE_URL (see .env)

Endpoints:

- POST /api/v1/auth/login { email, password }
- POST /api/v1/auth/refresh { refreshToken }
- GET /api/v1/auth/me -> must have role === 'Admin'

Implementation notes:

- Tokens persisted in localStorage keys: accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt
- All requests automatically attach Authorization: Bearer <accessToken> and auto-refresh on 401
- Context: AuthProvider exposes user, login(), logout().
- ProtectedRoute ensures only Admin can access app routes. Sign-in page is public.

Files:

- src/utils/tokenStorage.ts
- src/utils/apiClient.ts
- src/services/authService.ts
- src/context/AuthContext.tsx
- src/components/auth/ProtectedRoute.tsx
- src/components/auth/SignInForm.tsx (wired to login)
- src/App.tsx (AuthProvider + ProtectedRoute)

How it works:

1. User submits email/password -> login() -> saves tokens -> loads /me
2. If user.role !== 'Admin', ProtectedRoute blocks and redirects to /signin
3. For any API 401, client calls /auth/refresh and retries once
4. Logout clears tokens and navigates to /signin
