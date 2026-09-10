import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#4f46e5',
};

export const metadata: Metadata = {
  title: 'English Tutors Academy LMS',
  description: 'Enterprise Offline-First LMS with Clerk Auth, Neon PostgreSQL, Cloudinary CDN, and Gemini AI',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Academy LMS',
  },
};

import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.className} min-h-screen bg-theme-main text-theme-main antialiased transition-colors duration-200`}>
          <ThemeProvider>
            {children}
            <Toaster position="top-right" theme="dark" richColors />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
