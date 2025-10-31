"use client";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

export default function GoogleButton() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    if (typeof window !== 'undefined') {
      console.warn('[GoogleLogin] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Hiding Google button.');
    }
    return null;
  }
  // Optional allowlist by origin to avoid GSI 403 spam while console not configured
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const envList = (process.env.NEXT_PUBLIC_GOOGLE_ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim()).filter(Boolean);
    const allowed = envList.includes(origin);
    if (!allowed) {
      console.warn(`[GoogleLogin] Current origin ${origin} not in NEXT_PUBLIC_GOOGLE_ALLOWED_ORIGINS. Hiding Google button.`);
      return null;
    }
  }
  const router = useRouter();
  const search = useSearchParams();
  const from = search.get("from");

  return (
    <GoogleLogin
      onSuccess={async (cred) => {
        try {
          const idToken = cred.credential;
          if (!idToken) throw new Error("Missing Google credential");
          const { user } = await api.auth.google(idToken);
          if (from) {
            router.replace(from);
            return;
          }
          router.replace('/profile');
        } catch (err) {
          console.error("Google login failed:", err);
        }
      }}
      onError={() => console.error("Google Login Failed")}
      // Keep disabled by default if needed via env to reduce auto-init requests
      useOneTap={process.env.NEXT_PUBLIC_GOOGLE_USE_ONE_TAP !== 'false'}
    />
  );
}
