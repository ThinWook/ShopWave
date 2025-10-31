
import type { Metadata, Viewport } from 'next';
// import { GeistSans } from 'geist/font/sans'; // Removed due to module not found error
import './globals.css';
import { AppProviders } from '@/components/layout/AppProviders';
import ConditionalLayout from '@/components/layout/ConditionalLayout';

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
      <body className="antialiased flex flex-col min-h-screen">
        <AppProviders>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AppProviders>
      </body>
    </html>
  );
}
