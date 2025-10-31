"use client";

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getAuthToken } from '@/lib/api';

// Redirects to /signin if there is no access token present on the client.
// Usage: call inside client pages that require authentication.
export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    // Only run on client
    const token = getAuthToken();
    if (!token) {
      const qs = search?.toString();
      const from = qs ? `${pathname}?${qs}` : pathname;
      if (!pathname.startsWith('/signin')) {
        router.replace(`/signin?from=${encodeURIComponent(from)}`);
      }
    }
  }, [router, pathname, search]);
}
