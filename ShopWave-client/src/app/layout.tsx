
import type { Metadata, Viewport } from 'next';
// import { GeistSans } from 'geist/font/sans'; // Removed due to module not found error
import './globals.css';
import { AppProviders } from '@/components/layout/AppProviders';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import FancyboxInit from '@/components/FancyboxInit.client';

export const metadata: Metadata = {
  title: 'ShopWave - Your Ultimate Shopping Destination',
  description: 'Discover a wide range of products at ShopWave. Quality, variety, and personalized suggestions await you.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3F51B5',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="" suppressHydrationWarning>
      <head>
        {/* Fancybox CDN (quick integration) */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fancyapps/ui/dist/fancybox.css" />
        <script defer src="https://cdn.jsdelivr.net/npm/@fancyapps/ui/dist/fancybox.umd.js"></script>
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        <AppProviders>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AppProviders>
        {/* client init to bind Fancybox after script loads */}
        <FancyboxInit />
      </body>
    </html>
  );
}
