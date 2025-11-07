
"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CartProvider } from '@/contexts/CartContext';
import session from '@/lib/session';
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
    // Ensure a guest session id exists for cart operations (creates cookie + localStorage)
    try { session.ensureSessionId(); } catch { /* ignore */ }
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

  // Input modality: when the user uses mouse, suppress focus-visible rings on text inputs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const handleMouseDown = () => root.classList.add('using-mouse');
    const handleKeyDown = (e: KeyboardEvent) => {
      // On Tab or arrow keys, consider keyboard navigation
      const keys = ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (keys.includes(e.key)) {
        root.classList.remove('using-mouse');
      }
    };
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('keydown', handleKeyDown, { passive: true });
    return () => {
      window.removeEventListener('mousedown', handleMouseDown as any);
      window.removeEventListener('keydown', handleKeyDown as any);
    };
  }, []);
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
