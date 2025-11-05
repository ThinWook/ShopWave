
"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CartProvider } from '@/contexts/CartContext';
import { ProductProvider } from '@/contexts/ProductContext';
// Lazy-load Toaster to avoid pulling it into initial chunks
const Toaster = dynamic(() => import('@/components/ui/toaster').then(m => m.Toaster), { ssr: false });
import dynamic from 'next/dynamic';

// Lazy-load Google OAuth provider so @react-oauth/google is only loaded on auth pages
const GoogleOAuthProvider = dynamic(
  () => import('@react-oauth/google').then(m => m.GoogleOAuthProvider),
  { ssr: false }
);

export function AppProviders({ children }: { children: ReactNode }) {
  const [enableGoogle, setEnableGoogle] = useState(false);
  const pathname = usePathname();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  useEffect(() => {
    const origin = window.location.origin;
    const envList = (process.env.NEXT_PUBLIC_GOOGLE_ALLOWED_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const originAllowed = envList.includes(origin);
    if (!googleClientId) {
      console.warn("[GoogleOAuthProvider] Skipped: NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set.");
      setEnableGoogle(false);
      return;
    }
    if (!originAllowed) {
      console.warn(`[GoogleOAuthProvider] Current origin ${origin} is not in NEXT_PUBLIC_GOOGLE_ALLOWED_ORIGINS. Provider will not be mounted.`);
      setEnableGoogle(false);
      return;
    }
    setEnableGoogle(true);
  }, [googleClientId]);
  const isAuthRoute = !!pathname && (/^\/(signin|signup|login)(\/|$)/.test(pathname));
  const content = (
    <ProductProvider>
      <CartProvider>
        {children}
        <Toaster />
      </CartProvider>
    </ProductProvider>
  );
  return enableGoogle && isAuthRoute ? (
    <GoogleOAuthProvider clientId={googleClientId!}>{content}</GoogleOAuthProvider>
  ) : (
    content
  );
}
