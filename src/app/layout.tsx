import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#4f46e5',
};

export const metadata: Metadata = {
  title: 'Vedayan LMS — Enterprise Learning Platform',
  description: 'Enterprise Offline-First Learning Management System by Vedayan for English Tutors, Academies, and Language Schools.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png?v=vedayan', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png?v=vedayan', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=vedayan', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vedayan LMS',
  },
};

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
            <ServiceWorkerRegister />
            {children}
            <Toaster position="top-right" theme="dark" richColors />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
