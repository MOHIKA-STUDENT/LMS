import '@/lib/polyfills';
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
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
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
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
(function() {
  if (typeof window === 'undefined') return;
  if (typeof globalThis === 'undefined') { window.globalThis = window; }
  try {
    if (!window.crypto) { window.crypto = {}; }
    if (!window.crypto.randomUUID) {
      window.crypto.randomUUID = function() {
        if (typeof window.crypto.getRandomValues === 'function') {
          var buf = new Uint8Array(16);
          window.crypto.getRandomValues(buf);
          buf[6] = (buf[6] & 0x0f) | 0x40;
          buf[8] = (buf[8] & 0x3f) | 0x80;
          var s = '';
          for (var i = 0; i < 16; i++) {
            s += (buf[i] < 16 ? '0' : '') + buf[i].toString(16);
          }
          return s.slice(0, 8) + '-' + s.slice(8, 12) + '-' + s.slice(12, 16) + '-' + s.slice(16, 20) + '-' + s.slice(20);
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = (Math.random() * 16) | 0;
          var v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };
    }
  } catch (e) {}
  if (!Object.hasOwn) {
    Object.hasOwn = function(obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    };
  }
  if (!Array.prototype.at) {
    Array.prototype.at = function(n) {
      n = Math.trunc(n) || 0;
      if (n < 0) n += this.length;
      if (n < 0 || n >= this.length) return undefined;
      return this[n];
    };
  }
  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function(s, r) {
      if (s instanceof RegExp) {
        if (!s.global) throw new TypeError('RegExp must have /g');
        return this.replace(s, r);
      }
      return this.split(s).join(r);
    };
  }
  if (!Object.fromEntries) {
    Object.fromEntries = function(entries) {
      var obj = {};
      for (var p of entries) { obj[p[0]] = p[1]; }
      return obj;
    };
  }
  if (typeof window.structuredClone !== 'function') {
    window.structuredClone = function(obj) {
      try { return JSON.parse(JSON.stringify(obj)); } catch (e) { return obj; }
    };
  }
  if (typeof Promise.withResolvers !== 'function') {
    Promise.withResolvers = function() {
      var resolve, reject;
      var promise = new Promise(function(res, rej) { resolve = res; reject = rej; });
      return { promise: promise, resolve: resolve, reject: reject };
    };
  }
  if (typeof window.queueMicrotask !== 'function') {
    window.queueMicrotask = function(cb) {
      Promise.resolve().then(cb).catch(function(err) { setTimeout(function() { throw err; }, 0); });
    };
  }
})();
              `,
            }}
          />
        </head>
        <body className={`${inter.className} min-h-screen overflow-x-hidden bg-theme-main text-theme-main antialiased transition-colors duration-200`}>
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
