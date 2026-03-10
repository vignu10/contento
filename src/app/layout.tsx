import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Content Repurposing Pipeline',
  description: 'Transform one piece of content into 10+ formats for all platforms',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="transition-colors duration-200">
      <body className={inter.className + ' transition-colors duration-200'}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
