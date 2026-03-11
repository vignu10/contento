import type { Metadata } from 'next';
import { Space_Grotesk, Geist } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

/* ==========================================================================
   TYPOGRAPHY - Distinctive pairing for editorial aesthetic
   Space Grotesk: Display/headlines with character
   Geist: Clean, readable body text for modern interfaces
   ========================================================================== */

const space = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Contento - Transform Content Into 10+ Formats',
  description: 'Transform one piece of content into 10+ formats for all platforms. YouTube, podcasts, blogs → Twitter, LinkedIn, newsletter, TikTok, and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${space.variable} ${geist.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
