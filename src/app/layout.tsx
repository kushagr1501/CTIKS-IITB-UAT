import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Footer from '@/components/layout/Footer';
import PageMotion from '@/components/providers/PageMotion';
import 'lenis/dist/lenis.css';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Centre for Traditional Indian Knowledge and Skills — IIT Bombay',
    template: '%s | CTIKS, IIT Bombay',
  },
  description:
    'The Centre for Traditional Indian Knowledge and Skills at IIT Bombay runs doctoral research, community outreach, and interdisciplinary study of classical Indian knowledge systems.',
  icons: { icon: '/assets/ctiks-logo.png' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link
          rel="preload"
          href="/fonts/red-rose-400-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/montserrat-400-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      {/* Browser extensions can add body attributes before React hydrates. */}
      <body suppressHydrationWarning className="flex min-h-screen flex-col">
        <PageMotion>{children}</PageMotion>
        <Footer />
      </body>
    </html>
  );
}
