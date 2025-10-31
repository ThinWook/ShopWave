# Google Sign-In: Error 400 invalid_request (Access blocked: Authorization Error)

This usually means the OAuth client is misconfigured or the clientId on the frontend is missing/incorrect.

## Quick checklist

1. Verify Client ID is set in your frontend env

- File: `.env.local`
- Key: `NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_DEV_CLIENT_ID.apps.googleusercontent.com`
- Restart dev server after changes.

2. Authorized JavaScript origins (Google Cloud Console)

- Go to Credentials → Your OAuth 2.0 Client ID (Web)
- Add:
  - `http://localhost:3000`
- If you use One Tap, also add:
  - `https://accounts.google.com`

3. Authorized redirect URIs (only if you use redirect-based flow)

- Not required for the `@react-oauth/google` popup/One Tap flow we use.

4. Domain restrictions

- If the client is set to internal and your Google account is not allowed, switch to "External" or add test users.

5. Third-party cookies & ITP

- Ensure third‑party cookies aren’t blocked in your browser for localhost while testing One Tap.

6. Multiple OAuth clients / wrong clientId

- Make sure the clientId in `.env.local` matches the OAuth client labeled "Web application" you configured.

7. Fresh dev build

- After updating env, run a fresh dev: `npm run dev` (restart).

## Logging hints

- We log a warning if `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is empty in `AppProviders`.
- Open DevTools Console to see detailed errors from `@react-oauth/google`.

## Backend CORS/cookies (avoid silent failures)

- CORS: `Access-Control-Allow-Origin: http://localhost:3000`
- CORS: `Access-Control-Allow-Credentials: true`
- Cookies: `SameSite=None; Secure; HttpOnly; Path=/`

## Still seeing invalid_request?

- Capture the exact error param from the URL/dialog and compare with Google’s docs.
- Share the clientId (masked) and a screenshot; we can validate Console settings together.
