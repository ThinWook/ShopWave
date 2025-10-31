import type { ReactNode } from 'react';

export const metadata = {
  title: 'Admin',
  description: 'Admin dashboard',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-muted/20">
      <div className="mx-auto w-full max-w-7xl p-6">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Admin</h1>
          <nav className="text-sm text-muted-foreground">
            <a href="/" className="hover:underline">Back to Store</a>
          </nav>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
