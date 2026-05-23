import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { PostHogRouteGuard } from './PostHogRouteGuard';
import './globals.css';

// Inter via Next.js font system — bundled at build time, self-hosted via
// the deploy, identical rendering across macOS, Linux, Windows, and mobile.
// Replaces the previous `system-ui` fallback chain which produced different
// fonts per platform (SF Pro on macOS, Segoe UI on Windows, Cantarell on
// Linux/GNOME, Roboto on Android) and caused subtle cross-platform layout
// drift on small text labels.
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Ask Miyagi — Master Your Instrument',
  description: 'Step-by-step interactive tutorials using a replica of your synth.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="min-h-screen bg-[#0a0a0f] text-gray-100 antialiased">
        <PostHogRouteGuard />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
