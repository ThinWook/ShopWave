"use client";
import { useEffect } from 'react';

export default function LoginPage(props: { searchParams: any }) {
  // Demo login removed: just redirect to target or home.
  useEffect(() => {
    let cancelled = false;
    const go = async () => {
      try {
        const sp = typeof props.searchParams?.then === 'function' ? await props.searchParams : props.searchParams;
        const from = sp?.from ?? '/';
        if (cancelled) return;
        window.location.href = from;
      } catch {
        window.location.href = '/';
      }
    };
    go();
    return () => { cancelled = true; };
  }, [props.searchParams]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-sm text-muted-foreground">Redirecting…</p>
    </div>
  );
}
